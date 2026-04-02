import React from "react";
import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";
import { ShieldCheckIcon } from "lucide-react";

const AdminNavbar: React.FC = () => {
  return (
    <nav className="flex items-center justify-between px-8 md:px-12 h-16 border-b border-white/5 bg-[#050505] sticky top-0 z-50 backdrop-blur-3xl">
      <Link to="/" className="hover:opacity-80 transition-opacity">
        <img src={assets.logo} alt="Project Logo" className="w-32 h-auto" />
      </Link>
      
      <div className="flex items-center gap-4">
         <div className="flex flex-col items-end mr-3">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">Authenticated</span>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter leading-none">Security Protocol Active</span>
         </div>
         <div className="bg-primary/20 p-2 rounded-xl border border-primary/20 group hover:border-primary transition-all cursor-crosshair">
            <ShieldCheckIcon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
         </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
