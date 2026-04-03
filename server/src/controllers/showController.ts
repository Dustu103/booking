import { Request, Response } from "express";
import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import { IMovie, IShow } from "../types/index.js";

// API to get now playing movies from TMDB API
export const getNowPlayingMovies = async (_req: Request, res: Response) => {
  try {
    const { data } = await axios.get(
      "https://api.themoviedb.org/3/movie/now_playing",
      {
        params: { api_key: process.env.TMDB_API_KEY },
      }
    );

    const movies = data.results;
    res.json({ success: true, movies: movies });
  } catch (error: any) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

interface ShowInputItem {
  date: string;
  time: string[];
}

// API to add a new show to the database
export const addShow = async (req: Request, res: Response) => {
  try {
    const { movieId, showsInput, showPrice }: { movieId: string; showsInput: ShowInputItem[]; showPrice: number } = req.body;

    let movie = (await Movie.findById(movieId)) as IMovie | null;

    if (!movie) {
      // Fetch movie details and credits from TMDB API
      const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
          params: { api_key: process.env.TMDB_API_KEY },
        }),

        axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
          params: { api_key: process.env.TMDB_API_KEY },
        }),
      ]);

      const movieApiData = movieDetailsResponse.data;
      const movieCreditsData = movieCreditsResponse.data;

      const movieDetails = {
        _id: movieId,
        title: movieApiData.title,
        overview: movieApiData.overview,
        poster_path: movieApiData.poster_path,
        backdrop_path: movieApiData.backdrop_path,
        genres: movieApiData.genres,
        casts: movieCreditsData.cast,
        release_date: movieApiData.release_date,
        original_language: movieApiData.original_language,
        tagline: movieApiData.tagline || "",
        vote_average: movieApiData.vote_average,
        runtime: movieApiData.runtime,
      };

      //   Add movie to the database
      movie = (await Movie.create(movieDetails)) as IMovie;
    }

    const showsToCreate: any[] = [];
    showsInput.forEach((show) => {
      const showDate = show.date;
      show.time.forEach((time) => {
        const dateTimeString = `${showDate}T${time}`;
        showsToCreate.push({
          movie: movieId,
          showDateTime: new Date(dateTimeString),
          showPrice,
          occupiedSeats: {}, // Initialize with empty object
        });
      });
    });

    if (showsToCreate.length > 0) {
      await Show.insertMany(showsToCreate);
    }

    res.json({ success: true, message: "Show Added successfully." });
  } catch (error: any) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all shows from the database
export const getShows = async (_req: Request, res: Response) => {
  try {
    const shows = (await Show.find({ showDateTime: { $gte: new Date() } })
      .populate("movie")
      .sort({ showDateTime: 1 })) as (IShow & { movie: IMovie })[];

    // filter unique shows
    const uniqueShows = new Set(shows.map((show) => show.movie));

    res.json({ success: true, shows: Array.from(uniqueShows) });
  } catch (error: any) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get a single show from the database
export const getShow = async (req: Request, res: Response) => {
  try {
    const { movieId } = req.params;
    // get all upcoming shows for the movie
    const shows = (await Show.find({
      movie: movieId,
      showDateTime: { $gte: new Date() },
    })) as IShow[];

    const movie = await Movie.findById(movieId);
    const dateTime: Record<string, { time: Date; showId: string | any }[]> = {};

    shows.forEach((show) => {
      const date = show.showDateTime.toISOString().split("T")[0];
      if (!dateTime[date]) {
        dateTime[date] = [];
      }

      dateTime[date].push({ time: show.showDateTime, showId: show._id });
    });

    res.json({ success: true, movie, dateTime });
  } catch (error: any) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
