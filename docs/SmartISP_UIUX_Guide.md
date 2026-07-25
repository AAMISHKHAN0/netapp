# SmartISP — UI/UX Design Guide

**Product:** SmartISP — ISP Billing, Fee Collection & Operations Platform
**Version:** 1.0
**Date:** July 25, 2026
**Companion to:** `SmartISP_PRD.md`, `SmartISP_TRD.md`

---

## 1. Design Philosophy

SmartISP handles other people's money, so the interface has to feel **trustworthy, precise, and calm** — closer to Stripe's dashboard or Linear than to a typical crowded admin template. Three principles guide every screen:

1. **Clarity over decoration.** Numbers (money, dues, counts) are the hero content; chrome around them stays quiet.
2. **Fast, not flashy.** Motion and visual flourish are used only where they aid comprehension (a status change, a value updating) — never just for show.
3. **Built for a busy cashier, not just the owner.** Every screen a staff member touches many times a day (payment entry, complaint logging) should be optimized for speed and few clicks, even if that means it's visually simpler than the analytics screens the owner checks once a day.

## 2. Color System

**Primary brand color:** a confident, trustworthy blue-indigo — signals "financial software" without feeling cold.

| Token | Light mode | Dark mode | Usage |
|---|---|---|---|
| `--background` | `#FAFAFA` | `#0A0A0B` | Page background |
| `--surface` | `#FFFFFF` | `#141416` | Cards, tables, panels |
| `--border` | `#E5E7EB` | `#26272B` | Dividers, card borders |
| `--text-primary` | `#111827` | `#F5F5F6` | Headings, key values |
| `--text-secondary` | `#6B7280` | `#A1A1AA` | Labels, captions |
| `--primary` | `#4F46E5` | `#6366F1` | Primary actions, active nav, links |
| `--primary-hover` | `#4338CA` | `#4F46E5` | Hover state |
| `--success` | `#16A34A` | `#22C55E` | Paid, Active, resolved |
| `--warning` | `#D97706` | `#F59E0B` | Due soon, Pending |
| `--danger` | `#DC2626` | `#EF4444` | Overdue, Suspended, errors |
| `--info` | `#0284C7` | `#38BDF8` | Neutral notices |

Status colors are used **consistently and only** for status — never repurposed decoratively, so a glance at a screen tells the user at-a-glance what needs attention (red = money/service problem, amber = coming up, green = handled).

## 3. Typography

- **Primary font:** Inter (or Geist) — excellent legibility at small sizes for dense tables, wide language support.
- **Numeric tables/amounts:** enable tabular figures (`font-variant-numeric: tabular-nums`) so columns of money align cleanly — a small detail that matters a lot in a billing product.

| Style | Size / Weight | Usage |
|---|---|---|
| Display | 32px / 700 | Dashboard hero stat (e.g., "Rs. 12,450") |
| H1 | 24px / 600 | Page titles |
| H2 | 18px / 600 | Section headers, card titles |
| Body | 14px / 400 | Default text, table cells |
| Small | 13px / 400 | Secondary labels, captions |
| Caption | 12px / 500 | Table headers (uppercase, letter-spaced) |

## 4. Spacing & Layout Grid

- Base unit: **4px**, scaling in 4/8/12/16/24/32/48px steps.
- Content max-width: 1440px on large screens, with generous side padding (24–32px) rather than edge-to-edge tables.
- Sidebar: fixed 240px expanded / 64px collapsed (icon-only).
- Card padding: 20px; card corner radius: 12px (soft but not overly rounded — reads as "professional software," not "consumer app").

## 5. Core Layout

```
┌───────────┬───────────────────────────────────────────┐
│           │  Topbar: search / ⌘K palette · notifications · profile │
│  Sidebar  ├───────────────────────────────────────────┤
│           │  Breadcrumb                                │
│  - Dashboard      │  Page content                       │
│  - Customers      │                                      │
│  - Billing        │                                      │
│  - Payments       │                                      │
│  - Complaints      │                                      │
│  - Technicians     │                                      │
│  - Expenses        │                                      │
│  - Reports          │                                      │
│  - Settings          │                                      │
└───────────┴───────────────────────────────────────────┘
```

