import { Request, Response } from "express";
import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";

// API Controller Function to Get User Bookings
export const getUserBookings = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).auth;
    const userId = auth?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const bookings = await Booking.find({ user: userId })
      .populate({
        path: "show",
        populate: { path: "movie" },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error: any) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

// API Controller Function to Update Favorite Movie in Clerk User Metadata
export const updateFavorite = async (req: Request, res: Response) => {
  try {
    const { movieId } = req.body;
    const auth = (req as any).auth;
    const userId = auth?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await clerkClient.users.getUser(userId);
    const privateMetadata = user.privateMetadata as { favorites?: string[] };

    let favorites = privateMetadata.favorites || [];

    if (!favorites.includes(movieId)) {
      favorites.push(movieId);
    } else {
      favorites = favorites.filter((item) => item !== movieId);
    }

    await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: { ...privateMetadata, favorites },
    });

    res.json({ success: true, message: "Favorite movies updated" });
  } catch (error: any) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

// API Controller Function to Get Favorite Movies from Clerk User Metadata
export const getFavorites = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).auth;
    const userId = auth?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await clerkClient.users.getUser(userId);
    const favorites = (user.privateMetadata as { favorites?: string[] }).favorites || [];

    // Getting movies from database
    const movies = await Movie.find({ _id: { $in: favorites } });

    res.json({ success: true, movies });
  } catch (error: any) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};
