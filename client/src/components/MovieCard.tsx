import React from "react";
import { StarIcon } from "lucide-react";
import { useNavigate, NavigateFunction } from "react-router-dom";
import timeFormat from "../lib/timeFormat";
import { useAppContext } from "../context/AppContext";
import { IMovie } from "../types";

interface MovieCardProps {
  movie: IMovie;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const navigate: NavigateFunction = useNavigate();
  const { image_base_url } = useAppContext();

  const handleNavigate = () => {
    navigate(`/movies/${movie._id}`);
    window.scrollTo(0, 0);
  };

  return (
    <div className="flex flex-col justify-between p-4 bg-gray-900/50 border border-white/5 hover:border-white/20 rounded-2xl hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/20 transition duration-300 w-full max-w-[280px]">
      <div className="relative group overflow-hidden rounded-xl h-52 mb-3">
        <img
          onClick={handleNavigate}
          src={image_base_url + movie.backdrop_path}
          alt={movie.title}
          className="w-full h-full object-cover object-center cursor-pointer group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="text-white text-xs font-bold uppercase tracking-wider">View Details</span>
        </div>
      </div>

      <p className="font-bold text-white text-lg truncate mb-1">{movie.title}</p>

      <p className="text-xs text-gray-400 flex items-center gap-1.5 mb-4">
        <span>{new Date(movie.release_date).getFullYear()}</span>
        <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
        <span className="truncate">
          {movie.genres
            .slice(0, 2)
            .map((genre: any) => typeof genre === 'string' ? genre : genre.name)
            .join(" | ")}
        </span>
        <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
        <span>{timeFormat(movie.runtime)}</span>
      </p>

      <div className="flex items-center justify-between mt-auto">
        <button
          onClick={handleNavigate}
          className="px-5 py-2 text-xs bg-primary hover:bg-primary-dull transition-colors rounded-full font-bold text-black uppercase tracking-tighter"
        >
          Buy Tickets
        </button>
        <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-md border border-white/10">
          <StarIcon className="w-3.5 h-3.5 text-primary fill-primary" />
          <span className="text-xs font-bold text-white leading-none">
            {movie.vote_average.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
