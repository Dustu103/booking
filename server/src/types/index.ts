import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  image: string;
}

export interface IMovie extends Document {
  _id: string;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  original_language?: string;
  tagline?: string;
  genres: string[];
  casts: Array<{ name: string; role: string; image: string }>;
  vote_average: number;
  runtime: number;
}

export interface IAccessibility {
  closedCaptions: boolean;
  audioDescription: boolean;
  wheelchairRows: string[];
  companionSeatDiscount: boolean;
}

export interface IShow extends Document {
  _id: Types.ObjectId;
  movie: string | IMovie;
  showDateTime: Date;
  showPrice: number;
  occupiedSeats: Record<string, any>;
  accessibility: IAccessibility;
}

export interface IBooking extends Document {
  _id: Types.ObjectId;
  user: string | IUser;
  show: string | IShow;
  amount: number;
  bookedSeats: string[];
  isPaid: boolean;
  paymentLink?: string;
}