Sidebar items map 1:1 to PRD modules. Branch Managers/Cashiers see a filtered subset based on their role's permissions — the nav itself reflects RBAC, not just page-level guards.

## 6. Core Components (shadcn/ui based)

- **Stat cards:** big number, label, small trend indicator (▲/▼ vs. last period), optional sparkline. Used across the dashboard for Today's Collection, Monthly Revenue, Pending Payments, Active Customers, etc.
- **Status badges:** pill-shaped, colored per §2 (Active/green, Suspended/red, Pending/amber, Closed/gray; Paid/green, Due Soon/amber, Overdue/red).
- **Data tables** (TanStack Table): sticky header, column sort, inline filters (status, package, area, branch), row-level quick actions (view, record payment, message), pagination, and a persistent search box. Tables collapse to stacked cards on mobile (§10).
- **Forms:** React Hook Form + Zod, inline validation messages, autosave indicator on longer forms (customer edit) so staff don't lose work.
- **Command palette (⌘K / Ctrl+K):** jump to any customer, invoice, or action ("record payment for Ali", "new complaint") — a genuine time-saver for power users like the owner and branch managers.
- **Empty states:** never a blank table — always a short explanation + a primary action ("No complaints yet — they'll show up here once customers report an issue").
- **Toasts:** confirm successful actions (payment recorded, reminder sent) without blocking the workflow.
- **Skeleton loaders:** match the shape of the content they replace (stat card skeletons, table row skeletons) rather than a generic spinner, so layout doesn't jump when data arrives.

## 7. Key Screens

### 7.1 Dashboard
Top row: 6–8 stat cards (Today's Collection, Monthly Revenue, Pending Payments, Active Customers, New Customers This Month, Today's Complaints, Upcoming Renewals). Below: a two-column chart row (Revenue trend line chart + Package distribution donut), followed by a Recent Activity feed (latest payments, new complaints, new customers) and a Quick Actions row (Record Payment, Add Customer, New Complaint).

### 7.2 Customers — List & Detail
List: searchable/filterable table (status, package, branch, area). Detail view uses tabs: **Overview** (personal + internet + billing info), **Billing History** (all invoices/payments), **Complaints**, **Documents** (CNIC scan, agreement). A prominent status badge and "Record Payment" button stay visible at the top regardless of tab.

### 7.3 Billing & Payment Collection
Invoice list filterable by status (Unpaid/Partial/Paid/Overdue). The **payment entry flow** is deliberately POS-like and fast: search customer → amount pre-filled from balance due → method selector → confirm → receipt auto-generated and offered to print or send via WhatsApp — this is the single most-used screen in the whole product and should take a trained cashier under 15 seconds per transaction.

### 7.4 Complaints
Kanban-style board (Open → In Progress → Resolved) for support agents and managers, drag to update status; each card shows priority color, customer name/area, and assigned technician avatar. List view available as an alternative for filtering/export.

### 7.5 Technicians (mobile-first)
A simple, large-tap-target mobile view: today's job list as cards (customer name, address with map link, issue type), tap to open job detail, mark complete, log parts used, optional photo upload as proof of work.

### 7.6 Reports & Analytics
Chart-forward layout: revenue trend, collection rate gauge, customer growth, complaint trend by area — each chart has a matching export (PDF/Excel/CSV) and a date-range + branch filter shared across the whole page.

