import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import axios, { AxiosStatic } from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useLocation, useNavigate, NavigateFunction } from "react-router-dom";
import toast from "react-hot-toast";
import { IMovie, AppContextType } from "../types";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [shows, setShows] = useState<IMovie[]>([]);
  const [favoriteMovies, setFavoriteMovies] = useState<IMovie[]>([]);

  const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL as string;

  const { user } = useUser();
  const { getToken } = useAuth();
  const location = useLocation();
  const navigate: NavigateFunction = useNavigate();

  const fetchIsAdmin = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/admin/is-admin", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setIsAdmin(data.isAdmin);

      if (!data.isAdmin && location.pathname.startsWith("/admin")) {
        navigate("/");
        toast.error("You are not authorized to access admin dashboard");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchShows = async () => {
    try {
      const { data } = await axios.get("/api/show/all");

      if (data.success) {
        setShows(data.shows);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchFavoriteMovies = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/user/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setFavoriteMovies(data.movies);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchShows();
  }, []);

  useEffect(() => {
    if (user) {
      fetchIsAdmin();
      fetchFavoriteMovies();
    }
  }, [user]);

  const value: AppContextType = {
    axios: axios as AxiosStatic,
    fetchIsAdmin,
    user,
    //@ts-ignore - Clerks getToken type is complex
    getToken,
    navigate,
    isAdmin,
    shows,
    favoriteMovies,
    fetchFavoriteMovies,
    image_base_url,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
