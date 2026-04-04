# Booking Service — Design Documentation

## 🛠️ Overview
The Booking Service is the transactional core of MovieShine, managing the atomic reservation of theater seats, electronic payment fulfillment via Stripe, and automated seat release for unpaid orders. This is a **logical domain** within the monolithic Express server — not a separate microservice.

## 🏗️ System Architecture
The service follows a high-integrity transactional approach to ensure seat concurrency and payment safety.

```text
┌─────────────────────────────────────────────────────────────┐
│                       API GATEWAY                           │
│                (Clerk Middleware / Stripe Raw)              │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                      BOOKING SERVICE                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐│
│  │ Reservation Svc  │  │ Stripe Fulfillment │  │ Seat Tracker ││
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘│
│           │                     │                   │        │
│  ┌────────▼─────────────────────▼───────────────────▼───────┐│
│  │               Transaction & Integrity Logic               ││
│  │  - Atomic seat occupation map check                      ││
│  │  - Checkout session initialization                       ││
│  │  - Async fulfillment via Webhooks                        ││
│  │  - Automated cleanup for failed payments (Inngest)       ││
│  └──────────────────────────────┬───────────────────────────┘│
└─────────────────────────────────┼────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                          DATA LAYER                         │
│  ┌──────────────────┐   ┌──────────────────┐                │
│  │    MongoDB       │   │      Stripe       │                │
│  │  bookings coll.  │   │   (Payment API)   │                │
│  │  + shows coll.   │   │   (Webhooks)      │                │
│  └──────────────────┘   └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Database Schema (MongoDB + Mongoose)

### `Booking` Collection
Represents a single ticket transaction between a user and a show. Tracks payment state and links to the Stripe checkout session.

```typescript
// models/Booking.ts — Mongoose Schema
{
  user:        { type: String,  required: true, ref: "User" },  // FK → User._id (Clerk ID)
  show:        { type: String,  required: true, ref: "Show" },  // FK → Show._id (ObjectId as string)
  amount:      { type: Number,  required: true },                // Total price = showPrice × seatCount
  bookedSeats: { type: Array,   required: true },                // ["A1", "A2", "B5"]
  isPaid:      { type: Boolean, default: false },                // true after Stripe webhook confirms
  paymentLink: { type: String  }                                 // Stripe checkout URL (cleared after payment)
}
// Options: { timestamps: true }  →  auto createdAt/updatedAt
```

**TypeScript Interface**:
```typescript
interface IBooking extends Document {
  _id: Types.ObjectId;
  user: string | IUser;         // Clerk user ID or populated User doc
  show: string | IShow;         // ObjectId string or populated Show doc
  amount: number;               // Total price in USD
  bookedSeats: string[];        // Seat identifiers
  isPaid: boolean;              // Payment confirmation flag
  paymentLink?: string;         // Stripe checkout URL
}
```

### `Show.occupiedSeats` (Seat Map — Embedded Object)
The seat map is NOT a separate collection. It is an **embedded object** on the `Show` document acting as a real-time lock mechanism.

```typescript
// Schema: { type: Object, default: {} }
// Runtime shape:
{
  "A1": "user_2abc123",   // seatId → userId who occupied it
  "A2": "user_2abc123",
  "B5": "user_7xyz456"
}
```

**Concurrency Model**:
1. On booking: seats are written (`show.occupiedSeats[seat] = userId`)
2. `show.markModified("occupiedSeats")` is called (required for Mongoose mixed types)
3. On cancellation/expiry: seats are deleted (`delete show.occupiedSeats[seat]`)

**Indexing Strategy**:

| Collection | Field | Purpose |
|------------|-------|---------|
| `bookings` | `user` | Fast lookup of user's booking history |
| `bookings` | `show` | Find bookings for a specific show |
| `bookings` | `isPaid` | Filter paid vs unpaid bookings |

---

## 🔄 Key Workflows

### 1. Atomic Seat Reservation
```text
Client (POST /api/booking/create)
    │
    ▼
Reservation Service
    ├── Check Availability (Atomicity)
    │   └── Are selected seats empty in occupiedSeats?
    ├── Occupy Seats (Temporary)
    │   └── Set seat[id] = userId in occupiedSeats
    │   └── markModified("occupiedSeats") + save()
    ├── Create Booking (isPaid: false)
    ├── Create Stripe Checkout Session
    │   └── Metadata: { bookingId: booking._id }
    │   └── Expiry: 30 minutes
    └── Schedule Expiration (Inngest)
        └── Send "app/checkpayment" event
    │
    ▼
Return Stripe URL to Client
```

### 2. Stripe Webhook Fulfillment
- **Trigger**: Stripe sends `checkout.session.completed`.
- **Verification**: Backend validates `stripe-signature` header against `STRIPE_WEBHOOK_SECRET`.
- **Action**: Update `Booking.isPaid = true`, clear `paymentLink`, trigger `app/show.booked` for confirmation email.

### 3. Automated Seat Release (Unpaid — 10 minutes)
- **Mechanism**: Inngest worker `release-seats-delete-booking` sleeps for 10 minutes.
- **Check**: If `Booking.isPaid` is still `false`.
- **Action**: Remove the user's seats from `Show.occupiedSeats` map, delete the Booking record.

## 🔌 Infrastructure & Integrations

| Integration | Technology | Purpose |
|-------------|------------|---------|
| **Payment** | Stripe (Checkout v3 + Webhooks) | PCI-compliant payment session and fulfillment |
| **Storage** | MongoDB | Transaction-level consistency for seat map and bookings |
| **Worker** | Inngest | 10-minute seat release timer and confirmation email dispatch |

---

## 📁 Directory Structure
```text
src/
├── controllers/
│   ├── bookingController.ts # Seat check, reservation, Stripe session creation
│   └── stripeWebhooks.ts    # Webhook signature verification and fulfillment
├── routes/
│   └── bookingRoutes.ts     # POST /create, GET /seats/:showId
├── models/
│   └── Booking.ts           # Payment state and seat tracking
└── inngest/
    └── index.ts             # release-seats-delete-booking, send-booking-confirmation-email
```

## ✅ Implementation Status
- **✅ Stripe Ready**: Fully operational with Checkout v3 and webhook-based fulfillment.
- **✅ Inngest Workers**: 10-minute auto-release and email confirmations active.
- **✅ Atomic Check**: Double-booking prevention via occupiedSeats map check.
- **🔄 Refund Logic**: (Future) Handling user-initiated cancellations and Stripe refunds.

## ❓ Troubleshooting
- **Seat Stuck**: If a user abandons checkout, the seats auto-release in 10 minutes via Inngest.
- **Signature Failure**: Ensure `STRIPE_WEBHOOK_SECRET` matches the one in Stripe Dashboard → Webhooks.
- **Email Not Sent**: Check Inngest logs for `app/show.booked` event failures.
- **markModified Error**: The `occupiedSeats` field is a Mongoose `Mixed` type — always call `markModified()` before `save()`.

## 📖 Related Documentation
- [API Reference](api.md) — Complete endpoint documentation with request/response JSON
