export interface IUser {
  _id: string;
  name: string;
  email: string;
  image: string;
  role?: "admin" | "user";
}

export interface IMovie {
  _id: string;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  genres: string[] | { id: number; name: string }[];
  casts: { name: string; role: string; image: string }[];
  vote_average: number;
  runtime: number;
}

export interface IShow {
  _id: string;
  movie: string | IMovie;
  showDateTime: string | Date;
  showPrice: number;
  occupiedSeats: Record<string, string>; // seatId -> userId
}

export interface IBooking {
  _id: string;
  user: string | IUser;
  show: string | IShow;
  amount: number;
  bookedSeats: string[];
  isPaid: boolean;
  paymentLink?: string;
  createdAt?: string;
}

// Populated version for MyBookings page
export interface IBookingPopulated extends Omit<IBooking, "show"> {
  show: IShow & { movie: IMovie };
}

export interface IAccessibility {
  closedCaptions: boolean;
  audioDescription: boolean;
  wheelchairRows: string[];
  companionSeatDiscount: boolean;
}

export interface ShowSlot {
  time: string | Date;
  showId: string;
  accessibility?: IAccessibility;
}

export interface DateTimeMap {
  [date: string]: ShowSlot[];
}

export interface AppContextType {
  isAdmin: boolean;
  shows: IMovie[];
  favoriteMovies: IMovie[];
  image_base_url: string;
  fetchIsAdmin: () => Promise<void>;
  fetchFavoriteMovies: () => Promise<void>;
  user: any; // Clerk User
  getToken: () => Promise<string | null>;
  navigate: (path: string) => void;
  axios: any;
}
