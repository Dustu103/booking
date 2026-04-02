import React, { useState } from "react";
import { dummyTrailers, ITrailer } from "../assets/assets";
import ReactPlayer from "react-player";
import BlurCircle from "./BlurCircle";
import { PlayCircleIcon } from "lucide-react";

const TrailersSection: React.FC = () => {
  const [currentTrailer, setCurrentTrailer] = useState<ITrailer>(dummyTrailers[0]);

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-44 py-24 overflow-hidden relative">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-white font-bold text-3xl mb-8 tracking-tight flex items-center gap-3">
          <span className="w-8 h-1 bg-primary rounded-full"></span>
          OFFICIAL TRAILERS
        </h2>

        <div className="relative group rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-black/40 backdrop-blur-sm">
          <BlurCircle top="-100px" right="-100px" size="300" />
          <div className="aspect-video w-full max-w-[960px] mx-auto overflow-hidden">
             <ReactPlayer
              url={currentTrailer.videoUrl}
              controls={true}
              playing={false}
              light={currentTrailer.image}
              width="100%"
              height="100%"
              className="react-player"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-10">
          {dummyTrailers.map((trailer: ITrailer) => (
            <div
              key={trailer.image}
              className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 group ${
                currentTrailer.image === trailer.image 
                ? "ring-2 ring-primary ring-offset-4 ring-offset-black scale-95 shadow-lg shadow-primary/20" 
                : "opacity-60 hover:opacity-100 grayscale hover:grayscale-0 hover:-translate-y-1"
              }`}
              onClick={() => setCurrentTrailer(trailer)}
            >
              <img
                src={trailer.image}
                alt="Trailer thumbnail"
                className="w-full aspect-video object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <PlayCircleIcon
                  strokeWidth={2}
                  className="text-white w-10 h-10 drop-shadow-lg"
                />
              </div>
              
              {currentTrailer.image === trailer.image && (
                <div className="absolute top-2 right-2 bg-primary text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                   Playing
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrailersSection;
