# Admin Service — Design Documentation

## 🛠️ Overview
The Admin Service provides highly-privileged management capabilities for platform operators, including real-time dashboard analytics, catalog management, and administrative control over theatrical shows.

## 🏗️ System Architecture
The service enforces strict role-based access control (RBAC) via Clerk private metadata, ensuring only verified administrators can access sensitive management logic.

```text
┌─────────────────────────────────────────────────────────────┐
│                       API GATEWAY                           │
│                (Clerk Middleware / protectAdmin)            │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                      ADMIN SERVICE                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐│
│  │ Dashboard Svc    │  │  Catalog Manager  │  │  RBAC Svc    ││
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘│
│           │                     │                   │        │
│  ┌────────▼─────────────────────▼───────────────────▼───────┐│
│  │                Administrative Logic Unit                 ││
│  │  - Dashboard data aggregation (Bookings/Stats)           ││
│  │  - Batch show generation and unique movie sync           ││
│  │  - Role-based metadata verification (Clerk)              ││
│  └──────────────────────────────┬───────────────────────────┘│
└─────────────────────────────────┼────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                          DATA LAYER                         │
│  ┌──────────────────┐   ┌──────────────────┐                │
│  │    MongoDB       │   │      Clerk       │                │
│  │   Collections    │   │   Admin Role     │                │
│  │ (Full Access)    │   │ (PrivateMetadata)│                │
│  └──────────────────┘   └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Analytics Models
The service performs real-time aggregation across the platform:
- **Total Revenue**: Aggregated sum of `Booking.amount` where `isPaid = true`.
- **Total Users**: Count of the `User` collection.
- **Total Bookings**: Count of all successful booking transactions.
- **Active Shows**: List of all `Show` records with `showDateTime > now`.

## 🔄 Key Workflows

### 1. Administrative Check (RBAC)
- **Mechanism**: The `protectAdmin` middleware extracts the `role` from the Clerk user's `privateMetadata`.
- **Action**: Blocks access with a `401 Unauthorized` response if the role is not `admin`.

### 2. Dashboard Data Aggregation
```text
Admin Request (GET /api/admin/dashboard)
    │
    ▼
Auth Middleware (protectAdmin)
    │  Validate Clerk role == 'admin'
    ▼
Admin Handler
    ├── Query Bookings (isPaid=true)
    │   └── Sum amounts for Total Revenue
    ├── Count Users
    ├── Query Shows (Upcoming)
    │   └── Populate movie metadata
    │
    ▼
Return Aggregated Dashboard Object
```

## 🔌 Infrastructure & Integrations

| Integration | Technology | Purpose |
|-------------|------------|---------|
| **RBAC** | Clerk | Strict role management via `privateMetadata.role` |
| **Analytics** | MongoDB | Real-time aggregation over collections |
| **Catalog** | TMDB API | Used for metadata backfill during show addition |

---

## 📁 Directory Structure
```text
src/
├── controllers/
│   └── adminController.ts   # Analytics & Dashboard logic
├── routes/
│   └── adminRoutes.ts       # Endpoint mapping
├── middleware/
│   └── auth.ts              # RBAC (protectAdmin)
└── models/
    ├── Booking.ts           # Source for revenue data
    └── Show.ts              # Source for active show data
```

## ✅ Implementation Status
- **✅ protectAdmin**: Fully integrated and enforced across all admin routes.
- **✅ Analytics**: Live revenue and booking counts enabled.
- **✅ Show Management**: Batch show generation for administrators.
- **🔄 Extended Logs**: (Future) Admin audit logs for all management actions.

## ❓ Troubleshooting
- **IsAdmin=false**: Ensure the user has `role: "admin"` set in their **Clerk Dashboard -> Private Metadata**.
- **Stats Inaccurate**: Verify that only `isPaid: true` bookings are being summed.
