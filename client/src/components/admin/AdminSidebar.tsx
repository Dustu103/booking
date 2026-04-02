import React from "react";
import { assets } from "../../assets/assets";
import {
  LayoutDashboardIcon,
  ListCollapseIcon,
  ListIcon,
  PlusSquareIcon,
  LucideIcon,
} from "lucide-react";
import { NavLink } from "react-router-dom";

interface AdminNavLink {
  name: string;
  path: string;
  icon: LucideIcon;
}

const AdminSidebar: React.FC = () => {
  const user = {
    firstName: "System",
    lastName: "Administrator",
    imageUrl: assets.profile,
  };

  const adminNavlinks: AdminNavLink[] = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboardIcon },
    { name: "Add Shows", path: "/admin/add-shows", icon: PlusSquareIcon },
    { name: "List Shows", path: "/admin/list-shows", icon: ListIcon },
    {
      name: "List Bookings",
      path: "/admin/list-bookings",
      icon: ListCollapseIcon,
    },
  ];

  return (
    <aside className="h-[calc(100vh-64px)] md:flex flex-col items-start pt-10 w-20 md:w-64 border-r border-white/5 bg-[#050505] transition-all duration-300 overflow-hidden">
      <div className="flex flex-col items-center md:items-start px-4 md:px-8 mb-12 w-full">
        <div className="relative group">
           <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
           <img
            className="relative h-10 w-10 md:h-12 md:w-12 rounded-2xl object-cover border border-white/10 ring-2 ring-transparent group-hover:ring-primary/50 transition-all duration-300"
            src={user.imageUrl}
            alt="Profile"
          />
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full shadow-lg"></div>
        </div>
        
        <div className="mt-4 hidden md:block">
           <p className="text-white font-black text-sm tracking-tight leading-none uppercase italic">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest mt-1">Global Permissions</p>
        </div>
      </div>
      
      <div className="w-full space-y-1">
        {adminNavlinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end
            className={({ isActive }) =>
              `relative flex items-center gap-4 w-full py-4 px-6 md:px-8 transition-all duration-300 group ${
                isActive 
                ? "text-primary bg-primary/5 border-r-2 border-primary" 
                : "text-gray-500 hover:text-white hover:bg-white/5"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <link.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(255,231,10,0.5)]" : "group-hover:scale-110"}`} />
                <span className={`hidden md:block text-xs font-black uppercase tracking-widest transition-all duration-300 ${isActive ? "translate-x-1" : ""}`}>
                  {link.name}
                </span>
                
                {/* Visual indicator for collapsed state */}
                <div className={`md:hidden absolute left-0 w-1 h-8 rounded-r bg-primary transition-all duration-300 ${isActive ? "opacity-100" : "opacity-0"}`}></div>
              </>
            )}
          </NavLink>
        ))}
      </div>
      
      <div className="mt-auto p-4 md:px-8 py-10 w-full hidden md:block">
         <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Node Status</p>
            <div className="flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
               <span className="text-[10px] font-black text-white italic">PROD-SYNC.01</span>
            </div>
         </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
