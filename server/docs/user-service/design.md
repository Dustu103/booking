# User Service — Design Documentation

## 🛠️ Overview
The User Service is the foundation of MovieShine's personalized experience, managing identity, authentication (via Clerk), user profile metadata, and the "Favorite Movies" curation feature. This is a **logical domain** within the monolithic Express server — not a separate microservice.

## 🏗️ System Architecture
The service leverages **Clerk** as the primary identity provider, with a local **MongoDB** synchronized database for profile enrichment and booking relationships.

```text
┌─────────────────────────────────────────────────────────────┐
│                       API GATEWAY                           │
│                (Clerk Middleware / Auth)                    │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                       USER SERVICE                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐│
│  │   Auth Handler   │  │ Profile Handler  │  │ Favorite Svc ││
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘│
│           │                     │                   │        │
│  ┌────────▼─────────────────────▼───────────────────▼───────┐│
│  │                Identity & Sync Logic                     ││
│  │  - Clerk Webhook synchronization (Inngest)               ││
│  │  - Metadata management (Private Metadata in Clerk)       ││
│  │  - Social graph (Favorites list)                         ││
│  └──────────────────────────────┬───────────────────────────┘│
└─────────────────────────────────┼────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                          DATA LAYER                         │
│  ┌──────────────────┐   ┌──────────────────┐                │
│  │    MongoDB       │   │      Clerk       │                │
│  │  users collection│   │  PrivateMetadata │                │
│  │  + favorites     │   │  (Role / Favs)   │                │
│  └──────────────────┘   └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Database Schema (MongoDB + Mongoose)

### `User` Collection
Synchronized from Clerk via Inngest webhook workers. The `_id` is the Clerk user ID (string), not an auto-generated ObjectId.

```typescript
// models/User.ts — Mongoose Schema
{
  _id:   { type: String, required: true },  // Clerk user ID (e.g., "user_2abc123")
  name:  { type: String, required: true },  // "John Doe" (first + last from Clerk)
  email: { type: String, required: true },  // "john@example.com"
  image: { type: String, required: true }   // Clerk avatar URL
}
```

**TypeScript Interface**:
```typescript
interface IUser extends Document {
  _id: string;       // Clerk user ID
  name: string;
  email: string;
  image: string;
}
```

### Clerk `privateMetadata` (External State)
Favorites and admin roles are NOT stored in MongoDB — they live in Clerk's `privateMetadata`:

```json
{
  "role": "admin",
  "favorites": ["912649", "550988", "1184918"]
}
```

| Field | Type | Storage | Purpose |
|-------|------|---------|---------|
| `role` | `string` | Clerk `privateMetadata` | `"admin"` for admin users, absent for regular users |
| `favorites` | `string[]` | Clerk `privateMetadata` | Array of TMDB movie IDs the user has favorited |

---

## 🔄 Key Workflows

### 1. Identity Synchronization (Clerk → Inngest → MongoDB)

```text
Clerk Dashboard / Frontend Login
    │
    ├── clerk/user.created  →  Inngest Worker → User.create()
    ├── clerk/user.updated  →  Inngest Worker → User.findByIdAndUpdate()
    └── clerk/user.deleted  →  Inngest Worker → User.findByIdAndDelete()
```

**Inngest Functions**:

| Function ID | Trigger Event | Action |
|-------------|---------------|--------|
| `sync-user-from-clerk` | `clerk/user.created` | Extract `{id, name, email, image}` → `User.create()` |
| `update-user-from-clerk` | `clerk/user.updated` | Extract updated fields → `User.findByIdAndUpdate()` |
| `delete-user-with-clerk` | `clerk/user.deleted` | Extract `id` → `User.findByIdAndDelete()` |

### 2. Updating Favorite Movies

```text
Client (POST /api/user/update-favorite)
    │
    ▼
Auth Middleware (Clerk)
    │  Validate Session & Extract userId
    ▼
User Controller
    │  Fetch user from Clerk API
    │  Read privateMetadata.favorites
    ▼
Toggle Logic
    ├── movieId NOT in favorites → Push it
    └── movieId ALREADY in favorites → Filter it out
    │
    ▼
Clerk SDK
    └── updateUserMetadata(userId, { privateMetadata: { favorites } })
    │
    ▼
Return success to Client
```

### 3. Fetching Favorite Movies

```text
Client (GET /api/user/favorites)
    │
    ▼
Auth Middleware → Clerk SDK
    │  Read privateMetadata.favorites → ["912649", "550988"]
    ▼
MongoDB Query
    │  Movie.find({ _id: { $in: favorites } })
    ▼
Return full movie metadata to Client
```

## 🔌 Infrastructure & Integrations

| Integration | Technology | Purpose |
|-------------|------------|---------|
| **Auth** | Clerk (OIDC/JWT) | Primary identity management & JWT provider |
| **Storage** | MongoDB | Local cache for user profile & booking relationships |
| **Metadata** | Clerk `privateMetadata` | Favorites list and admin role storage |
| **Sync** | Inngest | Event-driven webhook processing for Clerk lifecycle events |
| **SDK** | `@clerk/express` | Server-side middleware for JWT validation |

---

## 📁 Directory Structure
```text
src/
├── controllers/
│   └── userController.ts   # Bookings history, favorites toggle, favorites list
├── routes/
│   └── userRoutes.ts       # GET /bookings, POST /update-favorite, GET /favorites
├── models/
│   └── User.ts             # Mongoose schema (synchronized from Clerk)
├── middleware/
│   └── auth.ts             # protectAdmin — Clerk role-based guard
└── inngest/
    └── index.ts             # syncUserCreation, syncUserDeletion, syncUserUpdation
```

## ✅ Implementation Status
- **✅ Clerk Integration**: Successfully implemented for Web/Mobile.
- **✅ Metadata Sync**: Inngest workers configured for create/update/delete events.
- **✅ Favorites**: Toggle system with Clerk privateMetadata storage.
- **✅ Booking History**: Deep-populated queries (Show → Movie).
- **🔄 Social Graph**: (Future) Mutual friends or shared favorite lists.

## ❓ Troubleshooting
- **Webhook Not Syncing**: Ensure `INNGEST_EVENT_KEY` is correctly set in Clerk's webhook settings.
- **Unauthorized Errors**: Check if `CLERK_SECRET_KEY` matches the current environment.
- **Favorites Not Updating**: Verify the Clerk API is reachable and `privateMetadata` permissions are granted.
- **User Not In DB**: If a user logged in before Inngest was configured, manually trigger a sync.

## 📖 Related Documentation
- [API Reference](api.md) — Complete endpoint documentation with request/response JSON
