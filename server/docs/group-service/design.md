# Group Booking Service — System Design Document

## 1. Executive Summary & Business Case (For Product & Marketing)

### The "Why"
The traditional movie ticketing experience isolates the buyer. When friends want to go to a movie, one person buys tickets blindly or sends screenshots back and forth to coordinate seats. The **Group Booking Service** turns checkout into a real-time, multiplayer social experience.

### Core Value Proposition (Marketing Focus)
*   **Live Collaboration:** Friends see each other picking seats in real-time (color-coded). No more double-booking or arguments over rows.
*   **Frictionless Payouts:** Eliminates the "you venmo me later" problem. The Host opens the room, friends claim what they want, and the Host executes a single, clean checkout transaction for the aggregate total.
*   **Viral Growth Loop:** Because users must share an invite link (`/group/X81Y`) to coordinate, the platform organically pulls new users into the MovieShine ecosystem.

---

## 2. System Architecture (High-Level Design)

This domain requires bypassing our standard MongoDB transactional DB in favor of a lightning-fast ephemeral stack (`Redis` + `Centrifugo`) to handle High-Frequency UI events.

```text
┌─────────────────────────────────────────────────────────────┐
│                 CLIENT (Multiplayer React)                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐│
│  │ Centrifuge Hook  │  │   Seat Matrix    │  │ Member HUD   ││
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘│
└───────────┼─────────────────────┼───────────────────┼────────┘
            │          (WebSocket │ Streams)          │
            ▼                     ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                 CENTRIFUGO V5 (WS BROKER)                   │
│  [ Channel: group:code ]  <-- Hard-streams payload to UI    │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP Pub/Sub Trigger
            ┌─────────────┴────────────────┐
            ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 ORCHESTRATION LAYER (groupCtrl)             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐│
│  │ Seat Validation  │  │ Checkout Aggreg. │  │ JWT Signer   ││
│  │ (Overlap Checks) │  │ (Stripe Builder) │  │ (Auth Guard) ││
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘│
└───────────┼─────────────────────┼───────────────────┼────────┘
            │                     │                   │
            ▼                     ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                      STATE & STORAGE                        │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │ Redis (Hot State)│  │ MongoDB (Storage)│                  │
│  └──────────────────┘  └──────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Core Business Logic & Workflows

This system manages three highly-concurrent vectors: Token generation, Room state aggregation, and Payment escrowing.

### Real-time Event Pipeline
1.  **Room Initialization:** Host requests a room. Backend creates a `RoomState` object in Redis. Backend uses `CENTRIFUGO_TOKEN_SECRET` to sign a custom JWT granting the Host Web-socket access to `group:<roomCode>`.
2.  **Concurrency Checks:** User A and User B click Seat `C4` simultaneously. Both API requests hit node. Node queries Redis. The first thread to execute `saveRoomState()` wins. The second thread fails validation and returns `false`.
3.  **The Checkout Aggregator:** When the Host triggers checkout, Node extracts *every* selected seat out of the Redis `members` object, flattens them into a single array (`[A1, A2, B3]`), verifies against the primary DB they haven't been poached, and opens a single Stripe session.

---

## 4. Data Model Design (Redis vs MongoDB)

### A. Ephemeral State (Redis)
We do not touch the database during active seat-selection. All state exists in Redis with a **30-Minute TTL** (Time to Live). 
*   **Key**: `group_room:A3F8C2`
*   **Value (Stringified JSON):**
    ```typescript
    {
      roomCode: "A3F8C2", showId: "Object_ID", createdBy: "user_123", status: "selecting",
      members: { 
        "user_123": { color: "#7c3aed", selectedSeats: ["A1", "A2"], isReady: true }
      }
    }
    ```

### B. Persistent State (MongoDB Collection: `GroupRoom`)
Once the checkout completes, the Redis key is deleted. A permanent record is minted in Mongo for historical audits.
*   `bookedSeats`: Array of the final flattened seat choices.
*   `bookingId`: Refers to the unified primary `Booking` document.
*   `paymentLink`: The completed Stripe URL.

---

## 5. Developer Navigation & Debugging Guide

*Immediate navigation targets for resolving live operational issues.*

### Where does the Logic live?
*   **Main Business Engine:** `server/src/controllers/groupController.ts`
*   **Redis Mutators:** `server/src/configs/redis.ts` (All cache hit/miss logic)
*   **Websocket Engine:** `server/src/configs/centrifugo.ts` (JWT synthesis, `publishToChannel()`)
*   **React Hook:** `client/src/hooks/useGroupRoom.ts` (The WS front-end receiver)

### Common Bug Fixes & Hot-Paths
| Issue | Where to Fix | Logic to Check |
| :--- | :--- | :--- |
| **Users get disconnected/Websocket fails** | `centrifugo.ts` ➔ `generateConnectionToken()` | Ensure the `CENTRIFUGO_TOKEN_SECRET` environment variable holds the exact same string value defined in `.env` and `centrifugo_config.json`. |
| **"Rooms expire too fast"** | `redis.ts` ➔ `ROOM_TTL_SECONDS` | Simply increase `30 * 60` to a higher integer. This expands the cache life of the room. |
| **Teammates click same seat & UI bugs out** | `groupController.ts` ➔ `updateSeatSelection()` | Ensure the array flattener `allOtherSeats.includes(s)` correctly parses the incoming seat constraints before validating to Redis. |
| **Checkout button remains disabled** | `GroupBooking.tsx` (React) | The Host's button relies on the boolean equation that *every* user in `roomState.members` evaluates `isReady: true`. Verify Centrifugo pushed the `MEMBER_READY` packet. |

---

## 6. Design Decisions & Trade-Offs

**Trade-off 1: Centrifugo vs Socket.io**
*   *Decision:* We leveraged Centrifugo (Standalone Golang Service) rather than embedding `socket.io` directly into our Node/Express server.
*   *Why:* Node is deeply single-threaded. Tying up the main thread with 10,000 idle websocket connections degrades HTTP performance. By extracting WS management to Centrifugo, Node merely makes lightning-fast, stateless HTTP fire-and-forget `POST` requests to Centrifugo, and Centrifugo handles pushing packets to 10k clients. Infinity scalable.

**Trade-off 2: History Replay vs Absolute State**
*   *Decision:* We configured Centrifugo with `history_size: 100` and `history_ttl: 300s`.
*   *Why:* If User B drops connection and reconnects (bad mobile data), they missed the `SEAT_UPDATE` event. With History Recovery, Centrifugo blasts all missed events to User B the millisecond they reconnect, guaranteeing the React state converges perfectly without having to hammer the Node API for a state sync.
