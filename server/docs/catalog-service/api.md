# Catalog Service — API Documentation

## 🔌 Overview
The Catalog Service manages the movie library and theater show schedules. It bridges TMDB's global metadata with MovieShine's local scheduling system.

- **Server**: `http://localhost:3000` (Monolithic Express)
- **Route Prefix**: `/api/show`
- **Content-Type**: `application/json`

---

## 🔐 Authentication

Some endpoints require **Admin-level** Clerk JWT authentication.

```
Authorization: Bearer <clerk-jwt-token>
```

---

## 🚀 Endpoints

### 1. Get "Now Playing" Movies from TMDB
**GET** `/api/show/now-playing`

**Description**: Fetches the current "Now Playing" movie list directly from the TMDB API. Used by admins to browse and select movies for local scheduling.

**Authentication**: Required (Admin only — `protectAdmin` middleware)

**Success Response (200)**:
```json
{
  "success": true,
  "movies": [
    {
      "id": 912649,
      "title": "Venom: The Last Dance",
      "overview": "Eddie and Venom are on the run...",
      "poster_path": "/aosm8NMQ3UyoBVpSxyimorCQykC.jpg",
      "backdrop_path": "/3V4kLQg0kSqPLctI5ziYWB6BSBo.jpg",
      "release_date": "2024-10-22",
      "vote_average": 6.8
    }
  ]
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "Request failed with status code 401"
}
```

**cURL**:
```bash
curl -X GET http://localhost:3000/api/show/now-playing \
  -H "Authorization: Bearer <admin-jwt>"
```

---

### 2. Add Show(s) for a Movie
**POST** `/api/show/add`

**Description**: Batch-creates theater shows for a movie. If the movie doesn't exist locally, it is automatically fetched from TMDB (lazy-load pattern) with full metadata enrichment (credits, trailers, genres).

**Authentication**: Required (Admin only — `protectAdmin` middleware)

**Request Body**:
```json
{
  "movieId": "912649",
  "showsInput": [
    {
      "date": "2025-04-10",
      "time": ["10:00", "14:30", "19:00"]
    },
    {
      "date": "2025-04-11",
      "time": ["11:00", "16:00"]
    }
  ],
  "showPrice": 12.99
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `movieId` | `string` | ✅ | TMDB movie ID |
| `showsInput` | `ShowInputItem[]` | ✅ | Array of date + time combinations |
| `showsInput[].date` | `string` | ✅ | ISO date (`YYYY-MM-DD`) |
| `showsInput[].time` | `string[]` | ✅ | Array of times in `HH:mm` format |
| `showPrice` | `number` | ✅ | Ticket price in USD |

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Show Added successfully."
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "Request failed with status code 404"
}
```

**cURL**:
```bash
curl -X POST http://localhost:3000/api/show/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-jwt>" \
  -d '{
    "movieId": "912649",
    "showsInput": [{"date": "2025-04-10", "time": ["10:00", "14:30"]}],
    "showPrice": 12.99
  }'
```

---

### 3. Get All Upcoming Movies (Unique)
**GET** `/api/show/all`

**Description**: Fetches a unique list of movies that have at least one upcoming show (`showDateTime >= now`). The shows collection is queried, populated with movie metadata, and de-duplicated.

**Authentication**: Not required (Public)

**Success Response (200)**:
```json
{
  "success": true,
  "shows": [
    {
      "_id": "912649",
      "title": "Venom: The Last Dance",
      "overview": "Eddie and Venom are on the run...",
      "poster_path": "/aosm8NMQ3UyoBVpSxyimorCQykC.jpg",
      "backdrop_path": "/3V4kLQg0kSqPLctI5ziYWB6BSBo.jpg",
      "genres": [{"id": 878, "name": "Science Fiction"}],
      "casts": [{"name": "Tom Hardy", "character": "Eddie Brock"}],
      "vote_average": 6.8,
      "runtime": 109
    }
  ]
}
```

**cURL**:
```bash
curl -X GET http://localhost:3000/api/show/all
```

---

### 4. Get Show Schedule for a Movie
**GET** `/api/show/:movieId`

**Description**: Fetches all upcoming showtimes for a specific movie, grouped by date. Returns the full movie metadata along with a date-indexed map of show slots.

**Authentication**: Not required (Public)

**Path Parameters**:
- `movieId` (string): TMDB movie ID

**Success Response (200)**:
```json
{
  "success": true,
  "movie": {
    "_id": "912649",
    "title": "Venom: The Last Dance",
    "poster_path": "/aosm8NMQ3UyoBVpSxyimorCQykC.jpg",
    "genres": [{"id": 878, "name": "Science Fiction"}],
    "runtime": 109
  },
  "dateTime": {
    "2025-04-10": [
      { "time": "2025-04-10T10:00:00.000Z", "showId": "661f1a2b3c4d5e6f7a8b9c0d" },
      { "time": "2025-04-10T14:30:00.000Z", "showId": "661f1a2b3c4d5e6f7a8b9c0e" }
    ],
    "2025-04-11": [
      { "time": "2025-04-11T11:00:00.000Z", "showId": "661f1a2b3c4d5e6f7a8b9c0f" }
    ]
  }
}
```

**cURL**:
```bash
curl -X GET http://localhost:3000/api/show/912649
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
| `500` | Internal server error |

---

## 🧪 Quick Test

```bash
# 1. Check public movie list
curl http://localhost:3000/api/show/all

# 2. Get schedule for a specific movie
curl http://localhost:3000/api/show/912649
```
