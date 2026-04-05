# Group Booking Service API Documentation

## Base URL
`/api/group`

## Authorization
All endpoints require a valid Clerk JWT token in the `Authorization: Bearer <token>` header.

---

### `POST /create`
Creates a brand new Redis-backed group room configuration and issues a Centrifugo connection payload.

**Request Body:**
```json
{
  "showId": "65ab...",
  "userName": "Alice The Host"
}
```

**Response:**
```json
{
  "success": true,
  "roomCode": "A3F8C2",
  "connectionToken": "jwt_token...",
  "subscriptionToken": "jwt_token...",
  "channel": "group:A3F8C2"
}
```

---

### `POST /:roomCode/join`
Allows secondary users to explicitly attach to an existing session space.

**Request Body:**
```json
{
  "userName": "Bob Teammate"
}
```

**Response:**
```json
{
  "success": true,
  "roomState": { ... },
  "connectionToken": "jwt_token...",
  "subscriptionToken": "jwt_token...",
  "channel": "group:A3F8C2"
}
```

---

### `GET /:roomCode`
Retrieves current persistent state from Redis and refreshes the TTL heartbeat.

**Response:**
```json
{
  "success": true,
  "roomState": { ... }
}
```

---

### `POST /:roomCode/seats`
Fired continuously as users select/deselect seats. Mutates the centralized Redis array for the user, checks for conflict overlaps, and publishes a `SEAT_UPDATE` socket event automatically.

**Request Body:**
```json
{
  "selectedSeats": ["C3", "C4"]
}
```

**Response:**
```json
{
  "success": true
}
```

---

### `POST /:roomCode/ready`
Marks a specific connection participant as "Ready", flipping backend checks for whether the Host is authorized to fire checkout. Publishes `MEMBER_READY`.

---

### `POST /:roomCode/checkout`
Host-only action. Aggregates all selected seats from all live members into a Single Consolidated Record. Initiates standard Booking flow and responds with standard Stripe payload. Publishes `CHECKOUT_READY` socket event.

---

### `GET /token`
Issues a fresh connection JWT for Centrifugo reconnect/reload sequences.
