import { Request, Response } from "express";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import User from "../models/User.js";
import { IBooking, IShow, IMovie } from "../types/index.js";

// API to check if user is an admin
export const isAdmin = async (_req: Request, res: Response) => {
  res.json({ success: true, isAdmin: true });
};

// API to get dashboard data
export const getDashboardData = async (_req: Request, res: Response) => {
  try {
    const bookings = (await Booking.find({ isPaid: true })) as IBooking[];
    const activeShows = (await Show.find({
      showDateTime: { $gte: new Date() },
    }).populate("movie")) as (IShow & { movie: IMovie })[];

    const totalUser = await User.countDocuments();

    const dashboardData = {
      totalBookings: bookings.length,
      totalRevenue: bookings.reduce((acc: number, booking: IBooking) => acc + booking.amount, 0),
      activeShows,
      totalUser,
    };

    res.json({ success: true, dashboardData });
  } catch (error: any) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all shows
export const getAllShows = async (_req: Request, res: Response) => {
  try {
    const shows = (await Show.find({ showDateTime: { $gte: new Date() } })
      .populate("movie")
      .sort({ showDateTime: 1 })) as (IShow & { movie: IMovie })[];

    res.json({ success: true, shows });
  } catch (error: any) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all bookings
export const getAllBookings = async (_req: Request, res: Response) => {
  try {
    const bookings = await Booking.find({})
      .populate("user")
      .populate({
        path: "show",
        populate: { path: "movie" },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error: any) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
