import mongoose, { Model } from "mongoose";
import { IUser } from "../types/index.js";

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  image: { type: String, required: true },
});

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
