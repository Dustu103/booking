import { Request, Response } from "express";
import crypto from "crypto";
import Stripe from "stripe";
import GroupRoom from "../models/GroupRoom.js";
import Show from "../models/Show.js";
import Booking from "../models/Booking.js";
import {
  getRoomState,
  saveRoomState,
  deleteRoomState,
  refreshRoomTTL,
  MEMBER_COLORS,
  RoomState,
  RoomMember,
} from "../configs/redis.js";
import {
  generateConnectionToken,
  generateSubscriptionToken,
  publishToChannel,
  groupChannel,
} from "../configs/centrifugo.js";
import { IShow, IMovie } from "../types/index.js";

// ─── Auth helper — Clerk userId is typed as string | string[] but is always string ──
const getAuthUserId = (req: Request): string | null => {
  const uid = (req as any).auth?.userId;
  if (!uid) return null;
  return String(uid);
};

// ─── Generate a short unique room code ─────────────────────────────────────
const generateRoomCode = (): string =>
  crypto.randomBytes(3).toString("hex").toUpperCase();


// ─── POST /api/group/create ────────────────────────────────────────────────
export const createGroupRoom = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { showId, userName } = req.body;
    if (!showId) return res.json({ success: false, message: "showId is required." });

    const show = await Show.findById(showId);
    if (!show) return res.json({ success: false, message: "Show not found." });

    // Generate unique room code (retry on collision)
    let roomCode = generateRoomCode();
    while (await GroupRoom.findOne({ roomCode })) {
      roomCode = generateRoomCode();
    }

    // Persist room to MongoDB
    await GroupRoom.create({ roomCode, showId, createdBy: userId, status: "waiting" });

    // Initialise Redis room state
    const hostMember: RoomMember = {
      userId,
      name: userName || "Host",
      color: MEMBER_COLORS[0],
      selectedSeats: [],
      isReady: false,
    };

    const roomState: RoomState = {
      roomCode,
      showId,
      createdBy: userId,
      status: "waiting",
      members: { [userId]: hostMember },
    };
    await saveRoomState(roomState);

    // Issue Centrifugo tokens for this user
    const connectionToken = generateConnectionToken(userId);
    const subscriptionToken = generateSubscriptionToken(userId, groupChannel(roomCode));

    res.json({
      success: true,
      roomCode,
      connectionToken,
      subscriptionToken,
      channel: groupChannel(roomCode),
    });
  } catch (error: any) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// ─── POST /api/group/:roomCode/join ───────────────────────────────────────
export const joinGroupRoom = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const roomCode = String(req.params.roomCode);
    const { userName } = req.body;

    const roomState = await getRoomState(roomCode);
    if (!roomState) return res.json({ success: false, message: "Room not found or expired." });

    if (roomState.status === "completed" || roomState.status === "checkout") {
      return res.json({ success: false, message: "This room is no longer accepting new members." });
    }

    const memberCount = Object.keys(roomState.members).length;
    if (memberCount >= 8) {
      return res.json({ success: false, message: "Room is full (max 8 members)." });
    }

    // Add member if not already in room
    if (!roomState.members[userId]) {
      const newMember: RoomMember = {
        userId,
        name: userName || `Member ${memberCount + 1}`,
        color: MEMBER_COLORS[memberCount % MEMBER_COLORS.length],
        selectedSeats: [],
        isReady: false,
      };
      roomState.members[userId] = newMember;
      roomState.status = "selecting";
      await saveRoomState(roomState);

      // Notify all members that someone joined
      await publishToChannel(groupChannel(roomCode), {
        type: "MEMBER_JOINED",
        member: newMember,
        members: roomState.members,
      });
    }

    const connectionToken = generateConnectionToken(userId);
    const subscriptionToken = generateSubscriptionToken(userId, groupChannel(roomCode));

    res.json({
      success: true,
      roomState,
      connectionToken,
      subscriptionToken,
      channel: groupChannel(roomCode),
    });
  } catch (error: any) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// ─── GET /api/group/:roomCode ─────────────────────────────────────────────
export const getGroupRoom = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const roomCode = String(req.params.roomCode);
    const roomState = await getRoomState(roomCode);
    if (!roomState) return res.json({ success: false, message: "Room not found or expired." });

    await refreshRoomTTL(roomCode);
    res.json({ success: true, roomState });
  } catch (error: any) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// ─── POST /api/group/:roomCode/seats ─────────────────────────────────────
