import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import { dateFormat } from "../../lib/dateFormat";
import { useAppContext } from "../../context/AppContext";
import { IBookingPopulated } from "../../types";
import { UserCheckIcon, CreditCardIcon } from "lucide-react";

const ListBookings: React.FC = () => {
  const currency = (import.meta.env.VITE_CURRENCY as string) || "$";

  const { axios, getToken, user } = useAppContext();

  const [bookings, setBookings] = useState<IBookingPopulated[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getAllBookings = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/admin/all-bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      getAllBookings();
    }
  }, [user]);

  return !isLoading ? (
    <div className="pb-24">
      <Title text1="REGISTRATION" text2="LOGS" />
      
      <div className="mt-12 bg-white/5 border border-white/10 rounded-[40px] overflow-hidden backdrop-blur-2xl shadow-inner shadow-white/5">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="px-10 py-7">Member Identity</th>
                <th className="px-10 py-7">Production title</th>
                <th className="px-10 py-7">Show Synchronization</th>
                <th className="px-10 py-7">Allocated Nodes</th>
                <th className="px-10 py-7 text-right">Escrow Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bookings.map((item, index) => (
                <tr
                  key={item._id || index}
                  className="group hover:bg-white/[0.03] transition-all duration-300"
                >
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                          <UserCheckIcon className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-white font-black text-sm uppercase tracking-tighter">
                             {typeof item.user === 'object' && 'name' in item.user ? item.user.name : "System User"}
                          </span>
                          <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest leading-none mt-0.5 italic">Verified Patron</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                     <span className="text-gray-300 font-bold text-xs uppercase tracking-tight">
                        {item.show.movie.title}
                     </span>
                  </td>
                  <td className="px-10 py-7">
                     <div className="flex flex-col">
                        <span className="text-white font-black text-xs">
                           {dateFormat(item.show.showDateTime)}
                        </span>
                        <span className="text-[9px] font-black text-primary/60 uppercase tracking-tighter">UTC Sync Active</span>
                     </div>
                  </td>
                  <td className="px-10 py-7">
                    <div className="flex flex-wrap gap-1.5 max-w-[150px]">
                      {item.bookedSeats.map((seat) => (
                        <span key={seat} className="bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-[9px] font-black text-gray-400 group-hover:text-primary group-hover:border-primary/30 transition-all">
                           {seat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <div className="flex flex-col items-end">
                       <div className="flex items-center gap-2">
                          {item.isPaid ? (
                             <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                          ) : (
                             <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          )}
                          <span className="text-xl font-black text-white tracking-tighter">
                             <span className="text-primary text-[10px] mr-1 opacity-50">{currency}</span>
                             {item.amount.toLocaleString()}
                          </span>
                       </div>
                       <span className={`text-[9px] font-black uppercase tracking-widest mt-1 ${item.isPaid ? "text-emerald-500/60" : "text-red-500/60"}`}>
                          {item.isPaid ? "Transaction Finalized" : "Payment Pending"}
                       </span>
                    </div>
                  </td>
                </tr>
              ))}
              
              {bookings.length === 0 && (
                <tr>
                   <td colSpan={5} className="px-10 py-24 text-center">
                     <div className="flex flex-col items-center opacity-20">
                        <CreditCardIcon className="w-12 h-12 mb-4" />
                        <span className="font-black uppercase tracking-[0.3em] text-sm italic">Ledger sequence is empty</span>
                     </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ) : (
    <div className="h-[60vh] flex items-center justify-center">
       <Loading />
    </div>
  );
};

export default ListBookings;
