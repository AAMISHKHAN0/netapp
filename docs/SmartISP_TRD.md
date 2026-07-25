# SmartISP — Technical Requirements Document (TRD)

**Product:** SmartISP — ISP Billing, Fee Collection & Operations Platform
**Version:** 1.0
**Date:** July 25, 2026
**Companion to:** `SmartISP_PRD.md`, `SmartISP_UIUX_Guide.md`

---

## 1. Architecture Overview

SmartISP is a **Next.js monorepo** application backed by PostgreSQL, Redis, and a background worker for scheduled/queued jobs (bill generation, reminders, reports).

```
                     ┌─────────────────────┐
                     │   Next.js 15 App     │
                     │  (App Router, RSC)   │
                     │  Admin UI + Portal   │
                     └─────────┬────────────┘
                               │ Server Actions / Route Handlers
                     ┌─────────▼────────────┐
                     │   Prisma ORM Layer    │
                     └─────────┬────────────┘
                               │
                     ┌─────────▼────────────┐
                     │  PostgreSQL (RLS)     │──── tenant_id scoped
                     └─────────┬────────────┘
                               │
              ┌────────────────┼─────────────────┐
              │                │                  │
     ┌────────▼──────┐ ┌───────▼───────┐ ┌────────▼────────┐
     │  Redis (cache/  │ │  BullMQ Worker │ │  Object Storage  │
     │  queues/session)│ │  (cron + jobs) │ │  (R2 / Supabase) │
     └────────┬────────┘ └───────┬───────┘ └──────────────────┘
              │                  │
              │        ┌─────────▼─────────┐
              │        │ Notification layer │
              │        │ WhatsApp/SMS/Email │
              │        └─────────────────────┘
              │
     ┌────────▼────────┐
     │ Realtime (SSE)   │──► live dashboard updates
     └──────────────────┘
```

🆕 **Key architectural decision carried forward from planning:** build **multi-tenant from day one** — even though the first real customer is a single ISP, retrofitting tenant isolation later is significantly more expensive than including a `tenant_id` on every table now. This is the single highest-leverage technical decision in this document.

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) + React 19 | Server Components for data-heavy pages, streaming for perceived speed |
| Language | TypeScript (strict mode) | End-to-end type safety with Prisma-generated types |
| Package manager | pnpm | Fast installs, disk-efficient, first-class monorepo workspace support |
| Styling | Tailwind CSS 4 + shadcn/ui | Utility-first + accessible unstyled primitives customized to the design system |
| Forms & validation | React Hook Form + Zod | Shared Zod schemas reused on client and server (server actions validate the same schema) |
| Data fetching (client) | TanStack Query | Cache invalidation, optimistic updates on payment recording |
| Tables | TanStack Table | Sorting/filtering/pagination for customer & invoice lists |
| Charts | Recharts | Dashboard and report visualizations |
| Animation | Framer Motion | Used sparingly — see UI/UX guide |
| ORM | Prisma | Type-safe queries, migrations |
| Database | **Supabase (managed PostgreSQL)** 🔄 | Hosted Postgres accessed via Prisma; RLS for tenant isolation (see §4a). Swapped in for local Docker Postgres to remove local infra setup friction. |
| Cache / Queue broker | **Upstash (managed Redis)** 🔄 | Backs BullMQ and hot-path caching; swapped in for local Docker Redis for the same reason |
| Job queue | BullMQ | Reminder sending, invoice generation, report generation, backups |
| Auth | Custom JWT + RBAC (Auth.js/Better Auth) | Staff login only. 🔄 Decision: **not** using Supabase Auth for staff — the custom JWT/RBAC system was already built and verified; switching would be pure rework with no Phase 1 benefit. Supabase Auth (phone/OTP) is earmarked specifically for the **customer portal in Phase 2**, where it genuinely saves building OTP infrastructure from scratch — see §8. |
| Realtime | Server-Sent Events (SSE) | Simpler than Socket.IO for one-way live dashboard updates; upgrade to Socket.IO only if bidirectional (e.g., live technician location) is needed |
| File storage | Cloudflare R2 (S3-compatible) | Customer photos, ID scans, complaint images, generated PDFs |
| PDF generation | `@react-pdf/renderer` or Puppeteer-based HTML→PDF | Invoices, receipts, reports |
| Error tracking | Sentry | |
| Logging | Pino (structured JSON logs) | |
| Deployment | Docker Compose on a VPS (or Vercel for app + managed Postgres/Redis for infra) | Both are viable; VPS gives more control over the WhatsApp/Evolution API sidecar |