// Called when a member selects or deselects a seat
export const updateSeatSelection = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const roomCode = String(req.params.roomCode);
    const { selectedSeats } = req.body; // full current selection for this user

    const roomState = await getRoomState(roomCode);
    if (!roomState) return res.json({ success: false, message: "Room not found or expired." });
    if (!roomState.members[userId]) return res.json({ success: false, message: "You are not in this room." });

    // Check no seat is claimed by another member
    const allOtherSeats = Object.entries(roomState.members)
      .filter(([uid]) => uid !== userId)
      .flatMap(([, m]) => m.selectedSeats);

    const conflict = selectedSeats.find((s: string) => allOtherSeats.includes(s));
    if (conflict) {
      return res.json({ success: false, message: `Seat ${conflict} is already selected by another member.` });
    }

    // Update this member's selection
    roomState.members[userId].selectedSeats = selectedSeats;
    await saveRoomState(roomState);

    // Broadcast to all members via Centrifugo
    await publishToChannel(groupChannel(roomCode), {
      type: "SEAT_UPDATE",
      userId,
      color: roomState.members[userId].color,
      selectedSeats,
      members: roomState.members,
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// ─── POST /api/group/:roomCode/ready ─────────────────────────────────────
export const markReady = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const roomCode = String(req.params.roomCode);
    const roomState = await getRoomState(roomCode);
    if (!roomState) return res.json({ success: false, message: "Room not found or expired." });
    if (!roomState.members[userId]) return res.json({ success: false, message: "You are not in this room." });

    roomState.members[userId].isReady = true;
    await saveRoomState(roomState);

    const allReady = Object.values(roomState.members).every((m) => m.isReady);

    await publishToChannel(groupChannel(roomCode), {
      type: "MEMBER_READY",
      userId,
      allReady,
      members: roomState.members,
    });

    res.json({ success: true, allReady });
  } catch (error: any) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// ─── POST /api/group/:roomCode/checkout ──────────────────────────────────
// Host triggers checkout — collects all members' seats, creates one booking, one payment
export const checkoutGroupRoom = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const roomCode = String(req.params.roomCode);
    const origin = req.get("origin") as string;

    const roomState = await getRoomState(roomCode);
    if (!roomState) return res.json({ success: false, message: "Room not found or expired." });
    if (roomState.createdBy !== userId) {
      return res.json({ success: false, message: "Only the room host can trigger checkout." });
    }

    // Gather all seats across all members
    const allSeats = Object.values(roomState.members).flatMap((m) => m.selectedSeats);
    if (allSeats.length === 0) {
      return res.json({ success: false, message: "No seats selected by any member." });
    }

    // Verify seats still available
    const show = (await Show.findById(roomState.showId).populate("movie")) as (IShow & { movie: IMovie }) | null;
    if (!show) return res.json({ success: false, message: "Show not found." });

    const conflictSeat = allSeats.find((s) => show.occupiedSeats[s]);
    if (conflictSeat) {
      return res.json({ success: false, message: `Seat ${conflictSeat} was just booked by another user. Please re-select.` });
    }

    // Create the booking (host pays for all)
    const totalAmount = show.showPrice * allSeats.length;
    const booking = await Booking.create({
      user: userId,
      show: roomState.showId,
      amount: totalAmount,
      bookedSeats: allSeats,
      isPaid: false,
    });

    // Mark seats as occupied
    allSeats.forEach((seat) => { show.occupiedSeats[seat] = userId; });
    show.markModified("occupiedSeats");
    await show.save();

    // Create Stripe checkout session
    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY as string);
    const productName: string = `[Group Room ${roomCode}] ${show.movie.title} - ${allSeats.length} seats`;
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: "usd",
          product_data: { name: productName },
          unit_amount: Math.floor(totalAmount) * 100,
        },
        quantity: 1,
      },
    ];

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      success_url: `${origin}/loading/my-bookings`,
      cancel_url: `${origin}/group/${roomCode}`,
      line_items,
      mode: "payment",
      metadata: { bookingId: String(booking._id) },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    };

    const session = await stripeInstance.checkout.sessions.create(sessionParams);
    booking.paymentLink = session.url || "";
    await booking.save();

    // Persist final state to MongoDB
    roomState.status = "checkout";
    await saveRoomState(roomState);
    await GroupRoom.findOneAndUpdate(
      { roomCode },
      { status: "checkout", bookedSeats: allSeats, bookingId: String(booking._id), paymentLink: session.url }
    );

    // Broadcast checkout event so all members see the payment link
    await publishToChannel(groupChannel(roomCode), {
      type: "CHECKOUT_READY",
      paymentLink: session.url,
      allSeats,
      bookedBy: userId,
    });

    // Clean up Redis room state
    await deleteRoomState(roomCode);

    res.json({ success: true, paymentLink: session.url, allSeats });
  } catch (error: any) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// ─── GET /api/group/token ──────────────────────────────────────────────────
// Returns fresh Centrifugo connection token for the current user
export const getCentrifugoToken = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const connectionToken = generateConnectionToken(userId);
    res.json({ success: true, token: connectionToken });
  } catch (error: any) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
