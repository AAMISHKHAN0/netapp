# SmartISP — Product Requirements Document (PRD)

**Product:** SmartISP — ISP Billing, Fee Collection & Operations Platform
**Version:** 1.0
**Date:** July 25, 2026
**Owner:** [Your Name] — built for [Friend's ISP Business]
**Status:** Draft for stakeholder review

> Naming note: "SmartISP" is carried over as a placeholder from earlier brainstorming. Swap in your friend's actual business name/brand before development if you'd like the product white-labeled to their company from day one.

---

## 1. Executive Summary

SmartISP is a web-based operations platform for local internet service providers (ISPs). It replaces manual registers and spreadsheets with a single system to manage customers, packages, monthly billing, payment collection, automated WhatsApp/SMS/email reminders, complaints, technicians, expenses, and reporting.

The MVP is scoped for a single ISP (your friend's business), but the architecture is designed from day one as a **multi-tenant SaaS platform** — so once it works well for one company, it can be resold to other ISPs without a rebuild. This is the single biggest strategic upgrade over the original idea: build it once, sell it many times.

## 2. Problem Statement

Small and mid-sized ISPs typically run on registers, WhatsApp chats, and Excel sheets. This causes:

- No reliable way to know who has paid and who hasn't, in real time
- Missed or forgotten due-date reminders, leading to delayed collections and cash flow gaps
- No single record of a customer's package, equipment, and billing history
- Technicians dispatched without a system — jobs tracked verbally or on paper
- No visibility into monthly revenue, expenses, or profitability until someone manually tallies it
- Owners can't easily answer "how much are we owed right now?" or "which area has the most complaints?"

## 3. Goals & Objectives

| Goal | Why it matters |
|---|---|
| Centralize all customer, billing, and complaint data | Eliminates spreadsheets and register books |
| Automate due-date and overdue reminders | Improves on-time collection rate without manual follow-up |
| Give the owner a real-time financial picture | Faster, better decisions |
| Support multiple branches and staff roles | Business can scale without process breakdown |
| Make the platform resellable | Turns a one-off project into a recurring-revenue product |

## 4. Target Users / Personas

| Persona | Role | Primary needs |
|---|---|---|
| **Owner / Super Admin** (your friend) | Runs the ISP | Full visibility: revenue, outstanding dues, staff performance, business health |
| **Branch Manager** | Runs a specific location | Manage customers/staff/collections for their branch only |
| **Cashier / Accountant** | Collects payments, reconciles cash | Fast payment entry, receipts, daily collection summary |
| **Technician** | Installs & repairs connections | Simple job list, mark jobs done, log parts used |
| **Support Agent** | Handles complaints/calls | Log and track complaints to resolution |
| **End Customer** (subscriber) | Pays for internet | Know their bill, due date, and be able to pay/report issues without calling |

## 5. Representative User Stories

- As the **owner**, I want to see today's collections, pending dues, and this month's revenue on one dashboard, so I don't have to ask my staff.
- As the **owner**, I want overdue customers automatically reminded on WhatsApp, so I don't have to chase people manually.
- As a **cashier**, I want to record a cash or Easypaisa payment in under 10 seconds and print/share a receipt, so the line at my desk moves fast.
- As a **branch manager**, I want to see only my branch's customers and numbers, so I'm not overwhelmed by data that isn't mine.
- As a **technician**, I want a simple mobile-friendly list of today's assigned jobs, so I know where to go without calling the office.
- As a **support agent**, I want to log a complaint with a photo and priority, and assign it to a technician, so nothing gets lost.
- As a **customer**, I want to check my bill and pay online without calling the office, so it's convenient for me.
- As the **owner**, I want a monthly expense and income report, so I know my actual profit.

## 6. Scope

### 6.1 Phase 1 — MVP (single tenant, single/multi-branch)
Customer management, package management, manual + auto invoice generation, payment recording (cash/bank/Easypaisa/JazzCash/card, manually reconciled), WhatsApp reminders (via Evolution API, see TRD), basic dashboard, income reports, role-based access (Owner, Manager, Cashier).

### 6.2 Phase 2
Complaint management, technician module, expense tracking, customer self-service portal, SMS + email reminders, multi-branch support, notification center.

### 6.3 Phase 3
Analytics & AI insights, direct payment gateway integration (customers pay online instead of cash-only), inventory/asset tracking, CSV/Excel data import wizard for onboarding.

### 6.4 Phase 4 — Multi-tenant SaaS conversion
Tenant isolation, subscription billing for the SaaS itself, white-label branding per tenant, plan-based feature/customer limits, admin console for you (the platform owner) to manage tenants.

### 6.5 Phase 5
Mobile apps (technician + customer), MikroTik/RADIUS integration for automatic suspend/reactivate on non-payment, public API & webhooks for third-party integrations.

### 6.6 Out of Scope (for now)
Building your own SMS/WhatsApp carrier infrastructure; accounting-grade tax/GST filing automation; full ERP/HR/payroll suite (only lightweight expense and technician salary tracking is included).

## 7. Functional Requirements

### FR-1 Customer Management
- Store personal info (name, CNIC, phone, WhatsApp number, email, photo), address (city/area/street/house no., map pin), and internet details (ONU MAC, router MAC, static IP if any, PPPoE username/password, install & activation dates).
- Store billing info per customer: monthly fee, installation charge, due date, security deposit, previous balance.
- Status lifecycle: **Active → Suspended → Pending → Closed**, with reason and timestamp logged on every status change.
- Full-text search by name, phone, CNIC, customer ID, ONU MAC, PPPoE username, or area.

### FR-2 Package Management
- Define packages (name, download/upload speed, price, tax, FUP limit, description) and a "Corporate" package category for business clients.
- Packages can be activated/deactivated without deleting history of customers who used them.

### FR-3 Billing
- Auto-generate monthly invoices on a configurable billing date, honoring discounts, fines, previous balance carry-forward, and tax.
- Manual invoice creation for one-off charges (installation, equipment sale, corporate cabling, etc.).
- PDF invoice generation; optional payment QR code on the invoice.

### FR-4 Payment Collection
- Record payments by method: cash, bank transfer, Easypaisa, JazzCash, card, online transfer.
- Instant receipt generation (print or share as PDF/WhatsApp).
- Partial payments and payment plans are supported and reflected in the outstanding balance.

### FR-5 Automated Reminders (WhatsApp / SMS / Email)
- Reminder types: **before due date, due today, overdue, payment received confirmation.**
- Message templates are editable by the admin, with variables like `{{name}}`, `{{amount}}`, `{{date}}`.
- Daily scheduled job checks all active customers and queues the right reminder — no manual triggering needed.
- Delivery status (sent/failed/read where supported) is logged per message.
- SMS and email are fallback channels for customers without WhatsApp.

### FR-6 Complaint Management
- Categories: Internet Slow, No Internet, High Ping, Cable Damage, ONU Fault, Router Issue, Other.
- Each ticket has priority, assigned technician, attached images, status (Open/In Progress/Resolved/Closed), and resolution time tracked automatically.
- 🆕 **SLA & escalation:** if a ticket isn't touched within a configurable time (e.g., 4 hours for "No Internet"), it auto-escalates to the branch manager.

### FR-7 Technician Module
- Each technician sees their assigned jobs, today's visits, and closed job history.
- Optional GPS check-in on job start/complete.
- Salary and attendance tracking.
- 🆕 Parts/inventory used per job is logged against stock (see FR-14).

### FR-8 Expense Management
Track electricity, fiber/bandwidth purchase, pole rent, fuel, salaries, office rent, maintenance, and custom categories — each with date, amount, branch, and receipt attachment.

### FR-9 Reports & Income
Daily/weekly/monthly/yearly views of collected revenue, outstanding dues, paid vs. cancelled invoices, and expected revenue for the current period. Exportable as PDF, Excel, or CSV.

### FR-10 Analytics Dashboard
Revenue trend, customer growth, package distribution, collection rate, complaint trend — all as interactive charts, filterable by branch and date range.

### FR-11 Customer Self-Service Portal
Customers log in (phone/OTP or email) to view/download invoices, see payment history, view their package, submit and track complaints, and update contact details.

- 🆕 **Online bill payment**: a "Pay Now" button on the portal (see FR-15) instead of cash-only collection — this is one of the highest-value additions, since it directly improves cash flow and reduces cashier workload.

### FR-12 Admin Panel
Manage employees, roles/permissions, packages, taxes, branches, and general settings (business name, logo, currency, invoice numbering format, reminder timing rules).

### FR-13 Multi-Branch Support
Each branch has its own customers, staff, reports, revenue, and expenses, while the owner can see a consolidated cross-branch view.

### FR-14 🆕 Inventory & Asset Management (pulled forward from "future ideas")
Track routers, ONUs, cables, and accessories: stock in/out, assigned-to-customer status, low-stock alerts, and cost basis for expense reporting. This closes a real gap — ISPs lose track of expensive equipment constantly, and technicians currently have no system tie-in for parts used.

### FR-15 🆕 Payment Gateway Integration
Beyond manually recording an Easypaisa/JazzCash transfer, integrate their checkout APIs (or a local aggregator) so customers can pay directly from an invoice link or the portal, with automatic reconciliation instead of a cashier manually marking it paid.

### FR-16 🆕 Data Import Wizard
A guided CSV/Excel importer with field mapping and a validation preview, so an ISP switching from spreadsheets can onboard their existing customer base in an afternoon instead of re-typing everything. This materially lowers the barrier for **selling this to other ISPs**, which is the whole point of building it as a product.

### FR-17 Role-Based Access Control
Roles: Super Admin, Branch Manager, Cashier, Technician, Support Agent, Accountant — each with a customizable, granular permission matrix (view/create/edit/delete per module).

### FR-18 Notifications Center (internal)
In-app + email notifications to staff for: bill due, payment received, complaint assigned, new customer added, daily collection summary, backup completed.

### FR-19 🆕 AI Assistant & Insights (Premium)
- Natural-language query over the business's own data: *"Who hasn't paid this month?"*, *"Show overdue customers in Johar Town."*
- **Collection risk scoring**: flags customers statistically likely to miss their next payment, based on their payment history.
- **Revenue forecasting** for the current month based on collections-to-date.
- **Complaint pattern detection**: surfaces recurring issues by area, package, or equipment type (e.g., "60% of 'No Internet' tickets this month are in Block C").
- Plain-language business insights surfaced proactively on the dashboard (e.g., "Collections are 12% lower than this time last month").

### FR-20 🆕 Multi-Tenant & Subscription Layer (for the SaaS business model)
- Each ISP that signs up gets an isolated workspace (own customers, branches, staff, data) under a shared platform.
- Plan tiers gate features and limits (see §12).
- You, as the platform owner, get a super-admin console to see all tenants, their plan, usage, and billing status — this is what turns the project into a product business rather than a single client deliverable.

## 8. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Dashboard loads in under 2 seconds; page transitions feel instant (sub-200ms perceived) |
| Scalability | Must comfortably support 5,000+ customers per tenant and dozens of tenants without redesign |
| Security | Encrypted data at rest and in transit; role-based access enforced server-side, not just hidden in the UI; 2FA available for admin accounts |
| Reliability | Automated daily backups; reminder jobs must retry on failure and never silently drop a message |
| Usability | Non-technical staff (cashiers, technicians) should be productive with under 15 minutes of training |
| Localization | English UI at launch; Urdu as a fast-follow (see UI/UX guide) |
| Auditability | Every financial or status-changing action is logged with who/when/what changed |

## 9. Success Metrics (KPIs)

- % of bills paid on or before due date (target: measurable uplift vs. pre-launch baseline)
- Average days-to-pay after due date
- Reminder delivery success rate
- Complaint resolution time (median)
- System uptime (target 99.5%+)
- If sold as SaaS: number of tenants, MRR, tenant churn rate

## 10. Subscription / Pricing Model (for the SaaS version)

| Plan | Customers | Branches | Key features | Suggested target |
|---|---|---|---|---|
| **Starter** | Up to 200 | 1 | Core billing, reminders, basic reports | Small ISPs / new resellers |
| **Professional** | Up to 1,000 | Up to 3 | + Complaints, technicians, portal, expenses | Growing regional ISPs |
| **Enterprise** | Unlimited | Unlimited | + AI insights, white-label, API access, priority support | Large ISPs / franchise groups |

Pricing itself (fixed monthly vs. per-customer) is a business decision best made once you've validated the product with your friend's real usage data — I'd recommend starting per-customer-tier as shown above since it scales fairly with the ISP's own revenue.

## 11. Assumptions & Constraints

- Primary market is Pakistan initially (CNIC, Easypaisa/JazzCash, Urdu localization) — architecture should not hard-code this, to allow future regional expansion.
- WhatsApp automation initially relies on Evolution API (unofficial) for cost reasons; migration path to the official WhatsApp Cloud API is required before reselling to other businesses commercially (see TRD §10 for why).
- Your friend's business is the reference implementation and first real-world test; treat their feedback in the first 60–90 days as the primary MVP validation signal.

## 12. Risks

| Risk | Mitigation |
|---|---|
| Unofficial WhatsApp automation gets the connected number banned | Rate-limit sends, keep official Cloud API as documented fallback, monitor delivery failures |
| Manual payment recording causes reconciliation errors | Phase 3 payment gateway integration reduces manual entry over time |
| Feature scope creep delays MVP | Hold firmly to the Phase 1 scope in §6.1; everything else is explicitly deferred |
| Multi-tenant retrofit is harder than building it in from the start | Recommendation: design the DB schema multi-tenant-ready from day one (tenant_id on every table) even while only serving one tenant initially — see TRD §4 |

## 13. Glossary

| Term | Meaning |
|---|---|
| ONU | Optical Network Unit — the device converting fiber signal at the customer's premises |
| PPPoE | Point-to-Point Protocol over Ethernet — common authentication method for internet sessions |
| FUP | Fair Usage Policy — data/speed cap after a usage threshold |
| CNIC | Computerized National Identity Card (Pakistan's national ID) |
| MikroTik / RADIUS | Networking hardware/protocol used to authenticate and manage subscriber sessions; enables automatic suspend-on-nonpayment |

---

*Companion documents: `SmartISP_TRD.md` (technical architecture) and `SmartISP_UIUX_Guide.md` (design system & screens).*
