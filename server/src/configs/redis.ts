import { Redis } from "ioredis";

// Singleton Redis client — shared across all server modules
let redisClient: Redis | null = null;

export const getRedis = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      retryStrategy: (times) => Math.min(times * 50, 2000),
      lazyConnect: true,
    });

    redisClient.on("connect", () => console.log("✅ Redis connected"));
    redisClient.on("error", (err) => console.error("❌ Redis error:", err.message));
  }
  return redisClient;
};

// ─── Group Room Redis helpers ──────────────────────────────────────────────

export interface RoomMember {
  userId: string;
  name: string;
  color: string;   // assigned color for seat highlight
  selectedSeats: string[];
  isReady: boolean;
}

export interface RoomState {
  roomCode: string;
  showId: string;
  createdBy: string;
  status: "waiting" | "selecting" | "checkout" | "completed";
  members: Record<string, RoomMember>; // keyed by userId
}

const ROOM_TTL_SECONDS = 30 * 60; // 30 minutes

// Predefined distinct seat-selection colors for up to 8 members
export const MEMBER_COLORS = [
  "#7c3aed", // primary purple
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f43f5e", // rose
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#84cc16", // lime
];

export const roomKey = (code: string) => `group_room:${code}`;

export const saveRoomState = async (state: RoomState): Promise<void> => {
  const redis = getRedis();
  await redis.setex(roomKey(state.roomCode), ROOM_TTL_SECONDS, JSON.stringify(state));
};

export const getRoomState = async (code: string): Promise<RoomState | null> => {
  const redis = getRedis();
  const raw = await redis.get(roomKey(code));
  return raw ? (JSON.parse(raw) as RoomState) : null;
};

export const deleteRoomState = async (code: string): Promise<void> => {
  const redis = getRedis();
  await redis.del(roomKey(code));
};

export const refreshRoomTTL = async (code: string): Promise<void> => {
  const redis = getRedis();
  await redis.expire(roomKey(code), ROOM_TTL_SECONDS);
};
