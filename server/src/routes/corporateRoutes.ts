import express from "express";
import {
  createCorporateAccount,
  getCorporateAccount,
  addMember,
  submitBookingRequest,
  getBookingRequests,
  approveBookingRequest,
  rejectBookingRequest,
  getInvoice,
} from "../controllers/corporateController.js";

const corporateRouter = express.Router();

// Account management
corporateRouter.post("/account/create", createCorporateAccount);
corporateRouter.get("/account", getCorporateAccount);
corporateRouter.post("/account/add-member", addMember);

// Booking requests
corporateRouter.post("/booking/request", submitBookingRequest);
corporateRouter.get("/booking/list", getBookingRequests);
corporateRouter.post("/booking/approve/:requestId", approveBookingRequest);
corporateRouter.post("/booking/reject/:requestId", rejectBookingRequest);

// Invoice
corporateRouter.get("/booking/invoice/:requestId", getInvoice);

export default corporateRouter;
