import { Request, Response } from "express";
import Stripe from "stripe";
import Booking from "../models/Booking.js";
import { inngest } from "../inngest/index.js";

export const stripeWebhooks = async (request: Request, response: Response) => {
  const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  const sig = request.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (error: any) {
    return response.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.bookingId;

        if (bookingId) {
          await Booking.findByIdAndUpdate(bookingId, {
            isPaid: true,
            paymentLink: "",
          });

          // Send Confirmation Email
          await inngest.send({
            name: "app/show.booked",
            data: { bookingId },
          });
        }
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    response.json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    response.status(500).send("Internal Server Error");
  }
};
