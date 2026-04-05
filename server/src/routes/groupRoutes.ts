import express from "express";
import {
  createGroupRoom,
  joinGroupRoom,
  getGroupRoom,
  updateSeatSelection,
  markReady,
  checkoutGroupRoom,
  getCentrifugoToken,
} from "../controllers/groupController.js";

const groupRouter = express.Router();

groupRouter.get("/token", getCentrifugoToken);
groupRouter.post("/create", createGroupRoom);
groupRouter.get("/:roomCode", getGroupRoom);
groupRouter.post("/:roomCode/join", joinGroupRoom);
groupRouter.post("/:roomCode/seats", updateSeatSelection);
groupRouter.post("/:roomCode/ready", markReady);
groupRouter.post("/:roomCode/checkout", checkoutGroupRoom);

export default groupRouter;
