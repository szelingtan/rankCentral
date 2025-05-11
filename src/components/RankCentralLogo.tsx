
import React from 'react';

export const RankCentralLogo: React.FC<{ className?: string; size?: number }> = ({ 
  className = "", 
  size = 40 
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 50 50" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="mr-2"
      >
        <circle cx="25" cy="25" r="25" fill="#0D6E9A" />
        <path 
          d="M15 17H35M15 25H30M15 33H25" 
          stroke="white" 
          strokeWidth="3" 
          strokeLinecap="round" 
        />
        <path 
          d="M37 23L31 29L28 26" 
          stroke="#24B5CC" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
      <span className="font-bold text-brand-primary text-xl ml-1">
        rank<span className="text-brand-accent text-xl">Central</span>
      </span>
    </div>
  );
};

export default RankCentralLogo;
