# ChatBot Domain — Frontend Service Documentation

## 🛠️ Overview
The ChatBot domain provides a floating AI assistant named **Ari** that is available on all public-facing pages. It offers movie recommendations, booking help, and platform feature guidance. The widget uses a glassmorphism design language and maintains a multi-turn conversation via client-side state.

## 🏗️ Component Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                      ChatBot.tsx (Global Widget)                │
│                                                                 │
│  STATE: isOpen = false                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  CHAT BUBBLE (Fixed Bottom-Right)                       │   │
│  │  ┌──────────┐                                           │   │
│  │  │ 💬 Icon  │  ← Click toggles isOpen                  │   │
│  │  └──────────┘                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  STATE: isOpen = true                                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  CHAT WINDOW (Glassmorphism Panel)                       │  │
│  │  ┌──────────────────────────────────────────────────┐    │  │
│  │  │  Header: "Ari — MovieShine AI"    [X Close]      │    │  │
│  │  ├──────────────────────────────────────────────────┤    │  │
│  │  │  MESSAGE LIST (scrollable)                        │    │  │
│  │  │                                                    │    │  │
│  │  │  ┌─ Model ──────────────────────────────┐         │    │  │
│  │  │  │ Hi! I'm Ari. How can I help you?    │         │    │  │
│  │  │  └─────────────────────────────────────┘         │    │  │
│  │  │                                                    │    │  │
│  │  │              ┌─── User ─────────────────┐         │    │  │
│  │  │              │ What movies are playing?  │         │    │  │
│  │  │              └──────────────────────────┘         │    │  │
│  │  │                                                    │    │  │
│  │  │  ┌─ Model ──────────────────────────────┐         │    │  │
│  │  │  │ Check our "Now Playing" section!     │         │    │  │
│  │  │  └─────────────────────────────────────┘         │    │  │
│  │  │                                                    │    │  │
│  │  │  ┌─ Loading ────────────────────────────┐         │    │  │
│  │  │  │ ● ● ●  (typing indicator)            │         │    │  │
│  │  │  └─────────────────────────────────────┘         │    │  │
│  │  ├──────────────────────────────────────────────────┤    │  │
│  │  │  INPUT BAR:  [Type a message...] [Send ➤]        │    │  │
│  │  └──────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Data Flow

```text
User types message → clicks Send / presses Enter
    │
    ▼
State: messages.push({ role: "user", text: input })
    │  isLoading = true
    │  Auto-scroll to bottom
    ▼
POST /api/chat
    │  Body: {
    │    message: "current user message",
    │    history: [
    │      { role: "user", parts: [{ text: "previous msg" }] },
    │      { role: "model", parts: [{ text: "previous response" }] }
    │    ]
    │  }
    ▼
Server processes via Gemini Flash
    │  Returns: { success: true, text: "AI response" }
    ▼
State: messages.push({ role: "model", text: response })
    │  isLoading = false
    │  Auto-scroll to bottom
```

## 🧩 Component Details

### ChatBot.tsx

**State Management**:

| State | Type | Default | Purpose |
|-------|------|---------|---------|
| `isOpen` | `boolean` | `false` | Toggle chat window visibility |
| `messages` | `Message[]` | `[]` | Full conversation history |
| `isLoading` | `boolean` | `false` | Show typing indicator |
| `input` | `string` | `""` | Current input field value |

**Message Type**:
```typescript
interface Message {
  role: "user" | "model";
  text: string;
}
```

**History Conversion**: Before sending to the API, client-side `messages` are converted to Gemini's expected format:
```typescript
const history = messages.map(msg => ({
  role: msg.role,
  parts: [{ text: msg.text }]
}));
```

**Key Features**:

| Feature | Implementation |
|---------|----------------|
| **Floating Bubble** | `fixed bottom-6 right-6 z-50` positioned button |
| **Glassmorphism** | `bg-white/10 backdrop-blur-xl border border-white/20` |
| **Auto-scroll** | `useRef` + `scrollIntoView({ behavior: "smooth" })` |
| **Loading Dots** | Animated `●●●` pulse while waiting for AI |
| **Enter to Send** | `onKeyDown` handler checks `Enter` key |
| **Visibility** | Only renders on public routes (`!isAdminRoute`) |

---

## 🎨 Design Language

| Element | Style |
|---------|-------|
| Window | `max-w-md w-full max-h-[500px]` rounded-2xl |
| User Messages | `bg-primary/80 text-white` aligned right |
| AI Messages | `bg-white/10 text-white` aligned left |
| Input Bar | `bg-white/5 border-white/10` with send button |
| Bubble Icon | Lucide `MessageCircle` icon with primary color |

---

## 📁 Files

```text
src/
├── components/
│   └── ChatBot.tsx        # Complete floating widget (self-contained)
│
└── App.tsx                # Registers ChatBot globally (non-admin routes)
```

## ✅ Implementation Status
- **✅ Floating Widget**: Persistent bubble on all public pages
- **✅ Multi-turn Chat**: Conversation history maintained in local state
- **✅ Glassmorphism UI**: Premium dark-mode aesthetic
- **✅ Typing Indicator**: Animated loading dots
- **✅ Auto-scroll**: Smooth scroll to latest message
- **✅ Keyboard Support**: Enter key sends message
- **🔄 Markdown Rendering**: (Future) Parse AI responses with formatting
- **🔄 Persistent History**: (Future) Save conversation to localStorage

## ❓ Troubleshooting
- **Widget not showing**: Only renders on non-admin routes — check URL path
- **AI not responding**: Verify `GEMINI_API_KEY` is set in `server/.env`
- **Slow responses**: Gemini Flash is optimized; network latency is usually the bottleneck
- **Off-topic answers**: Check that the server's `SYSTEM_INSTRUCTION` hasn't been altered
