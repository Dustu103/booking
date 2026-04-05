import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import {
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  WifiIcon,
  WifiOffIcon,
  CopyIcon,
  ArrowRightIcon,
  RefreshCwIcon,
} from "lucide-react";
import BlurCircle from "../components/BlurCircle";
import { useGroupRoom, RoomMember, RoomState, GroupEvent } from "../hooks/useGroupRoom";

const SeatButton: React.FC<{
  seatId: string;
  isSelected: boolean;
  isOccupied: boolean;
  ownerColor?: string;
  isMySelection: boolean;
  disabled: boolean;
  onClick: () => void;
}> = ({ seatId, isSelected, isOccupied, ownerColor, isMySelection, disabled, onClick }) => (
  <button
    onClick={onClick}
    disabled={disabled || isOccupied}
    style={isSelected && ownerColor ? { backgroundColor: ownerColor + "33", borderColor: ownerColor } : {}}
    title={isOccupied ? "Already booked" : isSelected ? `Seat held${!isMySelection ? " by teammate" : ""}` : seatId}
    className={`h-9 w-9 rounded-lg border text-[10px] font-black uppercase transition-all duration-200 flex items-center justify-center ${
      isOccupied
        ? "bg-white/5 border-white/10 text-white/10 cursor-not-allowed grayscale"
        : isSelected && isMySelection
        ? "scale-110 shadow-lg text-white"
        : isSelected
        ? "opacity-80 text-white cursor-not-allowed"
        : "bg-black/40 border-white/20 text-white/40 hover:border-primary/60 hover:text-primary hover:bg-primary/5 cursor-pointer"
    }`}
  >
    {seatId}
  </button>
);

