import React, { useEffect, useState } from "react";
import { useNavigate, useParams, NavigateFunction } from "react-router-dom";
import BlurCircle from "../components/BlurCircle";
import { Heart, PlayCircleIcon, StarIcon } from "lucide-react";
import timeFormat from "../lib/timeFormat";
import DateSelect from "../components/DateSelect";
import MovieCard from "../components/MovieCard";
import Loading from "../components/Loading";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { IMovie, DateTimeMap } from "../types";

interface ShowData {
  success: boolean;
  movie: IMovie;
  dateTime: DateTimeMap;
}

const MovieDetails: React.FC = () => {
  const navigate: NavigateFunction = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [show, setShow] = useState<ShowData | null>(null);

  const {
    shows,
    axios,
    getToken,
    user,
    fetchFavoriteMovies,
    favoriteMovies,
    image_base_url,
  } = useAppContext();

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

  const handleFavorite = async () => {
    try {
      if (!user) return toast.error("Please login to proceed");

      const token = await getToken();
      const { data } = await axios.post(
        "/api/user/update-favorite",
        { movieId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        await fetchFavoriteMovies();
        toast.success(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) {
      getShow();
    }
  }, [id]);

  const isFavorite = favoriteMovies.some((m) => m._id === id);

  return show ? (
    <div className="px-6 md:px-16 lg:px-40 pt-32 md:pt-48">
      <div className="flex flex-col lg:flex-row gap-12 max-w-7xl mx-auto">
        <div className="relative group flex-shrink-0">
           <img
            src={image_base_url + show.movie.poster_path}
            alt={show.movie.title}
            className="rounded-3xl h-[500px] w-full max-w-[340px] md:max-w-[400px] object-cover shadow-2xl shadow-primary/20 transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <BlurCircle top="-40px" left="-40px" size="150" />
        </div>

        <div className="relative flex flex-col gap-6 flex-1">
          <BlurCircle top="20%" right="-100px" size="300" />
          
          <div className="flex items-center gap-2">
             <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-black rounded border border-primary/20 tracking-widest uppercase">English</span>
             <span className="px-3 py-1 bg-white/5 text-white/60 text-xs font-bold rounded border border-white/10 tracking-widest uppercase">4K / HDR</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-white leading-tight tracking-tighter">
            {show.movie.title}
          </h1>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-primary px-3 py-1 rounded-full">
              <StarIcon className="w-4 h-4 text-black fill-black" />
              <span className="text-sm font-black text-black">{show.movie.vote_average.toFixed(1)}</span>
            </div>
            <span className="text-gray-400 font-bold uppercase tracking-wider text-xs">User Rating</span>
          </div>

          <p className="text-gray-400 text-lg leading-relaxed font-light max-w-2xl bg-white/5 p-6 rounded-2xl border border-white/5 italic">
            "{show.movie.overview}"
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold text-gray-300">
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                {timeFormat(show.movie.runtime)}
             </div>
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                {show.movie.genres.map((g: any) => typeof g === 'string' ? g : g.name).join(", ")}
             </div>
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                {show.movie.release_date.split("-")[0]}
             </div>
          </div>

          <div className="flex items-center flex-wrap gap-4 mt-6">
            <button className="flex items-center gap-3 px-8 py-4 text-sm bg-white/10 hover:bg-white/20 transition-all rounded-full font-black text-white uppercase tracking-widest border border-white/10 backdrop-blur-sm active:scale-95">
              <PlayCircleIcon className="w-5 h-5 text-primary" />
              Watch Trailer
            </button>
            <a
              href="#dateSelect"
              className="px-12 py-4 text-sm bg-primary hover:bg-white transition-all rounded-full font-black text-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 text-center"
            >
              Buy Tickets
            </a>
            <button
              onClick={handleFavorite}
              className={`p-4 rounded-full transition-all border cursor-pointer active:scale-90 ${
                isFavorite 
                ? "bg-primary/20 border-primary shadow-lg shadow-primary/20" 
                : "bg-white/5 border-white/10 hover:border-white/30"
              }`}
            >
              <Heart
                className={`w-6 h-6 transition-all duration-300 ${
                  isFavorite ? "fill-primary text-primary scale-110" : "text-white"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-32">
        <h3 className="text-white font-black text-2xl mb-8 uppercase tracking-tighter flex items-center gap-4">
           <span className="w-12 h-1 bg-primary rounded-full"></span>
           Top Cast Members
        </h3>
        <div className="overflow-x-auto no-scrollbar pb-8">
          <div className="flex items-start gap-8 w-max">
            {show.movie.casts.slice(0, 12).map((cast: any, index) => (
              <div key={index} className="group flex flex-col items-center text-center w-24">
                <div className="relative mb-4">
                   <img
                    src={image_base_url + cast.profile_path}
                    alt={cast.name}
                    className="rounded-full h-24 w-24 aspect-square object-cover border-4 border-white/5 transition-all duration-300 group-hover:border-primary group-hover:scale-110 group-hover:rotate-6"
                  />
                </div>
                <p className="font-bold text-white text-xs leading-tight group-hover:text-primary transition-colors">{cast.name}</p>
                {cast.role && <p className="text-[10px] text-gray-500 mt-1 uppercase font-black tracking-tighter">{cast.role}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 bg-white/5 rounded-3xl p-1">
         <DateSelect dateTime={show.dateTime} id={id as string} />
      </div>

      <div className="mt-32 pb-20">
        <div className="flex items-center justify-between mb-12">
            <h3 className="text-white font-black text-4xl uppercase tracking-tighter">Recommended For You</h3>
            <button 
               onClick={() => { navigate("/movies"); window.scrollTo(0,0); }}
               className="text-primary font-black text-xs tracking-widest uppercase hover:text-white transition-colors"
            >
               View All
            </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {shows.slice(0, 4).map((movie, index) => (
            <MovieCard key={index} movie={movie} />
          ))}
        </div>

        <div className="flex justify-center mt-20">
          <button
            onClick={() => {
              navigate("/movies");
              window.scrollTo(0, 0);
            }}
            className="px-16 py-5 text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition-all rounded-full font-black text-white uppercase tracking-widest active:scale-95 shadow-2xl"
          >
            Discover More Movies
          </button>
        </div>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default MovieDetails;
