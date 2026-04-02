# MovieShine Frontend Architecture (ProYodha Standard)

## 0. Executive Summary
MovieShine is a high-performance, atomic seat-booking platform. The frontend is built with **Vite + React + TypeScript**, emphasizing strict type safety, premium design aesthetics, and seamless user transitions. This document outlines the logical and physical architecture of the client-side system.

## 1. System Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MOVIESHINE CLIENT (VITE/TS)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────┐      ┌──────────────────────┐      ┌───────────┐  │
│  │    CLERK AUTH        │ ◄──► │    APP CONTEXT (TS)  │ ◄──► │ AXIOS API │  │
│  └──────────────────────┘      └──────────┬───────────┘      └─────┬─────┘  │
│            ▲                              │                        │        │
│            │                              ▼                        ▼        │
│  ┌─────────┴────────────┐      ┌──────────────────────┐      ┌─────┴─────┐  │
│  │   ROUTING (RRD v6)   │      │   GLOBAL STATE       │      │  BACKEND  │  │
│  └─────────┬────────────┘      └──────────┬───────────┘      └───────────┘  │
│            │                              │                                 │
│            ▼                              ▼                                 │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                          COMPONENT HIERARCHY                          │  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │  [ NAV ] -> [ HERO ] -> [ FEATURED ] -> [ TRAILERS ] -> [ FOOTER ]    │  │
│  │                                                                       │  │
│  │  [ ADMIN ] -> [ LAYOUT ] -> [ DASHBOARD ] -> [ ADD/LIST SHOWS ]       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. Core Service Modules

### 2.1 Catalog Service (Catalyst-C)
Handles the visualization of currently playing movies.
- **Components**: `FeaturedSection`, `MovieCard`, `TrailersSection`.
- **Data Flow**: `AppContext` fetches `/api/show/all` -> Maps to `IMovie[]` -> Distributed to child components.

### 2.2 Booking Service (Nexus-B)
Manages the real-time seat allocation and Stripe checkout handoff.
- **Components**: `SeatLayout`, `DateSelect`.
- **Vertical Thread**: Select Movie -> Select Date -> Select Time Slots -> Atomic Seat Click -> `/api/booking/create` -> Stripe Redirection.

### 2.3 User Service (Aegis-U)
Unified identity management via Clerk.
- **Provider**: `ClerkProvider`.
- **Auth Flow**: `useAuth()`/`useUser()` -> Auth Token for Axios interceptors -> Protected Routes for `/admin/*` and `/my-bookings`.

## 3. TypeScript Implementation Standards
The migration from JS to TS follows the **Strict Aegis (SA)** protocol:
1. **Zero 'any' Policy**: Every data structure must match an interface defined in `src/types/index.ts`.
2. **Functional Consistency**: All components must be typed as `React.FC`.
3. **Environment Isolation**: `import.meta.env` is strictly typed in `vite-env.d.ts`.
4. **Prop Integrity**: No implicit props; all component inputs must have documented interfaces.

## 4. Design Guidelines (Aesthetic Protocol)
- **Primary Color**: `#ffe70a` (Vibrant Yellow).
- **Secondary Color**: `#050505` (Deep Space Dark).
- **Typography**: San-serif Bold/Black for headings, Regular/Light for body.
- **Interactions**: Sub-pixel micro-animations (1.02x scale), periodic blur circles, and glassmorphism (10% opacity white with blur).

## 5. Deployment & Build Sequence
1. `npm run typecheck`: Validates full project type safety.
2. `npm run lint`: Enforces coding standards.
3. `npm run build`: Compiles TSX to optimized ESNext bundles.
4. `vite preview`: Local verification of production build.

---
*Document Version: 2.1.0 (TypeScript Overhaul)*
*Standard: ProYodha High-Fidelity*
