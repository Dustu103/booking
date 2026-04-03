# Chatbot Service — Design Documentation

## 🛠️ Overview
The Chatbot Service provides users with a persistent, AI-powered assistant named **Ari**. It leverages Google's **Gemini 1.5 Flash** model to provide movie recommendations, booking assistance, and platform guidance while maintaining a strict project-specific context.

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
│  │  Google Gemini   │  │ Strict Reasoning  │  │ Result Parse ││
│  │  (v1.5 Flash)    │  │ (Persona Guard)   │  │ (Markdown)   ││
│  └──────────────────┘  └──────────────────┘  └──────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## 📐 Low-Level Design (LLD)

### 1. Persona & Context Control (Strictness)
The "Heart" of the chatbot is the **System Instruction**. It enforces three primary layers of safety:
- **Identity**: Defines the bot as **Ari — MovieShine AI Assistant**.
- **Knowledge Boundary**: Explicitly limits knowledge to MovieShine features, movies, and booking logic.
- **Refusal Logic**: Commands the model to refuse off-topic questions (e.g., math, general news, programming).

### 2. Backend Orchestration
- **Controller**: `chatController.ts` handles the mapping of user requests to the AI SDK.
- **Model Configuration**: Uses `gemini-1.5-flash` for low latency and high accuracy in following system instructions.
- **Session Management**: Chat history is passed between client and server to maintain conversational context within a single session.

### 3. Frontend Component (`ChatBot.tsx`)
- **State Management**: Tracks `isOpen`, `messages`, and `isLoading`.
- **UI Architecture**:
    - **Floating Bubble**: Fixed position (`bottom-right`) for global accessibility.
    - **Glassmorphism Window**: Uses `backdrop-blur-xl` and `bg-white/10` to match the "MovieShine" aesthetic.
    - **Interactivity**: Auto-scroll to bottom, animated fade-ins, and loading indicators.

## 🔄 Key Workflows

### 1. Conversational Flow
1. User types a message in the `ChatBot` UI.
2. React state updates local messages and marks `isLoading = true`.
3. Client sends `POST /api/chat` with current message and message history.
4. Server constructs Gemini prompt with:
    - `systemInstruction` (Strict Project Context).
    - `history` (Previous exchange).
    - `contents` (New message).
5. AI processes and returns a text response.
6. Client updates chat history and scrolls to bottom.

### 2. Strictness Validation (Filter)
- **Trigger**: User asks "Who won the World Cup?".
- **AI Action**: Matches the "Strict Constraints" in the prompt.
- **Response**: "I am only able to assist with MovieShine related inquiries. How can I help you with your movie booking today?"

## 🔌 Infrastructure & Integrations

| Integration | Technology | Purpose |
|-------------|------------|---------|
| **AI Model** | Gemini 1.5 Flash | Core LLM for natural language processing. |
| **SDK** | `@google/generative-ai` | Official Google SDK for Node.js integration. |
| **Styling** | Tailwind CSS v4 | Rapid UI development with custom utility classes. |
| **Icons** | Lucide React | High-quality, consistent iconography for the UI. |

---

## 📁 Directory Structure
```text
server/src/
├── controllers/
│   └── chatController.ts    # AI Logic & Persona enforcement
├── routes/
│   └── chatRoutes.ts        # Endpoint: POST /api/chat
client/src/
├── components/
│   └── ChatBot.tsx          # Floating UI & State management
└── App.tsx                  # Global registration layer
```

## ✅ Implementation Status
- **✅ Basic Chat**: Integrated and functional.
- **✅ Strict Persona**: Refuses off-topic questions.
- **✅ Glassmorphism UI**: Polished and matches the main app.
- **🔄 RAG (Future)**: Potentially connecting to the DB directly (Show/Booking models).
- **🔄 Authentication**: Linking chat sessions to `userId` for personalized booking help.
