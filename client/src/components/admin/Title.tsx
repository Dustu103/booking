import React from "react";

interface TitleProps {
  text1: string;
  text2: string;
}

const Title: React.FC<TitleProps> = ({ text1, text2 }) => {
  return (
    <h1 className="font-black text-4xl uppercase tracking-tighter text-white/50 italic flex items-center gap-4">
      <span className="text-white">{text1}</span>
      <span className="text-primary underline decoration-white/5 underline-offset-[12px]">{text2}</span>
    </h1>
  );
};

export default Title;
