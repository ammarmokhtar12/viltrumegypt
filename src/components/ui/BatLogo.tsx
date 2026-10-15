import React from "react";

interface BatLogoProps {
  className?: string;
  fill?: string;
}

export default function BatLogo({
  className = "w-6 h-6",
  fill = "currentColor",
}: BatLogoProps) {
  return (
    <svg
      viewBox="0 0 100 50"
      className={className}
      fill={fill}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* The Dark Knight Silhouette */}
      <path d="M 50,15 
               C 52,10 54,3 56,0 
               C 58,4 60,6 67,6 
               C 77,6 90,14 100,28 
               C 92,23 83,24 77,31 
               C 70,26 62,28 57,38 
               C 55,33 50,30 47,33 
               C 43,30 39,33 37,38 
               C 32,28 24,26 17,31 
               C 11,24 2,23 -6,28 
               C 4,14 17,6 27,6 
               C 34,6 36,4 38,0 
               C 40,3 42,10 44,15 
               C 47,13.5 48.5,13.5 50,15 Z" 
            transform="translate(3, 4) scale(0.94)"
      />
    </svg>
  );
}
