# Booking Service (Nexus-B) | Documentation

## 1. Primary Strategy
Nexus-B is the primary transactional engine for MovieShine. It coordinates show timings, real-time seat availability, and Stripe payment handoffs.

## 2. Booking Lifecycle Workflow (Nexus-B)

```text
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│     USER (UI)   │      │    BACKEND API  │      │     STRIPE      │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         │  1. SELECT SEATS (TS)  │                        │
         ├───────────────────────►│                        │
         │                        │  2. CREATE BOOKING     │
         │  ◄─────────────────────┼───────────────────────►│
         │                        │                        │
         │  3. REDIRECT TO PAY    │                        │
         ├────────────────────────┴───────────────────────►│
         │                        │                        │
         │  4. WEBHOOK CONFIRM    │                        │
         ├────────────────────────◄───────────────────────┤
         │                        │                        │
         │  5. UPDATE MONGO DB    │                        │
         ├────────────────────────►│                        │
```

## 2.1 Seat Selection Logic
The `SeatLayout` component manages atomic seat clicks via a 10x12 grid (A-J rows, 1-12 columns).
- **Client Validation**: Max 5 seats per booking, time slot must be selected.
- **Seat States**: Available (White/Empty), Selected (Yellow/Primary), Occupied (Gray/Disabled).

## 3. Stripe Checkout Integration
The `bookTickets` service call invokes a server-side session creation. The server returns a Stripe `checkout.url`, which the client handles via `window.location.href`.

## 4. Technical Data Models

### 4.1 IShow Interface
Defines the availability and pricing for a specific movie screening.
- `occupiedSeats`: A key-value map linking `seatId` to `userId`.

### 4.2 IBooking Interface
Registers a successful or pending transaction.
- `bookedSeats`: Array of seat strings (e.g., `["A1", "A2"]`).
- `isPaid`: Boolean status controlled by Stripe webhooks.

## 5. Visual Standards
The Booking system uses the **Nexus-Dark** palette:
- **Seats**: `h-9 w-9` rounded-lg with `border-white/20`.
- **Selected**: `shadow-lg shadow-primary/40`.
- **Screen**: High-fidelity SVG screen image with gradient blur effects.

---
*Transactional Standard: Stripe PCI-DSS*
*Service Module: Nexus-B*