## 3. Monorepo Structure

```
smartisp/
├── apps/
│   ├── web/                 # Next.js app — admin dashboard + customer portal
│   └── worker/               # BullMQ worker process (reminders, bill generation, reports)
├── packages/
│   ├── ui/                   # Shared shadcn/ui-based component library
│   ├── database/             # Prisma schema, client, migrations, seed scripts
│   ├── auth/                 # Auth config, session helpers, RBAC permission checks
│   ├── config/                # Shared env/config validation (Zod)
│   ├── types/                 # Shared TypeScript types/DTOs
│   ├── utils/                  # Shared helpers (formatting, date math, currency)
│   ├── notifications/          # WhatsApp/SMS/Email provider adapters + templates
│   ├── billing/                 # Invoice generation, fee calculation, tax logic
│   └── ai/                       # AI assistant prompt logic, insight generators
├── docker-compose.yml
├── turbo.json                     # or nx.json — monorepo task runner
└── pnpm-workspace.yaml
```

## 4. Multi-Tenancy Strategy

**Recommended approach: shared database, shared schema, `tenant_id` on every table + PostgreSQL Row-Level Security (RLS).**

Why this over schema-per-tenant or database-per-tenant:
- Far simpler migrations (one schema to evolve, not N)
- Cheaper to operate at the scale this product targets (dozens to low hundreds of ISPs, not thousands of enterprise clients)
- RLS gives strong isolation guarantees enforced *at the database level*, not just in application code — so a bug in a server action can't leak another tenant's data

```sql
-- Example RLS policy pattern applied to every tenant-scoped table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON customers
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

The app sets `app.current_tenant_id` per request/connection based on the authenticated user's tenant (resolved from subdomain, e.g. `friendisp.smartisp.app`, or from the session for the single-tenant MVP deployment).

**MVP note:** even while serving only one tenant, every table still carries `tenant_id` from day one and a single row exists in the `tenants` table. This costs almost nothing now and saves a full migration later.

### 4a. 🔄 Supabase-Specific Connection Notes

Since the database is hosted on Supabase rather than local Docker Postgres, two things need to be handled correctly:

1. **Two connection strings, not one.** Supabase's pooled connection (port `6543`, via Supavisor) is used by the app at runtime; a direct connection (port `5432`) is required for migrations.
   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")   // pooled, port 6543, ?pgbouncer=true
     directUrl = env("DIRECT_URL")     // direct, port 5432 — used for `prisma migrate`/`db push`
   }
   ```
2. **RLS + connection pooling.** The tenant-scoping `SET` from §4 must run as `SET LOCAL` **inside the same Prisma `$transaction`** as the query it scopes — not as a bare `SET` on the shared pooled connection — or transaction-mode pooling can apply it to the wrong request.

Note this app does **not** use Supabase's own JS client (`@supabase/supabase-js`) or Supabase Auth for data access — all reads/writes go through Prisma against the underlying Postgres database, consistent with the rest of this document. Supabase here is purely acting as a managed Postgres host.

Install Supabase's official **Agent Skills** package for whichever coding agent is building this (`npx skills add supabase/agent-skills`) — it encodes exactly these pooling/RLS patterns and catches the mistakes generic AI coding agents commonly make with Supabase.

## 5. Core Database Schema

Representative fields for the primary entities — a full Prisma schema would be generated during implementation, but this defines the contract.

**`Tenant`**
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | string | ISP business name |
| subdomain | string, unique | e.g. `friendisp` |
| plan | enum | starter / professional / enterprise |
| branding | jsonb | logo URL, primary color, custom domain (white-label) |
| status | enum | active / suspended / trial |

**`Branch`**
| id | tenant_id | name | address | created_at |

**`User`** (staff)
| id | tenant_id | branch_id (nullable) | name | email | phone | role_id | password_hash | two_fa_enabled | last_login |

**`Role` / `Permission`** — role has many permissions; permission = `(module, action)` e.g. `(customers, delete)`.

**`Customer`**
| Field | Type |
|---|---|
| id | uuid |
| tenant_id, branch_id | uuid |
| name, cnic, phone, whatsapp, email, photo_url | string |
| address, city, area, street, house_no, lat, lng | string/float |
| onu_mac, router_mac, static_ip, pppoe_username, pppoe_password_encrypted | string |
| installation_date, activation_date | date |
| package_id | fk |
| monthly_fee, installation_charge, security_deposit, previous_balance | decimal |
| due_day_of_month | int |
| status | enum: active / suspended / pending / closed |

