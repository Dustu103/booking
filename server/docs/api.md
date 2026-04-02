# MovieShine — API Reference Documentation

## 🛠️ Overview
The MovieShine platform provides a set of RESTful APIs for client applications to manage movie life-cycles, theater scheduling, and transactional bookings.

## 🏗️ Authentication
All protected routes require a **Clerk JWT**. 
- Header Key: `Authorization`
- Header Value: `Bearer <token>`

---

## 👤 User Service

### 1. [GET] /api/user/bookings
Fetches the current user's complete booking history.
- **Header**: Bearer Token
- **Success Response**: `{ success: true, bookings: IBooking[] }`

### 2. [POST] /api/user/update-favorite
Toggles a movie in the user's favorites list.
- **Header**: Bearer Token
- **Body**: `{ movieId: string }`
- **Success Response**: `{ success: true, message: "Favorite movies updated" }`

---

## 🎬 Catalog Service

### 1. [GET] /api/show/now-playing
Fetches currently active movies from the TMDB bridge.
- **Success Response**: `{ success: true, movies: IMovie[] }`

### 2. [GET] /api/show/all
Fetches a unique list of movies that have upcoming shows.
- **Success Response**: `{ success: true, shows: IMovie[] }`

### 3. [GET] /api/show/:movieId
Fetches the complete upcoming show schedule for a specific movie.
- **Params**: `movieId` (string)
- **Success Response**: `{ success: true, movie: IMovie, dateTime: Record<string, ShowSlot[]> }`

---

## 💳 Booking & Payment Service

### 1. [POST] /api/booking/create
Initiates a new ticket booking and generates a Stripe Checkout session.
- **Header**: Bearer Token
- **Body**: `{ showId: string, selectedSeats: string[] }`
- **Success Response**: `{ success: true, url: string }` (Stripe Session URL)

### 2. [GET] /api/booking/seats/:showId
Fetched the list of occupied seats for a specific show.
- **Params**: `showId` (string)
- **Success Response**: `{ success: true, occupiedSeats: string[] }`

### 3. [POST] /api/stripe (Webhook)
Internal fulfillment handler for Stripe payment events.
- **Header**: `stripe-signature`
- **Body**: Raw JSON from Stripe

---

## 🔧 Admin Service

### 1. [GET] /api/admin/dashboard (Protected)
Fetches aggregated platform analytics for administrators.
- **Header**: Bearer Token (must have Admin role)
- **Success Response**: `{ success: true, dashboardData: DashboardStats }`

### 2. [POST] /api/show/add (Protected)
Batch generates shows for a specific movie (TMDB fetch if missing).
- **Header**: Bearer Token (must have Admin role)
- **Body**: `{ movieId: string, showsInput: ShowSlot[], showPrice: number }`
- **Success Response**: `{ success: true, message: "Show Added successfully." }`
