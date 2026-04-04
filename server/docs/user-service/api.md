# User Service — API Documentation

## 🔌 Overview
The User Service manages user identity, booking history, and the "Favorite Movies" curation feature. User profiles are synchronized from Clerk via Inngest background workers.

- **Server**: `http://localhost:3000` (Monolithic Express)
- **Route Prefix**: `/api/user`
- **Content-Type**: `application/json`

---

## 🔐 Authentication

All User Service endpoints require a **Clerk JWT** in the Authorization header:

```
Authorization: Bearer <clerk-jwt-token>
```

User identity is extracted from `req.auth.userId` — injected by the global `clerkMiddleware()`.

---

## 🚀 Endpoints

### 1. Get My Bookings
**GET** `/api/user/bookings`

**Description**: Fetches the complete booking history for the authenticated user, sorted by most recent first. Each booking is fully populated with show and movie metadata.

**Authentication**: Required (Clerk JWT)

**Success Response (200)**:
```json
{
  "success": true,
  "bookings": [
    {
      "_id": "661f1a2b3c4d5e6f7a8b9c0d",
      "user": "user_2abc123",
      "show": {
        "_id": "661f1a2b3c4d5e6f7a8b9c10",
        "movie": {
          "_id": "912649",
          "title": "Venom: The Last Dance",
          "poster_path": "/aosm8NMQ3UyoBVpSxyimorCQykC.jpg"
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

**Error Response — Unauthorized**:
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**cURL**:
```bash
curl -X GET http://localhost:3000/api/user/bookings \
  -H "Authorization: Bearer <clerk-jwt>"
```

---

### 2. Toggle Favorite Movie
**POST** `/api/user/update-favorite`

**Description**: Toggles a movie in the authenticated user's favorites list. If the movie is not in the list, it is added. If it already exists, it is removed. Favorites are stored in Clerk's `privateMetadata.favorites` array.

**Authentication**: Required (Clerk JWT)

**Request Body**:
```json
{
  "movieId": "912649"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `movieId` | `string` | ✅ | TMDB movie ID to toggle |

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Favorite movies updated"
}
```

**Behavior**:
- If `movieId` is **NOT** in `privateMetadata.favorites` → **adds** it
- If `movieId` is **already** in `privateMetadata.favorites` → **removes** it

**cURL**:
```bash
curl -X POST http://localhost:3000/api/user/update-favorite \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <clerk-jwt>" \
  -d '{"movieId": "912649"}'
```

---

### 3. Get Favorite Movies
**GET** `/api/user/favorites`

**Description**: Fetches the authenticated user's favorite movie list. Reads the movie IDs from Clerk's `privateMetadata.favorites` and then queries the local MongoDB for full movie metadata.

**Authentication**: Required (Clerk JWT)

**Success Response (200)**:
```json
{
  "success": true,
  "movies": [
    {
      "_id": "912649",
      "title": "Venom: The Last Dance",
      "overview": "Eddie and Venom are on the run...",
      "poster_path": "/aosm8NMQ3UyoBVpSxyimorCQykC.jpg",
      "backdrop_path": "/3V4kLQg0kSqPLctI5ziYWB6BSBo.jpg",
      "genres": [{"id": 878, "name": "Science Fiction"}],
      "vote_average": 6.8,
      "runtime": 109
    }
  ]
}
```

**Success Response — No Favorites**:
```json
{
  "success": true,
  "movies": []
}
```

**cURL**:
```bash
curl -X GET http://localhost:3000/api/user/favorites \
  -H "Authorization: Bearer <clerk-jwt>"
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
| `401` | Missing or invalid Clerk JWT |
| `500` | Internal server error (Clerk API failure, DB error) |

---

## 🧪 Quick Test

```bash
# 1. Get your bookings
curl -H "Authorization: Bearer <jwt>" http://localhost:3000/api/user/bookings

# 2. Add a movie to favorites
curl -X POST http://localhost:3000/api/user/update-favorite \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt>" \
  -d '{"movieId": "912649"}'

# 3. Verify favorites list
curl -H "Authorization: Bearer <jwt>" http://localhost:3000/api/user/favorites
```
