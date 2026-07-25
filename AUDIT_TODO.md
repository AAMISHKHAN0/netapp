# SmartISP — Complete System Audit & TODO Log

This document tracks all audited components, functional verifications, priority issues, and Phase 2 enhancement backlog.

---

## Critical Bugs

*No critical crash or blocking data loss bugs found. Core Phase 1 MVP functionality verified.*

---

## High Priority

### 1. Hardcoded Demo Authentication fallback in `login/page.tsx`
- **File**: `apps/web/src/app/login/page.tsx`
- **Component**: `handleLogin` function
- **Description**: The login form falls back to simulated role setting when NextAuth/Supabase Auth isn't wired.
- **Root Cause**: Phase 1 staff auth uses quick role pre-filling for demonstration purposes without persistent JWT cookies.
- **Proposed Fix**: Wire `loginAction` from `apps/web/src/lib/actions.ts` into NextAuth HTTP-only JWT cookies.
- **Priority**: High

---

## Medium Priority

### 1. Responsive Table Horizontal Scroll Indicators on Mobile (< 640px)
- **File**: `apps/web/src/app/(dashboard)/customers/page.tsx` & `billing/page.tsx`
- **Component**: Data Tables
- **Description**: Data tables wrap inside `overflow-x-auto`, but on very small screens (iPhone SE), a visual scroll prompt is missing.
- **Root Cause**: Tables use standard `overflow-x-auto` wrapper without horizontal gradient fade cues.
- **Proposed Fix**: Add stacked card layout breakpoint (`md:hidden`) for mobile subscribers list per UI/UX Guide §10.
- **Priority**: Medium

---

## Low Priority

### 1. Thermal Printing Layout Style Tags
- **File**: `apps/web/src/app/(dashboard)/payments/page.tsx`
- **Component**: Receipt Card Thermal Print Button
- **Description**: Clicking `Print Thermal Receipt` invokes `window.print()`, printing the full page rather than isolating the receipt receipt canvas.
- **Root Cause**: Missing CSS `@media print` print stylesheet hiding sidebar/topbar.
- **Proposed Fix**: Inject `@media print { body * { visibility: hidden; } #receipt-canvas { visibility: visible; } }`.
- **Priority**: Low

---

## Phase 2 Backlog (Not Implemented - Out of Phase 1 Scope)

1. **Complaints Kanban Board** (`PRD FR-6`): Reserved for Phase 2.
2. **Technician Mobile View & Attendance** (`PRD FR-7`): Reserved for Phase 2.
3. **Expense Management** (`PRD FR-8`): Reserved for Phase 2.
4. **Inventory & ONU Stock Tracking** (`PRD FR-14`): Reserved for Phase 3.
5. **Customer Self-Service Portal & Online Gateway Checkout** (`PRD FR-11, FR-15`): Reserved for Phase 2–3.
