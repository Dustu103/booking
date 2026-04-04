# Booking & Payment Service — API Documentation

## 🔌 Overview
The Booking Service handles atomic seat reservation, Stripe payment session creation, and seat availability queries. It is the transactional core of the MovieShine platform.

- **Server**: `http://localhost:3000` (Monolithic Express)
- **Route Prefix**: `/api/booking` (User-facing) and `/api/stripe` (Webhook)
- **Content-Type**: `application/json`

---

## 🔐 Authentication

Booking endpoints require a **Clerk JWT** in the Authorization header. The Stripe webhook endpoint uses Stripe's signature-based verification instead.

```
Authorization: Bearer <clerk-jwt-token>
```

---

## 🚀 Endpoints

### 1. Create Booking (Initiate Payment)
**POST** `/api/booking/create`

**Description**: Atomically reserves the selected seats, creates a Booking record (`isPaid: false`), generates a Stripe Checkout session, and schedules a 10-minute auto-release via Inngest. Returns the Stripe Checkout URL for payment redirect.

**Authentication**: Required (Clerk JWT)

**Request Body**:
```json
{
  "showId": "661f1a2b3c4d5e6f7a8b9c0d",
  "selectedSeats": ["A1", "A2", "A3"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `showId` | `string` | ✅ | MongoDB ObjectId of the Show |
| `selectedSeats` | `string[]` | ✅ | Array of seat identifiers (e.g., `"A1"`, `"B5"`) |

**Success Response (200)**:
```json
{
  "success": true,
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

**Error Response — Seats Taken**:
```json
{
  "success": false,
  "message": "Selected Seats are not available."
}
```

**Error Response — Show Not Found**:
```json
{
  "success": false,
  "message": "Show not found"
}
```

**Error Response — Unauthorized**:
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**Side Effects**:
1. Seats are immediately locked in `Show.occupiedSeats` map (userId → seatId)
2. A `Booking` document is created with `isPaid: false`
3. An Inngest event `app/checkpayment` is dispatched (10-minute timer to auto-release if unpaid)
4. Stripe Checkout session expires in 30 minutes

**cURL**:
```bash
curl -X POST http://localhost:3000/api/booking/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <clerk-jwt>" \
  -d '{
    "showId": "661f1a2b3c4d5e6f7a8b9c0d",
    "selectedSeats": ["A1", "A2"]
  }'
```

---

### 2. Get Occupied Seats for a Show
**GET** `/api/booking/seats/:showId`

**Description**: Returns the list of currently occupied seat IDs for a given show. Used by the frontend to render the seat map with unavailable seats.

**Authentication**: Not required (Public)

**Path Parameters**:
- `showId` (string): MongoDB ObjectId of the Show

**Success Response (200)**:
```json
{
  "success": true,
  "occupiedSeats": ["A1", "A2", "B5", "C3"]
}
```

**Error Response — Show Not Found**:
```json
{
  "success": false,
  "message": "Show not found"
}
```

**cURL**:
```bash
curl -X GET http://localhost:3000/api/booking/seats/661f1a2b3c4d5e6f7a8b9c0d
```

---

### 3. Stripe Webhook (Payment Fulfillment)
**POST** `/api/stripe`

**Description**: Internal fulfillment handler called by Stripe when a payment event occurs. On `checkout.session.completed`, it marks the booking as paid and triggers a confirmation email via Inngest.

**Authentication**: Stripe Signature Verification (via `stripe-signature` header)

> ⚠️ This endpoint uses `express.raw()` middleware — it expects a raw JSON body, NOT parsed JSON.

**Headers**:
```
stripe-signature: t=1234567890,v1=abc123...
Content-Type: application/json
```

**Handled Events**:

| Stripe Event | Action |
|-------------|--------|
| `checkout.session.completed` | Set `Booking.isPaid = true`, clear `paymentLink`, trigger `app/show.booked` email |
| All other events | Logged and ignored |

**Success Response (200)**:
```json
{
  "received": true
}
```

**Error Response — Invalid Signature**:
```
Webhook Error: No signatures found matching the expected signature for payload...
```
*(HTTP 400)*

**Local Testing**:
```bash
# Forward Stripe test webhooks to your local server
stripe listen --forward-to localhost:3000/api/stripe

# Then trigger a test event
stripe trigger checkout.session.completed
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
| `400` | Stripe webhook signature verification failed |
| `401` | Missing or invalid Clerk JWT |
| `500` | Internal server error (Stripe API failure, DB error) |

---

## 🧪 Quick Test (Full Booking Flow)

```bash
# 1. Check available seats
curl http://localhost:3000/api/booking/seats/<showId>

# 2. Create a booking (requires auth)
curl -X POST http://localhost:3000/api/booking/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt>" \
  -d '{"showId": "<showId>", "selectedSeats": ["A1"]}'

# 3. Open the returned Stripe URL in browser to complete payment

# 4. Verify seats are now occupied
curl http://localhost:3000/api/booking/seats/<showId>
```
