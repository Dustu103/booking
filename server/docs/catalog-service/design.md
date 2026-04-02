# Catalog Service — Design Documentation

## 🛠️ Overview
The Catalog Service is the source of truth for all "Now Playing" and "Upcoming" content on MovieShine. It bridges the gap between global movie metadata (TMDB) and local theater scheduling (Shows).

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

## 📊 Data Models
- **`Movie`**: Comprehensive metadata including `poster_path`, `backdrop_path`, `genres`, and `casts`.
- **`Show`**: Atomic scheduling unit referencing a `Movie`, containing `showDateTime`, `showPrice`, and the `occupiedSeats` map.

## 🔄 Key Workflows

### 1. Adding a New Movie/Show
```text
Admin Request (POST /api/show/add)
    │
    ▼
Check local DB
    ├── Movie exists? -> Use local
    └── Movie missing? -> Fetch from TMDB API
                      ├── Enrich with credits/trailers
                      └── Create local Movie record
    │
    ▼
Generate multiple Show records
    ├── Loop through dates/times
    └── Batch insert into shows collection
    │
    ▼
Return success response
```

### 2. Fetching "Now Playing" Unique List
- **Mechanism**: MongoDB aggregation over the `shows` collection where `showDateTime > now`.
- **Optimization**: Populate with movie metadata to prevent N+1 queries.

## 🔌 Infrastructure & Integrations

| Integration | Technology | Purpose |
|-------------|------------|---------|
| **Metadata** | TMDB API | Global source for movie trailers, posters, and cast |
| **Search** | MongoDB Aggregation | High-performance unique movie filtering |
| **Worker** | Inngest | (Optional) Automated show cleanup |

---

## 📁 Directory Structure
```text
src/
├── controllers/
│   └── showController.ts   # TMDB fetch & scheduling logic
├── routes/
│   └── showRoutes.ts       # Endpoint mapping
├── models/
│   ├── Movie.ts            # Metadata schema
│   └── Show.ts             # Scheduling schema
└── configs/
    └── db.ts               # Connection layer
```

## ✅ Implementation Status
- **✅ TMDB Integration**: Fully operational with v3 API.
- **✅ Show Scheduling**: Support for multi-day, multi-time batch creation.
- **✅ Metadata Caching**: Lazy-loading pattern reduces TMDB usage.
- **🔄 Universal Search**: (Future) Global movie search beyond what is "Now Playing".

## ❓ Troubleshooting
- **Poster Missing**: Ensure `VITE_TMDB_API_KEY` is valid and not rate-limited.
- **Timezone Mismatch**: Shows are stored as UTC; client must localize to `Africa/Kigali` as per current specs.
