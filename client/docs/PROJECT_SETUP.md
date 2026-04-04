# MovieShine Frontend — Local Setup Guide

## 📋 Prerequisites

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| **Node.js** | ≥ 18.x | `node -v` |
| **npm** | ≥ 9.x | `npm -v` |
| **Clerk Account** | - | [clerk.com](https://clerk.com) |
| **Backend Server** | Running on `:3000` | See `server/docs/PROJECT_REBORN_LOCAL_SETUP.md` |

---

## 🚀 Phase 1: Installation

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install
```

---

## 🔧 Phase 2: Environment Configuration

Create a `.env` file in the `client/` directory:

```env
# ===== CLERK AUTH =====
# Get from: Clerk Dashboard → API Keys → Publishable Key
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxx

# ===== BACKEND API =====
# Must match the port your Express server is running on
VITE_BASE_URL=http://localhost:3000

# ===== TMDB IMAGES =====
# Standard TMDB image CDN base URL
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p/original
```

### Environment Variable Schema

| Key | Required | Description | Example |
|-----|----------|-------------|---------|
| `VITE_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable key (starts with `pk_`) | `pk_test_abc123...` |
| `VITE_BASE_URL` | ✅ | Backend server URL (Express API) | `http://localhost:3000` |
| `VITE_TMDB_IMAGE_BASE_URL` | ✅ | TMDB image CDN for poster/backdrop rendering | `https://image.tmdb.org/t/p/original` |

> ⚠️ **Important**: The `VITE_` prefix is required for Vite to expose env variables to the client bundle.

---

## ▶️ Phase 3: Start Development Server

```bash
npm run dev
```

Expected output:
```
  VITE v6.x.x  ready in 300 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

---

## ✅ Phase 4: Verification Checklist

| # | Check | How to Verify |
|---|-------|---------------|
| 1 | **Homepage loads** | Navigate to `http://localhost:5173` — Hero section with movie backdrop should render |
| 2 | **Movies list** | Navigate to `/movies` — Grid of movie cards should appear (requires backend running) |
| 3 | **Clerk Login** | Click "Login" button — Clerk modal should open |
| 4 | **Auth Token Flow** | After login, check browser DevTools → Network → any API call should have `Authorization: Bearer ...` |
| 5 | **Admin Dashboard** | Navigate to `/admin` — If user has `role: "admin"` in Clerk metadata, dashboard renders |
| 6 | **ChatBot Widget** | A floating chat bubble should appear at bottom-right on all public pages |
| 7 | **Favorites** | After login, click the heart icon on a movie — "Favorites" nav link should appear |

---

## ❓ Phase 5: Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Blank page — "Missing Publishable Key" | `VITE_CLERK_PUBLISHABLE_KEY` not set | Create `.env` file with the key from Clerk Dashboard |
| API calls returning 404 | Backend not running | Start the backend server: `cd server && npm run dev` |
| Images not loading | `VITE_TMDB_IMAGE_BASE_URL` incorrect | Ensure it's set to `https://image.tmdb.org/t/p/original` |
| "You are not authorized" toast on `/admin` | User doesn't have admin role | In Clerk Dashboard, set user's privateMetadata to `{ "role": "admin" }` |
| CORS error in console | Frontend/backend port mismatch | Ensure `VITE_BASE_URL` matches the server's port |
| TailwindCSS not applying | PostCSS/Tailwind config issue | Run `npm install` again to ensure `@tailwindcss/vite` is installed |
| ChatBot not responding | `GEMINI_API_KEY` missing on backend | Set the API key in `server/.env` |

---

## 🧪 Phase 6: Build & Preview (Production)

```bash
# Type-check the entire project
npm run typecheck

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

The production build outputs to `client/dist/` and can be deployed to **Vercel**, **Netlify**, or any static hosting provider.
