# Chatbot Service — API Documentation

## 🔌 Overview
The Chatbot Service provides an AI-powered assistant named **Ari** that helps users with movie recommendations, booking guidance, and platform feature questions. Powered by Google Gemini with a strict persona layer.

- **Server**: `http://localhost:3000` (Monolithic Express)
- **Route Prefix**: `/api/chat`
- **Content-Type**: `application/json`

---

## 🔐 Authentication

The chatbot endpoint is **publicly accessible** — no JWT required. This allows the floating chat widget to be used by all visitors, including unauthenticated users.

---

## 🚀 Endpoints

### 1. Send Chat Message
**POST** `/api/chat`

**Description**: Sends a user message to the Ari AI assistant and returns a contextual response. Supports multi-turn conversation via the `history` parameter. The AI is strictly constrained to MovieShine-related topics only.

**Authentication**: Not required (Public)

**Request Body**:
```json
{
  "message": "What movies are playing right now?",
  "history": [
    {
      "role": "user",
      "parts": [{ "text": "Hello!" }]
    },
    {
      "role": "model",
      "parts": [{ "text": "Hi there! I'm Ari, the MovieShine AI Assistant. How can I help you with your movie booking today?" }]
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | `string` | ✅ | The user's current message |
| `history` | `ChatHistory[]` | ❌ | Previous conversation turns for context continuity |
| `history[].role` | `"user" \| "model"` | ✅ | Who sent the message |
| `history[].parts` | `{text: string}[]` | ✅ | Message content array |

**Success Response (200)**:
```json
{
  "success": true,
  "text": "You can browse the latest movies on our \"Now Playing\" section! Just head to the homepage and you'll see all currently available movies with showtimes. Would you like help booking a ticket?"
}
```

**Success Response — Off-Topic Refusal**:
```json
{
  "success": true,
  "text": "I am Ari, and I am only able to assist with MovieShine related inquiries. How can I help you with your movie booking today?"
}
```

**Error Response — Missing Message**:
```json
{
  "success": false,
  "message": "Message is required"
}
```
*(HTTP 400)*

**Error Response — AI Failure**:
```json
{
  "success": false,
  "message": "Failed to get response from AI"
}
```
*(HTTP 500)*

**cURL — Basic Message**:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How do I book a ticket?"}'
```

**cURL — With History (Multi-turn)**:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What about action movies?",
    "history": [
      {"role": "user", "parts": [{"text": "What genres do you recommend?"}]},
      {"role": "model", "parts": [{"text": "We have a great selection across all genres! Are you in the mood for action, comedy, sci-fi, or drama?"}]}
    ]
  }'
```

**cURL — Off-Topic Test (Strictness Check)**:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Who won the World Cup?"}'
# Expected: Refusal response from Ari
```

---

## 🤖 AI Configuration

### System Instruction (Persona)
The AI is configured with the following strict constraints:

| Rule | Description |
|------|-------------|
| **Identity** | Responds as "Ari, the MovieShine AI Assistant" |
| **Knowledge Boundary** | ONLY answers questions about MovieShine, movies, showtimes, and bookings |
| **Refusal Logic** | Politely refuses off-topic questions (math, coding, news, weather, etc.) |
| **Model Concealment** | Never reveals its underlying engine (Gemini) |
| **Style** | Polite, helpful, and concise |

### Model Configuration

| Setting | Value |
|---------|-------|
| Model | `gemini-flash-latest` |
| System Prompt | Custom MovieShine persona (server-side only) |
| Session | Stateless — history passed per request from client |

---

## 🚨 Error Handling

| Status Code | Scenario |
|-------------|----------|
| `200` | Success (AI response generated) |
| `400` | Missing `message` field in request body |
| `500` | Gemini API failure (rate limit, network, key invalid) |

---

## 🧪 Quick Test

```bash
# 1. Basic greeting
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'

# 2. Movie recommendation
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Recommend a good sci-fi movie"}'

# 3. Strictness validation (should be refused)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Write me a Python script"}'
```
