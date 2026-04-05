# Identity & RBAC (Role-Based Access Control)

## 1. Overview
MovieShine delegates raw password security and identity validation to **Clerk.js**. Our backend primarily acts as a consumer of Clerk's JWTs, enforcing authorization bounds based on application state.

## 2. Authentication Lifecycle

1.  **Client-Side Resolution:** The React client utilizes `<ClerkProvider>` to acquire a short-lived session JWT.
2.  **API Transport:** Every protected API request carries this token in the `Authorization: Bearer <token>` header.
3.  **Edge Validation:** The Express middleware intercepts the request, verifies the cryptographic signature utilizing Clerk's JWKS (JSON Web Key Set), and extracts the unified user ID.

```javascript
// Standard Middleware Example
import { requireAuth } from '@clerk/express';

app.use('/api/protected', requireAuth(), (req, res, next) => {
    // req.auth.userId is reliably injected here
    next();
});
```

## 3. Role-Based Access Control
We distinguish between standard users, system administrators, and corporate users via database-level checks.

### Standard Users
- Can read public catalogs.
- Can create standard bookings.
- Can view their own order history (where `userId === req.auth.userId`).

### System Administrators
- Typically maintained via a specialized `Admin` model or Clerk metadata claims.
- Can create/edit movies, theaters, and showtimes.
- Can bypass standard user validation checks for management endpoints.

### Corporate Tenants (B2B)
- A standard Clerk user who is added to the `members` array of a `CorporateAccount` document dynamically inherits corporate privileges.
- Admin vs Employee distinction *within* a corporation is defined by matching `req.auth.userId` against the `adminUserId` field of the respective B2B tenant record.

> [!WARNING]
> Do not rely solely on frontend UI hiding to enforce permissions. Every protected endpoint must independently query the backend database or validate Clerk claims to ensure a corporate user has explicit permission to execute an action (like approving a high-value corporate escrow) before issuing Stripe links.
