# MovieShine — System Design Documentation

## 🛠️ Overview
MovieShine is a premium movie ticket booking platform designed for high concurrency and atomic seat reservations. The system integrates real-time movie metadata via TMDB, secure identity management via Clerk, and robust payment fulfillment via Stripe.

## 🏗️ Platform Architecture

The system follows a modular monolithic architecture, containerized with Docker, and utilizes Inngest for asynchronous background jobs (reminders, seat releases).

```text
                     ┌────────────────────────────────┐
                     │          Client Apps           │
                     │    (Next.js / Vite / Mobile)   │
                     └───────────────┬────────────────┘
                                     │
                                     ▼
                     ┌────────────────────────────────┐
                     │      API Gateway / Server      │
                     │   (Express.js + TypeScript)    │
                     └───────────────┬────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│   Catalog Svc    │        │   Booking Svc    │        │     User Svc     │
│ - Movie Metadata │        │ - Seat Selection │        │ - Profile Auth   │
│ - Show Schedule  │        │ - Payment Gate   │        │ - Favorites      │
└────────┬─────────┘        └────────┬─────────┘        └────────┬─────────┘
         │                           │                           │
         │             ┌─────────────┴─────────────┐             │
         ▼             ▼                           ▼             ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│     TMDB API     │  │     MongoDB      │  │     Inngest      │  │    Clerk Auth    │
│ (Remote Data)    │  │ (Primary Store)  │  │ (Background Svc) │  │ (Identity Provider)│
└──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘
                                     │
                                     ▼
                           ┌──────────────────┐
                           │      Stripe       │
                           │  (Payment Gate)   │
                           └──────────────────┘
```

## 📋 Component Inventory

### 🎨 1. Catalog Service
- **Responsibility**: Manages the "Now Playing" movie list and the schedule of theater shows.
- **Data Source**: Synchronizes with TMDB API for enriched metadata (posters, cast, trailers).
- **Core Unit**: `Movie` and `Show` models.

### 💳 2. Booking & Payment Service
- **Responsibility**: Manages the atomic reservation of seats and integration with Stripe for payment fulfillment.
- **Concurrency**: Implements seat locking mechanisms to prevent double-booking.
- **Integrity**: Uses Stripe Webhooks to ensure bookings only finalize upon successful payment.

### 👤 3. User & Identity Service
- **Responsibility**: Manages user profiles, role-based access control (Admin/User), and social features like "Favorites".
- **Integration**: Leverages Clerk for secure OIDC-compliant authentication.

### 🤖 4. Background Workers (Inngest)
- **Responsibility**: Executes scheduled tasks such as show reminders (email) and automated expiration of unpaid bookings (releasing seats back to the catalog).

## 🔌 Infrastructure Summary

| Component | Technology | Role |
|-----------|------------|------|
| **Core** | Node.js / TypeScript | High-performance backend runtime |
| **Database** | MongoDB | Document store for flexible movie/booking schemas |
| **Identity** | Clerk | Managed OIDC/Auth management |
| **Payments** | Stripe | PCI-compliant payment gateway |
| **MetaData** | TMDB API | Source of truth for global movie database |
| **Email** | Nodemailer / Brevo | Transactional email delivery |
| **Worker** | Inngest | Event-driven background job orchestration |

---

## 🏃 Local Development

### 1. Prerequisites
- Docker & Docker Compose
- Node.js 18+ & npm
- Cloned repository of `movieshine`

### 2. Quick Start
```bash
# Navigate to server
cd server

# Install dependencies
npm install

# Run in development mode (TSX)
npm run dev
```

### 3. Build & Production
```bash
# Compile TypeScript
npm run build

# Start optimized production server
npm start
```