**`Package`**
| id, tenant_id, name, download_speed, upload_speed, price, tax_percent, fup_gb, description, is_corporate, is_active |

**`Bill`** (invoice)
| id, tenant_id, customer_id, period_month, amount, discount, fine, tax, previous_balance, total_due, due_date, status (unpaid/partial/paid/cancelled), pdf_url |

**`Payment`**
| id, tenant_id, customer_id, bill_id, amount, method (cash/bank/easypaisa/jazzcash/card/online), reference_no, received_by (user_id), received_at, receipt_url |

**`Complaint`**
| id, tenant_id, customer_id, category, description, priority, image_urls[], status, assigned_technician_id, created_at, resolved_at, sla_due_at |

**`Technician`**
| id references User, assigned_branch_id, salary, attendance records (separate `Attendance` table) |

**`Expense`**
| id, tenant_id, branch_id, category, amount, date, note, receipt_url, recorded_by |

**`InventoryItem`** 🆕
| id, tenant_id, sku, name (ONU/router/cable/etc.), quantity_in_stock, unit_cost, low_stock_threshold |

**`InventoryTransaction`** 🆕
| id, item_id, type (in/out/assigned), quantity, related_customer_id (nullable), related_job_id (nullable), created_at |

**`NotificationQueue`**
| id, tenant_id, customer_id, channel (whatsapp/sms/email), template_key, payload jsonb, status (queued/sent/failed/delivered), attempts, sent_at |

**`ActivityLog`** (audit trail)
| id, tenant_id, actor_user_id, action, entity_type, entity_id, before jsonb, after jsonb, created_at |

**`Subscription`** 🆕 (SaaS billing for the tenant itself — separate from customer bills)
| id, tenant_id, plan, status, current_period_end, payment_provider_ref |

## 6. Key Relationships

- `Tenant 1—N Branch`, `Tenant 1—N User`, `Tenant 1—N Customer`
- `Branch 1—N Customer`, `Branch 1—N User`
- `Customer 1—N Bill`, `Bill 1—N Payment` (supports partial payments)
- `Customer 1—N Complaint`, `Complaint N—1 Technician (User)`
- `Package 1—N Customer`
- Every table above carries `tenant_id`; RLS policies mirror this on every table.

## 7. API / Server Actions Surface

Next.js Server Actions are used for internal admin mutations (co-located with UI, fully type-safe). Route Handlers (`/api/*`) are used for: webhooks (payment gateway callbacks, WhatsApp delivery status), the customer portal's public endpoints, and anything needed by the future mobile apps.

Representative surface:

| Area | Action / Endpoint | Auth |
|---|---|---|
| Customers | `createCustomer`, `updateCustomer`, `changeCustomerStatus`, `searchCustomers` | Staff (RBAC-checked) |
| Billing | `generateMonthlyBills` (also runs as scheduled job), `createManualInvoice`, `getCustomerInvoices` | Staff |
| Payments | `recordPayment`, `POST /api/webhooks/payment-gateway` | Staff / gateway (signed) |
| Reminders | (internal, triggered by worker) `queueReminder`, `POST /api/webhooks/whatsapp-status` | System / provider (signed) |
| Complaints | `createComplaint`, `assignComplaint`, `updateComplaintStatus` | Staff, and customer (portal, scoped to own records) |
| Reports | `getRevenueReport`, `exportReport(format)` | Staff |
| Portal (public, tenant + customer scoped) | `GET /api/portal/invoices`, `POST /api/portal/pay`, `POST /api/portal/complaints` | Customer session (OTP-based) |
| Admin | `manageRoles`, `managePackages`, `manageBranches` | Super Admin / Branch Manager |
| AI | `askAssistant(query)` | Staff, plan-gated (Professional/Enterprise) |

All server actions validate input with the shared Zod schemas from `packages/types`, and every mutation writes an `ActivityLog` entry.

## 8. Authentication & Authorization