const GroupBooking: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { axios, getToken, user } = useAppContext();

  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [connectionToken, setConnectionToken] = useState("");
  const [channel, setChannel] = useState("");
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [joiningName, setJoiningName] = useState("");
  const [viewMode, setViewMode] = useState<"join" | "room">("join");

  const currentUserId = (user as any)?.id || "";

  const groupRows = [
    ["A", "B"],
    ["C", "D"],
    ["E", "F"],
    ["G", "H"],
    ["I", "J"],
  ];

  // Fetch occupied seats from backend
  const fetchOccupied = useCallback(async (showId: string) => {
    try {
      const token = await getToken();
      const { data } = await axios.get(`/api/booking/occupied-seats/${showId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setOccupiedSeats(data.occupiedSeats || []);
    } catch { /* non-critical */ }
  }, [axios, getToken]);

  // Handle real-time events from Centrifugo
  const handleGroupEvent = useCallback((event: GroupEvent) => {
    if (event.type === "MEMBER_JOINED" || event.type === "SEAT_UPDATE" || event.type === "MEMBER_READY") {
      setRoomState((prev) => prev ? { ...prev, members: event.members } : prev);
    }
    if (event.type === "MEMBER_JOINED") {
      toast.success(`${event.member.name} joined the room!`);
    }
    if (event.type === "MEMBER_READY") {
      toast(`${event.members[event.userId]?.name} is ready!`, { icon: "✅" });
      if (event.allReady) toast.success("Everyone is ready! Host can now checkout.", { duration: 5000 });
    }
    if (event.type === "CHECKOUT_READY") {
      toast.success("Host completed checkout! Redirecting to payment...", { duration: 4000 });
      setCheckoutUrl(event.paymentLink);
      setTimeout(() => window.open(event.paymentLink, "_blank"), 2000);
    }
  }, []);

  const { connected } = useGroupRoom({
    channel,
    connectionToken,
    onEvent: handleGroupEvent,
  });

  // Join or create the room
  const joinRoom = async () => {
    if (!joiningName.trim()) return toast.error("Please enter your name.");
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await axios.post(
        `/api/group/${roomCode}/join`,
        { userName: joiningName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!data.success) return toast.error(data.message);

      setRoomState(data.roomState);
      setConnectionToken(data.connectionToken);
      setChannel(data.channel);
      setIsHost(data.roomState.createdBy === currentUserId);
      await fetchOccupied(data.roomState.showId);
      setViewMode("room");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is already in the room (page refresh recovery)
  useEffect(() => {
    const init = async () => {
      try {
        const token = await getToken();
        const { data } = await axios.get(`/api/group/${roomCode}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success && data.roomState.members[currentUserId]) {
          // Re-join to get fresh tokens
          const joinRes = await axios.post(
            `/api/group/${roomCode}/join`,
            { userName: data.roomState.members[currentUserId]?.name },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (joinRes.data.success) {
            setRoomState(joinRes.data.roomState);
            setConnectionToken(joinRes.data.connectionToken);
            setChannel(joinRes.data.channel);
            setIsHost(joinRes.data.roomState.createdBy === currentUserId);
            await fetchOccupied(joinRes.data.roomState.showId);
            setViewMode("room");
          }
        }
      } catch { /* user not in room yet — show join form */ }
      finally { setLoading(false); }
    };
    if (user) init();
  }, [user, roomCode]);

  // Update my seat selection
  const handleSeatClick = async (seatId: string) => {
    if (!roomState) return;
    const myMember = roomState.members[currentUserId];
    if (!myMember) return;

    const otherSeats = Object.values(roomState.members)
      .filter((m) => m.userId !== currentUserId)
      .flatMap((m) => m.selectedSeats);

    if (otherSeats.includes(seatId)) return toast.error("That seat is held by a teammate.");

    const newSeats = myMember.selectedSeats.includes(seatId)
      ? myMember.selectedSeats.filter((s) => s !== seatId)
      : [...myMember.selectedSeats, seatId];

    // Optimistic update
    setRoomState((prev) =>
      prev ? { ...prev, members: { ...prev.members, [currentUserId]: { ...prev.members[currentUserId], selectedSeats: newSeats } } } : prev
    );

    try {
      const token = await getToken();
      await axios.post(
        `/api/group/${roomCode}/seats`,
        { selectedSeats: newSeats },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch { toast.error("Failed to update seat."); }
  };

  const handleReady = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.post(`/api/group/${roomCode}/ready`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setIsReady(true);
        toast.success("You're marked as ready!");
      }
    } catch (e: any) { toast.error(e.message); }
  };

  const handleCheckout = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.post(`/api/group/${roomCode}/checkout`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        window.open(data.paymentLink, "_blank");
      } else {
        toast.error(data.message);
      }
    } catch (e: any) { toast.error(e.message); }
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/group/${roomCode}`;
    navigator.clipboard.writeText(link);
    toast.success("Room link copied!");
  };

  // Flatten all seat selections for rendering
  const allSeatOwners: Record<string, { color: string; isMe: boolean }> = {};
  if (roomState) {
    Object.values(roomState.members).forEach((m) => {
      m.selectedSeats.forEach((s) => {
        allSeatOwners[s] = { color: m.color, isMe: m.userId === currentUserId };
      });
    });
  }

  const allReady = roomState
    ? Object.values(roomState.members).every((m) => m.isReady) && Object.keys(roomState.members).length > 1
    : false;

  // Join form
  if (viewMode === "join" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <BlurCircle top="30%" left="-100px" size="300" />
        <div className="bg-white/5 border border-white/10 rounded-[40px] p-12 w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <UsersIcon className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Join Room</h1>
          <p className="text-gray-500 text-sm mb-8">
            Room <span className="text-primary font-mono font-bold">{roomCode}</span> — pick your seats together!
          </p>
          {loading ? (
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                value={joiningName}
                onChange={(e) => setJoiningName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                placeholder="Your name (e.g. Arjun 🎬)"
                className="w-full bg-black/40 border border-white/10 focus:border-primary outline-none rounded-2xl py-4 px-6 text-white font-bold transition-all placeholder:text-gray-700 text-center"
              />
              <button
                onClick={joinRoom}
                className="w-full py-4 bg-primary hover:bg-white text-black font-black uppercase tracking-widest text-sm rounded-2xl transition-all active:scale-95"
              >
                Enter Room →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 md:px-10 lg:px-16 pt-28 pb-20">
      <BlurCircle top="100px" left="-100px" size="350" />
      <BlurCircle bottom="10%" right="-80px" size="250" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              {connected ? "Live" : "Connecting..."}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
              Room {roomCode}
            </span>
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Group Booking</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={copyRoomLink}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 hover:border-white/30 text-white text-xs font-black uppercase rounded-full transition-all"
          >
            <CopyIcon className="w-3.5 h-3.5" /> Invite Link
          </button>
          {checkoutUrl && (
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-white text-black text-xs font-black uppercase rounded-full transition-all"
            >
              Pay Now <ArrowRightIcon className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Members sidebar */}
        <div className="xl:w-64 flex-shrink-0 space-y-3">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">
            Members ({Object.keys(roomState?.members || {}).length}/8)
          </h2>
          {Object.values(roomState?.members || {}).map((m) => (
            <div
              key={m.userId}
              className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl"
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: m.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-black truncate">
                  {m.name} {m.userId === currentUserId && <span className="text-primary">(you)</span>}
                  {m.userId === roomState?.createdBy && <span className="text-yellow-400 ml-1">👑</span>}
                </p>
                <p className="text-gray-600 text-[10px] font-bold">
                  {m.selectedSeats.length > 0 ? m.selectedSeats.join(", ") : "No seats yet"}
                </p>
              </div>
              {m.isReady ? (
                <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
              ) : (
                <ClockIcon className="w-4 h-4 text-gray-600 flex-shrink-0" />
              )}
            </div>
          ))}

          {/* Legend */}
          <div className="pt-4 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Seat Colors</p>
            {Object.values(roomState?.members || {}).map((m) => (
              <div key={m.userId} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: m.color + "66", border: `1px solid ${m.color}` }} />
                <span className="text-[10px] text-gray-500 font-bold truncate">{m.name}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-1">
              <div className="w-3 h-3 rounded-sm bg-white/5 border border-white/10 opacity-30" />
              <span className="text-[10px] text-gray-600 font-bold">Occupied</span>
            </div>
          </div>
        </div>

        {/* Seat grid */}
        <div className="flex-1">
          {/* Screen */}
          <div className="relative w-full max-w-3xl mx-auto mb-10">
            <div className="h-2 bg-gradient-to-r from-transparent via-primary/60 to-transparent rounded-full mb-2" />
            <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Screen This Way</p>
          </div>

          <div className="flex flex-col items-center gap-4 max-w-3xl mx-auto">
            {groupRows.map((rowPair) => (
              <div key={rowPair.join("")} className="flex gap-6 md:gap-10">
                {rowPair.map((row) => (
                  <div key={row} className="flex flex-wrap gap-2">
                    {Array.from({ length: 9 }, (_, i) => {
                      const seatId = `${row}${i + 1}`;
                      const isOccupied = occupiedSeats.includes(seatId);
                      const owner = allSeatOwners[seatId];
                      const isSelected = !!owner;
                      const isMySelection = owner?.isMe ?? false;

                      return (
                        <SeatButton
                          key={seatId}
                          seatId={seatId}
                          isSelected={isSelected}
                          isOccupied={isOccupied}
                          ownerColor={owner?.color}
                          isMySelection={isMySelection}
                          disabled={!isMySelection && isSelected}
                          onClick={() => handleSeatClick(seatId)}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Action bar */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center max-w-lg mx-auto">
            {!isReady && (
              <button
                onClick={handleReady}
                disabled={!roomState?.members[currentUserId]?.selectedSeats.length}
                className="flex-1 py-4 bg-green-500/20 border border-green-500/40 text-green-400 font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-green-500/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ✅ I'm Ready
              </button>
            )}
            {isReady && !isHost && (
              <div className="flex-1 py-4 bg-green-500/10 border border-green-500/20 text-green-500 font-black uppercase tracking-widest text-sm rounded-2xl text-center">
                ✅ Waiting for host to checkout...
              </div>
            )}
            {isHost && (
              <button
                onClick={handleCheckout}
                disabled={!allReady}
                className="flex-1 py-4 bg-primary hover:bg-white text-black font-black uppercase tracking-widest text-sm rounded-2xl transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-2xl shadow-primary/20"
              >
                {allReady ? "💳 Checkout — Pay for All" : `Waiting for everyone... (${Object.values(roomState?.members || {}).filter(m => m.isReady).length}/${Object.keys(roomState?.members || {}).length} ready)`}
              </button>
            )}
          </div>

          <p className="text-center text-gray-700 text-[10px] font-bold uppercase tracking-widest mt-4">
            Host pays for all tickets in one checkout
          </p>
        </div>
      </div>
    </div>
  );
};

export default GroupBooking;
