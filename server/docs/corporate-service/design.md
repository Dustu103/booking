# Corporate Booking Service — System Design Document

## 1. Executive Summary & Business Case (For Product & Marketing)

### The "Why"
The B2C cinema market has a low ceiling per transaction. The **Corporate Booking Service** introduces a dedicated B2B sales pipeline to MovieShine. By allowing corporations to centralize ticketing, we shift from selling 2 tickets per user to selling 50+ tickets per transaction. 

### Core Value Proposition (Marketing Focus)
*   **Centralized Billing (One-Pay-All):** Companies can host team outings without forcing employees to buy their own tickets and file HR expense reports.
*   **GST-Compliant Invoicing:** Fully automated, tax-compliant PDF/HTML invoices generated post-payment for corporate accounting teams.
*   **Approval Workflows:** Management can enforce a mandatory approval gate (Escrow phase) so employees can't spend company money without explicit authorization.

---

## 2. System Architecture (High-Level Design)

The Corporate Service is a logical domain built into the monolithic Express server relying heavily on **State Escrow** and **Role-Based Workflows**.

```text
┌─────────────────────────────────────────────────────────────┐
│                 CLIENT (Multi-Role React)                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐│
│  │ Employee Portal  │  │ Dashboard UI     │  │ Admin Actions││
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘│
└───────────┼─────────────────────┼───────────────────┼────────┘
            │          (Role-based Auth JWT)          │
            ▼                     ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                 ORCHESTRATION LAYER (corporateCtrl)         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐│
│  │  Access Matrix   │  │   Escrow Logic   │  │ Invoice Gen  ││
│  │ (Admin vs Memb)  │  │ (Locking Seats)  │  │ (HTML Bind)  ││
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘│
└───────────┼─────────────────────┼───────────────────┼────────┘
            │                     │                   │
            ▼                     ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                  STATE & PAYMENT SERVICES                   │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │ MongoDB (Storage)│  │ Stripe Payments  │                  │
│  └──────────────────┘  └──────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Core Business Logic & State Machines

The most complex business logic in this service is the **Booking Escrow Lifecycle**. Standard bookings are immediate (Seat Picked → Paid). Corporate bookings introduce a vital intermediary holding state.

### The Status State Machine
`pending` ──(Admin Approves)──> `approved` ──(Admin Pays)──> `paid`
   │
   └──(Admin Rejects)──> `rejected`

1.  **Creation (Escrow Entry):** When an employee books, `show.occupiedSeats` is immediately populated to lock out public users, but the payment is deferred. The `CorporateBookingRequest` sits at `pending`.
2.  **Approval (Gatekeeping):** The request surfaces on the Admin's dashboard. Clicking 'Approve' triggers a server-side Stripe Checkout Session creation tailored to the exact seat count + GST markup.
3.  **Fulfillment:** Stripe Webhook intercepts the payment, updates the request to `paid`, and validates the final invoice schema.

---

## 4. Data Model Design (MongoDB)

Our schemas are designed for relational traversing without heavy JOINs (`$lookup`), utilizing embedded references.

### A. `CorporateAccount` Schema
The Anchor document holding the B2B metadata.
*   `name` (String): The enterprise name.
*   `gstNumber` (String): Critical for the invoicing logic.
*   `adminUserId` (String): The single Clerk UserID holding approval authority.
*   `members` (Array<String>): A fast-lookup array of Clerk UserIDs that belong to this corporation.
*   `approvalRequired` (Boolean): Feature flag. If false, bypasses the `pending` escrow state.

### B. `CorporateBookingRequest` Schema
The Transaction document wrapping the core booking details.
*   `show` (Object): Embedded snapshot of the Movie and Show timings at the time of booking.
*   `requestedBy` (String): The employee who initiated it.
*   `status` (Enum): `pending | approved | rejected | paid`.
*   `gstAmount` (Number): Computed dynamically at creation time to freeze the tax rate context.

---

## 5. Developer Navigation & Debugging Guide

*For junior/new developers to instantly locacte and resolve issues.*

### Where does the Logic live?
*   **All primary business logic:** `server/src/controllers/corporateController.ts`
*   **Database definitions:** `server/src/models/CorporateAccount.ts` and `CorporateBookingRequest.ts`
*   **Routing & Middlewares:** `server/src/routes/corporateRoutes.ts`

### Common Bug Fixes & Hot-Paths
| Issue | Where to Fix | Logic to Check |
| :--- | :--- | :--- |
| **Admin cannot invite members** | `corporateController.ts` ➔ `addTeamMember()` | Validate `req.auth.userId` matches the DB `CorporateAccount.adminUserId`. |
| **Employees hit 'Unauthorized'** | `corporateController.ts` ➔ `submitBookingRequest()` | The `clerkUserId` of the requester is strictly checked against the `members` array in the DB. Ensure array pushes worked. |
| **Invoice generating blank PDFs/HTML** | `corporateController.ts` ➔ `downloadInvoice()` | It relies heavily on `req.params.requestId` resolving a populated target. Ensure `BookingRequest.show.movie` is deeply populated before string interpolation. |
| **Stripe Checkout Total Mismatch** | `corporateController.ts` ➔ `approveBookingRequest()` | Unit_amount is calculated in cents: `Math.floor((amount + gst) * 100)`. Ensure floating point math hasn't corrupted the integer. |

---

## 6. Design Decisions & Trade-Offs

**Trade-off 1: Escrow Database Holding vs Redis TTL Lock**
*   *Decision:* We hold `pending` corporate seats in the primary MongoDB `Show.occupiedSeats` map indefinitely until approved or explicitly rejected.
*   *Why:* Unlike normal B2C users who get a 10-minute Redis TTL timer to pay, corporate approvals can take days (waiting on finance teams). We chose guaranteed seat locking (DB persistent) over capacity optimization (Redis).

**Trade-off 2: Server-Side HTML Invoicing vs 3rd Party PDF Service**
*   *Decision:* Generating invoices as raw HTML strings dynamically within `corporateController.ts` and serving them as `text/html`.
*   *Why:* Reduced infrastructure cost (no headless chrome/puppeteer overhead, no external PDF API limits). The browser handles the print-to-PDF seamlessly for the user, retaining perfect CSS layouts at zero compute cost to us.
