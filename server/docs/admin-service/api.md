# Admin Service — API Documentation

## 🔌 Overview
The Admin Service provides privileged management capabilities for platform operators, including real-time dashboard analytics, show management, and booking oversight.

- **Server**: `http://localhost:3000` (Monolithic Express)
- **Route Prefix**: `/api/admin`
- **Content-Type**: `application/json`

---

## 🔐 Authentication

**All** Admin endpoints are protected by both `clerkMiddleware()` and the `protectAdmin` middleware. The user must:

1. Have a valid Clerk JWT
2. Have `role: "admin"` set in their Clerk `privateMetadata`

```
Authorization: Bearer <admin-clerk-jwt>
```

> ⚠️ If the user is not an admin, all endpoints return `{ success: false, message: "not authorized" }`.

---

## 🚀 Endpoints

### 1. Check Admin Status
**GET** `/api/admin/is-admin`

**Description**: Verifies whether the authenticated user has admin privileges. Used by the frontend to conditionally render the admin dashboard.

**Authentication**: Required (Admin only)

**Success Response (200)** — Is Admin:
```json
{
  "success": true,
  "isAdmin": true
}
```

**Error Response — Not Admin**:
```json
{
  "success": false,
  "message": "not authorized"
}
```

**cURL**:
```bash
curl -X GET http://localhost:3000/api/admin/is-admin \
  -H "Authorization: Bearer <admin-jwt>"
```

---

### 2. Get Dashboard Analytics
**GET** `/api/admin/dashboard`

**Description**: Fetches aggregated platform analytics including total revenue, booking count, user count, and all active (upcoming) shows with movie metadata.

**Authentication**: Required (Admin only)

**Success Response (200)**:
```json
{
  "success": true,
  "dashboardData": {
    "totalBookings": 142,
    "totalRevenue": 1847.58,
    "totalUser": 89,
    "activeShows": [
      {
        "_id": "661f1a2b3c4d5e6f7a8b9c0d",
        "movie": {
          "_id": "912649",
          "title": "Venom: The Last Dance",
          "poster_path": "/aosm8NMQ3UyoBVpSxyimorCQykC.jpg"
        },
        "showDateTime": "2025-04-10T14:30:00.000Z",
        "showPrice": 12.99,
        "occupiedSeats": { "A1": "user_123", "A2": "user_456" }
      }
    ]
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `totalBookings` | `number` | Count of all bookings where `isPaid = true` |
| `totalRevenue` | `number` | Sum of `amount` across all paid bookings (USD) |
| `totalUser` | `number` | Count of all registered users |
| `activeShows` | `Show[]` | All shows with `showDateTime >= now`, populated with movie metadata |

**cURL**:
```bash
curl -X GET http://localhost:3000/api/admin/dashboard \
  -H "Authorization: Bearer <admin-jwt>"
```

---

### 3. Get All Active Shows
**GET** `/api/admin/all-shows`

**Description**: Fetches all upcoming shows (sorted by date, ascending) with fully populated movie metadata. Used for the admin's show management panel.

**Authentication**: Required (Admin only)

**Success Response (200)**:
```json
{
  "success": true,
  "shows": [
    {
      "_id": "661f1a2b3c4d5e6f7a8b9c0d",
      "movie": {
        "_id": "912649",
        "title": "Venom: The Last Dance",
        "poster_path": "/aosm8NMQ3UyoBVpSxyimorCQykC.jpg",
        "runtime": 109
      },
      "showDateTime": "2025-04-10T14:30:00.000Z",
      "showPrice": 12.99,
      "occupiedSeats": {}
    }
  ]
}
```

**cURL**:
```bash
curl -X GET http://localhost:3000/api/admin/all-shows \
  -H "Authorization: Bearer <admin-jwt>"
```

---

### 4. Get All Bookings
**GET** `/api/admin/all-bookings`

**Description**: Fetches all bookings on the platform (paid and unpaid), sorted by most recent first. Each booking is fully populated with user info, show data, and movie metadata.

**Authentication**: Required (Admin only)

**Success Response (200)**:
```json
{
  "success": true,
  "bookings": [
    {
      "_id": "661f1a2b3c4d5e6f7a8b9c0d",
      "user": {
        "_id": "user_2abc123",
        "name": "John Doe",
        "email": "john@example.com",
        "image": "https://img.clerk.com/..."
      },
      "show": {
        "_id": "661f1a2b3c4d5e6f7a8b9c10",
        "movie": {
          "_id": "912649",
          "title": "Venom: The Last Dance"
        },
        "showDateTime": "2025-04-10T14:30:00.000Z",
        "showPrice": 12.99
      },
      "amount": 25.98,
      "bookedSeats": ["A1", "A2"],
      "isPaid": true,
      "createdAt": "2025-04-08T09:15:00.000Z"
    }
  ]
}
```

**cURL**:
```bash
curl -X GET http://localhost:3000/api/admin/all-bookings \
  -H "Authorization: Bearer <admin-jwt>"
```

---

## 🚨 Error Handling

All endpoints return a consistent JSON structure:

```json
{
  "success": false,
  "message": "Human-readable error description"
}
```

| Status Code | Scenario |
|-------------|----------|
| `200` | Success (check `success: true/false` in body) |
| `200` + `success: false` | User is not an admin (`"not authorized"`) |
| `500` | Internal server error |

---

## 🧪 Quick Test

```bash
# 1. Check admin status
curl -H "Authorization: Bearer <jwt>" http://localhost:3000/api/admin/is-admin

# 2. Get dashboard analytics
curl -H "Authorization: Bearer <jwt>" http://localhost:3000/api/admin/dashboard

# 3. List all shows
curl -H "Authorization: Bearer <jwt>" http://localhost:3000/api/admin/all-shows

# 4. List all bookings
curl -H "Authorization: Bearer <jwt>" http://localhost:3000/api/admin/all-bookings
```

> **Note**: To set a user as admin, go to **Clerk Dashboard → Users → Select User → Edit Private Metadata** and set `{ "role": "admin" }`.
