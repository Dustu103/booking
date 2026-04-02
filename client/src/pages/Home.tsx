import React from "react";
import HeroSection from "../components/HeroSection";
import FeaturedSection from "../components/FeaturedSection";
import TrailersSection from "../components/TrailersSection";

const Home: React.FC = () => {
  return (
    <main className="bg-black text-white min-h-screen">
      <HeroSection />
      <FeaturedSection />
      <TrailersSection />
    </main>
  );
};

export default Home;
