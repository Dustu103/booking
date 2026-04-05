import jwt from "jsonwebtoken";
import axios from "axios";

const CENTRIFUGO_API_URL = process.env.CENTRIFUGO_API_URL || "http://localhost:8000";
const CENTRIFUGO_API_KEY = process.env.CENTRIFUGO_API_KEY || "centrifugo-api-key-change-in-production";
const CENTRIFUGO_TOKEN_SECRET = process.env.CENTRIFUGO_TOKEN_SECRET || "centrifugo-secret-change-in-production";

// ─── Generate connection token for a user ──────────────────────────────────
// The frontend passes this token to Centrifugo when connecting via WebSocket.
export const generateConnectionToken = (userId: string): string => {
  return jwt.sign(
    {
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + 30 * 60, // 30 min
    },
    CENTRIFUGO_TOKEN_SECRET
  );
};

// ─── Generate subscription token for a channel ────────────────────────────
// Required so only users who joined via the backend can subscribe to the channel.
export const generateSubscriptionToken = (userId: string, channel: string): string => {
  return jwt.sign(
    {
      sub: userId,
      channel,
      exp: Math.floor(Date.now() / 1000) + 30 * 60,
    },
    CENTRIFUGO_TOKEN_SECRET
  );
};

// ─── Publish an event to a Centrifugo channel ─────────────────────────────
export const publishToChannel = async (channel: string, data: object): Promise<void> => {
  try {
    await axios.post(
      `${CENTRIFUGO_API_URL}/api/publish`,
      { channel, data },
      {
        headers: {
          "Authorization": `apikey ${CENTRIFUGO_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error(`Centrifugo publish error [${channel}]:`, error.message);
  }
};

// ─── Channel name helper ───────────────────────────────────────────────────
export const groupChannel = (roomCode: string) => `group:${roomCode}`;
