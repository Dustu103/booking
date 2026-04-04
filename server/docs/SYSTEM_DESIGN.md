# MovieShine — Global System Design

## 🏛️ High-Level Design (HLD)

MovieShine is a premium movie-ticket booking platform built on a **Modular Monolithic Architecture**. The backend is a single Express.js server, logically separated into domain-specific services (Catalog, Booking, User, Admin, Chatbot), containerized with Docker, and deployed serverlessly via Vercel. It integrates real-time movie metadata via **TMDB**, secure identity management via **Clerk**, payment fulfillment via **Stripe**, event-driven background jobs via **Inngest**, and an AI-powered chatbot via **Google Gemini**.

### System Architecture Overview
```text
                     ┌────────────────────────────────┐
                     │          Client Apps            │
                     │ (Vite + React 19 + TailwindCSS) │
                     └───────────────┬────────────────┘
                                     │ HTTPS (REST API)
                                     ▼
                     ┌────────────────────────────────┐
                     │      Express.js API Server      │
                     │  (TypeScript + Clerk Middleware) │
                     │          Port :3000              │
                     └───────────────┬────────────────┘
                                     │
          ┌──────────────┬───────────┴───────────┬──────────────┬──────────────┐
          ▼              ▼                       ▼              ▼              ▼
  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
  │ Catalog Svc  │ │ Booking Svc  │ │    User Svc      │ │  Admin Svc   │ │ Chatbot Svc  │
  │- Now Playing │ │- Seat Lock   │ │- Profile Sync    │ │- Dashboard   │ │- Ari (GenAI) │
  │- Show Sched  │ │- Stripe Pay  │ │- Favorites       │ │- Show Mgmt   │ │- Context Grd │
  └──────┬───────┘ └──────┬───────┘ └──────┬───────────┘ └──────┬───────┘ └──────┬───────┘
         │                │                │                    │                │
         ▼         ┌──────┴───────┐        ▼                    │                ▼
 ┌──────────────┐  │              │  ┌──────────────┐           │        ┌──────────────┐
 │   TMDB API   │  │   MongoDB    │  │  Clerk Auth  │           │        │  Gemini API  │
 │(Remote Data) │  │(Primary DB)  │  │ (OIDC/JWT)   │           │        │(AI Inference)│
 └──────────────┘  │              │  └──────────────┘           │        └──────────────┘
                   └──────┬───────┘                             │
                          │                                     │
                   ┌──────┴───────┐                      ┌──────┴───────┐
                   │   Inngest    │                      │    Stripe    │
                   │(Background)  │                      │  (Payments)  │
                   │- Seat Release│                      └──────────────┘
                   │- Reminders   │
                   │- Emails      │
                   └──────────────┘
```

---

## ⚙️ Low-Level Design (LLD)

### 1. Standardized Codebase Structure
Every logical service within the monolith follows a strict, convention-based folder layout:

```text
server/src/
├── configs/        # Database connections, email transporter setup
├── controllers/    # HTTP request handling (one file per domain)
├── middleware/     # Cross-cutting concerns (auth, admin guard)
├── models/         # Mongoose schemas (Movie, Show, Booking, User)
├── routes/         # Express route definitions (one file per domain)
├── inngest/        # Event-driven background job definitions
├── types/          # Shared TypeScript interfaces
└── server.ts       # Application entry point & middleware pipeline
```

### 2. Authentication & Security
- **Clerk OIDC-Based Auth**: The `clerkMiddleware()` is applied globally. Every request extracts `req.auth.userId` for identity verification.
- **Admin Role Guard**: The `protectAdmin` middleware queries Clerk's `privateMetadata.role` to enforce Admin-only access on sensitive endpoints (Dashboard, Show Management).

### 3. Data Models (MongoDB + Mongoose)

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| **User** | `_id` (Clerk ID), `name`, `email`, `image` | Synced from Clerk via Inngest webhooks |
| **Movie** | `_id` (TMDB ID), `title`, `poster_path`, `genres`, `casts`, `runtime` | Enriched metadata from TMDB API |
| **Show** | `movie` (ref), `showDateTime`, `showPrice`, `occupiedSeats` (Map) | Theater schedule with real-time seat map |
| **Booking** | `user` (ref), `show` (ref), `amount`, `bookedSeats[]`, `isPaid` | Transactional record tied to Stripe payment |

### 4. Background Workers (Inngest — Event-Driven)

| Worker Function | Trigger | Purpose |
|----------------|---------|---------|
| `sync-user-from-clerk` | `clerk/user.created` | Saves new Clerk user to MongoDB |
| `delete-user-with-clerk` | `clerk/user.deleted` | Removes user from MongoDB |
| `update-user-from-clerk` | `clerk/user.updated` | Syncs profile changes |
| `release-seats-delete-booking` | `app/checkpayment` | Waits 10 min; if unpaid → releases seats & deletes booking |
| `send-booking-confirmation-email` | `app/show.booked` | Sends payment confirmation email via Brevo SMTP |
| `send-show-reminders` | Cron: `0 */8 * * *` | Emails users 8 hours before their showtime |
| `send-new-show-notifications` | `app/show.added` | Notifies all users when Admin adds a new show |