- **Staff auth:** email/phone + password, custom JWT session with refresh token rotation; optional TOTP 2FA for Super Admin and Branch Manager roles. 🔄 Confirmed decision: stays custom, not Supabase Auth — already built and verified for Owner/Branch Manager/Cashier roles, and changing it now would be rework without a Phase 1 benefit.
- **Customer portal auth (Phase 2):** phone-number + OTP, lighter-weight session, scoped strictly to that customer's own records. 🔄 **Recommended: use Supabase Auth's built-in phone/OTP flow here specifically** — it's a separate, much simpler login surface than staff auth, and Supabase Auth avoids building OTP delivery/verification/rate-limiting from scratch. This deliberately creates two independent auth systems (staff vs. customer) rather than one shared one — they have different security requirements and almost no overlap in code, so this isn't the "competing auth systems" problem it would be if both handled staff login.
- **RBAC:** permission matrix defined per role at the tenant level (Super Admin can customize a role's permissions per PRD §7 FR-17). Every server action checks `(user.role, module, action)` server-side — the UI hiding a button is a convenience, never the actual security boundary.
- **Tenant resolution:** middleware resolves `tenant_id` from subdomain (`friendisp.smartisp.app`) or custom domain (Enterprise white-label), and sets the Postgres session variable used by RLS.

## 9. Background Jobs & Scheduling

BullMQ queues, each with retry + dead-letter handling:

| Queue | Trigger | Purpose |
|---|---|---|
| `bill-generation` | Daily cron | Generates monthly invoices on each customer's billing date |
| `reminder-dispatch` | Daily cron (e.g. 9:00 AM tenant-local time) | Evaluates all active customers' due dates and queues the correct reminder type |
| `notification-send` | Consumes queued reminders | Actually calls the WhatsApp/SMS/Email provider adapter, with rate limiting per tenant |
| `suspension-check` 🆕 | Daily cron | Flags (Phase 1–3) or automatically suspends via MikroTik/RADIUS (Phase 5) customers overdue beyond a configurable grace period |
| `report-generation` | On-demand + scheduled monthly | Builds PDF/Excel reports asynchronously for large date ranges |
| `backup` | Daily | Triggers `pg_dump` + upload to off-site object storage |

## 10. Notification Engine

Adapter pattern so the messaging provider can be swapped without touching business logic:

```ts
interface NotificationProvider {
  send(to: string, template: string, variables: Record<string, string>): Promise<DeliveryResult>;
}

class EvolutionApiProvider implements NotificationProvider { /* WhatsApp via self-hosted Evolution API */ }
class WhatsAppCloudApiProvider implements NotificationProvider { /* Official Meta API */ }
class TwilioSmsProvider implements NotificationProvider { /* SMS fallback */ }
class EmailProvider implements NotificationProvider { /* Resend/SendGrid */ }
```

**Provider recommendation, matching the earlier discussion:**
- **MVP / cost-sensitive stage:** Evolution API (self-hosted, free per-message, connected via QR to a real WhatsApp number). Understand and accept the risk that it's unofficial and the number can be rate-limited or restricted if sending volume spikes.
- **Before reselling this to other ISPs as a commercial product:** migrate to the official **WhatsApp Cloud API**. Build the adapter interface now so this swap is a config change, not a rewrite.
- Templates are stored per-tenant (admin-editable) with variable substitution (`{{name}}`, `{{amount}}`, `{{date}}`), matching PRD FR-5.
- Every send attempt and its delivery status is persisted in `NotificationQueue` for auditability and troubleshooting ("did Ali actually get his reminder?").

## 11. Payment Flows — Two Distinct Systems

This is an important architectural distinction that's easy to conflate:

1. **Customer bill payments** — the ISP's own customers paying their monthly internet fee (cash, bank, Easypaisa, JazzCash, card, or 🆕 direct gateway checkout). Recorded against `Bill`/`Payment`.
2. **Tenant subscription billing** — *your* revenue from the ISP paying to use SmartISP itself (Starter/Professional/Enterprise plans). Recorded against `Subscription`, likely processed via Stripe or a regional equivalent, completely separate from the ISP's own customer payment data.

Keeping these cleanly separated in the schema and billing logic avoids a common and messy bug class where "who pays whom" gets tangled.

## 12. Caching & Performance

- Redis caches dashboard aggregate queries (today's collection, monthly revenue, pending count) with short TTL + invalidation on payment/bill write.
- TanStack Query handles client-side cache and optimistic UI (e.g., payment recorded instantly reflects in the customer's balance before the server round-trip confirms).
- Composite Postgres indexes on `(tenant_id, status)`, `(tenant_id, due_date)`, `(tenant_id, branch_id)` for the hot query paths (overdue lists, branch filtering).
- Server Components + streaming/Suspense for fast perceived load on data-heavy pages (customer list, reports).

## 13. Realtime Updates

SSE stream pushes: new payment recorded, new complaint created, reminder sent/failed — so the dashboard updates live without polling. Upgrade to Socket.IO only if a genuinely bidirectional feature is added later (e.g., live technician GPS tracking).

## 14. Security

- TLS everywhere; encryption at rest for the database volume and object storage.
- PPPoE passwords and other sensitive credentials stored encrypted (not hashed, since they need to be retrievable/usable — use envelope encryption via a KMS).
- Zod validation on every server action input, both client and server side (shared schema).
- Rate limiting (e.g., Upstash Ratelimit) on public endpoints — especially the customer portal OTP request and payment webhook endpoints.
- Full audit log (`ActivityLog`) on every create/update/delete of financial or status-changing records.
- 🆕 CNIC and other PII fields masked in the UI by default (e.g., `xxxxx-xxxxxxx-3`) with an explicit "reveal" action that itself gets audit-logged — good practice given how sensitive CNIC data is.
- 🆕 Tenant data export & deletion tooling, so a tenant can get a full export of their data or request deletion — good hygiene for a multi-tenant SaaS product even before it's a strict legal requirement.

## 15. Observability

- Structured logs (Pino) shipped to a log aggregator.
- Sentry for error tracking on both `web` and `worker`.
- Basic uptime/health-check endpoint (`/api/health`) monitored externally.
- Queue depth and failure-rate metrics for the notification queues — if reminders start silently failing, someone should know before customers do.

## 16. DevOps & Deployment

- **Local dev:** 🔄 `docker-compose.yml` now only runs the Evolution API sidecar — Postgres (Supabase) and Redis (Upstash) are hosted, removing the local database/cache setup that caused early environment friction.
- **Production:** Docker image for `worker` (and the Evolution API sidecar) on a small VPS since they need a persistent WhatsApp connection; `web` deploys to Vercel or the same VPS. Supabase and Upstash handle the data layer regardless of where the app itself runs.
- **CI/CD:** GitHub Actions — lint, typecheck, unit tests, build, then deploy on merge to `main`; separate `staging` environment for testing before production release.
- **Backups:** nightly `pg_dump`, retained 30 days, stored off-site (R2/S3), with a documented restore procedure that's actually tested periodically — not just assumed to work.

## 17. Testing Strategy

- **Unit tests** (Vitest) for billing/fee calculation logic, permission checks, and notification template rendering — these are the functions where a silent bug directly costs money or sends a wrong message to a customer.
- **Integration tests** for server actions touching the database (using a test database/schema).
- **E2E tests** (Playwright) for the critical paths: generate bill → send reminder → record payment → receipt; create complaint → assign → resolve.
- **Load testing** the reminder-dispatch queue at a realistic customer count (e.g., 2,000 customers) to validate the daily job completes well within its window and respects provider rate limits.

## 18. Performance Targets

- Lighthouse score 95+
- Dashboard/table pages: sub-2s initial load, sub-200ms perceived interaction latency
- API/server action p95 latency under 300ms for standard CRUD operations
- Reminder queue: capable of processing at least 1,000 messages/hour per tenant while respecting provider rate limits

## 19. Third-Party Integrations

| Integration | Purpose | Phase |
|---|---|---|
| 🔄 Supabase | Managed PostgreSQL hosting (via Prisma); phone/OTP auth for customer portal | 1 (DB) / 2 (portal auth) |
| 🔄 Upstash | Managed Redis for BullMQ + rate limiting | 1 |
| Evolution API → WhatsApp Cloud API | Automated reminders | 1 → 4 (migration) |
| Twilio or a local SMS gateway | SMS fallback reminders | 2 |
| Resend / SendGrid | Email invoices & reminders | 2 |
| Easypaisa / JazzCash APIs (or a local aggregator) | Direct online bill payment | 3 |
| Stripe (or regional equivalent) | Tenant subscription billing (SaaS revenue) | 4 |
| Google Maps | Customer address pin, technician routing | 1–2 |
| MikroTik RouterOS API / FreeRADIUS | Automatic suspend/reactivate on payment status | 5 |

## 20. Scalability Path

- Postgres read replica once reporting query load grows meaningfully.
- PgBouncer connection pooling as tenant count scales.
- Queue and worker horizontal scaling (multiple `worker` instances consuming the same BullMQ queues).
- CDN for static assets and generated PDFs.

## 21. Data Migration & Onboarding Tooling

A guided CSV/Excel import flow (field mapping UI + validation preview + dry-run report before committing) so a new ISP tenant can bring in their existing spreadsheet-based customer list without your involvement — this is what actually makes the product self-serve and resellable, rather than requiring a manual data-entry project every time you onboard a new ISP client.

---

*Companion documents: `SmartISP_PRD.md` (product scope & requirements) and `SmartISP_UIUX_Guide.md` (design system & key screens).*