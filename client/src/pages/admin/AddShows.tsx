import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import { CheckIcon, Trash2Icon, StarIcon, PlusIcon, CalendarIcon, DollarSignIcon } from "lucide-react";
import { kConverter } from "../../lib/kConverter";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

interface MovieOption {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  vote_count: number;
  release_date: string;
}

interface DateTimeSelection {
  [date: string]: string[];
}

const AddShows: React.FC = () => {
  const { axios, getToken, user, image_base_url } = useAppContext();
  const currency = (import.meta.env.VITE_CURRENCY as string) || "$";

  const [nowPlayingMovies, setNowPlayingMovies] = useState<MovieOption[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<number | null>(null);
  const [dateTimeSelection, setDateTimeSelection] = useState<DateTimeSelection>({});
  const [dateTimeInput, setDateTimeInput] = useState<string>("");
  const [showPrice, setShowPrice] = useState<string>("");
  const [addingShow, setAddingShow] = useState<boolean>(false);

  const fetchNowPlayingMovies = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/show/now-playing", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setNowPlayingMovies(data.movies);
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
    }
  };

  const handleDateTimeAdd = () => {
    if (!dateTimeInput) return;
    const [date, time] = dateTimeInput.split("T");
    if (!date || !time) return;

    setDateTimeSelection((prev) => {
      const times = prev[date] || [];
      if (!times.includes(time)) {
        return { ...prev, [date]: [...times, time] };
      }
      return prev;
    });
    setDateTimeInput("");
  };

  const handleRemoveTime = (date: string, time: string) => {
    setDateTimeSelection((prev) => {
      const filteredTimes = prev[date].filter((t) => t !== time);
      if (filteredTimes.length === 0) {
        const { [date]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [date]: filteredTimes };
    });
  };

  const handleSubmit = async () => {
    try {
      setAddingShow(true);

      if (!selectedMovie || Object.keys(dateTimeSelection).length === 0 || !showPrice) {
        return toast.error("Missing required fields: Movie, Schedule, or Price");
      }

      const showsInput = Object.entries(dateTimeSelection).map(([date, times]) => ({
        date,
        time: times,
      }));

      const payload = {
        movieId: selectedMovie,
        showsInput,
        showPrice: Number(showPrice),
      };

      const token = await getToken();
      const { data } = await axios.post("/api/show/add", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        toast.success(data.message);
        setSelectedMovie(null);
        setDateTimeSelection({});
        setShowPrice("");
      } else {
        toast.error(data.message);
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(error.response?.data?.message || "An error occurred. Please try again.");
    } finally {
      setAddingShow(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNowPlayingMovies();
    }
  }, [user]);

  return nowPlayingMovies.length > 0 ? (
    <div className="pb-24">
      <Title text1="ORCHESTRATE" text2="SHOWS" />
      
      <div className="mt-12">
        <h3 className="text-white font-black text-xl uppercase tracking-tighter mb-6 flex items-center gap-3">
           <span className="w-8 h-1 bg-primary rounded-full"></span>
           1. Select Theater Catalog
        </h3>
        
        <div className="overflow-x-auto no-scrollbar pb-6">
          <div className="flex gap-6 w-max px-2">
            {nowPlayingMovies.map((movie) => (
              <div
                key={movie.id}
                className={`relative group w-44 cursor-pointer transition-all duration-500`}
                onClick={() => setSelectedMovie(movie.id)}
              >
                <div className={`relative rounded-3xl overflow-hidden border-2 transition-all duration-500 shadow-2xl ${selectedMovie === movie.id ? "border-primary scale-105" : "border-white/5 opacity-60 grayscale hover:opacity-100 hover:grayscale-0"}`}>
                  <img
                    src={image_base_url + movie.poster_path}
                    alt={movie.title}
                    className="w-full aspect-[2/3] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60 backdrop-blur-md translate-y-full group-hover:translate-y-0 transition-transform">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <StarIcon className="w-3 h-3 text-primary fill-primary" />
                        <span className="text-[10px] font-black text-white">{movie.vote_average.toFixed(1)}</span>
                      </div>
                      <span className="text-gray-400 text-[9px] font-bold uppercase">{kConverter(movie.vote_count)} Votes</span>
                    </div>
                  </div>

                  {selectedMovie === movie.id && (
                    <div className="absolute top-3 right-3 flex items-center justify-center bg-primary h-8 w-8 rounded-full shadow-lg shadow-primary/40 animate-bounce">
                      <CheckIcon className="w-5 h-5 text-black" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <p className={`mt-3 font-black text-xs truncate transition-colors uppercase tracking-tight ${selectedMovie === movie.id ? "text-primary" : "text-gray-500"}`}>{movie.title}</p>
                <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">{movie.release_date.split("-")[0]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12 bg-white/5 p-10 rounded-[40px] border border-white/10 shadow-2xl backdrop-blur-xl">
        {/* Left Side: Inputs */}
        <div className="space-y-10">
          <div>
            <h3 className="text-white font-black text-lg uppercase tracking-tighter mb-6 flex items-center gap-2">
               <DollarSignIcon className="w-5 h-5 text-primary" />
               2. Set Show Pricing
            </h3>
            <div className="relative group max-w-sm">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-primary font-black text-xl">{currency}</div>
                <input
                  min={0}
                  type="number"
                  value={showPrice}
                  onChange={(e) => setShowPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-black/40 border border-white/10 group-hover:border-primary/50 focus:border-primary outline-none rounded-3xl py-6 pl-12 pr-8 text-2xl font-black text-white transition-all placeholder:text-gray-800"
                />
            </div>
            <p className="text-gray-600 text-[10px] uppercase font-black tracking-widest mt-3 ml-2">Final ticket price per seat allocated</p>
          </div>

          <div>
            <h3 className="text-white font-black text-lg uppercase tracking-tighter mb-6 flex items-center gap-2">
               <CalendarIcon className="w-5 h-5 text-primary" />
               3. Define Show Sequence
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 max-w-lg">
              <input
                type="datetime-local"
                value={dateTimeInput}
                onChange={(e) => setDateTimeInput(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 focus:border-primary outline-none rounded-2xl py-4 px-6 text-sm font-bold text-white transition-all"
              />
              <button
                onClick={handleDateTimeAdd}
                className="bg-primary hover:bg-white text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap shadow-xl shadow-primary/20"
              >
                <PlusIcon className="w-4 h-4" />
                Add Slot
              </button>
            </div>
            <p className="text-gray-600 text-[10px] uppercase font-black tracking-widest mt-3 ml-2">Add multiple dates and times for the same movie</p>
          </div>
        </div>

        {/* Right Side: Preview */}
        <div className="bg-black/40 rounded-[32px] p-8 border border-white/5 h-full min-h-[300px]">
           <h4 className="text-gray-500 font-black uppercase text-[10px] tracking-[0.2em] mb-6 border-b border-white/5 pb-4">Schedule Manifest Preview</h4>
           
           {Object.keys(dateTimeSelection).length > 0 ? (
             <div className="space-y-8 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                {Object.entries(dateTimeSelection).map(([date, times]) => (
                  <div key={date} className="animate-fade-in">
                    <div className="flex items-center gap-3 mb-4">
                       <span className="text-white font-black text-sm uppercase tracking-tighter shadow-xl">{date}</span>
                       <div className="flex-1 h-[1px] bg-gradient-to-r from-white/10 to-transparent"></div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {times.map((time) => (
                        <div
                          key={time}
                          className="group bg-white/5 border border-white/10 pl-5 pr-3 py-3 flex items-center justify-between rounded-2xl hover:border-primary/50 transition-all hover:bg-white/10 min-w-[120px]"
                        >
                          <span className="text-white font-black text-xs tracking-widest">{time}</span>
                          <button
                             onClick={() => handleRemoveTime(date, time)}
                             className="p-1 px-2 text-gray-700 hover:text-red-500 transition-colors"
                          >
                             <Trash2Icon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
             </div>
           ) : (
             <div className="h-40 flex flex-col items-center justify-center text-center opacity-20 italic">
               <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Waiting for slot definitions...</p>
             </div>
           )}
        </div>
      </div>

      <div className="flex justify-center mt-16">
        <button
          onClick={handleSubmit}
          disabled={addingShow}
          className="group relative px-20 py-6 bg-primary hover:bg-white text-black font-black uppercase tracking-[0.3em] text-xs rounded-full transition-all duration-500 shadow-2xl shadow-primary/30 active:scale-95 disabled:grayscale"
        >
          {addingShow ? "Processing Matrix..." : "DEPLOY SHOW CONFIGURATION"}
          <div className="absolute -inset-1 bg-primary/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </div>
    </div>
  ) : (
    <div className="h-screen flex items-center justify-center">
       <Loading />
    </div>
  );
};

export default AddShows;
