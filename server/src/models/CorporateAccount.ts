import mongoose, { Document, Model, Types } from "mongoose";

export interface ICorporateAccount extends Document {
  _id: Types.ObjectId;
  name: string;
  gstNumber: string;
  adminUserId: string;
  members: string[];
  approvalRequired: boolean;
  totalBookingsValue: number;
  createdAt: Date;
  updatedAt: Date;
}

const corporateAccountSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    gstNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    adminUserId: { type: String, required: true },       // Clerk userId of account owner
    members: { type: [String], default: [] },            // Clerk userIds of team members
    approvalRequired: { type: Boolean, default: true },  // Manager must approve before payment
    totalBookingsValue: { type: Number, default: 0 },    // Running total
  },
  { timestamps: true }
);

const CorporateAccount: Model<ICorporateAccount> = mongoose.model<ICorporateAccount>(
  "CorporateAccount",
  corporateAccountSchema
);

export default CorporateAccount;
