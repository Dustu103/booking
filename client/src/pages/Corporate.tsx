import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import {
  BuildingIcon,
  UsersIcon,
  ReceiptIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
} from "lucide-react";
import BlurCircle from "../components/BlurCircle";

const Corporate: React.FC = () => {
  const { axios, getToken, user } = useAppContext();
  const navigate = useNavigate();

  const [step, setStep] = useState<"landing" | "create">("landing");
  const [formData, setFormData] = useState({
    name: "",
    gstNumber: "",
    approvalRequired: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // If user already has an account, redirect to dashboard
  useEffect(() => {
    if (!user) return;
    const checkAccount = async () => {
      try {
        const token = await getToken();
        const { data } = await axios.get("/api/corporate/account", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success) navigate("/corporate/dashboard");
      } catch {
        // no account — stay on landing
      }
    };
    checkAccount();
  }, [user]);

  const handleCreate = async () => {
    if (!user) return toast.error("Please login to create a corporate account.");
    if (!formData.name.trim() || !formData.gstNumber.trim()) {
      return toast.error("Company name and GST number are required.");
    }
    try {
      setSubmitting(true);
      const token = await getToken();
      const { data } = await axios.post("/api/corporate/account/create", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        toast.success("Corporate account created!");
        navigate("/corporate/dashboard");
      } else {
        toast.error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const features = [
    {
      icon: <UsersIcon className="w-6 h-6 text-primary" />,
      title: "Group Booking up to 50 Seats",
      desc: "Book an entire row or section for your team in one seamless flow.",
    },
    {
      icon: <ReceiptIcon className="w-6 h-6 text-primary" />,
      title: "GST-Compliant Tax Invoices",
      desc: "Auto-generated HTML invoices with CGST + SGST breakdown for easy reconciliation.",
    },
    {
      icon: <ShieldCheckIcon className="w-6 h-6 text-primary" />,
      title: "Manager Approval Workflow",
      desc: "Employees request seats — manager approves — payment is triggered automatically.",
    },
    {
      icon: <BuildingIcon className="w-6 h-6 text-primary" />,
      title: "Centralised Team Account",
      desc: "Invite colleagues, track all bookings, and manage entertainment spend in one dashboard.",
    },
  ];

  return (
    <div className="min-h-screen px-6 md:px-16 lg:px-40 pt-32 pb-24">
      <BlurCircle top="100px" left="-150px" size="400" />
      <BlurCircle bottom="10%" right="-100px" size="300" />

      {step === "landing" ? (
        <>
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
              <BuildingIcon className="w-4 h-4 text-primary" />
              <span className="text-primary text-xs font-black uppercase tracking-widest">Corporate</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter leading-tight mb-4">
              Book for Your
              <span className="text-primary italic"> Whole Team</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              MovieShine Corporate makes team outings effortless. Bulk booking, GST invoices,
              approval workflows — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <button
                onClick={() => setStep("create")}
                className="group flex items-center justify-center gap-3 px-10 py-4 bg-primary hover:bg-white text-black font-black uppercase tracking-widest text-sm rounded-full transition-all shadow-2xl shadow-primary/30 active:scale-95"
              >
                Create Corporate Account
                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              {user && (
                <button
                  onClick={() => navigate("/corporate/dashboard")}
                  className="px-10 py-4 bg-white/5 border border-white/10 hover:border-primary/50 text-white font-black uppercase tracking-widest text-sm rounded-full transition-all"
                >
                  Go to Dashboard
                </button>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {features.map((f, i) => (
              <div
                key={i}
                className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:border-primary/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-white font-black uppercase tracking-tight text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Pricing note */}
          <div className="mt-16 max-w-2xl mx-auto text-center p-8 bg-primary/5 border border-primary/20 rounded-3xl">
            <CheckCircleIcon className="w-8 h-8 text-primary mx-auto mb-3" />
            <h4 className="text-white font-black uppercase tracking-tight text-xl mb-2">Free to Set Up</h4>
            <p className="text-gray-500 text-sm">
              No monthly fee. You only pay when your team books. Standard ticket prices apply + 18% GST as per Indian tax regulations.
            </p>
          </div>
        </>
      ) : (
        /* Create Account Form */
        <div className="max-w-xl mx-auto">
          <button
            onClick={() => setStep("landing")}
            className="text-gray-500 hover:text-white text-xs font-black uppercase tracking-widest mb-10 flex items-center gap-2 transition-colors"
          >
            ← Back
          </button>

          <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">
            New Corporate Account
          </h1>
          <p className="text-gray-500 text-sm mb-10">You'll be the account admin. Invite teammates after setup.</p>

          <div className="space-y-6 bg-white/5 border border-white/10 rounded-[40px] p-10">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="Acme Technologies Pvt. Ltd."
                className="w-full bg-black/40 border border-white/10 focus:border-primary outline-none rounded-2xl py-4 px-6 text-white font-bold transition-all placeholder:text-gray-700"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                GST Number *
              </label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData((p) => ({ ...p, gstNumber: e.target.value.toUpperCase() }))}
                placeholder="27AAACM1234F1Z5"
                maxLength={15}
                className="w-full bg-black/40 border border-white/10 focus:border-primary outline-none rounded-2xl py-4 px-6 text-white font-bold font-mono tracking-widest transition-all placeholder:text-gray-700"
              />
              <p className="text-[10px] text-gray-700 font-bold uppercase tracking-widest mt-2 ml-2">15-character GST Identification Number</p>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setFormData((p) => ({ ...p, approvalRequired: !p.approvalRequired }))}
                className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl border transition-all ${
                  formData.approvalRequired
                    ? "bg-primary/10 border-primary/40"
                    : "bg-black/30 border-white/10 hover:border-white/20"
                }`}
              >
                <div>
                  <p className={`text-sm font-black uppercase tracking-wider ${formData.approvalRequired ? "text-primary" : "text-gray-400"}`}>
                    Manager Approval Required
                  </p>
                  <p className="text-[10px] text-gray-600 font-bold mt-0.5">
                    Employees must get admin approval before payment is triggered
                  </p>
                </div>
                <div className={`w-10 h-6 rounded-full transition-all flex items-center px-0.5 ${formData.approvalRequired ? "bg-primary justify-end" : "bg-white/10 justify-start"}`}>
                  <div className={`w-5 h-5 rounded-full ${formData.approvalRequired ? "bg-black" : "bg-white/30"}`} />
                </div>
              </button>
            </div>

            <button
              onClick={handleCreate}
              disabled={submitting}
              className="w-full py-5 bg-primary hover:bg-white text-black font-black uppercase tracking-widest text-sm rounded-2xl transition-all shadow-2xl shadow-primary/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating Account..." : "Create Corporate Account"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Corporate;
