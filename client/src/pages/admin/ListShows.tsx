import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import { dateFormat } from "../../lib/dateFormat";
import { useAppContext } from "../../context/AppContext";
import { IMovie } from "../../types";

interface AdminShow {
  _id: string;
  movie: IMovie;
  showDateTime: string | Date;
  showPrice: number;
  occupiedSeats: Record<string, string>;
}

const ListShows: React.FC = () => {
  const { axios, getToken, user } = useAppContext();
  const currency = (import.meta.env.VITE_CURRENCY as string) || "$";

  const [shows, setShows] = useState<AdminShow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const getAllShow = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/admin/all-shows", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setShows(data.shows);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      getAllShow();
    }
  }, [user]);

  return !loading ? (
    <div className="pb-20">
      <Title text1="SHOW" text2="INVENTORY" />
      
      <div className="mt-12 bg-white/5 border border-white/10 rounded-[32px] overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="px-8 py-6">Cinematic Title</th>
                <th className="px-8 py-6">Scheduled Matrix</th>
                <th className="px-8 py-6">Allocation</th>
                <th className="px-8 py-6 text-right">Revenue Yield</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {shows.map((show) => {
                const bookingCount = Object.keys(show.occupiedSeats).length;
                const revenue = bookingCount * show.showPrice;
                
                return (
                  <tr
                    key={show._id}
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-14 bg-white/5 rounded-lg overflow-hidden border border-white/10 group-hover:border-primary/50 transition-colors">
                             <img src={show.movie.poster_path} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <span className="text-white font-black text-sm uppercase tracking-tighter group-hover:text-primary transition-colors">{show.movie.title}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className="text-gray-400 font-bold text-xs">
                          {dateFormat(show.showDateTime)}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2">
                          <span className={`${bookingCount > 0 ? "text-primary" : "text-gray-600"} font-black text-xs`}>{bookingCount}</span>
                          <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                             <div 
                                className="h-full bg-primary" 
                                style={{ width: `${Math.min((bookingCount / 100) * 100, 100)}%` }}
                             ></div>
                          </div>
                          <span className="text-gray-600 font-bold text-[10px] uppercase">Seats</span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right font-black text-white text-lg">
                       <span className="text-primary text-xs mr-1 opacity-60">{currency}</span>
                       {revenue.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              
              {shows.length === 0 && (
                 <tr>
                    <td colSpan={4} className="px-8 py-20 text-center opacity-20 italic font-black uppercase tracking-widest text-sm">
                       Inventory database is currently empty
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

export default ListShows;
