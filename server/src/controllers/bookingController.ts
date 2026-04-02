import { Request, Response } from "express";
import { inngest } from "../inngest/index.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import Stripe from "stripe";
import { IBooking, IShow, IMovie } from "../types/index.js";

// Function to check availability of selected seats for a movie
const checkSeatsAvailability = async (showId: string, selectedSeats: string[]): Promise<boolean> => {
  try {
    const showData = (await Show.findById(showId)) as IShow | null;
    if (!showData) return false;

    const occupiedSeats = showData.occupiedSeats;
    const isAnySeatTaken = selectedSeats.some((seat) => occupiedSeats[seat]);

    return !isAnySeatTaken;
  } catch (error: any) {
    console.log(error.message);
    return false;
  }
};

export const createBooking = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).auth;
    const userId = auth?.userId;
    const { showId, selectedSeats } = req.body;
    const origin = req.get("origin");

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Check if the seat is available for the selected show
    const isAvailable = await checkSeatsAvailability(showId, selectedSeats);

    if (!isAvailable) {
      return res.json({
        success: false,
        message: "Selected Seats are not available.",
      });
    }

    // Get the show details
    const showData = (await Show.findById(showId).populate("movie")) as (IShow & { movie: IMovie }) | null;

    if (!showData) {
      return res.json({ success: false, message: "Show not found" });
    }

    // Create a new booking
    const booking = (await Booking.create({
      user: userId,
      show: showId,
      amount: showData.showPrice * selectedSeats.length,
      bookedSeats: selectedSeats,
    })) as IBooking;

    selectedSeats.forEach((seat: string) => {
      showData.occupiedSeats[seat] = userId;
    });

    showData.markModified("occupiedSeats");
    await showData.save();

    // Stripe Gateway Initialize
    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY as string);

    // Creating line items for Stripe
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: showData.movie.title,
          },
          unit_amount: Math.floor(booking.amount) * 100,
        },
        quantity: 1,
      },
    ];

    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/loading/my-bookings`,
      cancel_url: `${origin}/my-bookings`,
      line_items: line_items,
      mode: "payment",
      metadata: {
        bookingId: booking._id.toString(),
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // Expires in 30 minutes
    });

    booking.paymentLink = session.url || "";
    await booking.save();

    // Run Inngest Scheduler Function to check payment status after 10 minutes
    await inngest.send({
      name: "app/checkpayment",
      data: {
        bookingId: booking._id.toString(),
      },
    });

    res.json({ success: true, url: session.url });
  } catch (error: any) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const getOccupiedSeats = async (req: Request, res: Response) => {
  try {
    const { showId } = req.params;
    const showData = (await Show.findById(showId)) as IShow | null;

    if (!showData) {
      return res.json({ success: false, message: "Show not found" });
    }

    const occupiedSeats = Object.keys(showData.occupiedSeats);

    res.json({ success: true, occupiedSeats });
  } catch (error: any) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
