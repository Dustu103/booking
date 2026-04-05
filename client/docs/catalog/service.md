# Catalog Domain — Frontend Service Documentation

## 🛠️ Overview
The Catalog domain is the content discovery engine of MovieShine. It sources movie metadata from the backend (which itself bridges TMDB), and presents it through multiple visual surfaces: Hero banners, Featured carousels, Trailer embeds, and the full Movie grid.

## 🏗️ Component Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                       HOME PAGE (/)                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────┐  │
│  │  HeroSection     │  │ FeaturedSection   │  │ Trailers │  │
│  │  (Backdrop+CTA)  │  │(Horizontal Scroll)│  │ (Videos) │  │
│  └──────────────────┘  └────────┬─────────┘  └──────────┘  │
│                                 │                           │
│                     ┌───────────▼──────────┐                │
│                     │     MovieCard        │                │
│                     │  (Poster + Rating)   │                │
│                     └──────────────────────┘                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    MOVIES PAGE (/movies)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Grid of MovieCard components (3-col responsive)     │   │
│  │  Source: AppContext.shows (IMovie[])                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              MOVIE DETAILS PAGE (/movies/:id)               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────┐  │
│  │  Backdrop Banner  │  │  Movie Metadata  │  │DateSelect│  │
│  │  (Full Width)     │  │  (Title/Genre/   │  │(Calendar │  │
│  │                   │  │   Cast/Rating)   │  │ + Times) │  │
│  └──────────────────┘  └──────────────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow

```text
App Mounts
    │
    ▼
AppContext.fetchShows()
    │  GET /api/show/all
    ▼
Backend returns unique movies with upcoming shows
    │
    ▼
AppContext.shows = IMovie[]
    │
    ├──► Home.tsx → HeroSection (first movie backdrop)
    ├──► Home.tsx → FeaturedSection (horizontal scroll of MovieCards)
    ├──► Home.tsx → TrailersSection (YouTube embeds via ReactPlayer)
    └──► Movies.tsx → Full grid of MovieCards
```

## 🧩 Component Details

### HeroSection.tsx
- **Purpose**: Full-width banner featuring the first movie in the `shows` array
- **Data Source**: `AppContext.shows[0]`
- **Renders**: Backdrop image, title, overview, genre tags, CTA button → `/movies/:id`
- **Effects**: Gradient overlay `bg-gradient-to-t from-[#09090b]`

### FeaturedSection.tsx
- **Purpose**: Horizontal scrollable carousel of movie cards
- **Data Source**: `AppContext.shows`
- **Layout**: `overflow-x-auto` with `no-scrollbar` class
- **Interaction**: Click → navigate to `/movies/:id`

### TrailersSection.tsx
- **Purpose**: Embedded YouTube trailer playback
- **Library**: `react-player` with `controls` and `light` mode
- **Data Source**: Hardcoded trailer URLs or dynamic (future TMDB video API)

### MovieCard.tsx
- **Purpose**: Reusable movie poster card used across all catalog surfaces
- **Props**: `IMovie` object
- **Features**: Poster image, star rating, title, year, favorite toggle
- **Effects**: `hover:-translate-y-1`, `hover:shadow-2xl`, `scale` transitions

### DateSelect.tsx
- **Purpose**: Calendar and time-slot picker for show scheduling
- **Data Source**: `GET /api/show/:movieId` → `DateTimeMap`
- **State**: `selectedDate`, `selectedShowId`
- **Output**: Passes `showId` to SeatLayout page

### MovieDetails.tsx
- **Purpose**: Full movie detail page with metadata, cast, and showtime picker
- **Data Source**: `GET /api/show/:movieId` → Movie + DateTimeMap
- **Sections**: Backdrop, synopsis, genres, cast carousel, DateSelect component
- **Favorite Toggle**: `POST /api/user/update-favorite` via Clerk JWT

---

## 📁 Files

```text
src/
├── pages/
│   ├── Home.tsx            # Landing page: Hero + Featured + Trailers
│   ├── Movies.tsx          # Full movie grid
│   └── MovieDetails.tsx    # Movie detail + showtime picker
│
├── components/
│   ├── HeroSection.tsx     # Full-width backdrop banner
│   ├── FeaturedSection.tsx # Horizontal movie carousel
│   ├── TrailersSection.tsx # YouTube trailer embeds
│   ├── MovieCard.tsx       # Reusable poster card
│   └── DateSelect.tsx      # Calendar + time-slot picker
│
└── context/
    └── AppContext.tsx       # shows: IMovie[] (global catalog state)
```

## ✅ Implementation Status
- **✅ Hero Section**: Dynamic backdrop from first movie in catalog
- **✅ Featured Carousel**: Horizontal scrolling with smooth transitions
- **✅ Movie Grid**: Responsive 3-column layout
- **✅ Movie Details**: Full metadata display with cast carousel
- **✅ Date/Time Picker**: Calendar-based show selection
- **✅ Favorite Toggle**: Heart icon with Clerk metadata persistence
- **🔄 Trailer Integration**: Hardcoded URLs — future: dynamic TMDB video API
- **🔄 Search & Filter**: (Future) Genre/language/rating filtering

## ❓ Troubleshooting
- **No movies showing**: Backend must be running and shows must exist with future `showDateTime`
- **Broken images**: Verify `VITE_TMDB_IMAGE_BASE_URL` is set in `.env`
- **DateSelect empty**: Navigate to a specific movie that has shows scheduled
