import React from "react";
import { assets } from "../assets/assets";
import { ArrowRight, CalendarIcon, ClockIcon } from "lucide-react";
import { useNavigate, NavigateFunction } from "react-router-dom";

const HeroSection: React.FC = () => {
  const navigate: NavigateFunction = useNavigate();

  const handleExplore = () => {
    navigate("/movies");
    window.scrollTo(0, 0);
  };

  return (
    <div className='relative flex flex-col items-start justify-center gap-6 px-6 md:px-16 lg:px-36 bg-[url("/backgroundImage.png")] bg-cover bg-center h-screen overflow-hidden'>
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent -z-10" />
      
      <img
        src={assets.marvelLogo}
        alt="Partner Logo"
        className="max-h-12 lg:h-12 mt-20 drop-shadow-xl animate-fade-in"
      />

      <h1 className="text-5xl md:text-[84px] md:leading-[90px] font-black tracking-tighter text-white uppercase italic">
        Guardians <br /> of the Galaxy
      </h1>

      <div className="flex flex-wrap items-center gap-6 text-sm font-bold tracking-widest text-primary/90 uppercase">
        <span className="bg-primary/10 px-3 py-1 rounded border border-primary/20">Action | Adventure | Sci-Fi</span>
        <div className="flex items-center gap-2 text-white/80">
          <CalendarIcon className="w-4 h-4 text-primary" /> 2018
        </div>
        <div className="flex items-center gap-2 text-white/80">
          <ClockIcon className="w-4 h-4 text-primary" /> 2h 8m
        </div>
      </div>
      
      <p className="max-w-xl text-gray-400 text-lg leading-relaxed font-light">
        In a post-apocalyptic world where cities ride on wheels and consume each
        other to survive, two people meet in London and try to stop a
        conspiracy that threatens the very fabric of existence.
      </p>

      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={handleExplore}
          className="group flex items-center gap-3 px-10 py-5 text-sm bg-primary hover:bg-white transition-all rounded-full font-black text-black uppercase tracking-widest shadow-2xl shadow-primary/20 active:scale-95"
        >
          Explore Movies
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
        
        <button 
          onClick={handleExplore}
          className="px-10 py-5 text-sm border border-white/20 hover:bg-white/10 transition-colors rounded-full font-bold text-white uppercase tracking-widest bg-transparent backdrop-blur-sm"
        >
          Watch Trailer
        </button>
      </div>
    </div>
  );
};

export default HeroSection;
