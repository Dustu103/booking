import React from "react";
import BlurCircle from "../components/BlurCircle";
import MovieCard from "../components/MovieCard";
import { useAppContext } from "../context/AppContext";
import { IMovie } from "../types";

const Favorite: React.FC = () => {
  const { favoriteMovies } = useAppContext();

  return favoriteMovies.length > 0 ? (
    <div className="relative py-48 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-screen">
      <BlurCircle top="150px" left="-150px" size="450" />
      <BlurCircle bottom="10%" right="-100px" size="300" />
      
      <div className="mb-16 border-b border-white/5 pb-8">
         <h1 className="text-5xl font-black text-white uppercase tracking-tighter italic">Your <span className="text-primary underline decoration-white/10 underline-offset-8">Curated</span> Favorites</h1>
         <p className="text-gray-500 font-bold mt-3 tracking-[0.2em] uppercase text-[10px]">Your personal collection of must-watch titles</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12 justify-items-center">
        {favoriteMovies.map((movie: IMovie) => (
          <MovieCard movie={movie} key={movie._id} />
        ))}
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black px-6">
      <div className="max-w-md text-center space-y-6">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-white/5 rounded-full border border-white/10 mb-4 animate-pulse">
           <svg className="w-10 h-10 text-gray-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </div>
        <h2 className="text-4xl font-black text-white uppercase tracking-widest opacity-20 italic">List Is Currently Empty</h2>
        <p className="text-gray-500 font-medium leading-relaxed">You haven't added any movies to your favorites yet. Start exploring the catalog to curate your perfect watchlist.</p>
        <button 
           onClick={() => { window.location.href = "/movies"; }}
           className="px-10 py-4 bg-primary text-black font-black text-xs uppercase tracking-widest rounded-full hover:bg-white transition-all shadow-xl shadow-primary/10"
        >
           Start Exploring
        </button>
      </div>
    </div>
  );
};

export default Favorite;
