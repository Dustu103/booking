# Corporate Service API Documentation

## Base URL
`/api/corporate`

## Authorization
All endpoints require a valid Clerk JWT token in the `Authorization: Bearer <token>` header.

---

### `POST /account`
Creates a new corporate team account.

**Request Body:**
```json
{
  "name": "Acme Corp",
  "gstNumber": "22AAAAA0000A1Z5",
  "approvalRequired": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Corporate account created successfully",
  "account": { ... }
}
```

---

### `GET /account`
Fetches the corporate account associated with the currently authenticated user (either as admin or member).

**Response:**
```json
{
  "success": true,
  "account": { ... }
}
```

---

### `POST /account/add-member`
Adds a new user (by Clerk user ID) to the corporate account. Admin only.

**Request Body:**
```json
{
  "memberUserId": "user_xxxxxxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Member added successfully."
}
```

---

### `POST /booking/request`
Submits a corporate booking request (bypassing normal immediate payment).

**Request Body:**
```json
{
  "showId": "65ab...",
  "selectedSeats": ["A1", "A2"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking request submitted."
}
```

---

### `GET /booking/list`
Lists booking requests. For admins, returns all requests. For standard members, returns only their own requests.

**Response:**
```json
{
  "success": true,
  "isAdmin": true,
  "requests": [ ... ]
}
```

---

### `POST /booking/approve/:requestId`
Approves a pending booking request and responds with a Stripe Checkout Link for payment. Admin only. 

**Response:**
```json
{
  "success": true,
  "paymentLink": "https://checkout.stripe.com/..."
}
```

---

### `POST /booking/reject/:requestId`
Rejects a pending booking request and frees up reserved seats. Admin only.

**Response:**
```json
{
  "success": true,
  "message": "Request rejected."
}
```

---

### `GET /booking/invoice/:requestId`
Generates and serves a direct HTML-rendered invoice with GST/Tax breakdowns for an approved and paid request.
