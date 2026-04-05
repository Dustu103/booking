import { useEffect, useRef, useState, useCallback } from "react";
import { Centrifuge, Subscription } from "centrifuge";
import { useAppContext } from "../context/AppContext";

export interface RoomMember {
  userId: string;
  name: string;
  color: string;
  selectedSeats: string[];
  isReady: boolean;
}

export interface RoomState {
  roomCode: string;
  showId: string;
  createdBy: string;
  status: "waiting" | "selecting" | "checkout" | "completed";
  members: Record<string, RoomMember>;
}

export type GroupEvent =
  | { type: "MEMBER_JOINED"; member: RoomMember; members: Record<string, RoomMember> }
  | { type: "SEAT_UPDATE"; userId: string; color: string; selectedSeats: string[]; members: Record<string, RoomMember> }
  | { type: "MEMBER_READY"; userId: string; allReady: boolean; members: Record<string, RoomMember> }
  | { type: "CHECKOUT_READY"; paymentLink: string; allSeats: string[]; bookedBy: string };

interface UseGroupRoomOptions {
  channel: string;
  connectionToken: string;
  onEvent: (event: GroupEvent) => void;
}

const CENTRIFUGO_URL = import.meta.env.VITE_CENTRIFUGO_URL || "ws://localhost:8000/connection/websocket";

export const useGroupRoom = ({ channel, connectionToken, onEvent }: UseGroupRoomOptions) => {
  const { axios, getToken } = useAppContext();
  const centrifugeRef = useRef<Centrifuge | null>(null);
  const subRef = useRef<Subscription | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!connectionToken || !channel) return;

    const centrifuge = new Centrifuge(CENTRIFUGO_URL, {
      token: connectionToken,
      // Token refresh callback — hits /api/group/token endpoint
      getToken: async () => {
        const authToken = await getToken();
        const { data } = await axios.get("/api/group/token", {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        return data.token;
      },
    });

    centrifuge.on("connected", () => setConnected(true));
    centrifuge.on("disconnected", () => setConnected(false));

    const sub = centrifuge.newSubscription(channel, {
      // Replay history so late joiners catch up
      since: { epoch: "", offset: 0 },
      getToken: async () => {
        const authToken = await getToken();
        const { data } = await axios.get("/api/group/token", {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        // Re-request subscription token specifically for this channel
        const { data: subData } = await axios.post(
          "/api/group/sub-token",
          { channel },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        return subData.token;
      },
    });

    sub.on("publication", (ctx) => {
      onEvent(ctx.data as GroupEvent);
    });

    sub.subscribe();
    centrifuge.connect();

    centrifugeRef.current = centrifuge;
    subRef.current = sub;

    return () => {
      sub.unsubscribe();
      centrifuge.disconnect();
    };
  }, [channel, connectionToken]);

  const disconnect = useCallback(() => {
    subRef.current?.unsubscribe();
    centrifugeRef.current?.disconnect();
  }, []);

  return { connected, disconnect };
};
