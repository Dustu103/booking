import React from "react";

interface BlurCircleProps {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  size?: string;
  color?: string;
}

const BlurCircle: React.FC<BlurCircleProps> = ({
  top = "auto",
  left = "auto",
  right = "auto",
  bottom = "auto",
  size = "58",
  color = "bg-primary/30",
}) => {
  return (
    <div
      className={`absolute -z-50 aspect-square rounded-full blur-[100px] transition-all duration-1000 ${color}`}
      style={{ 
        top, 
        left, 
        right, 
        bottom, 
        height: `${size}px`, 
        width: `${size}px` 
      }}
    />
  );
};

export default BlurCircle;
