# MovieShine Frontend — System Design

## 🏛️ High-Level Design (HLD)

The MovieShine frontend is a **Single Page Application (SPA)** built with **React 19 + Vite + TypeScript + TailwindCSS 4**. It follows a monolithic client architecture where all pages, components, and state management live in a single Vite-bundled application. Authentication is fully delegated to **Clerk**, with all backend communication happening through a centralized Axios client via the `AppContext`.

### System Architecture Overview
```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    MOVIESHINE CLIENT (Vite + React 19)                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌──────────────────┐    ┌──────────────────────┐    │
│  │ ClerkProvider│◄──►│   AppContext      │◄──►│   Axios (baseURL)   │    │
│  │ (Auth SDK)  │    │ (Global State)    │    │ → localhost:3000     │    │
│  └──────┬──────┘    └────────┬─────────┘    └──────────┬───────────┘    │
│         │                    │                          │               │
│         ▼                    ▼                          ▼               │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    React Router DOM v7                           │    │
│  │                                                                 │    │
│  │  PUBLIC ROUTES                    ADMIN ROUTES (/admin/*)       │    │
│  │  ┌────────────────────────┐      ┌──────────────────────────┐   │    │
│  │  │ /           → Home     │      │ /admin      → Dashboard  │   │    │
│  │  │ /movies     → Movies   │      │ /admin/add  → AddShows   │   │    │
│  │  │ /movies/:id → Details  │      │ /admin/list → ListShows  │   │    │
│  │  │ /movies/:id/:date → Seats│    │ /admin/book → Bookings   │   │    │
│  │  │ /my-bookings → Bookings│      └──────────────────────────┘   │    │
│  │  │ /favorite   → Favorites│                                     │    │
│  │  └────────────────────────┘                                     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     COMPONENT HIERARCHY                         │    │
│  │                                                                 │    │
│  │  SHARED:  Navbar │ Footer │ BlurCircle │ Loading │ ChatBot      │    │
│  │  CATALOG: HeroSection │ FeaturedSection │ TrailersSection       │    │
│  │  BOOKING: MovieCard │ DateSelect │ SeatLayout                   │    │
│  │  ADMIN:   AdminNavbar │ AdminSidebar │ Title │ Dashboard        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└────────────────────────────────────────────┬────────────────────────────┘
                                             │  REST API (Axios + JWT)
                                             ▼
                                  ┌──────────────────────┐
                                  │  Express.js Backend  │
                                  │  (localhost:3000)     │
                                  └──────────────────────┘
```

---

## ⚙️ Low-Level Design (LLD)

### 1. Provider Stack (main.tsx)
The application is wrapped in three nested providers:

```text
ClerkProvider          ← Auth identity + JWT tokens
  └── BrowserRouter    ← URL routing
       └── AppProvider ← Global state (shows, favorites, admin status)
            └── App    ← Route definitions + layout
```

### 2. Global State Management (AppContext.tsx)

| State | Type | Source | Purpose |
|-------|------|--------|---------|
| `shows` | `IMovie[]` | `GET /api/show/all` | All movies with upcoming shows |
| `favoriteMovies` | `IMovie[]` | `GET /api/user/favorites` | User's favorite movie list |
| `isAdmin` | `boolean` | `GET /api/admin/is-admin` | Admin role gate |
| `user` | `ClerkUser` | Clerk `useUser()` hook | Current authenticated user |
| `image_base_url` | `string` | `VITE_TMDB_IMAGE_BASE_URL` | TMDB image CDN prefix |

**Exposed Functions**:

| Function | Trigger | Action |
|----------|---------|--------|
| `fetchShows()` | App mount (`useEffect`) | Fetches upcoming unique movies |
| `fetchIsAdmin()` | User login | Checks admin role, redirects if unauthorized |
| `fetchFavoriteMovies()` | User login | Loads favorite movies from Clerk metadata |
| `getToken()` | Before protected API calls | Returns Clerk JWT for Authorization header |

### 3. TypeScript Interfaces (types/index.ts)

```typescript
interface IUser {
  _id: string;              // Clerk user ID
  name: string;
  email: string;
  image: string;
  role?: "admin" | "user";
}

interface IMovie {
  _id: string;              // TMDB movie ID
  title: string;
  overview: string;
  poster_path: string;      // Relative path (append to image_base_url)
  backdrop_path: string;
  release_date: string;
  genres: string[] | { id: number; name: string }[];
  casts: { name: string; role: string; image: string }[];
  vote_average: number;
  runtime: number;
}

interface IShow {
  _id: string;
  movie: string | IMovie;
  showDateTime: string | Date;
  showPrice: number;
  occupiedSeats: Record<string, string>;  // seatId → userId
}

interface IBooking {
  _id: string;
  user: string | IUser;
  show: string | IShow;
  amount: number;
  bookedSeats: string[];
  isPaid: boolean;
  paymentLink?: string;
  createdAt?: string;
}

// Populated version for MyBookings page
interface IBookingPopulated extends Omit<IBooking, "show"> {
  show: IShow & { movie: IMovie };
}

interface ShowSlot {
  time: string | Date;
  showId: string;
}

interface DateTimeMap {
  [date: string]: ShowSlot[];
}
```

### 4. Utility Functions (lib/)

| File | Function | Purpose |
|------|----------|---------|
| `dateFormat.ts` | `formatDate(date)` | Formats ISO date to readable format |
| `timeFormat.ts` | `formatTime(date)` | Formats ISO timestamp to `HH:MM AM/PM` |
| `isoTimeFormat.ts` | `formatIsoTime(date)` | Extracts time portion from ISO string |
| `kConverter.ts` | `kConverter(num)` | Converts large numbers to `1.2K` format |

---

