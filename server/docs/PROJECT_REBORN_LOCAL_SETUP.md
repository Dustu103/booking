# 🚀 Project Reborn: MovieShine Local Setup Guide

> **A Phased Approach to a "Perfect" Local Environment**

Follow this guide step-by-step for a clean, stable, and testable local setup of the MovieShine platform (both client and server).

---

## 🛠️ Phase 1: Prerequisites & Tooling

Before starting, ensure the following tools are installed on your system.

1.  **Node.js 18+**: Verify with `node -v`.
2.  **npm**: Comes bundled with Node.js. Verify with `npm -v`.
3.  **Git**: For repository cloning.
4.  **Docker Desktop** (Optional): Only required if you want to run MongoDB locally via container.

---

## 📦 Phase 2: Clone & Install

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd movieshine
    ```

2.  **Install Server Dependencies:**
    ```bash
    cd server
    npm install
    ```

3.  **Install Client Dependencies:**
    ```bash
    cd ../client
    npm install
    ```

---

## ⚙️ Phase 3: Configuration (The `.env` Secrets)

Both the **server** and the **client** require their own `.env` files. Ask the project admin for the actual secret values.

### Server (`server/.env`)
```env
# ── Database ──
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net

# ── Authentication (Clerk) ──
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# ── Payments (Stripe) ──
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ── Movie Data (TMDB) ──
TMDB_API_KEY=<your_tmdb_key>

# ── Email (Brevo SMTP) ──
SMTP_USER=<brevo_smtp_user>
SMTP_PASS=<brevo_smtp_pass>
SENDER_EMAIL=noreply@movieshine.com

# ── AI Chatbot (Gemini) ──
GEMINI_API_KEY=<your_gemini_key>

# ── Background Workers (Inngest) ──
INNGEST_EVENT_KEY=<inngest_event_key>
INNGEST_SIGNING_KEY=<inngest_signing_key>
```

### Client (`client/.env`)
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_SERVER_URL=http://localhost:3000
```

---

## 🚀 Phase 4: Start Development Servers

### Option A: Run Locally (Recommended for Development)

**Start the Server:**
```bash
cd server
npm run dev
```
*Starts the Express API on `http://localhost:3000` using TSX with hot-reload.*

**Start the Client (New Terminal):**
```bash
cd client
npm run dev
```
*Starts the Vite dev server on `http://localhost:5173` with HMR.*

### Option B: Run via Docker Compose (Server + MongoDB)

If you want a fully containerized backend with a local MongoDB instance:
```bash
cd server
docker-compose up --build
```
*Builds the server image, starts MongoDB on `:27017`, and the API on `:3000`.*

---

## ✅ Phase 5: Verification Checklist

After starting the servers, verify everything is working:

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Visit `http://localhost:3000` | Returns `"Server is Live!"` |
| 2 | Visit `http://localhost:5173` | MovieShine frontend loads |
| 3 | Click "Sign In" on the frontend | Clerk authentication modal appears |
| 4 | Browse "Now Playing" section | Movie posters load from TMDB API |
| 5 | Open the Chat widget (💬 icon) | Ari responds to movie-related queries |

---

## 📊 Phase 6: Key Development URLs

| Tool | URL | Purpose |
|------|-----|---------|
| **Frontend** | `http://localhost:5173` | Vite + React development server |
| **Backend API** | `http://localhost:3000` | Express REST API |
| **Inngest Dashboard** | `http://localhost:8288` | Background job monitoring (when Inngest Dev Server is running) |
| **Stripe Test Dashboard** | `https://dashboard.stripe.com/test` | Payment event monitoring |
| **Clerk Dashboard** | `https://dashboard.clerk.com` | User & auth management |

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| `MONGODB_URI` connection error | Ensure your IP is whitelisted in MongoDB Atlas, or use Docker for local MongoDB. |
| Clerk auth not working | Verify `CLERK_PUBLISHABLE_KEY` matches between server and client `.env` files. |
| Stripe payments failing | Ensure you are using **test mode** keys. Run `stripe listen --forward-to localhost:3000/api/stripe` for local webhook testing. |
| TMDB posters not loading | Verify `TMDB_API_KEY` is valid. Test with: `curl "https://api.themoviedb.org/3/movie/now_playing?api_key=YOUR_KEY"`. |
| Emails not sending | Refer to [SMTP Setup Guide](maintenance/SMTP_SETUP.md) for Brevo configuration. |

---

## 📖 Detailed Documentation

For a deep dive into specific components, refer to:
- [System Design](SYSTEM_DESIGN.md) — Full architecture, flows, and API reference
- [API Reference](api.md) — Complete endpoint documentation
- [SMTP Setup](maintenance/SMTP_SETUP.md) — Email transporter configuration
- [Verification Risks](maintenance/verification_risks.md) — Known issues and edge cases

Per-service design documentation:
- [Catalog Service](catalog-service/design.md)
- [Booking Service](booking-service/design.md)
- [User Service](user-service/design.md)
- [Admin Service](admin-service/design.md)
- [Chatbot Service](chatbot-service/design.md)

---

**Success!** 🎉 Your MovieShine local environment is now correctly configured and ready for development.
