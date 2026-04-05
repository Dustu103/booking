import { Request, Response } from "express";
import Stripe from "stripe";
import CorporateAccount from "../models/CorporateAccount.js";
import CorporateBookingRequest from "../models/CorporateBookingRequest.js";
import Show from "../models/Show.js";
import { IShow, IMovie } from "../types/index.js";

const GST_RATE = 0.18;

// ─── Helper: generate HTML invoice ─────────────────────────────────────────
const generateInvoiceHtml = (params: {
  invoiceNumber: string;
  companyName: string;
  gstNumber: string;
  movieTitle: string;
  showDateTime: Date;
  seats: string[];
  pricePerSeat: number;
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
  requestedBy: string;
}) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Tax Invoice — ${params.invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; color: #111; font-size: 14px; }
    h1 { font-size: 22px; letter-spacing: 2px; text-transform: uppercase; color: #7c3aed; margin-bottom: 2px; }
    .sub { color: #888; font-size: 11px; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .box { background: #f8f7ff; border-radius: 8px; padding: 14px; }
    .box h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #7c3aed; margin: 0 0 6px; }
    .box p { margin: 2px 0; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #7c3aed; color: white; padding: 10px 14px; text-align: left; font-size: 12px; }
    td { padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 13px; }
    .totals { text-align: right; }
    .totals td { border: none; padding: 4px 14px; }
    .totals .label { color: #888; font-size: 12px; }
    .totals .total-row td { font-weight: bold; font-size: 15px; color: #7c3aed; border-top: 2px solid #7c3aed; padding-top: 8px; }
    .footer { margin-top: 32px; font-size: 11px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 16px; }
  </style>
</head>
<body>
  <h1>MovieShine</h1>
  <p class="sub">Tax Invoice — GST Compliant</p>

  <div class="grid">
    <div class="box">
      <h3>Billed To</h3>
      <p><strong>${params.companyName}</strong></p>
      <p>GSTIN: ${params.gstNumber}</p>
      <p>Requested by: ${params.requestedBy}</p>
    </div>
    <div class="box">
      <h3>Invoice Details</h3>
      <p>Invoice No: <strong>${params.invoiceNumber}</strong></p>
      <p>Date: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Show Date & Time</th>
        <th>Seats</th>
        <th>Rate</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${params.movieTitle}</td>
        <td>${params.showDateTime.toLocaleString("en-IN")}</td>
        <td>${params.seats.join(", ")}</td>
        <td>₹${params.pricePerSeat.toFixed(2)}</td>
        <td>₹${params.baseAmount.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <table class="totals">
    <tr><td class="label">Subtotal</td><td>₹${params.baseAmount.toFixed(2)}</td></tr>
    <tr><td class="label">CGST (9%)</td><td>₹${(params.gstAmount / 2).toFixed(2)}</td></tr>
    <tr><td class="label">SGST (9%)</td><td>₹${(params.gstAmount / 2).toFixed(2)}</td></tr>
    <tr class="total-row"><td>Total Payable</td><td>₹${params.totalAmount.toFixed(2)}</td></tr>
  </table>

  <div class="footer">
    MovieShine Entertainment Pvt. Ltd. &bull; GSTIN: 27AAACM1234F1Z5<br/>
    This is a computer-generated invoice and does not require a physical signature.
  </div>
</body>
</html>
`;

// ─── Create Corporate Account ───────────────────────────────────────────────
export const createCorporateAccount = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).auth;
    const userId = auth?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { name, gstNumber, approvalRequired } = req.body;
    if (!name || !gstNumber) {
      return res.json({ success: false, message: "Company name and GST number are required." });
    }

    // Check if user already owns an account
    const existing = await CorporateAccount.findOne({ adminUserId: userId });
    if (existing) {
      return res.json({ success: false, message: "You already have a corporate account." });
    }

    const account = await CorporateAccount.create({
      name,
      gstNumber,
      adminUserId: userId,
      members: [userId],
      approvalRequired: approvalRequired ?? true,
    });

    res.json({ success: true, account });
  } catch (error: any) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// ─── Get Corporate Account ──────────────────────────────────────────────────
export const getCorporateAccount = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).auth;
    const userId = auth?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const account = await CorporateAccount.findOne({
      $or: [{ adminUserId: userId }, { members: userId }],
    });

    if (!account) return res.json({ success: false, message: "No corporate account found." });

    res.json({ success: true, account });
  } catch (error: any) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// ─── Add Member to Corporate Account ───────────────────────────────────────
export const addMember = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).auth;
    const userId = auth?.userId;
    const { memberUserId } = req.body;

    const account = await CorporateAccount.findOne({ adminUserId: userId });
    if (!account) return res.json({ success: false, message: "Only the account admin can add members." });

    if (!account.members.includes(memberUserId)) {
      account.members.push(memberUserId);
      await account.save();
    }

    res.json({ success: true, account });
  } catch (error: any) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// ─── Submit Booking Request ─────────────────────────────────────────────────
export const submitBookingRequest = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).auth;
    const userId = auth?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { showId, selectedSeats } = req.body;

    if (!selectedSeats || selectedSeats.length < 1 || selectedSeats.length > 50) {
      return res.json({ success: false, message: "Select between 1 and 50 seats for a corporate booking." });
    }

    // Find the user's corporate account
    const account = await CorporateAccount.findOne({ members: userId });
    if (!account) {
      return res.json({ success: false, message: "You are not part of a corporate account." });
    }

    const showData = (await Show.findById(showId).populate("movie")) as (IShow & { movie: IMovie }) | null;
    if (!showData) return res.json({ success: false, message: "Show not found." });

    // Check seat availability
    const takenSeat = selectedSeats.find((seat: string) => showData.occupiedSeats[seat]);
    if (takenSeat) {
      return res.json({ success: false, message: `Seat ${takenSeat} is already booked.` });
    }

    const baseAmount = showData.showPrice * selectedSeats.length;
    const gstAmount = parseFloat((baseAmount * GST_RATE).toFixed(2));
    const totalAmount = baseAmount + gstAmount;

    const invoiceNumber = `CORP-${Date.now()}`;
    const invoiceHtml = generateInvoiceHtml({
      invoiceNumber,
      companyName: account.name,
      gstNumber: account.gstNumber,
      movieTitle: showData.movie.title,
      showDateTime: showData.showDateTime,
      seats: selectedSeats,
      pricePerSeat: showData.showPrice,
      baseAmount,
      gstAmount,
      totalAmount,
      requestedBy: userId,
    });

    const bookingRequest = await CorporateBookingRequest.create({
      corporateAccountId: account._id,
      requestedBy: userId,
      show: showId,
      selectedSeats,
      amount: baseAmount,
      gstAmount,
      invoiceHtml,
      // If no approval required, auto-approve
      status: account.approvalRequired ? "pending" : "approved",
      approvedBy: account.approvalRequired ? undefined : account.adminUserId,
    });

    res.json({ success: true, bookingRequest });
  } catch (error: any) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// ─── Get All Booking Requests for Account ──────────────────────────────────
export const getBookingRequests = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).auth;
    const userId = auth?.userId;

    const account = await CorporateAccount.findOne({
      $or: [{ adminUserId: userId }, { members: userId }],
    });
    if (!account) return res.json({ success: false, message: "No corporate account found." });

    const requests = await CorporateBookingRequest.find({
      corporateAccountId: account._id,
    })
      .populate({ path: "show", populate: { path: "movie" } })
      .sort({ createdAt: -1 });

    res.json({ success: true, requests, isAdmin: account.adminUserId === userId });
  } catch (error: any) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// ─── Approve Booking Request ────────────────────────────────────────────────
export const approveBookingRequest = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).auth;
    const userId = auth?.userId;
    const { requestId } = req.params;

    const bookingReq = await CorporateBookingRequest.findById(requestId);
    if (!bookingReq) return res.json({ success: false, message: "Booking request not found." });

    const account = await CorporateAccount.findById(bookingReq.corporateAccountId);
    if (!account || account.adminUserId !== userId) {
      return res.status(403).json({ success: false, message: "Only the account admin can approve requests." });
    }

    if (bookingReq.status !== "pending") {
      return res.json({ success: false, message: "This request is not in pending state." });
    }

    // Generate Stripe checkout for the full amount (one person pays for all)
    const showData = (await Show.findById(bookingReq.show).populate("movie")) as (IShow & { movie: IMovie }) | null;
    if (!showData) return res.json({ success: false, message: "Show not found." });

    const origin = req.get("origin") as string;
    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY as string);
    const totalAmount = bookingReq.amount + bookingReq.gstAmount;
    const seatCount: number = bookingReq.selectedSeats.length;
    const movieTitle: string = showData.movie.title;
    const productName: string = `[Corporate] ${movieTitle} - ${seatCount} seats`;

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: "inr",
          product_data: { name: productName },
          unit_amount: Math.floor(totalAmount * 100),
        },
        quantity: 1,
      },
    ];

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      success_url: `${origin}/corporate/dashboard?payment=success`,
      cancel_url: `${origin}/corporate/dashboard`,
      line_items,
      mode: "payment",
      metadata: { corporateRequestId: String(requestId) },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    };

    const session = await stripeInstance.checkout.sessions.create(sessionParams);

    bookingReq.status = "approved";
    bookingReq.approvedBy = userId;
    bookingReq.paymentLink = session.url || "";
    await bookingReq.save();

    res.json({ success: true, paymentLink: session.url, bookingRequest: bookingReq });
  } catch (error: any) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// ─── Reject Booking Request ─────────────────────────────────────────────────
export const rejectBookingRequest = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).auth;
    const userId = auth?.userId;
    const { requestId } = req.params;

    const bookingReq = await CorporateBookingRequest.findById(requestId);
    if (!bookingReq) return res.json({ success: false, message: "Booking request not found." });

    const account = await CorporateAccount.findById(bookingReq.corporateAccountId);
    if (!account || account.adminUserId !== userId) {
      return res.status(403).json({ success: false, message: "Only the account admin can reject requests." });
    }

    bookingReq.status = "rejected";
    await bookingReq.save();

    res.json({ success: true, message: "Request rejected." });
  } catch (error: any) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// ─── Serve Invoice HTML ─────────────────────────────────────────────────────
export const getInvoice = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).auth;
    const userId = auth?.userId;
    const { requestId } = req.params;

    const bookingReq = await CorporateBookingRequest.findById(requestId);
    if (!bookingReq) return res.json({ success: false, message: "Booking request not found." });

    const account = await CorporateAccount.findById(bookingReq.corporateAccountId);
    if (!account) return res.json({ success: false, message: "Account not found." });

    // Only admin or the requester can view invoice
    const isMember = account.members.includes(userId) || account.adminUserId === userId;
    if (!isMember) return res.status(403).json({ success: false, message: "Access denied." });

    if (!bookingReq.invoiceHtml) {
      return res.json({ success: false, message: "Invoice not generated yet." });
    }

    res.setHeader("Content-Type", "text/html");
    res.send(bookingReq.invoiceHtml);
  } catch (error: any) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
