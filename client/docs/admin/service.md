# Admin Domain — Frontend Service Documentation

## 🛠️ Overview
The Admin domain provides a separate dashboard interface for platform operators to manage shows, view bookings, and monitor real-time analytics. It uses a distinct layout (sidebar + navbar) from the public-facing pages and is protected behind Clerk-based RBAC.

## 🏗️ Component Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                          ADMIN LAYOUT                                   │
│  ┌────────────┐  ┌─────────────────────────────────────────────────┐   │
│  │  Sidebar   │  │  AdminNavbar                                    │   │
│  │  ┌────────┐│  │  (Logo + Title)                                 │   │
│  │  │Dashboard││  ├────────────────────────────────────────────────┤   │
│  │  │Add Shows││  │                                                │   │
│  │  │Shows   ││  │  ROUTE OUTLET                                  │   │
│  │  │Bookings││  │                                                │   │
│  │  └────────┘│  │  ┌─────────────────────────────────────────┐   │   │
│  │            │  │  │  Dashboard  │  AddShows  │  ListShows   │   │   │
│  │            │  │  │  (default)  │            │  ListBookings │   │   │
│  │            │  │  └─────────────────────────────────────────┘   │   │
│  └────────────┘  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## 📊 Page Details

### Dashboard.tsx (Default Admin Page)
**Route**: `/admin`

**Analytics Cards**:

| Card | Data Source | Computation |
|------|-----------|-------------|
| Total Revenue | `GET /api/admin/dashboard` | `dashboardData.totalRevenue` (sum of paid bookings) |
| Total Bookings | `GET /api/admin/dashboard` | `dashboardData.totalBookings` (count of paid bookings) |
| Total Users | `GET /api/admin/dashboard` | `dashboardData.totalUser` (all registered users) |
| Active Shows | `GET /api/admin/dashboard` | `dashboardData.activeShows.length` (upcoming shows) |

**Active Shows Table**: Displays all upcoming shows with movie title, date/time, price, and seat occupancy.

### AddShows.tsx (Show Creation)
**Route**: `/admin/add-shows`

**Workflow**:
```text
Admin clicks "Fetch Now Playing"
    │  GET /api/show/now-playing (TMDB)
    ▼
Grid of TMDB movie cards rendered
    │  Admin clicks a movie
    ▼
Show scheduling form appears
    │  Admin adds date/time slots + price
    │  Multiple dates supported
    ▼
POST /api/show/add
    │  { movieId, showsInput: [{date, time[]}], showPrice }
    ▼
Success toast → Shows now appear on platform
```

**Form Fields**:

| Field | Type | Validation |
|-------|------|-----------|
| Date | `input[type=date]` | Must be future date |
| Time | `input[type=time]` | Can add multiple per date |
| Price | `input[type=number]` | Required, > 0 |

### ListShows.tsx (Show Management)
**Route**: `/admin/list-shows`

- **Data Source**: `GET /api/admin/all-shows`
- **Table Columns**: Movie Title, Date & Time, Price, Occupied Seats Count
- **Sorting**: By `showDateTime` ascending

### ListBookings.tsx (Booking Oversight)
**Route**: `/admin/list-bookings`

- **Data Source**: `GET /api/admin/all-bookings`
- **Table Columns**: User Name, Movie, Show Date, Seats, Amount, Payment Status
- **Sorting**: Most recent first (`createdAt: -1`)
- **Population**: Full chain: Booking → User + (Show → Movie)

---

## 🧩 Shared Admin Components

### AdminSidebar.tsx
- **Purpose**: Left-side navigation panel
- **Links**: Dashboard, Add Shows, List Shows, List Bookings
- **Active State**: Highlights current route
- **Responsive**: Collapsible on mobile

### AdminNavbar.tsx
- **Purpose**: Top bar with logo and breadcrumb title
- **Minimal**: Clean header without user navigation (admin context only)

### Title.tsx
- **Purpose**: Reusable section heading component
- **Props**: `{ text: string }` → renders styled `<h2>`

---

## 📁 Files

```text
src/
├── pages/admin/
│   ├── Layout.tsx         # Admin shell: Sidebar + Navbar + Outlet
│   ├── Dashboard.tsx      # Analytics cards + active shows table
│   ├── AddShows.tsx       # TMDB movie picker + show scheduling form
│   ├── ListShows.tsx      # All upcoming shows table
│   └── ListBookings.tsx   # All bookings table with population
│
└── components/admin/
    ├── AdminNavbar.tsx     # Minimal top bar
    ├── AdminSidebar.tsx    # Navigation sidebar with route links
    └── Title.tsx           # Section heading component
```

## ✅ Implementation Status
- **✅ Dashboard Analytics**: Live revenue, booking count, user count, active shows
- **✅ Show Creation**: Full TMDB search + multi-date/time batch scheduling
- **✅ Show Listing**: Sortable table with movie metadata
- **✅ Booking Listing**: Deep-populated tables with user and payment data
- **✅ Admin RBAC**: Clerk-based role gate with redirect
- **🔄 Show Editing**: (Future) Edit price or cancel individual shows
- **🔄 Revenue Charts**: (Future) Time-series revenue visualization

## ❓ Troubleshooting
- **Admin page shows login**: User is not authenticated — log in first
- **"Not authorized" redirect**: Set `{ "role": "admin" }` in Clerk Dashboard → User → Private Metadata
- **No movies in "Fetch Now Playing"**: Check that `TMDB_API_KEY` is set in the server's `.env`
- **Stats showing 0**: Backend must have existing bookings and shows in MongoDB
