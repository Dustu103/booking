import React, { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, CalendarCheck2 } from "lucide-react";
import BlurCircle from "./BlurCircle";
import toast from "react-hot-toast";
import { useNavigate, NavigateFunction } from "react-router-dom";
import { DateTimeMap } from "../types";

interface DateSelectProps {
  dateTime: DateTimeMap;
  id: string;
}

const DateSelect: React.FC<DateSelectProps> = ({ dateTime, id }) => {
  const navigate: NavigateFunction = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  const onBookHandler = () => {
    if (!selected) {
      return toast.error("Please select a date to proceed");
    }
    navigate(`/movies/${id}/${selected}`);
    window.scrollTo(0, 0);
  };

  const dates = Object.keys(dateTime);

  return (
    <div id="dateSelect" className="pt-24 pb-12">
      <div className="relative overflow-hidden p-10 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-3xl shadow-2xl shadow-primary/5">
        <BlurCircle top="-50px" left="-50px" size="200" />
        <BlurCircle bottom="-50px" right="-50px" size="200" />
        
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
          <div className="w-full lg:w-auto">
            <div className="flex items-center gap-3 mb-8">
              <CalendarCheck2 className="text-primary w-6 h-6" />
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Select Show Date</h3>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                className="p-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-20 cursor-pointer"
                disabled={dates.length <= 1}
              >
                <ChevronLeftIcon className="text-white w-6 h-6" />
              </button>
              
              <div className="flex flex-wrap gap-4 items-center justify-center lg:justify-start">
                {dates.map((date) => {
                  const dateObj = new Date(date);
                  const isSelected = selected === date;
                  
                  return (
                    <button
                      onClick={() => setSelected(date)}
                      key={date}
                      className={`group flex flex-col items-center justify-center p-3 h-20 w-16 rounded-2xl transition-all duration-300 border cursor-pointer ${
                        isSelected
                          ? "bg-primary border-primary scale-110 shadow-lg shadow-primary/30"
                          : "bg-white/5 border-white/10 hover:border-primary/50 hover:bg-white/10"
                      }`}
                    >
                      <span className={`text-xs font-bold uppercase tracking-tighter ${isSelected ? "text-black/60" : "text-gray-500 group-hover:text-primary/70"}`}>
                        {dateObj.toLocaleString("en-US", { month: "short" })}
                      </span>
                      <span className={`text-2xl font-black ${isSelected ? "text-black" : "text-white"}`}>
                        {dateObj.getDate()}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button 
                className="p-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-20 cursor-pointer"
                disabled={dates.length <= 1}
              >
                <ChevronRightIcon className="text-white w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center lg:items-end gap-4 w-full lg:w-auto">
            <div className="text-center lg:text-right">
                <p className="text-gray-400 text-sm font-medium">Selected Date</p>
                <p className="text-white font-bold text-lg">
                  {selected ? new Date(selected).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "None selected"}
                </p>
            </div>
            
            <button
              onClick={onBookHandler}
              className="w-full lg:w-auto px-16 py-5 bg-primary hover:bg-white transition-all rounded-full font-black text-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selected}
            >
              Confirm & Book
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateSelect;
