# Group Booking Domain — Frontend Service Documentation

## 🛠️ Overview
The Group Booking domain powers real-time, live collaborative seat coordination. Through WebSocket integration (Centrifugo v5) and robust state tracking, multiple users can join a shared session, visibly claim seats in real-time, and execute a consolidated group checkout.

## 🏗️ Component Architecture

```text
┌─────────────────────────────────────────────────────────────────────┐
│                 GROUP BOOKING PAGE (/group/:roomCode)               │
│                                                                     │
│  ┌────────────────────────┐  ┌──────────────────────────────────┐   │
│  │   MEMBERS SIDEBAR      │  │        LIVE SEAT GRID            │   │
│  │                        │  │                                  │   │
│  │  [Color] User A (Host) │  │  Seat Status Visuals:            │   │
│  │      Ready ✅          │  │  - Free (Black/Outline)          │   │
│  │                        │  │  - Occupied DB (Grayed Out)      │   │
│  │  [Color] User B        │  │  - Claimed by Me (Primary Glow)  │   │
│  │      Pending ⏳         │  │  - Claimed by Teammate (Color)   │   │
│  └────────────────────────┘  └──────────────────────────────────┘   │
│                                               │                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                        ACTION BAR                             │   │
│  │                                                               │   │
│  │  Member View:     [ ✅ I'm Ready ]                            │   │
│  │  Host View:       [ 💳 Checkout — Pay for All ]               │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow: Real-Time Lifecycle

```text
Host creates room on SeatLayout
    │  POST /api/group/create
    ▼
Redirect to /group/:roomCode
    │
    ▼
useGroupRoom() Hook initializes Centrifugo WebSocket
    │  Subscribes to channel: group:{roomCode}
    ▼
Friends join via URL link
    │  Prompted for Name → POST /api/group/:roomCode/join
    ▼
Seat Selection
    │  User B clicks seat A1
    │  POST /api/group/seats (Syncs to Redis)
    │  Broadcast: "SEAT_UPDATE" → Updates UI for all connected clients instantly
    ▼
Members signal readiness
    │  Click "I'm Ready"
    │  Broadcast: "MEMBER_READY"
    ▼
Host Checkout
    │  When all members are ready, Host clicks "Checkout"
    │  POST /api/group/checkout
    │  Broadcast: "CHECKOUT_READY" → Drops payment link into UI
    ▼
Host completes Stripe Payment; all seats booked.
```

## 🧩 Component Details

### GroupBooking.tsx
- **Role**: Visually maps the real-time websocket state to the Seat Grid.
- **State Control**: Receives real-time state payloads overriding local states. Assures no overlap via hard-coded teammate-blockers.
- **Member Limit**: Capped at 8 concurrent members to ensure manageable UI and optimal rendering.

### useGroupRoom.ts (Hook)
- **Role**: Wraps the `centrifuge-js` client SDK.
- **Responsibilities**:
  - Maintains active WebSocket connection to the Centrifugo service.
  - Automatically fetches fresh `JWT` connection and subscription tokens if they expire.
  - Recovers history payloads for members who join late.

## 📁 Files

```text
src/
├── pages/
│   └── GroupBooking.tsx      # Real-time interactive seat grid
│
├── hooks/
│   └── useGroupRoom.ts       # Centrifugo WebSocket management
│
└── App.tsx                   # Registers `/group/:roomCode`
```

## ✅ Implementation Status
- **✅ Real-Time Websocket Pub/Sub**: Event-driven UI updates across all clients.
- **✅ Dynamic Color Assignment**: Distinct visual highlighting per team member.
- **✅ History Recovery**: Centrifugo recovers missing events for dropped connections or late arrivals.
- **✅ Conflict Resolution**: Prevents overlapping seat grabs before processing.
- **✅ Consolidated Payment**: Escrows tickets securely and enforces single-point payment.
