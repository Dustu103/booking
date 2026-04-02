# User Service — Design Documentation

## 🛠️ Overview
The User Service is the foundation of MovieShine's personalize experience, managing identity, authentication (via Clerk), user profile metadata, and the "Favorite Movies" curation feature.

## 🏗️ System Architecture
The service leverages **Clerk** as the primary identity provider, with a local **MongoDB** synchronize database for profile enrichment and social metadata.

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
│  │    PostgreSQL    │   │      Clerk       │                │
│  │   users collection│   │  PrivateMetadata │                │
│  │   + favorites    │   │  (Role / IDs)    │                │
│  └──────────────────┘   └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Data Models
- **`User`**: Core identity synchronized from Clerk (name, email, image, role).
- **`Favorites`**: Managed via Clerk `privateMetadata` for high-availability access on the frontend and persisted in the local Database for search/recommendations.

## 🔄 Key Workflows

### 1. Identity Synchronization (Clerk -> Inngest -> MongoDB)
- **Trigger**: User signs up or updates profile in Clerk.
- **Mechanism**: Clerk Sends a Webhook to Inngest.
- **Action**: Inngest worker updates the local `User` collection to maintain metadata consistency.

### 2. Updating Favorite Movies
```text
Client (POST /api/user/update-favorite)
    │
    ▼
Auth Middleware (Clerk)
    │  Validate Session & Extract userId
    ▼
User Handler
    │  Check if movieId exists in metadata
    ▼
User Service/Clerk SDK
    ├── Toggle movieId in privateMetadata.favorites
    ├── Persist to Clerk API
    └── Return success
    │
    ▼
Return Update Metadata to Client
```

## 🔌 Infrastructure & Integrations

| Integration | Technology | Purpose |
|-------------|------------|---------|
| **Auth** | Clerk | Primary identity management & JWT provider |
| **Storage** | MongoDB | Local cache for user profile & secondary metadata |
| **Sync** | Inngest | Event-driven webhook processing for Clerk events |

---

## 📁 Directory Structure
```text
src/
├── controllers/
│   └── userController.ts   # Main profile & favorites logic
├── routes/
│   └── userRoutes.ts       # Endpoint mapping
├── models/
│   └── User.ts             # Typed Mongoose schema
└── middleware/
    └── auth.ts             # Clerk role-based protection
```

## ✅ Implementation Status
- **✅ Clerk Integration**: Successfully implemented for Web/Mobile.
- **✅ Metadata Sync**: Inngest workers configured for create/update/delete events.
- **✅ Favorites**: Role-agnostic favorite toggle system enabled.
- **🔄 Social Graph**: (Future) Mutual friends or shared favorite lists.

## ❓ Troubleshooting
- **Webhook Not Syncing**: Ensure `INNGEST_EVENT_KEY` is correctly set in Clerks webhook settings.
- **Unauthorized Errors**: Check if the `CLERK_SECRET_KEY` matches the current environment.
