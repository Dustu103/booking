# booking
# MovieShine | The Premier Cinematic Booking Platform

## 0. Project Overview
MovieShine is a high-performance, atomic seat-booking ecosystem built with **Vite + React + Express + TypeScript**. This platform facilitates seamless transitions between movie discovery, real-time seat allocation, and secure Stripe-integrated transactions.

## 1. Architectural Highlights (ProYodha Standard)
The platform follows a strict service-oriented architecture, ensuring clear separation of concerns across the full-stack:

- **Nexus-B (Booking Service)**: Handles real-time seat maps and transaction lifecycles.
- **Show-C (Catalog Service)**: Manages movie metadata and localized scheduling.
- **Aegis-U (User Service)**: Unified identity management powered by Clerk.

## 2. Technology Stack
- **Frontend**: React 18, Vite, TypeScript, TailwindCSS.
- **Backend**: Node.js, Express, TypeScript, Mongoose.
- **Orchestration**: Inngest (Background Workflows), Stripe (Payments), Clerk (Auth).

## 3. Directory Structure
```text
┌── client/      # Vite + React (TypeScript)
├── server/      # Express + Node.js (TypeScript)
├── docs/        # High-fidelity design specifications
└── README.md    # System Overview
```

## 4. Quick Start
1.  **Dependencies**: Run `npm install` in both `client/` and `server/`.
2.  **Environment**: Configure `.env` in both directories (see docs for schema).
3.  **Development**:
    - `npm run dev` (Parallel startup via root, if configured).

## 5. Build Protocols
- **Type Checking**: `npm run typecheck` (Client-side validation).
- **Compilation**: `npm run build` (Production bundling).

---

