# Auth Service (Aegis-U) | Documentation

## 1. Primary Strategy
The User Authentication system is decentralized using **Clerk** for identity management. The client leverages the `@clerk/clerk-react` SDK to provide seamless login, signup, and profile management without maintaining a local password database.

## 2. Authentication Workflow (Nexus-U)

```text
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│     USER (UI)   │      │   CLERK SDK     │      │   BACKEND API   │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         │  1. OPEN SIGNIN()      │                        │
         ├───────────────────────►│                        │
         │                        │  2. VERIFY JWT         │
         │  ◄─────────────────────┤                        │
         │                        │                        │
         │  3. GET TOKEN()        │                        │
         ├───────────────────────►│                        │
         │                        │                        │
         │  4. API REQUEST + JWT  │                        │
         ├────────────────────────┴───────────────────────►│
         │                                                 │  5. AUTH SECURE?
         │  ◄──────────────────────────────────────────────┤
         │                                                 │
```

## 3. Integration Modules

### 3.1 Clerk Provider Configuration
The application root is wrapped in a `ClerkProvider` that consumes the `VITE_CLERK_PUBLISHABLE_KEY`. This ensures that all sub-components have access to the `useAuth()` and `useUser()` hooks.

### 3.2 Secure API Communication
The `AppContext` exposes a `getToken()` function from Clerk. Every request to a protected endpoint (Admin/Favorites/Bookings) must inject this token into the `Authorization` header.

```typescript
const token = await getToken();
const { data } = await axios.get("/api/user/favorites", {
  headers: { Authorization: `Bearer ${token}` },
});
```

## 4. Protected Routes
Routing is managed by `react-router-dom`. Protected routes are conditionally rendered:
1. **User Routes**: Restricted in the application code via state checks.
2. **Admin Routes**: Uses a nested layout with an identity check during the `useEffect` hook in `Layout.tsx`.

## 5. Metadata Sync
User roles (e.g., `admin`) are stored in Clerk's `publicMetadata`. The `fetchIsAdmin` service call synchronizes this metadata with the local `isAdmin` state.

---
*Identity Standard: Clerk Aegis V2*
*Component: Aegis-U*
