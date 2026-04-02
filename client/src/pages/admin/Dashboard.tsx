import React, { useEffect, useState } from "react";
import {
  ChartLineIcon,
  CircleDollarSignIcon,
  PlayCircleIcon,
  StarIcon,
  UsersIcon,
  TrendingUpIcon,
} from "lucide-react";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import BlurCircle from "../../components/BlurCircle";
import { dateFormat } from "../../lib/dateFormat";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { IMovie } from "../../types";

interface DashboardData {
  totalBookings: number;
  totalRevenue: number;
  activeShows: Array<{
    _id: string;
    movie: IMovie;
    showPrice: number;
    showDateTime: string;
  }>;
  totalUser: number;
}

const Dashboard: React.FC = () => {
  const { axios, getToken, user, image_base_url } = useAppContext();
  const currency = (import.meta.env.VITE_CURRENCY as string) || "$";

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalBookings: 0,
    totalRevenue: 0,
    activeShows: [],
    totalUser: 0,
  });

  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setDashboardData(data.dashboardData);
      } else {
        toast.error(data.message);
      }
    } catch (error: any) {
      toast.error("Error fetching dashboard data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const dashboardCards = [
    {
      title: "Total Bookings",
      value: dashboardData.totalBookings.toLocaleString(),
      icon: ChartLineIcon,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      title: "Total Revenue",
      value: currency + dashboardData.totalRevenue.toLocaleString(),
      icon: CircleDollarSignIcon,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      title: "Active Shows",
      value: dashboardData.activeShows.length.toString(),
      icon: PlayCircleIcon,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Total Users",
      value: dashboardData.totalUser.toLocaleString(),
      icon: UsersIcon,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
  ];

  return !loading ? (
    <div className="relative pb-20">
      <BlurCircle top="-50px" right="-50px" size="300" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
         <div>
            <Title text1="SYSTEM" text2="DASHBOARD" />
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Platform Performance Real-time Overview</p>
         </div>
         <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
            <TrendingUpIcon className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black text-white uppercase tracking-tighter">Live Traffic Monitoring Active</span>
         </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardCards.map((card, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-3xl hover:border-primary/30 transition-all duration-300 group hover:-translate-y-1 shadow-xl`}
          >
            <div>
              <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{card.title}</h3>
              <p className="text-3xl font-black text-white tracking-tighter group-hover:text-primary transition-colors">{card.value}</p>
            </div>
            <div className={`p-3 rounded-2xl ${card.bg}`}>
               <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-20">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 bg-primary rounded-full shadow-lg shadow-primary/40"></div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Active Show Management</h2>
           </div>
           <button 
              onClick={fetchDashboardData}
              className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors"
           >
              Refresh Stream
           </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {dashboardData.activeShows.map((show) => (
            <div
              key={show._id}
              className="group relative bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden hover:border-primary/20 transition-all duration-500 shadow-2xl"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={image_base_url + show.movie.poster_path}
                  alt={show.movie.title}
                  className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"></div>
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                   <StarIcon className="w-3.5 h-3.5 text-primary fill-primary" />
                   <span className="text-xs font-black text-white">{show.movie.vote_average.toFixed(1)}</span>
                </div>
              </div>
              
              <div className="p-6 -mt-10 relative z-10">
                <h4 className="font-black text-white text-lg truncate mb-1 group-hover:text-primary transition-colors">{show.movie.title}</h4>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-4">
                   {dateFormat(show.showDateTime)}
                </p>
                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-gray-600 uppercase tracking-tighter">Unit Price</span>
                     <span className="text-xl font-black text-white tracking-tighter">{currency}{show.showPrice}</span>
                  </div>
                  <button className="p-2 border border-white/10 rounded-xl hover:bg-primary hover:border-primary hover:text-black transition-all">
                     <PlayCircleIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {dashboardData.activeShows.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white/5 rounded-3xl border border-dashed border-white/10">
               <PlayCircleIcon className="w-12 h-12 text-gray-700 mb-4" />
               <p className="text-gray-500 font-black uppercase tracking-widest italic text-sm">No Active Shows Found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : (
    <div className="h-screen flex items-center justify-center">
       <Loading />
    </div>
  );
};

export default Dashboard;
