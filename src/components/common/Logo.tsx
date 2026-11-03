import React from 'react';
import officialLogoImg from '../../assets/images/regenerated_image_1793705163021.png';

interface LogoProps {
  variant?: 'dark' | 'light' | 'yellow';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  stacked?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className = '',
  stacked = false,
}) => {
  const heightClasses = {
    sm: stacked ? 'h-14' : 'h-8 sm:h-9',
    md: stacked ? 'h-20' : 'h-10 sm:h-12',
    lg: stacked ? 'h-28' : 'h-14 sm:h-16',
    xl: stacked ? 'h-36' : 'h-18 sm:h-20',
  };

  const logoSrc = stacked 
    ? '/english_join_logo_stacked.svg' 
    : officialLogoImg;

  return (
    <div
      className={`inline-flex items-center select-none transition-transform duration-200 hover:scale-[1.02] ${className}`}
    >
      <img
        src={logoSrc}
        alt="English Join Indonesia - Official Logo"
        className={`${heightClasses[size]} w-auto object-contain drop-shadow-sm`}
        loading="eager"
      />
    </div>
  );
};
