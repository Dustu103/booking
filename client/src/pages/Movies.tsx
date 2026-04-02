import React from "react";
import BlurCircle from "../components/BlurCircle";
import MovieCard from "../components/MovieCard";
import { useAppContext } from "../context/AppContext";
import { IMovie } from "../types";

const Movies: React.FC = () => {
  const { shows } = useAppContext();

  return shows.length > 0 ? (
    <div className="relative py-48 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-screen">
      <BlurCircle top="150px" left="-100px" size="400" />
      <BlurCircle bottom="50px" right="-100px" size="400" />
      
      <div className="mb-16 border-b border-white/5 pb-8">
         <h1 className="text-5xl font-black text-white uppercase tracking-tighter">Now Showing</h1>
         <p className="text-gray-500 font-bold mt-2 tracking-widest uppercase text-xs">Explore all currently active movies in theaters</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12 justify-items-center">
        {shows.map((movie: IMovie) => (
          <MovieCard movie={movie} key={movie._id} />
        ))}
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-white uppercase tracking-widest opacity-20 italic">No Movies Available</h2>
        <p className="text-gray-500 font-medium">Please check back later for upcoming shows.</p>
      </div>
    </div>
  );
};

export default Movies;