---

## 🔄 Core Flow Sequences

### 1. Ticket Booking & Stripe Payment Flow
This is the most critical business flow. It ensures atomic seat reservation with a 10-minute payment window.

```text
  User             Booking Ctrl         MongoDB          Stripe           Inngest
   │                    │                  │                │                │
   ├──POST /booking/create──►│             │                │                │
   │                    ├──Check Seat Avail──►│             │                │
   │                    │◄── Seats Free ───┤              │                │
   │                    ├──Create Booking──►│              │                │
   │                    │   (isPaid=false)  │              │                │
   │                    ├──Lock Seats──────►│              │                │
   │                    │   (occupiedSeats) │              │                │
   │                    ├──Create Checkout Session─────────►│               │
   │                    │◄─── Session URL ─────────────────┤               │
   │                    ├──Schedule 10min Timer────────────────────────────►│
   │◄── Redirect URL ──┤                  │                │               │
   │                    │                  │                │               │
   │─── Pays on Stripe ─────────────────────────────────────►│             │
   │                    │                  │                │               │
   │                    │     [ Stripe Webhook: checkout.session.completed ]│
   │                    │◄─── POST /api/stripe ────────────┤               │
   │                    ├──Mark isPaid=true──►│             │               │
   │                    ├──Trigger Confirm Email────────────────────────────►│
   │                    │                  │                │     Email Sent │
```

### 2. Unpaid Booking Auto-Release Flow
Prevents "ghost seats" by automatically freeing reservations after 10 minutes of non-payment.

```text
  Inngest Timer          MongoDB (Booking)        MongoDB (Show)
       │                       │                       │
       ├── Wake after 10min ──►│                       │
       │                       ├── Check isPaid ──────►│
       │                       │   (isPaid = false)    │
       │                       ├── Release Seats ─────►│
       │                       │   (delete from map)   │
       │                       ├── Delete Booking ────►│
       │                       │                       │
```

### 3. AI Chatbot Interaction Flow
```text
  User                Client (React)          Server (/api/chat)        Gemini API
   │                       │                        │                       │
   ├── Types message ─────►│                        │                       │
   │                       ├── POST { message } ───►│                       │
   │                       │                        ├── System Instruction ─►│
   │                       │                        │   + Chat History       │
   │                       │                        │◄── AI Response ────────┤
   │                       │◄─── { text } ──────────┤                       │
   │◄── Shows response ───┤                        │                       │
```

---

## 📡 API Endpoint Reference (Server Root: `:3000`)

| Route Prefix | Domain | Auth Required | Primary Responsibility |
|-------------|--------|---------------|----------------------|
| `/api/show` | Catalog | No (public) | Now Playing movies, Show schedules, Show details |
| `/api/booking` | Booking | Yes (Clerk JWT) | Seat reservation, Stripe checkout, Occupied seats |
| `/api/user` | User | Yes (Clerk JWT) | Booking history, Favorite movies |
| `/api/admin` | Admin | Yes (Admin role) | Dashboard analytics, Batch show creation |
| `/api/chat` | Chatbot | No | AI assistant for movie queries & booking guidance |
| `/api/stripe` | Webhooks | Stripe Signature | Payment fulfillment handler (internal) |
| `/api/inngest` | Workers | Inngest SDK | Background job orchestration endpoint |

---

## 🔌 Infrastructure Summary

| Component | Technology | Role |
|-----------|------------|------|
| **Runtime** | Node.js 18+ / TypeScript | High-performance backend with full type safety |
| **Framework** | Express.js 5 | HTTP server & middleware pipeline |
| **Database** | MongoDB + Mongoose | Document store for flexible movie/booking schemas |
| **Identity** | Clerk (OIDC) | Managed authentication & role-based access |
| **Payments** | Stripe (Checkout + Webhooks) | PCI-compliant payment gateway with session-based flow |
| **Movie Data** | TMDB API | Source of truth for global movie metadata |
| **Email** | Nodemailer + Brevo SMTP | Transactional email delivery (confirmations, reminders) |
| **Workers** | Inngest | Event-driven background job orchestration |
| **AI Chatbot** | Google Gemini (Flash) | Strict, persona-guarded conversational assistant |
| **Frontend** | React 19 + Vite + TailwindCSS 4 | Modern SPA with hot-reload development |
| **Deployment** | Vercel (Serverless) + Docker Compose (Local) | Zero-config cloud deployment + local containerization |

---

## 🧪 Verification & Testing

The system is verified via the following approach:
1.  **Type Safety**: `npm run typecheck` — Full TypeScript compilation check across client & server.
2.  **Lint Check**: `npm run lint` — ESLint validation for code quality.
3.  **Health Probe**: `GET /` — Returns `"Server is Live!"` when the API is operational.
4.  **End-to-End**: Manual Stripe test-mode transactions to verify the full booking → payment → email pipeline.