### 7.7 Settings
Tabs for: Business Profile (name, logo, currency, invoice numbering), Branches, Packages & Taxes, Roles & Permissions, Notification Templates (WhatsApp/SMS/Email editable text), Billing (the tenant's own SmartISP subscription).

### 7.8 Customer Self-Service Portal 🆕
Deliberately much simpler than the admin app — mobile-first, single-column: current bill amount + due date + a prominent **Pay Now** button at the top, payment history below, and a "Report an Issue" button that opens a short complaint form. No sidebar, no dense tables — this is a different product surface for a different audience.

## 8. Data Visualization Guidelines

- One consistent chart color per data series across the whole app (e.g., revenue is always the primary indigo, expenses always a neutral gray) — a user shouldn't have to re-learn the color mapping per page.
- Line charts for trends over time (revenue, customer growth); bar charts for comparisons across categories (branch, package); donut charts sparingly, only for part-to-whole breakdowns (package distribution, payment method split).
- Every chart has a loading skeleton and an explicit empty state ("Not enough data yet for this period") rather than an empty axis.
- Avoid 3D effects, gratuitous gradients, or animated chart "reveals" that delay reading real numbers.

## 9. Motion (Framer Motion)

Used only where it communicates a state change, not for decoration:
- Stat cards fade/slide in on first load (staggered ~40ms apart), not on every re-render.
- A status badge transitioning (e.g., Pending → Paid) briefly highlights before settling.
- Modals/sheets slide in from the edge they're anchored to; no bounce or overshoot easing — keep it crisp and professional.
- Page transitions are subtle (opacity/8px translate, ~150ms) — the app should feel instant, not "designed."

## 10. Responsive Design

| Breakpoint | Range | Behavior |
|---|---|---|
| Mobile | < 640px | Sidebar becomes a bottom nav or slide-out drawer; tables become stacked card lists; technician module is mobile-first here by design |
| Tablet | 640–1024px | Sidebar collapses to icon-only by default; two-column layouts drop to one column |
| Desktop | > 1024px | Full sidebar + multi-column dashboard/report layouts |

The **customer portal** and **technician view** should be treated as mobile-first products, not responsive afterthoughts of the admin app — that's genuinely how they'll be used in the field.

## 11. Accessibility

- WCAG AA contrast minimum for all text/background combinations in both themes (the palette in §2 is chosen to meet this).
- All icon-only buttons have `aria-label`s (e.g., the command palette trigger, table row action icons).
- Full keyboard navigation for the command palette and data tables (arrow keys + Enter to select a row).
- Status is never communicated by color alone — every status badge pairs color with a text label (and optionally an icon), so it's still legible for colorblind users and in black-and-white printed reports.

## 12. Dark Mode

Implemented via `next-themes` with the token table in §2. Charts and status colors are re-tuned (not just inverted) for dark backgrounds to keep the same perceptual weight — a raw color inversion tends to make success/danger colors either too dim or oversaturated.

## 13. Iconography

`lucide-react`, consistent 1.5px stroke weight, sized at 16px (inline/table), 20px (buttons/nav), or 24px (empty states, feature highlights) depending on context — never mixed within the same component.

## 14. Localization (English → Urdu roadmap)

English ships first. When Urdu is added (per PRD §8), plan for:
- RTL layout support (Tailwind's `rtl:` variants, mirrored sidebar/icons)
- A Nastaliq-style Urdu font paired with Inter/Geist for Latin text/numerals, since financial figures often stay in Western numerals even in an Urdu UI — this should be validated with real users rather than assumed.

## 15. Voice & Micro-copy

- **Reminder messages** (WhatsApp/SMS): polite, direct, never guilt-tripping — matches the tone already drafted in the PRD's reminder templates (e.g., "Your internet bill of Rs. 2,500 is due tomorrow. Please pay before the due date. Thank you.").
- **Error messages:** specific and actionable ("This phone number is already registered to another customer" — not "Something went wrong").
- **Empty states:** encouraging, not apologetic ("No complaints yet — nice and quiet 👍" rather than "No data found").

---

*Companion documents: `SmartISP_PRD.md` (product scope & requirements) and `SmartISP_TRD.md` (technical architecture).*