## 🎨 Design System

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#f84565` | CTA buttons, active states, selected seats |
| `--color-primary-dull` | `#d63854` | Hover states |
| Background | `#09090b` | Page background (Deep Space Dark) |
| Text | `white` | Primary text color |

### Typography
- **Font Family**: `Outfit` (Google Fonts) — sans-serif
- **Heading Scale**: Bold/Black weights for headings, Regular/Light for body
- **Custom Scrollbar**: Thin scrollbar with `#787777` thumb on `#1e1e1e` track

### Design Patterns
- **Glassmorphism**: `bg-white/10` + `backdrop-blur` + `border-white/20` for nav and overlays
- **BlurCircle**: Animated gradient blur circles for background depth
- **Micro-animations**: `hover:-translate-y-1`, `hover:scale-102`, smooth transitions
- **Card Style**: `bg-gray-900/50` + `border-white/5` + `shadow-2xl` on hover

---

## 🗺️ Route Map

| Path | Page Component | Auth Required | Layout |
|------|---------------|---------------|--------|
| `/` | `Home` | No | Public (Navbar + Footer) |
| `/movies` | `Movies` | No | Public |
| `/movies/:id` | `MovieDetails` | No | Public |
| `/movies/:id/:date` | `SeatLayout` | Yes (implicit) | Public |
| `/my-bookings` | `MyBookings` | Yes | Public |
| `/favorite` | `Favorite` | Yes | Public |
| `/loading/:nextUrl` | `Loading` | No | Public (redirect helper) |
| `/admin` | `Dashboard` | Yes (Admin) | Admin (Sidebar + AdminNav) |
| `/admin/add-shows` | `AddShows` | Yes (Admin) | Admin |
| `/admin/list-shows` | `ListShows` | Yes (Admin) | Admin |
| `/admin/list-bookings` | `ListBookings` | Yes (Admin) | Admin |

---

## 📁 Directory Structure

```text
client/src/
├── main.tsx              # Bootstrap: ClerkProvider → Router → AppProvider
├── App.tsx               # Route definitions + layout switching
├── index.css             # TailwindCSS imports + design tokens + custom styles
│
├── context/
│   └── AppContext.tsx     # Global state: shows, favorites, auth, admin
│
├── types/
│   └── index.ts          # IUser, IMovie, IShow, IBooking, AppContextType
│
├── pages/
│   ├── Home.tsx           # Hero + Featured + Trailers
│   ├── Movies.tsx         # Grid of all movies with upcoming shows
│   ├── MovieDetails.tsx   # Movie info + date/time picker
│   ├── SeatLayout.tsx     # Interactive 10x12 seat grid + Stripe checkout
│   ├── MyBookings.tsx     # User's booking history
│   ├── Favorite.tsx       # Favorite movies list
│   └── admin/
│       ├── Layout.tsx     # Admin shell (Sidebar + Navbar)
│       ├── Dashboard.tsx  # Analytics cards + show/booking tables
│       ├── AddShows.tsx   # TMDB search + batch show creation form
│       ├── ListShows.tsx  # All upcoming shows table
│       └── ListBookings.tsx # All bookings table
│
├── components/
│   ├── Navbar.tsx         # Glassmorphism nav with Clerk UserButton
│   ├── Footer.tsx         # Site footer with social links
│   ├── HeroSection.tsx    # Homepage hero with backdrop image
│   ├── FeaturedSection.tsx # Featured movie carousel
│   ├── TrailersSection.tsx # YouTube trailer embeds (ReactPlayer)
│   ├── MovieCard.tsx      # Movie poster card with hover effects
│   ├── DateSelect.tsx     # Date/time picker for show selection
│   ├── BlurCircle.tsx     # Decorative gradient blur circle
│   ├── Loading.tsx        # Loading/redirect transition page
│   ├── ChatBot.tsx        # Floating AI chat widget (Ari)
│   └── admin/
│       ├── AdminNavbar.tsx  # Minimal admin top bar
│       ├── AdminSidebar.tsx # Navigation sidebar with route links
│       └── Title.tsx        # Section title component
│
├── lib/
│   ├── dateFormat.ts      # Date formatting utility
│   ├── timeFormat.ts      # Time formatting utility
│   ├── isoTimeFormat.ts   # ISO time extraction utility
│   └── kConverter.ts      # Number abbreviation (1K, 1M)
│
└── assets/
    ├── assets.ts          # Centralized asset imports/exports
    ├── logo.svg           # MovieShine logo
    ├── backgroundImage.png # Hero section backdrop
    └── ...                # Icons, badges, decorative SVGs
```

---

## 🔌 Infrastructure Summary

| Component | Technology | Version | Role |
|-----------|------------|---------|------|
| **Framework** | React | 19 | UI component library |
| **Bundler** | Vite | 6.x | Dev server with HMR + production bundler |
| **Language** | TypeScript | 6.x | Full type safety |
| **Styling** | TailwindCSS | 4.x | Utility-first CSS with custom design tokens |
| **Auth** | Clerk React | 5.x | Login/signup/profile management |
| **Routing** | React Router DOM | 7.x | Client-side SPA routing |
| **HTTP** | Axios | 1.x | API communication with JWT injection |
| **Toasts** | react-hot-toast | 2.x | User notification system |
| **Video** | react-player | 2.x | YouTube trailer embeds |
| **Icons** | Lucide React | 0.5x | Consistent SVG iconography |
| **Deployment** | Vercel | - | Serverless SPA hosting |

---

## 🧪 Verification & Testing

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server with HMR (`:5173`) |
| `npm run typecheck` | Full TypeScript compilation check |
| `npm run lint` | ESLint code quality validation |
| `npm run build` | Production build (`tsc && vite build`) |
| `npm run preview` | Preview production build locally |
