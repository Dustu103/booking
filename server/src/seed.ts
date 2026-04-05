import mongoose from "mongoose";
import "dotenv/config";
import axios from "axios";
import Movie from "./models/Movie.js";
import Show from "./models/Show.js";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const MONGODB_URI = "mongodb://localhost:27017/quickshow";

async function seed() {
  console.log("Connecting to MongoDB at", MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  if (!TMDB_API_KEY) {
    console.error("Missing TMDB_API_KEY in .env");
    process.exit(1);
  }

  console.log("Fetching 'now playing' movies from TMDB...");
  const { data } = await axios.get("https://api.themoviedb.org/3/movie/now_playing", {
    params: { api_key: TMDB_API_KEY },
  });

  const topMovies = data.results.slice(0, 8); // Grab up to 8 movies

  for (const apiMovie of topMovies) {
    const movieId = String(apiMovie.id);
    let movie = await Movie.findById(movieId);

    if (!movie) {
      console.log(`Fetching details for movie ID: ${movieId} (${apiMovie.title})...`);
      const [details, credits] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}`),
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${TMDB_API_KEY}`)
      ]);
      
      const mData = details.data;
      const cData = credits.data;
      
      movie = await Movie.create({
        _id: movieId,
        title: mData.title,
        overview: mData.overview,
        poster_path: mData.poster_path,
        backdrop_path: mData.backdrop_path,
        release_date: mData.release_date,
        original_language: mData.original_language,
        tagline: mData.tagline || "",
        genres: mData.genres || [],
        casts: cData.cast || [],
        vote_average: mData.vote_average || 0,
        runtime: mData.runtime || 120,
      });
      console.log(`Created movie: ${movie.title}`);
    } else {
      console.log(`Movie already exists: ${movie.title}`);
    }

    console.log(`Creating shows for ${movie.title}...`);
    // Create some shows over the next 5 days
    for (let i = 0; i < 5; i++) {
        const d1 = new Date();
        d1.setDate(d1.getDate() + i);
        d1.setHours(18, 0, 0, 0); // 6:00 PM

        await Show.create({
            movie: movieId,
            showDateTime: d1,
            showPrice: 15,
            occupiedSeats: {}
        });
        
        const d2 = new Date();
        d2.setDate(d2.getDate() + i);
        d2.setHours(21, 30, 0, 0); // 9:30 PM

        await Show.create({
            movie: movieId,
            showDateTime: d2,
            showPrice: 20,
            occupiedSeats: {}
        });
    }
  }

  console.log("✅ Seeding complete. Your database is now populated!");
  process.exit(0);
}

seed().catch((err) => {
    console.error("Error seeding DB:", err);
    process.exit(1);
});
