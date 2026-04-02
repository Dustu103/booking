import mongoose, { Model } from "mongoose";
import { IShow } from "../types/index.js";

const showSchema = new mongoose.Schema(
  {
    movie: { type: String, required: true, ref: "Movie" },
    showDateTime: { type: Date, required: true },
    showPrice: { type: Number, required: true },
    occupiedSeats: { type: Object, default: {} },
  },
  { minimize: false }
);

const Show: Model<IShow> = mongoose.model<IShow>("Show", showSchema);

export default Show;
