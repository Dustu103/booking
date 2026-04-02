import AdminNavbar from "../../components/admin/AdminNavbar";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { Outlet } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { useEffect } from "react";
import Loading from "../../components/Loading";
import React from "react";

const Layout: React.FC = () => {
  const { isAdmin, fetchIsAdmin } = useAppContext();

  useEffect(() => {
    fetchIsAdmin();
  }, [fetchIsAdmin]);

  return isAdmin ? (
    <div className="bg-[#050505] min-h-screen">
      <AdminNavbar />
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 px-6 py-10 md:px-12 h-full overflow-y-auto custom-scrollbar bg-gradient-to-br from-black to-[#0a0a0a]">
          <div className="max-w-7xl mx-auto">
             <Outlet />
          </div>
        </main>
      </div>
    </div>
  ) : (
    <div className="bg-black h-screen flex items-center justify-center">
       <Loading />
    </div>
  );
};

export default Layout;
