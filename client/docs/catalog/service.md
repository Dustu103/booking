# Catalog Service (Show-C) | Documentation

## 1. Primary Strategy
Show-C is the primary content discovery engine for MovieShine. It bridges the gap between TMDB (The Movie Database) metadata and local show schedules.

## 2. Content Lifecycle Workflow (Nexus-C)

```text
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│     ADMIN UI    │      │    BACKEND API  │      │      TMDB       │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         │  1. FETCH NOW-PLAYING  │                        │
         ├───────────────────────►│                        │
         │                        │  2. GET TMDB METADATA  │
         │  ◄─────────────────────┼───────────────────────►│
         │                        │                        │
         │  3. CONFIGURE SHOWS    │                        │
         ├───────────────────────►│                        │
         │                        │  4. PERSIST MONGO      │
         │  ◄─────────────────────┤                        │
         │                        │                        │
```

## 3. Component Architecture

### 3.1 Show Discovery (Front-End)
Show-C provides a categorized view of upcoming blockbusters:
- **Featured**: Top-tier movies promoted on the landing page.
- **Trailers**: Dynamic video playback via `ReactPlayer`.
- **Movies**: Full grid inventory with filtering (future work).

### 3.2 Metadata Definition
All movies comply with the `IMovie` interface, ensuring that UI components can reliably access:
- `poster_path` / `backdrop_path` (Images)
- `genres` (Array of objects or strings)
- `casts` (Actor metadata)
- `vote_average` (Rating)

## 4. Visual Standards
The Catalog uses the **Aegis-Visual** palette:
- **Cards**: Glassmorphism with `bg-gray-900/50` and `border-white/5`.
- **Star Rating**: `#ffe70a` (Vibrant Yellow).
- **Scale Effects**: `hover:-translate-y-1` and `hover:shadow-2xl`.

## 5. Persistence Synchronization
The `AppContext` maintains a global `shows` array that is updated during the initial application mount (`useEffect`). This ensures that catalog data is cached and ready for instant navigation.

---
*Content Standard: TMDB Extended*
*Service Module: Show-C*
