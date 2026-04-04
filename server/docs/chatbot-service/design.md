# Chatbot Service — Design Documentation

## 🛠️ Overview
The Chatbot Service provides users with a persistent, AI-powered assistant named **Ari**. It leverages Google's **Gemini Flash** model to provide movie recommendations, booking assistance, and platform guidance while maintaining a strict project-specific context. This is a **logical domain** within the monolithic Express server — not a separate microservice.

## 🏗️ High-Level Architecture (HLD)
The architecture follows a standard client-server request-response pattern with an external AI inference layer.

```text
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT (React)                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐│
│  │ ChatBot Bubble   │  │ Chat Window UI   │  │ Message Hist ││
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘│
└───────────┼─────────────────────┼───────────────────┼────────┘
            │                     │                   │
            ▼                     ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                       SERVER (Node.js)                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐│
│  │ Express Router   │  │ Chat Controller  │  │ System Prompt││
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘│
└───────────┼─────────────────────┼───────────────────┼────────┘
            │                     │                   │
            ▼                     ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                       AI SERVICE Layer                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐│
│  │ Google Gemini    │  │ Strict Reasoning  │  │ Result Parse ││
│  │ (gemini-flash)   │  │ (Persona Guard)   │  │ (Text)       ││
│  └──────────────────┘  └──────────────────┘  └──────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## 📐 Low-Level Design (LLD)

### 1. Persona & Context Control (System Instruction)
The "heart" of the chatbot is the **System Instruction**. It enforces three primary layers of safety:

```typescript
// chatController.ts — System Instruction (server-side only)
const SYSTEM_INSTRUCTION = `
You are Ari, the MovieShine AI Assistant.
Your goal is to help users with:
- Movie recommendations based on their interests.
- Explaining how to book tickets on MovieShine.
- Providing information about movie showtimes.
- General questions about MovieShine features.

STRICT CONSTRAINTS:
1. ONLY answer questions related to MovieShine, movies, showtimes, and bookings.
2. If a user asks about ANYTHING ELSE → politely refuse.
3. Refusal message: "I am Ari, and I am only able to assist with
   MovieShine related inquiries."
4. Do not mention your underlying model (Gemini). You are Ari.
5. Be polite, helpful, and concise.
`;
```

**Constraint Layers**:

| Layer | Rule | Example Trigger |
|-------|------|-----------------|
| **Identity** | Responds as "Ari, MovieShine AI Assistant" | "Who are you?" → "I'm Ari..." |
| **Knowledge Boundary** | Only MovieShine, movies, showtimes, bookings | "What genres are available?" → ✅ |
| **Refusal Logic** | Refuse off-topic questions with standard message | "Solve 2+2" → ❌ Refused |
| **Model Concealment** | Never reveals Gemini as underlying engine | "What model are you?" → "I'm Ari..." |

### 2. Backend Orchestration

```typescript
// chatController.ts — Core Logic
const model = genAI.getGenerativeModel({
  model: "gemini-flash-latest",           // Low latency, high instruction compliance
  systemInstruction: SYSTEM_INSTRUCTION,   // Persona constraints (server-side only)
});

const chat = model.startChat({
  history: history || [],                  // Previous conversation turns from client
});

const result = await chat.sendMessage(message);  // Current user message
const text = result.response.text();
```

| Config | Value | Rationale |
|--------|-------|-----------|
| **Model** | `gemini-flash-latest` | Low latency for chat UX, strong instruction following |
| **System Prompt** | Server-side only | Client never sees the persona rules (security) |
| **Session** | Stateless | History is passed per request from the client |
| **SDK** | `@google/generative-ai` | Official Google SDK for Node.js |

### 3. Frontend Component (`ChatBot.tsx`)

**State Management**:

| State | Type | Purpose |
|-------|------|---------|
| `isOpen` | `boolean` | Toggle chat window visibility |
| `messages` | `Message[]` | Chat history (role + text) |
| `isLoading` | `boolean` | Show typing indicator |
| `input` | `string` | Current input field value |

**UI Architecture**:
- **Floating Bubble**: Fixed position (`bottom-right`) for global accessibility
- **Glassmorphism Window**: Uses `backdrop-blur-xl` and `bg-white/10` for premium aesthetic
- **Auto-scroll**: Scrolls to bottom on new messages
- **Loading Indicator**: Animated dots while waiting for AI response

---

## 🔄 Key Workflows

### 1. Conversational Flow
```text
User types message
    │
    ▼
React State: messages.push({ role: "user", text: message })
    │  isLoading = true
    ▼
POST /api/chat  →  { message, history }
    │
    ▼
Server: Construct Gemini prompt
    ├── systemInstruction (Strict Persona)
    ├── history (Previous exchanges)
    └── contents (New user message)
    │
    ▼
Gemini AI processes and returns text
    │
    ▼
React State: messages.push({ role: "model", text: response })
    │  isLoading = false
    │  scrollToBottom()
```

### 2. Strictness Validation (Filter)
- **Trigger**: User asks "Who won the World Cup?"
- **AI Action**: Matches the "Strict Constraints" in the system prompt
- **Response**: "I am Ari, and I am only able to assist with MovieShine related inquiries. How can I help you with your movie booking today?"

## 🔌 Infrastructure & Integrations

| Integration | Technology | Purpose |
|-------------|------------|---------|
| **AI Model** | Gemini Flash (latest) | Core LLM for natural language processing |
| **SDK** | `@google/generative-ai` | Official Google SDK for Node.js integration |
| **Styling** | Tailwind CSS v4 | Glassmorphism UI with responsive design |
| **Icons** | Lucide React | High-quality, consistent iconography for the UI |

---

## 📁 Directory Structure
```text
server/src/
├── controllers/
│   └── chatController.ts    # AI logic, persona enforcement, Gemini SDK
├── routes/
│   └── chatRoutes.ts        # POST /api/chat

client/src/
├── components/
│   └── ChatBot.tsx          # Floating UI widget, state management, API calls
└── App.tsx                  # Global registration of ChatBot component
```

## ✅ Implementation Status
- **✅ Basic Chat**: Integrated and functional with multi-turn history.
- **✅ Strict Persona**: Successfully refuses off-topic questions.
- **✅ Glassmorphism UI**: Polished and matches the MovieShine aesthetic.
- **🔄 RAG (Future)**: Connecting to the DB directly (Show/Booking models) for real-time data.
- **🔄 Authentication**: Linking chat sessions to `userId` for personalized booking help.

## ❓ Troubleshooting
- **AI Not Responding**: Verify `GEMINI_API_KEY` is valid and not rate-limited.
- **Off-Topic Responses**: Check that the `SYSTEM_INSTRUCTION` constant hasn't been modified.
- **CORS Error**: Ensure the client's origin is allowed in the server's CORS configuration.
- **Slow Responses**: Gemini Flash is optimized for speed; network latency is usually the bottleneck.

## 📖 Related Documentation
- [API Reference](api.md) — Complete endpoint documentation with request/response JSON
