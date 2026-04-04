# Auth & Identity Domain — Frontend Service Documentation

## 🛠️ Overview
The Auth domain manages all user identity throughout the MovieShine frontend. Authentication is fully delegated to **Clerk** — there is no local password database or custom auth logic. Clerk handles signup, login, profile management, and JWT issuance. The frontend uses Clerk's React SDK hooks to access user data and generate JWTs for protected API calls.

## 🏗️ Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                      CLERK AUTH FLOW                        │
│                                                             │
│  ┌──────────────┐  1. openSignIn()  ┌──────────────────┐   │
│  │   Navbar     │ ────────────────► │   Clerk Modal    │   │
│  │  (Login Btn) │                   │  (Hosted UI)     │   │
│  └──────────────┘                   └────────┬─────────┘   │
│                                              │              │
│                              2. JWT Issued   │              │
│                                              ▼              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    ClerkProvider                      │   │
│  │  ┌──────────────┐  ┌──────────────┐                  │   │
│  │  │ useUser()    │  │ useAuth()    │                  │   │
│  │  │ → user obj   │  │ → getToken() │                  │   │
│  │  └──────┬───────┘  └──────┬───────┘                  │   │
│  └─────────┼─────────────────┼──────────────────────────┘   │
│            │                 │                              │
│            ▼                 ▼                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    AppContext                         │   │
│  │  - user: ClerkUser                                   │   │
│  │  - isAdmin: boolean                                  │   │
│  │  - getToken() → JWT for Authorization header         │   │
│  │  - fetchIsAdmin() on login → role check              │   │
│  │  - fetchFavoriteMovies() on login → personalization  │   │
│  └──────────────────────────────────────────────────────┘   │
│            │                                                │
│            ▼                                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    ROUTE PROTECTION                   │   │
│  │                                                       │   │
│  │  PUBLIC:  /, /movies, /movies/:id  → No auth needed   │   │
│  │  USER:    /my-bookings, /favorite  → Clerk session    │   │
│  │  ADMIN:   /admin/*                 → Clerk + role     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Clerk Integration Points

### 1. Provider Configuration (main.tsx)
```typescript
<ClerkProvider publishableKey={VITE_CLERK_PUBLISHABLE_KEY}>
  <BrowserRouter>
    <AppProvider>
      <App />
    </AppProvider>
  </BrowserRouter>
</ClerkProvider>
```

### 2. Clerk SDK Hooks Used

| Hook | Component | Purpose |
|------|-----------|---------|
| `useUser()` | `Navbar`, `AppContext` | Get current user object (name, email, image) |
| `useAuth()` | `AppContext` | Get `getToken()` function for JWT generation |
| `useClerk()` | `Navbar` | Access `openSignIn()` to programmatically open login modal |
| `<UserButton>` | `Navbar` | Clerk's pre-built user profile dropdown |
| `<SignIn>` | `App.tsx` (admin fallback) | Clerk's full sign-in page component |

### 3. JWT Token Flow for Protected APIs

```typescript
// Pattern used across all auth-protected API calls
const token = await getToken();  // Clerk SDK generates a fresh JWT
const { data } = await axios.get("/api/user/bookings", {
  headers: { Authorization: `Bearer ${token}` },
});
```

### 4. Admin Role Verification

```text
User logs in via Clerk
    │
    ▼
AppContext.fetchIsAdmin()
    │  GET /api/admin/is-admin
    │  Header: Authorization: Bearer <jwt>
    ▼
Backend checks Clerk privateMetadata
    │  { role: "admin" } → isAdmin = true
    │  No role           → isAdmin = false
    ▼
If NOT admin and on /admin/* route
    │  → navigate("/")
    │  → toast.error("You are not authorized...")
```

## 🧩 Component Details

### Navbar.tsx (Auth UI)
- **Unauthenticated**: Shows "Login" button → `openSignIn()`
- **Authenticated**: Shows `<UserButton>` (Clerk's profile dropdown)
  - Custom menu item: "My Bookings" → navigates to `/my-bookings`
- **Conditional Nav Links**: "Favorites" link only renders when `favoriteMovies.length > 0`
- **Responsive**: Full-screen overlay on mobile with hamburger menu

### Admin Layout.tsx (Admin Route Guard)
- **Guard**: If `user` is null, renders `<SignIn>` component instead of admin layout
- **Layout**: Sidebar navigation + AdminNavbar + route outlet
- **RBAC**: The `fetchIsAdmin()` call runs on mount and redirects non-admin users

---

## 🔐 Route Protection Matrix

| Route | Auth Method | Component Guard | Backend Guard |
|-------|------------|-----------------|---------------|
| `/` | None | - | - |
| `/movies` | None | - | - |
| `/movies/:id` | None | - | - |
| `/movies/:id/:date` | Clerk JWT (implicit) | Login required to book | `clerkMiddleware()` |
| `/my-bookings` | Clerk JWT | Login redirect | `clerkMiddleware()` |
| `/favorite` | Clerk JWT | Login redirect | `clerkMiddleware()` |
| `/admin/*` | Clerk JWT + Role | `<SignIn>` fallback + `fetchIsAdmin()` redirect | `protectAdmin` middleware |

## 📁 Files

```text
src/
├── main.tsx              # ClerkProvider wrapper (root)
├── App.tsx               # Route definitions + admin gate
│
├── components/
│   └── Navbar.tsx        # Login/UserButton + conditional nav links
│
├── pages/admin/
│   └── Layout.tsx        # Admin layout with SignIn fallback
│
└── context/
    └── AppContext.tsx     # user, isAdmin, getToken(), fetchIsAdmin()
```

## ✅ Implementation Status
- **✅ Clerk Authentication**: Fully integrated (signup, login, profile)
- **✅ JWT Token Flow**: Automatic token injection for all protected API calls
- **✅ Admin RBAC**: Server-side role check with client-side redirect
- **✅ UserButton**: Clerk's built-in profile dropdown with custom menu items
- **✅ Session Persistence**: Clerk handles session across tabs/refreshes
- **🔄 Social Login**: (Future) Google/GitHub OAuth via Clerk
- **🔄 Multi-factor Auth**: (Future) Enable MFA in Clerk Dashboard

## ❓ Troubleshooting
- **"Missing Publishable Key"**: Ensure `VITE_CLERK_PUBLISHABLE_KEY` is set in `client/.env`
- **Login modal not opening**: Check browser console for Clerk SDK errors
- **Admin redirect loop**: Verify `role: "admin"` exists in Clerk `privateMetadata` (not `publicMetadata`)
- **Token undefined**: Ensure the API call is inside a component wrapped by `<ClerkProvider>`
