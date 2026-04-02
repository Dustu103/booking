import { Request, Response, NextFunction } from "express";
import { clerkClient } from "@clerk/express";

export const protectAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = (req as any).auth;
    const userId = auth?.userId;

    if (!userId) {
      return res.json({ success: false, message: "not authorized" });
    }

    const user = await clerkClient.users.getUser(userId);

    if (user.privateMetadata.role !== "admin") {
      return res.json({ success: false, message: "not authorized" });
    }

    next();
  } catch (error: any) {
    return res.json({ success: false, message: "not authorized" });
  }
};
