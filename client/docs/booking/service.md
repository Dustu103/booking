# Booking Domain — Frontend Service Documentation

## 🛠️ Overview
The Booking domain is the transactional core of the MovieShine frontend. It manages the interactive seat selection grid, real-time seat availability visualization, Stripe checkout handoff, and booking history display. This is the highest-stakes user flow in the application.

## 🏗️ Component Architecture

```text
┌─────────────────────────────────────────────────────────────────────┐
│                SEAT LAYOUT PAGE (/movies/:id/:date)                 │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     SCREEN SVG                                │   │
│  │               (Visual "screen" indicator)                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    10 × 12 SEAT GRID                          │   │
│  │                                                               │   │
│  │  Row Labels (A-J) ←→ 12 Seat Buttons per row                 │   │
│  │                                                               │   │
│  │  Seat States:                                                 │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                      │   │
│  │  │Available │  │Selected │  │Occupied │                      │   │
│  │  │ (White)  │  │(Primary)│  │ (Gray)  │                      │   │
│  │  │ border-  │  │ shadow- │  │ cursor- │                      │   │
│  │  │ white/20 │  │ primary │  │ not-    │                      │   │
│  │  │          │  │ /40     │  │ allowed │                      │   │
│  │  └─────────┘  └─────────┘  └─────────┘                      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    BOOKING SUMMARY                            │   │
│  │  Selected Seats: A1, A2, A3                                  │   │
│  │  Total: $38.97 (3 × $12.99)                                  │   │
│  │  [Book Now] ──→ POST /api/booking/create ──→ Stripe URL      │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                 MY BOOKINGS PAGE (/my-bookings)                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Booking Card (per booking):                                  │   │
│  │  ┌────────────┬──────────────────────────────────┐           │   │
│  │  │  Poster    │  Movie Title                      │           │   │
│  │  │  (Image)   │  Date & Time | Seats: A1, A2     │           │   │
│  │  │            │  Amount: $25.98 | Status: ✅ Paid  │           │   │
│  │  └────────────┴──────────────────────────────────┘           │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow: Full Booking Lifecycle

```text
User on MovieDetails Page
    │  Selects date + time slot
    ▼
Navigate to /movies/:movieId/:date?showId=xxx
    │
    ▼
SeatLayout.tsx mounts
    │  GET /api/booking/seats/:showId
    │  → Returns occupied seat IDs
    ▼
Render 10x12 seat grid
    │  Available seats = clickable
    │  Occupied seats = disabled + gray
    ▼
User clicks seats (max 5)
    │  Local state: selectedSeats[]
    │  Visual: Primary color + shadow
    ▼
User clicks "Book Now"
    │  POST /api/booking/create
    │  Body: { showId, selectedSeats }
    │  Header: Authorization: Bearer <jwt>
    ▼
Server returns Stripe Checkout URL
    │
    ▼
window.location.href = stripeUrl
    │  User completes payment on Stripe
    ▼
Stripe webhook → Server marks booking as paid
    │
    ▼
User returns to /my-bookings → Sees confirmed booking
```

## 🧩 Component Details

### SeatLayout.tsx (Core Transaction Page)
- **Grid**: 10 rows (A-J) × 12 columns (1-12) = 120 total seats
- **State Management**:

| State | Type | Purpose |
|-------|------|---------|
| `selectedSeats` | `string[]` | Currently selected seat IDs |
| `occupiedSeats` | `string[]` | Already booked seats (fetched from API) |
| `showData` | `IShow` | Current show details (price, time) |

- **Validation Rules**:
  - Maximum 5 seats per booking
  - Time slot must be selected before seat selection
  - Occupied seats cannot be clicked

- **Seat ID Format**: `{Row}{Column}` → e.g., `"A1"`, `"B12"`, `"J5"`

- **Booking Submit**:
```typescript
const bookTickets = async () => {
  const token = await getToken();
  const { data } = await axios.post("/api/booking/create", {
    showId,
    selectedSeats,
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (data.success) {
    window.location.href = data.url;  // Stripe checkout redirect
  }
};
```

### MyBookings.tsx (Booking History Page)
- **Data Source**: `GET /api/user/bookings` (auth required)
- **Populated Data**: Each booking includes full `Show → Movie` populated chain
- **TypeScript**: Uses `IBookingPopulated` interface for deeply nested types
- **Features**: Show poster, movie title, date/time, seat list, amount, payment status
- **Sorting**: Most recent first (`createdAt: -1`)

---

## 📁 Files

```text
src/
├── pages/
│   ├── SeatLayout.tsx     # 10×12 interactive seat grid + Stripe checkout
│   └── MyBookings.tsx     # User's booking history with populated data
│
├── components/
│   └── DateSelect.tsx     # Date/time picker (bridges catalog → booking)
│
├── types/
│   └── index.ts           # IBooking, IBookingPopulated, IShow, ShowSlot
│
└── context/
    └── AppContext.tsx      # getToken() for Auth header injection
```

## ✅ Implementation Status
- **✅ Seat Grid**: 10×12 interactive layout with 3-state rendering
- **✅ Atomic Selection**: Max 5 seats validation enforced client-side
- **✅ Stripe Checkout**: Full redirect flow with session URL
- **✅ Booking History**: Deep-populated data with poster images
- **✅ Real-time Availability**: Occupied seats fetched per show
- **🔄 Payment Status Polling**: (Future) Real-time confirmation without page refresh
- **🔄 Seat Categories**: (Future) Premium, Standard, Economy seat types with different pricing

## ❓ Troubleshooting
- **All seats gray/disabled**: Backend may not be returning `occupiedSeats` correctly — check `GET /api/booking/seats/:showId`
- **Stripe not redirecting**: Verify `STRIPE_SECRET_KEY` is set in the server's `.env`
- **"Unauthorized" on booking**: User must be logged in — check Clerk session
- **Booking history empty**: Ensure `isPaid: true` bookings exist — unpaid bookings may have been auto-released
