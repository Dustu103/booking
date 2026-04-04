# Catalog Service — Design Documentation

## 🛠️ Overview
The Catalog Service is the source of truth for all "Now Playing" and "Upcoming" content on MovieShine. It bridges the gap between global movie metadata (TMDB) and local theater scheduling (Shows). This is a **logical domain** within the monolithic Express server — not a separate microservice.

## 🏗️ System Architecture
The service performs lazy-loading of movie details from TMDB and persists them for localized show management.

```text
┌─────────────────────────────────────────────────────────────┐
│                       CATALOG SERVICE                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐│
│  │  TMDB Bridge     │  │   Show Scheduler │  │ Theater Svc  ││
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘│
│           │                     │                   │        │
│  ┌────────▼─────────────────────▼───────────────────▼───────┐│
│  │                Metadata Aggregation Logic                ││
│  │  - Fetch "Now Playing" from TMDB API                     ││
│  │  - Cast and Genre enrichment                             ││
│  │  - Multi-date show scheduling                            ││
│  └──────────────────────────────┬───────────────────────────┘│
└─────────────────────────────────┼────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                          DATA LAYER                         │
│  ┌──────────────────┐   ┌──────────────────┐                │
│  │    MongoDB       │   │     TMDB API     │                │
│  │   movies coll.   │   │  (Remote Meta)   │                │
│  │   + shows coll.  │   │  (REST / v3)     │                │
│  └──────────────────┘   └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Database Schema (MongoDB + Mongoose)

### `Movie` Collection
Stores enriched metadata fetched lazily from TMDB. The `_id` is the TMDB movie ID (string), not an auto-generated ObjectId.

```typescript
// models/Movie.ts — Mongoose Schema
{
  _id:               { type: String,  required: true },  // TMDB movie ID (e.g., "912649")
  title:             { type: String,  required: true },  // "Venom: The Last Dance"
  overview:          { type: String,  required: true },  // Synopsis text
  poster_path:       { type: String,  required: true },  // "/aosm8NMQ...jpg"
  backdrop_path:     { type: String,  required: true },  // Banner image path
  release_date:      { type: String,  required: true },  // "2024-10-22"
  original_language: { type: String  },                   // "en"
  tagline:           { type: String  },                   // "Til death do they part"
  genres:            { type: Array,   required: true },  // [{id: 878, name: "Sci-Fi"}]
  casts:             { type: Array,   required: true },  // [{name, character, profile_path}]
  vote_average:      { type: Number,  required: true },  // 6.8
  runtime:           { type: Number,  required: true },  // 109 (minutes)
  createdAt:         Date,                                // Auto (timestamps: true)
  updatedAt:         Date                                 // Auto (timestamps: true)
}
```

**TypeScript Interface**:
```typescript
interface IMovie extends Document {
  _id: string;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  original_language?: string;
  tagline?: string;
  genres: string[];
  casts: Array<{ name: string; role: string; image: string }>;
  vote_average: number;
  runtime: number;
}
```

### `Show` Collection
Represents a single theater showtime. The `occupiedSeats` field is a dynamic key-value map used as a real-time seat lock.

```typescript
// models/Show.ts — Mongoose Schema
{
  movie:         { type: String, required: true, ref: "Movie" },  // FK → Movie._id
  showDateTime:  { type: Date,   required: true },                // UTC timestamp
  showPrice:     { type: Number, required: true },                // Ticket price (USD)
  occupiedSeats: { type: Object, default: {} }                    // {"A1": "user_123", "B2": "user_456"}
}
// Options: { minimize: false }  →  preserves empty objects in MongoDB
```

**TypeScript Interface**:
```typescript
interface IShow extends Document {
  _id: Types.ObjectId;
  movie: string | IMovie;       // String (ID) or populated Movie doc
  showDateTime: Date;
  showPrice: number;
  occupiedSeats: Record<string, any>;  // seatId → userId mapping
}
```

**Indexing Strategy**:

| Field | Index Type | Purpose |
|-------|-----------|---------|
| `movie` | Default (ref) | Populate joins with Movie collection |
| `showDateTime` | Ascending (sort) | Efficient "upcoming shows" queries (`$gte: new Date()`) |

---

## 🔄 Key Workflows

### 1. Adding a New Movie/Show
```text
Admin Request (POST /api/show/add)
    │
    ▼
Check local DB
    ├── Movie exists? -> Use local
    └── Movie missing? -> Fetch from TMDB API
                      ├── GET /movie/{id} (details + tagline + runtime)
                      ├── GET /movie/{id}/credits (cast + crew)
                      └── Create local Movie record
    │
    ▼
Generate multiple Show records
    ├── Loop through dates × times
    └── Batch insert via Show.insertMany()
    │
    ▼
Return success response
```

### 2. Fetching "Now Playing" Unique List
- **Mechanism**: MongoDB query on `shows` where `showDateTime > now`, populated with movie metadata.
- **De-duplication**: JavaScript `Set` over movie references to return unique movies only.
- **Optimization**: `.populate("movie")` prevents N+1 queries.

## 🔌 Infrastructure & Integrations

| Integration | Technology | Purpose |
|-------------|------------|---------|
| **Metadata** | TMDB API (v3) | Global source for movie trailers, posters, and cast |
| **Storage** | MongoDB | Local persistence for movies and show schedules |
| **Worker** | Inngest | `app/show.added` event → triggers notification emails to all users |

---

## 📁 Directory Structure
```text
src/
├── controllers/
│   └── showController.ts   # TMDB fetch, scheduling logic, show queries
├── routes/
│   └── showRoutes.ts       # GET /now-playing, POST /add, GET /all, GET /:movieId
├── models/
│   ├── Movie.ts            # Metadata schema (TMDB-sourced)
│   └── Show.ts             # Scheduling schema (seat map + pricing)
└── configs/
    └── db.ts               # MongoDB connection layer
```

## ✅ Implementation Status
- **✅ TMDB Integration**: Fully operational with v3 API (details + credits).
- **✅ Show Scheduling**: Support for multi-day, multi-time batch creation.
- **✅ Metadata Caching**: Lazy-loading pattern reduces TMDB API usage.
- **🔄 Universal Search**: (Future) Global movie search beyond what is "Now Playing".

## ❓ Troubleshooting
- **Poster Missing**: Ensure `TMDB_API_KEY` is valid and not rate-limited.
- **Timezone Mismatch**: Shows are stored as UTC; client must localize to `Africa/Kigali` as per current specs.
- **Empty Show List**: Verify that shows exist with `showDateTime >= now` in MongoDB.

## 📖 Related Documentation
- [API Reference](api.md) — Complete endpoint documentation with request/response JSON
