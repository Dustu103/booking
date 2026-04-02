import React, { useEffect, useState } from "react";
import { useNavigate, useParams, NavigateFunction } from "react-router-dom";
import { assets } from "../assets/assets";
import Loading from "../components/Loading";
import { ArrowRightIcon, ClockIcon } from "lucide-react";
import isoTimeFormat from "../lib/isoTimeFormat";
import BlurCircle from "../components/BlurCircle";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";
import { IMovie, DateTimeMap, ShowSlot } from "../types";

interface ShowResponse {
  success: boolean;
  movie: IMovie;
  dateTime: DateTimeMap;
}

const SeatLayout: React.FC = () => {
  const groupRows = [
    ["A", "B"],
    ["C", "D"],
    ["E", "F"],
    ["G", "H"],
    ["I", "J"],
  ];

  const { id, date } = useParams<{ id: string; date: string }>();
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<ShowSlot | null>(null);
  const [show, setShow] = useState<ShowResponse | null>(null);
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);

  const navigate: NavigateFunction = useNavigate();
  const { axios, getToken, user } = useAppContext();

  const getShow = async () => {
    try {
      const { data } = await axios.get(`/api/show/${id}`);
      if (data.success) {
        setShow(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSeatClick = (seatId: string) => {
    if (!selectedTime) {
      return toast.error("Please select a show time first");
    }
    if (!selectedSeats.includes(seatId) && selectedSeats.length > 4) {
      return toast.error("Maximum 5 seats per booking allowed");
    }
    if (occupiedSeats.includes(seatId)) {
      return toast.error("This seat is already booked");
    }
    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((seat) => seat !== seatId)
        : [...prev, seatId]
    );
  };

  const renderSeats = (row: string, count = 9) => (
    <div key={row} className="flex gap-2.5 mt-2.5">
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {Array.from({ length: count }, (_, i) => {
          const seatId = `${row}${i + 1}`;
          const isSelected = selectedSeats.includes(seatId);
          const isOccupied = occupiedSeats.includes(seatId);
          
          return (
            <button
              key={seatId}
              disabled={isOccupied}
              onClick={() => handleSeatClick(seatId)}
              className={`h-9 w-9 rounded-lg border text-[10px] font-black uppercase transition-all duration-300 cursor-pointer flex items-center justify-center ${
                isSelected
                  ? "bg-primary border-primary text-black scale-110 shadow-lg shadow-primary/40"
                  : isOccupied
                  ? "bg-white/5 border-white/10 text-white/10 cursor-not-allowed grayscale"
                  : "bg-black/40 border-white/20 text-white/40 hover:border-primary/60 hover:text-primary hover:bg-primary/5"
              }`}
            >
              {seatId}
            </button>
          );
        })}
      </div>
    </div>
  );

  const getOccupiedSeats = async () => {
    if (!selectedTime) return;
    try {
      const { data } = await axios.get(
        `/api/booking/seats/${selectedTime.showId}`
      );
      if (data.success) {
        setOccupiedSeats(data.occupiedSeats);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const bookTickets = async () => {
    try {
      if (!user) return toast.error("Please login to proceed");

      if (!selectedTime || !selectedSeats.length)
        return toast.error("Please select a time and at least one seat");

      const token = await getToken();
      const { data } = await axios.post(
        "/api/booking/create",
        { showId: selectedTime.showId, selectedSeats },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        window.location.href = data.url;
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      //@ts-ignore
      toast.error(error.message);
    }
  };

  useEffect(() => {
    getShow();
  }, [id]);

  useEffect(() => {
    if (selectedTime) {
      getOccupiedSeats();
    }
  }, [selectedTime]);

  // Determine initial selectedTime if not set
  useEffect(() => {
      if (show && date && show.dateTime[date] && !selectedTime) {
          // No auto-selection to force user choice or let them pick
      }
  }, [show, date]);

  const showSlots = (show && date && show.dateTime[date]) ? show.dateTime[date] : [];

  return show ? (
    <div className="flex flex-col lg:flex-row px-6 md:px-16 lg:px-40 pt-32 pb-20 md:pt-48 gap-16 min-h-screen">
       <BlurCircle top="100px" left="-150px" size="400" />
       <BlurCircle bottom="10%" right="-100px" size="300" />

      {/* Available Timings Sidebar */}
      <div className="w-full lg:w-72 bg-white/5 border border-white/10 rounded-3xl py-10 px-8 h-max lg:sticky lg:top-40 backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
           <div className="w-1.5 h-6 bg-primary rounded-full"></div>
           <p className="text-xl font-black text-white uppercase tracking-tighter">Show Timings</p>
        </div>
        <div className="space-y-3">
          {showSlots.map((item) => {
            const isSelected = selectedTime?.time === item.time;
            return (
              <button
                key={typeof item.time === 'string' ? item.time : item.time.toISOString()}
                onClick={() => { setSelectedTime(item); setSelectedSeats([]); }}
                className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl cursor-pointer transition-all duration-300 border ${
                  isSelected
                    ? "bg-primary border-primary text-black shadow-lg shadow-primary/20 scale-[1.02]"
                    : "bg-white/5 border-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <ClockIcon className={`w-4 h-4 ${isSelected ? "text-black" : "text-primary"}`} />
                  <p className="text-sm font-black tracking-widest">{isoTimeFormat(item.time)}</p>
                </div>
                {isSelected && (
                   <span className="w-2 h-2 bg-black rounded-full animate-pulse"></span>
                )}
              </button>
            );
          })}
        </div>
        
        <p className="mt-8 text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
           Select a localized time slot for <span className="text-white italic">{date}</span> in your current timezone.
        </p>
      </div>

      {/* Seats Layout Main Section */}
      <div className="relative flex-1 flex flex-col items-center">
        <div className="text-center mb-12">
            <h1 className="text-5xl font-black text-white uppercase tracking-tighter mb-2 italic">Select Your Passage</h1>
            <div className="flex items-center justify-center gap-6">
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-white/10 border border-white/20 rounded"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Available</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded shadow-lg shadow-primary/40"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Selected</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-white/5 border border-white/10 opacity-20 rounded"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">Occupied</span>
               </div>
            </div>
        </div>

        <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center group">
             <img 
               src={assets.screenImage} 
               alt="Cinema Screen" 
               className="w-full opacity-40 group-hover:opacity-60 transition-opacity duration-1000 mb-2" 
             />
             <div className="h-1 w-2/3 bg-gradient-to-r from-transparent via-primary/50 to-transparent blur-sm mb-4"></div>
             <p className="text-white/20 text-xs font-black tracking-[1.5em] mb-12 uppercase italic">Silver Screen Center</p>
             
             {/* Actual Seat Grid */}
             <div className="flex flex-col items-center scale-90 md:scale-100 origin-top">
                <div className="flex flex-col md:flex-row gap-12 lg:gap-24">
                  <div className="flex flex-col gap-2">
                    {groupRows[0].map((row) => renderSeats(row))}
                    {groupRows[1].map((row) => renderSeats(row))}
                  </div>
                  <div className="flex flex-col gap-2">
                    {groupRows[0].map((row) => renderSeats(row))}
                    {groupRows[1].map((row) => renderSeats(row))}
                  </div>
                </div>
                
                <div className="mt-12 flex flex-col md:flex-row gap-12 lg:gap-24 pr-6">
                   <div className="flex flex-col gap-2">
                      {groupRows.slice(2,4).map((group) => group.map((row) => renderSeats(row)))}
                   </div>
                   <div className="flex flex-col gap-2">
                      {groupRows.slice(2,4).map((group) => group.map((row) => renderSeats(row)))}
                   </div>
                </div>

                <div className="mt-12 flex flex-col gap-2 items-center">
                    {groupRows[4].map((row) => renderSeats(row, 12))}
                </div>
             </div>
        </div>

        <div className="mt-20 flex flex-col md:flex-row items-center gap-8 w-full max-w-2xl bg-white/5 p-8 rounded-[40px] border border-white/10 backdrop-blur-xl mb-20">
           <div className="flex-1 text-center md:text-left">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest h-4">
                 {selectedSeats.length > 0 ? "You have selected" : ""}
              </p>
              <h4 className="text-2xl font-black text-white italic">
                 {selectedSeats.length > 0 
                    ? `${selectedSeats.length} Seats: ${selectedSeats.join(", ")}` 
                    : "No seats selected"}
              </h4>
           </div>
           
           <button
            onClick={bookTickets}
            disabled={!selectedTime || selectedSeats.length === 0}
            className="group flex items-center gap-4 px-12 py-5 text-sm bg-primary hover:bg-white transition-all rounded-full font-black text-black uppercase tracking-widest shadow-2xl shadow-primary/30 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Finalize Checkout
            <ArrowRightIcon strokeWidth={3} className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default SeatLayout;
