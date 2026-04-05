# Corporate Booking Domain — Frontend Service Documentation

## 🛠️ Overview
The Corporate Booking domain facilitates B2B user flows, allowing corporate entities to create team accounts, manage members, submit bulk booking requests, and process payments. It includes a dedicated corporate landing page and an interactive management dashboard.

## 🏗️ Component Architecture

```text
┌─────────────────────────────────────────────────────────────────────┐
│                 CORPORATE LANDING PAGE (/corporate)                  │
│                                                                     │
│  [Hero Section] Features: B2B accounts, GST billing, Workflow       │
│                                │                                    │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     CREATE ACCOUNT FORM                       │   │
│  │  - Company Name                                               │   │
│  │  - GST Number                                                 │   │
│  │  - Require Manager Approval? (Toggle)                         │   │
│  │  [Create Account Button] ──→ POST /api/corporate/account      │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│            CORPORATE DASHBOARD (/corporate/dashboard)               │
│                                                                     │
│  [Stats Header] Total Requests | Pending | Paid | Team Members      │
│                                │                                    │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    BOOKING REQUESTS LIST                      │   │
│  │  Status Badges: [Pending] [Approved] [Paid] [Rejected]        │   │
│  │                                                               │   │
│  │  If Admin & Pending: [Approve Button] [Reject Button]         │   │
│  │  If Approved:        [Pay Now Button] ──→ Stripe Checkout     │   │
│  │  If Paid/Approved:   [Invoice Button] ──→ Download HTML PDF   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                │                                    │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    ADD TEAM MEMBER (Admin)                    │   │
│  │  - Entering Clerk User ID                                     │   │
│  │  [Add Button] ──→ POST /api/corporate/account/add-member      │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow: Corporate Workflow Lifecycle

```text
Corporate Admin creates account via /corporate
    │
    ▼
Adds team members mapping Clerk IDs
    │
    ▼
Team member logs in and books tickets
    │  (If user belongs to a corporate account, tickets are booked as CorporateBookingRequest)
    ▼
Request appears on Dashboard as "Pending"
    │
    ▼
Admin approves request
    │  POST /api/corporate/booking/approve/:id
    ▼
Server generates Stripe payment link, marks "Approved"
    │
    ▼
Admin clicks "Pay Now" → completes Stripe Checkout
    │
    ▼
Server webhook marks request as "Paid", generates GST Invoice
    │
    ▼
Members/Admin download invoice from Dashboard
```

## 🧩 Component Details

### Corporate.tsx (Landing & Setup)
- **Role**: Onboards new B2B accounts.
- **State**: Company Name, GST Number, Approval Toggle.

### CorporateDashboard.tsx (Management)
- **Role**: Centralized hub for corporate requests and members.
- **Tab System**: Filters between "All Requests" and "Pending".
- **Dynamic Capabilities**: Action buttons change based on the user's role (admin vs member) and the request status (`pending`, `approved`, `paid`).

## 📁 Files

```text
src/
├── pages/
│   ├── Corporate.tsx             # Landing and onboarding form
│   └── CorporateDashboard.tsx    # Management hub and request pipeline
│
└── App.tsx                       # Registers `/corporate` and `/corporate/dashboard`
```

## ✅ Implementation Status
- **✅ Account Creation**: Support for Company Name and GST metadata.
- **✅ Team Management**: Support for resolving multi-user Clerk IDs to a single account.
- **✅ Dashboard Panels**: Visual stat tracking and booking summaries.
- **✅ Invoice Generator**: Server-side HTML template binding for GST-compliant invoicing.
- **✅ Stripe Integration**: Centralized "One pays for all" checkouts.
