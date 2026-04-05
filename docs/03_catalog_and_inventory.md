# Catalog & Inventory Domain

## 1. Overview
The Catalog Service manages the persistent metadata required to render the application. This includes movies, cast members, theaters (cinemas), and showtimes. It acts as the read-heavy counterpart to the write-heavy Booking Service.

## 2. External Sync (TMDB)
MovieShine relies on TMDB for rich media (posters, backdrops) and canonical metadata (synopsis, runtime, cast).

### Sync Strategy
We do not poll TMDB on every user request. Instead, we sync data via the Admin portal when a new movie is onboarded.
1. Admin searches TMDB via MovieShine's backend proxy.
2. The user selects a movie. The server fetches the full payload from TMDB.
3. The server normalizes the TMDB JSON into the `Movie` Mongoose schema and persists it locally.

> [!TIP]
> This pattern ensures zero latency degradation if the TMDB API goes down and allows us to override synopses or add custom local fields safely.

## 3. Inventory Modeling
Physical locations are mapped logically to ensure scaling across regions.

### Schema Relationships
*   **Theater:** A physical building (e.g., "MovieShine Downtown").
*   **Screen:** A specific auditorium within a Theater (e.g., "Screen 1"). Holds the physical seat topology (Rows A-G, Columns 1-10).
*   **Show:** The intersection of a `Movie`, a `Screen`, and a `timestamp`. 

### Seat Topology Mapping
When a `Show` is queried, the Catalog Service must merge the `Screen` topology with the `Show`'s `occupiedSeats` array to generate the interactive UI map.

```javascript
// Conceptual rendering logic injected to Client via API
const seatMap = screen.layout.map(seat => ({
  id: seat.id,
  isAvailable: !show.occupiedSeats.includes(seat.id)
}));
```

## 4. Query Access Patterns
To maintain sub-100ms API response times for our landing page:
- `GET /movies/now-playing` utilizes a composite index on `{ status: 1, releaseDate: -1 }`.
- `GET /shows?movieId=123&date=YYYY-MM-DD` uses an aggregation pipeline to group showtimes by `Theater` for intuitive UI grouping.
