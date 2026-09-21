import React from 'react';

interface LogoProps {
  variant?: 'full' | 'icon' | 'horizontal';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'horizontal',
  className = '',
  size = 'md'
}) => {
  if (variant === 'icon') {
    const sizeClasses = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-14 w-14',
      xl: 'h-20 w-20'
    }[size];

    return (
      <img
        src="/logo-icon.svg"
        alt="KibuMall Logo Icon"
        className={`object-contain select-none shrink-0 ${sizeClasses} ${className}`}
        referrerPolicy="no-referrer"
      />
    );
  }

  if (variant === 'full') {
    const sizeClasses = {
      sm: 'h-16 w-auto',
      md: 'h-24 w-auto',
      lg: 'h-36 w-auto',
      xl: 'h-48 w-auto'
    }[size];

    return (
      <img
        src="/logo.svg"
        alt="KibuMall Marketplace"
        className={`object-contain select-none ${sizeClasses} ${className}`}
        referrerPolicy="no-referrer"
      />
    );
  }

  // Horizontal variant (Ideal for Navigation Bar)
  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-10 sm:h-11 w-auto',
    lg: 'h-12 sm:h-14 w-auto',
    xl: 'h-16 sm:h-20 w-auto'
  }[size];

  return (
    <img
      src="/logo-horizontal.svg"
      alt="KibuMall Marketplace"
      className={`object-contain select-none ${sizeClasses} ${className}`}
      referrerPolicy="no-referrer"
    />
  );
};

export default Logo;
