import mongoose, { Document, Model, Types } from "mongoose";

export interface IGroupRoom extends Document {
  _id: Types.ObjectId;
  roomCode: string;
  showId: string;
  createdBy: string;
  status: "waiting" | "selecting" | "checkout" | "completed";
  bookedSeats: string[];       // final confirmed seat list
  bookingId?: string;          // linked Booking._id after checkout
  paymentLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

const groupRoomSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true, unique: true, index: true },
    showId: { type: String, required: true, ref: "Show" },
    createdBy: { type: String, required: true },
    status: {
      type: String,
      enum: ["waiting", "selecting", "checkout", "completed"],
      default: "waiting",
    },
    bookedSeats: { type: [String], default: [] },
    bookingId: { type: String },
    paymentLink: { type: String },
  },
  { timestamps: true }
);

const GroupRoom: Model<IGroupRoom> = mongoose.model<IGroupRoom>("GroupRoom", groupRoomSchema);

export default GroupRoom;
