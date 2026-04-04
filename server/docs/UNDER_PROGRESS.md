# Under Progress — Tasks & Documentation

## ✅ Completed Milestones

- [x] **Full-Stack Architecture**: Established a modular monolithic backend (Express + TypeScript) with React 19 + Vite frontend.
- [x] **TMDB Integration**: Synced "Now Playing" movie metadata including posters, cast, trailers, and genres.
- [x] **Clerk Authentication**: Implemented OIDC-compliant login/signup with role-based access control (Admin/User).
- [x] **Atomic Seat Booking**: Implemented real-time seat maps with concurrency-safe locking (`occupiedSeats` map).
- [x] **Stripe Payment Gateway**: Full checkout session integration with webhook-based fulfillment and 30-minute expiry.
- [x] **Inngest Background Workers**: Deployed 7 event-driven functions for user sync, seat release, email confirmations, and show reminders.
- [x] **Brevo SMTP Email System**: Transactional emails for booking confirmations, show reminders (8-hour cron), and new show notifications.
- [x] **AI Chatbot (Ari)**: Integrated Google Gemini with strict persona constraints — MovieShine-only responses.
- [x] **Admin Dashboard**: Aggregated analytics endpoint with protected Admin-only route guard.
- [x] **Docker Containerization**: Docker Compose setup for local MongoDB + server stack.
- [x] **Vercel Deployment**: Serverless deployment configuration for both client and server.
- [x] **Security Audit**: Admin role verification via Clerk's `privateMetadata`, JWT-based route protection across all user endpoints.

---

## 🚧 Currently Under Progress

- [ ] **Comprehensive System Documentation**: Bringing all docs up to ProYodha-level standard with HLD, LLD, and flow diagrams.
- [ ] **Stripe Test Coverage**: End-to-end validation of the full booking → payment → email pipeline in test mode.
- [ ] **Performance Optimization**: Evaluating MongoDB indexing on `Show.showDateTime` and `Booking.user` for query performance.

---

## 📋 Current Work

- **Documentation Overhaul**:
    - [x] Rewritten `SYSTEM_DESIGN.md` with full HLD, LLD, ASCII flow diagrams, and API reference table.
    - [x] Created `PROJECT_REBORN_LOCAL_SETUP.md` with phased onboarding guide.
    - [x] Created `UNDER_PROGRESS.md` for milestone & roadmap tracking.
    - [ ] Refresh per-service `design.md` docs to match updated system design.

- **Frontend Enhancements**:
    - [ ] Responsive design audit across all pages.
    - [ ] Skeleton loading states for movie cards and booking pages.

- **Backend Hardening**:
    - [ ] Rate limiting on public API endpoints (`/api/show`, `/api/chat`).
    - [ ] Structured error response format across all controllers.
    - [ ] Request validation middleware (Zod/Joi).

- **DevOps & Monitoring**:
    - [ ] CI/CD pipeline setup (GitHub Actions).
    - [ ] Health check endpoint (`/health`) with dependency status.
    - [ ] Logging infrastructure (structured JSON logs).

---

## 🗺️ Future Roadmap

- **Theater Management**: Multi-theater support with geographic search.
- **Seat Map Customization**: Visual seat editor for Admin to define theater layouts.
- **Push Notifications**: Browser push notifications for show reminders and promotions.
- **Review System**: User ratings and reviews for movies they've watched.
- **Analytics Dashboard V2**: Revenue charts, booking trends, and user acquisition metrics.

---

## 📖 Ongoing Documentation

- **Per-Service Guides**: Each service (`catalog`, `booking`, `user`, `admin`, `chatbot`) has its own `design.md` in `docs/<service>/`.
- **Maintenance Guides**: SMTP setup and verification risks documented in `docs/maintenance/`.
