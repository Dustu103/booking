import React from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate, NavigateFunction } from "react-router-dom";
import BlurCircle from "./BlurCircle";
import MovieCard from "./MovieCard";
import { useAppContext } from "../context/AppContext";
import { IMovie } from "../types";

const FeaturedSection: React.FC = () => {
  const navigate: NavigateFunction = useNavigate();
  const { shows } = useAppContext();

  const handleViewAll = () => {
    navigate("/movies");
    window.scrollTo(0, 0);
  };

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-44 overflow-hidden relative">
       {/* Background decorative elements */}
       <BlurCircle top="-100px" right="-100px" />
       
      <div className="flex items-center justify-between pt-20 pb-12 border-b border-white/5">
        <div>
           <h2 className="text-white font-bold text-3xl tracking-tight">Now Showing</h2>
           <p className="text-gray-500 text-sm mt-1">Catch the latest blockbusters in theaters near you.</p>
        </div>
        <button
          onClick={handleViewAll}
          className="group flex items-center gap-2 text-sm font-bold text-primary cursor-pointer hover:text-white transition-colors"
        >
          VIEW ALL
          <ArrowRight className="group-hover:translate-x-1 transition-transform w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-12 content-center justify-items-center">
        {shows.slice(0, 4).map((movie: IMovie) => (
          <MovieCard key={movie._id} movie={movie} />
        ))}
      </div>

      <div className="flex justify-center mt-20">
        <button
          onClick={handleViewAll}
          className="px-12 py-4 text-sm bg-primary hover:bg-primary-dull transition-all rounded-full font-bold text-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary/20 active:scale-95"
        >
          Explore All Movies
        </button>
      </div>
    </div>
  );
};

export default FeaturedSection;
