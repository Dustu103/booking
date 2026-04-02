import React, { useEffect, useState } from "react";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import timeFormat from "../lib/timeFormat";
import { dateFormat } from "../lib/dateFormat";
import { useAppContext } from "../context/AppContext";
import { Link } from "react-router-dom";
import { IBookingPopulated } from "../types";
import { Ticket } from "lucide-react";

const MyBookings: React.FC = () => {
  const currency = (import.meta.env.VITE_CURRENCY as string) || "$";

  const { axios, getToken, user, image_base_url } = useAppContext();

  const [bookings, setBookings] = useState<IBookingPopulated[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getMyBookings = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/user/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) {
      getMyBookings();
    }
  }, [user]);

  return !isLoading ? (
    <div className="relative px-6 md:px-16 lg:px-40 pt-32 md:pt-48 min-h-screen">
      <BlurCircle top="100px" left="-150px" size="400" />
      <BlurCircle bottom="10%" right="-100px" size="300" />
      
      <div className="mb-16 border-b border-white/5 pb-8">
         <h1 className="text-5xl font-black text-white uppercase tracking-tighter">My Bookings</h1>
         <p className="text-gray-500 font-bold mt-2 tracking-widest uppercase text-xs">Your history of cinematic experiences</p>
      </div>

      <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-20">
        {bookings.length > 0 ? (
          bookings.map((item, index) => (
            <div
              key={item._id || index}
              className="group flex flex-col lg:flex-row justify-between bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/20 rounded-3xl overflow-hidden transition-all duration-300 shadow-xl"
            >
              <div className="flex flex-col md:flex-row flex-1">
                <div className="relative overflow-hidden w-full md:w-60 h-40 md:h-auto">
                    <img
                      src={image_base_url + item.show.movie.poster_path}
                      alt={item.show.movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 "
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4 md:hidden">
                       <p className="text-white font-black text-xl">{item.show.movie.title}</p>
                    </div>
                </div>
                
                <div className="flex flex-col p-8 justify-between">
                  <div>
                    <h2 className="hidden md:block text-2xl font-black text-white mb-2">{item.show.movie.title}</h2>
                    <div className="flex items-center gap-3 text-gray-500 text-xs font-bold uppercase tracking-widest">
                       <span>{timeFormat(item.show.movie.runtime)}</span>
                       <span className="w-1.5 h-1.5 bg-primary/40 rounded-full"></span>
                       <span>{item.show.movie.genres.map((g: any) => typeof g === 'string' ? g : g.name).slice(0,2).join(" | ")}</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 md:mt-auto">
                     <p className="text-primary font-black text-lg tracking-tight">
                        {dateFormat(item.show.showDateTime)}
                     </p>
                     <p className="text-gray-500 text-[10px] font-black uppercase tracking-tighter mt-1">Confirmed Show Date & Time</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row lg:flex-col lg:items-end md:text-right border-t lg:border-t-0 lg:border-l border-white/5 p-8 bg-black/20">
                <div className="flex items-center lg:items-end justify-between md:justify-end gap-6 mb-8 w-full">
                   {!item.isPaid ? (
                    <div className="flex flex-col items-start lg:items-end">
                       <p className="text-red-400 font-black text-[10px] uppercase tracking-widest animate-pulse mb-1">Unpaid Transaction</p>
                       {item.paymentLink && (
                          <Link
                            to={item.paymentLink}
                            className="bg-primary hover:bg-white text-black px-6 py-2 text-xs rounded-full font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20"
                          >
                            Pay Now
                          </Link>
                       )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-full border border-green-500/20">
                       <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                       <span className="text-[10px] font-black uppercase tracking-widest">Paid & Confirmed</span>
                    </div>
                  )}
                  
                  <p className="text-4xl font-black text-white tracking-tighter">
                    {currency}{item.amount}
                  </p>
                </div>

                <div className="text-[10px] uppercase tracking-widest space-y-3 w-full">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-gray-500 font-bold">Registration</span>
                    <span className="text-white font-black">#{item._id.slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-gray-500 font-bold">Total Tickets</span>
                    <span className="text-white font-black">{item.bookedSeats.length} PASSES</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-gray-500 font-bold">Allocated Seats</span>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                       {item.bookedSeats.map(seat => (
                         <span key={seat} className="bg-white/10 px-2 py-1 rounded text-primary font-black border border-white/5">{seat}</span>
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
           <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <Ticket className="w-16 h-16 text-gray-700 mb-6" />
              <h2 className="text-2xl font-black text-gray-400 uppercase tracking-widest italic">No Bookings Found</h2>
              <p className="text-gray-600 mt-2">Catch the latest blockbusters and start your collection.</p>
           </div>
        )}
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default MyBookings;
