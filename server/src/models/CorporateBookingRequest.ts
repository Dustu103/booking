import mongoose, { Document, Model, Types } from "mongoose";

export interface ICorporateBookingRequest extends Document {
  _id: Types.ObjectId;
  corporateAccountId: Types.ObjectId;
  requestedBy: string;
  show: string;
  selectedSeats: string[];
  status: "pending" | "approved" | "rejected" | "paid";
  approvedBy?: string;
  amount: number;
  gstAmount: number;
  paymentLink?: string;
  invoiceHtml?: string;
  createdAt: Date;
  updatedAt: Date;
}

const corporateBookingRequestSchema = new mongoose.Schema(
  {
    corporateAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CorporateAccount",
      required: true,
    },
    requestedBy: { type: String, required: true },   // employee Clerk userId
    show: { type: String, required: true, ref: "Show" },
    selectedSeats: { type: [String], required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "paid"],
      default: "pending",
    },
    approvedBy: { type: String },                    // manager Clerk userId
    amount: { type: Number, required: true },        // base amount (seats × price)
    gstAmount: { type: Number, required: true },     // 18% GST
    paymentLink: { type: String },
    invoiceHtml: { type: String },                   // server-rendered HTML invoice
  },
  { timestamps: true }
);

const CorporateBookingRequest: Model<ICorporateBookingRequest> =
  mongoose.model<ICorporateBookingRequest>(
    "CorporateBookingRequest",
    corporateBookingRequestSchema
  );

export default CorporateBookingRequest;
