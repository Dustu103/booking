# Booking Service — Design Documentation

## 🛠️ Overview
The Booking Service is the transactional core of MovieShine, managing the atomic reservation of theater seats, electronic payment fulfillment via Stripe, and automated seat release for unpaid orders.

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

## 📊 Data Models
- **`Booking`**: Stores the relationship between a `User` and `Show`. Includes `amount`, `bookedSeats`, `isPaid`, and the Stripe `paymentLink`.
- **`Show (Seat Map)`**: The `occupiedSeats` field is a key-value store mapping `seatId` to `userId`.

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
    ├── Create Checkout
    │   └── Generate Stripe Session with bookingId in metadata
    └── Schedule Expiration (Inngest)
        └── Send "app/checkpayment" to Inngest
    │
    ▼
Return Stripe URL to Client
```

### 2. Stripe Webhook Fulfillment
- **Trigger**: Stripe sends `checkout.session.completed`.
- **Mechanism**: Backend validates signature and extracts `bookingId`.
- **Action**: Update `Booking.isPaid = true` and trigger `app/show.booked` for confirmation email.

### 3. Automated Seat Release (Unpaid)
- **Mechanism**: Inngest worker waits 10 minutes from booking creation.
- **Check**: If `Booking.isPaid` is still `false`.
- **Action**: Remove the user's seats from the `Show.occupiedSeats` map and delete the booking record.

## 🔌 Infrastructure & Integrations

| Integration | Technology | Purpose |
|-------------|------------|---------|
| **Payment** | Stripe | PCI-compliant checkouts & webhooks |
| **Integrity** | MongoDB | Transaction-level consistency for the seat map |
| **Worker** | Inngest | Time-delayed seat release and confirmation emails |

---

## 📁 Directory Structure
```text
src/
├── controllers/
│   ├── bookingController.ts # Transaction orchestration
│   └── stripeWebhooks.ts    # Fulfillment logic
├── routes/
│   └── bookingRoutes.ts     # Endpoint mapping
├── models/
│   └── Booking.ts           # Payment & Seat state
└── inngest/
    └── index.ts             # Background expiration logic
```

## ✅ Implementation Status
- **✅ Stripe Ready**: Fully operational with Checkout v3.
- **✅ Inngest Workers**: Configured for 10-minute cleanup and email reminders.
- **✅ Atomic Check**: Double-booking prevention logic active.
- **🔄 Refund Logic**: (Future) Handling user cancellations.

## ❓ Troubleshooting
- **Seat Stuck**: If a user is not redirected, the seats will release automatically in 10 minutes.
- **Signature Failure**: Ensure `STRIPE_WEBHOOK_SECRET` is correct.
- **Email Not Sent**: Check Inngest logs for "app/show.booked" failures.
