# Admin Service — Design Documentation

## 🛠️ Overview
The Admin Service provides highly-privileged management capabilities for platform operators, including real-time dashboard analytics, catalog management, and administrative control over theatrical shows. This is a **logical domain** within the monolithic Express server — not a separate microservice.

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
│  │  - Show listing and booking oversight                    ││
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

## 📊 Analytics Models (Aggregated at Runtime)

The Admin service does NOT have its own MongoDB collection. It performs **real-time aggregation** across existing collections:

```typescript
// adminController.ts — Dashboard Aggregation
{
  totalBookings: number,     // Booking.countDocuments({ isPaid: true })
  totalRevenue:  number,     // SUM(Booking.amount) where isPaid = true
  totalUser:     number,     // User.countDocuments()
  activeShows:   IShow[]     // Show.find({ showDateTime: { $gte: now } }).populate("movie")
}
```

**Collections Read By Admin Service**:

| Collection | Query | Purpose |
|------------|-------|---------|
| `bookings` | `{ isPaid: true }` | Revenue calculation and booking counts |
| `users` | `countDocuments()` | Total registered user count |
| `shows` | `{ showDateTime: { $gte: new Date() } }` | List of active upcoming shows |
| `movies` | Via `.populate("movie")` | Movie metadata for show listings |

## 🔐 RBAC Implementation (protectAdmin Middleware)

```typescript
// middleware/auth.ts
const protectAdmin = async (req, res, next) => {
  const userId = req.auth?.userId;
  if (!userId) return res.json({ success: false, message: "not authorized" });

  const user = await clerkClient.users.getUser(userId);

  if (user.privateMetadata.role !== "admin") {
    return res.json({ success: false, message: "not authorized" });
  }

  next();  // ✅ User is admin — proceed
};
```

**Admin Setup**: To make a user an admin:
1. Go to **Clerk Dashboard → Users → Select User**
2. Click **Edit Private Metadata**
3. Set: `{ "role": "admin" }`

---

## 🔄 Key Workflows

### 1. Administrative Check (RBAC)
- **Mechanism**: The `protectAdmin` middleware extracts the `role` from the Clerk user's `privateMetadata`.
- **Action**: Blocks access with `{ success: false, message: "not authorized" }` if role is not `admin`.

### 2. Dashboard Data Aggregation
```text
Admin Request (GET /api/admin/dashboard)
    │
    ▼
Auth Middleware (protectAdmin)
    │  Validate Clerk role == 'admin'
    ▼
Admin Controller
    ├── Query Bookings (isPaid: true)
    │   └── Sum amounts for Total Revenue
    ├── Count Users (User.countDocuments())
    ├── Query Shows (showDateTime >= now)
    │   └── Populate movie metadata
    │
    ▼
Return Aggregated Dashboard Object
```

## 🔌 Infrastructure & Integrations

| Integration | Technology | Purpose |
|-------------|------------|---------|
| **RBAC** | Clerk `privateMetadata.role` | Strict admin role verification |
| **Analytics** | MongoDB Aggregation | Real-time queries over bookings, users, and shows |
| **Catalog** | TMDB API (via Show creation) | Movie metadata backfill during `POST /api/show/add` |

---

## 📁 Directory Structure
```text
src/
├── controllers/
│   └── adminController.ts   # isAdmin, dashboard, all-shows, all-bookings
├── routes/
│   └── adminRoutes.ts       # GET /is-admin, /dashboard, /all-shows, /all-bookings
├── middleware/
│   └── auth.ts              # protectAdmin — Clerk role guard
└── models/
    ├── Booking.ts           # Source for revenue data
    ├── Show.ts              # Source for active show data
    └── User.ts              # Source for user count
```

## ✅ Implementation Status
- **✅ protectAdmin**: Fully integrated and enforced across all admin routes.
- **✅ Analytics**: Live revenue and booking counts enabled.
- **✅ Show Management**: Full show listing with movie metadata population.
- **✅ Booking Oversight**: All bookings viewable with user, show, and movie data.
- **🔄 Extended Logs**: (Future) Admin audit logs for all management actions.

## ❓ Troubleshooting
- **IsAdmin=false**: Ensure the user has `role: "admin"` set in **Clerk Dashboard → Private Metadata**.
- **Stats Inaccurate**: Verify that only `isPaid: true` bookings are being summed.
- **Empty Show List**: Check that shows with future `showDateTime` exist in MongoDB.

## 📖 Related Documentation
- [API Reference](api.md) — Complete endpoint documentation with request/response JSON
