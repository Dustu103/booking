import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  DownloadIcon,
  UserPlusIcon,
  TicketIcon,
  ArrowRightIcon,
  BuildingIcon,
} from "lucide-react";
import BlurCircle from "../components/BlurCircle";

interface CorporateAccount {
  _id: string;
  name: string;
  gstNumber: string;
  adminUserId: string;
  members: string[];
  approvalRequired: boolean;
  totalBookingsValue: number;
}

interface BookingRequest {
  _id: string;
  show: {
    _id: string;
    showDateTime: string;
    showPrice: number;
    movie: { title: string; poster_path: string };
  };
  requestedBy: string;
  selectedSeats: string[];
  status: "pending" | "approved" | "rejected" | "paid";
  amount: number;
  gstAmount: number;
  paymentLink?: string;
  createdAt: string;
}

const statusConfig = {
  pending: { label: "Pending Approval", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", icon: <ClockIcon className="w-4 h-4" /> },
  approved: { label: "Approved — Pay Now", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", icon: <ArrowRightIcon className="w-4 h-4" /> },
  rejected: { label: "Rejected", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", icon: <XCircleIcon className="w-4 h-4" /> },
  paid: { label: "Paid", color: "text-green-400", bg: "bg-green-500/10 border-green-500/30", icon: <CheckCircleIcon className="w-4 h-4" /> },
};

const CorporateDashboard: React.FC = () => {
  const { axios, getToken, user, image_base_url } = useAppContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [account, setAccount] = useState<CorporateAccount | null>(null);
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [memberEmail, setMemberEmail] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      toast.success("Payment successful! Your corporate booking is confirmed.");
    }
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [accountRes, requestsRes] = await Promise.all([
        axios.get("/api/corporate/account", { headers }),
        axios.get("/api/corporate/booking/list", { headers }),
      ]);

      if (accountRes.data.success) setAccount(accountRes.data.account);
      else { navigate("/corporate"); return; }

      if (requestsRes.data.success) {
        setRequests(requestsRes.data.requests);
        setIsAdmin(requestsRes.data.isAdmin);
      }
    } catch (error: any) {
      toast.error("Failed to load dashboard.");
      navigate("/corporate");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `/api/corporate/booking/approve/${requestId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success("Booking approved! Opening payment link...");
        window.open(data.paymentLink, "_blank");
        fetchDashboard();
      } else {
        toast.error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `/api/corporate/booking/reject/${requestId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success("Request rejected.");
        fetchDashboard();
      } else {
        toast.error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleViewInvoice = (requestId: string) => {
    window.open(`/api/corporate/booking/invoice/${requestId}`, "_blank");
  };

  useEffect(() => {
    if (user) fetchDashboard();
  }, [user]);

  const displayedRequests = activeTab === "pending"
    ? requests.filter((r) => r.status === "pending")
    : requests;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Corporate Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 md:px-16 lg:px-40 pt-32 pb-24">
      <BlurCircle top="100px" left="-150px" size="400" />
      <BlurCircle bottom="10%" right="-100px" size="300" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <BuildingIcon className="w-6 h-6 text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Corporate Dashboard</p>
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">{account?.name}</h1>
          <p className="text-gray-600 font-mono text-sm mt-1">GSTIN: {account?.gstNumber}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate("/movies")}
            className="group flex items-center gap-2 px-8 py-3 bg-primary hover:bg-white text-black font-black uppercase tracking-widest text-xs rounded-full transition-all shadow-xl shadow-primary/20 active:scale-95"
          >
            <TicketIcon className="w-4 h-4" />
            Book Tickets
            <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Total Requests", value: requests.length },
          { label: "Pending", value: requests.filter((r) => r.status === "pending").length },
          { label: "Paid", value: requests.filter((r) => r.status === "paid").length },
          { label: "Team Members", value: account?.members.length ?? 0 },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
            <p className="text-3xl font-black text-white">{stat.value}</p>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["all", "pending"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-full font-black uppercase tracking-widest text-xs transition-all ${
              activeTab === tab ? "bg-primary text-black" : "bg-white/5 border border-white/10 text-gray-400 hover:border-white/30"
            }`}
          >
            {tab === "all" ? "All Requests" : `Pending (${requests.filter((r) => r.status === "pending").length})`}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {displayedRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center opacity-30">
          <TicketIcon className="w-12 h-12 text-gray-500 mb-4" />
          <p className="text-gray-400 font-black uppercase tracking-widest text-sm">
            {activeTab === "pending" ? "No pending requests" : "No booking requests yet"}
          </p>
          <p className="text-gray-600 text-xs mt-2">
            {activeTab === "all" ? "Go to Movies and book tickets as a corporate booking." : ""}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedRequests.map((req) => {
            const cfg = statusConfig[req.status];
            const total = req.amount + req.gstAmount;
            return (
              <div
                key={req._id}
                className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center hover:border-white/20 transition-all"
              >
                {/* Movie poster */}
                <img
                  src={image_base_url + req.show?.movie?.poster_path}
                  alt={req.show?.movie?.title}
                  className="w-14 h-20 object-cover rounded-xl flex-shrink-0"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-lg uppercase tracking-tight truncate">
                    {req.show?.movie?.title}
                  </p>
                  <p className="text-gray-500 text-xs font-bold mt-0.5">
                    {new Date(req.show?.showDateTime).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {req.selectedSeats.map((s) => (
                      <span key={s} className="text-[10px] font-black px-2 py-0.5 bg-white/10 rounded-md text-white">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Amounts */}
                <div className="text-right flex-shrink-0">
                  <p className="text-white font-black text-xl">₹{total.toFixed(2)}</p>
                  <p className="text-gray-600 text-[10px] font-bold">Base ₹{req.amount.toFixed(2)} + GST ₹{req.gstAmount.toFixed(2)}</p>
                </div>

                {/* Status + Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0 min-w-[160px]">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black ${cfg.color} ${cfg.bg}`}>
                    {cfg.icon}
                    {cfg.label}
                  </div>

                  {/* Admin actions */}
                  {isAdmin && req.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(req._id)}
                        className="flex-1 py-2 bg-green-500/20 border border-green-500/40 text-green-400 text-[10px] font-black uppercase rounded-xl hover:bg-green-500/30 transition-all"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(req._id)}
                        className="flex-1 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-black uppercase rounded-xl hover:bg-red-500/20 transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {/* Pay now */}
                  {req.status === "approved" && req.paymentLink && (
                    <a
                      href={req.paymentLink}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-4 bg-primary text-black text-[10px] font-black uppercase rounded-xl text-center hover:bg-white transition-all"
                    >
                      Pay Now →
                    </a>
                  )}

                  {/* Invoice */}
                  {(req.status === "approved" || req.status === "paid") && (
                    <button
                      onClick={() => handleViewInvoice(req._id)}
                      className="flex items-center justify-center gap-1.5 py-2 bg-white/5 border border-white/10 text-gray-300 text-[10px] font-black uppercase rounded-xl hover:border-white/30 transition-all"
                    >
                      <DownloadIcon className="w-3 h-3" />
                      Invoice
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Member (admin only) */}
      {isAdmin && (
        <div className="mt-12 bg-white/5 border border-white/10 rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <UserPlusIcon className="w-5 h-5 text-primary" />
            <h3 className="text-white font-black uppercase tracking-tight text-lg">Add Team Member</h3>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            Enter the Clerk user ID of the team member you want to add. They can then submit booking requests on behalf of <strong className="text-white">{account?.name}</strong>.
          </p>
          <div className="flex gap-3 max-w-xl">
            <input
              type="text"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="user_xxxxxxxxxxxxxxxx"
              className="flex-1 bg-black/40 border border-white/10 focus:border-primary outline-none rounded-2xl py-3 px-5 text-white font-mono text-sm transition-all placeholder:text-gray-700"
            />
            <button
              onClick={async () => {
                if (!memberEmail.trim()) return;
                try {
                  const token = await getToken();
                  const { data } = await axios.post(
                    "/api/corporate/account/add-member",
                    { memberUserId: memberEmail.trim() },
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  if (data.success) { toast.success("Member added!"); setMemberEmail(""); fetchDashboard(); }
                  else toast.error(data.message);
                } catch (e: any) { toast.error(e.message); }
              }}
              className="px-6 py-3 bg-primary hover:bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl transition-all active:scale-95"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorporateDashboard;
