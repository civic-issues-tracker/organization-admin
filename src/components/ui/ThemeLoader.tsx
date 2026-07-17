import React from 'react';

const ThemeLoader: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`relative ${sizeClasses[size]} animate-spin-slow`}>
        <div className="absolute inset-0 rounded-full border-4 border-secondary/10" />
        <div className="absolute inset-0 rounded-full border-4 border-l-transparent border-r-transparent border-b-transparent border-t-secondary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-1/2 w-1/2 items-center justify-center rounded-sm bg-secondary shadow-lg rotate-45 animate-pulse">
            <span className="text-[10px] font-black uppercase text-white -rotate-45">Yegna</span>
          </div>
        </div>
      </div>

      <span className="text-[10px] md:text-xs font-black text-secondary uppercase tracking-[0.3em] animate-pulse">
        Loading...
      </span>
    </div>
  );
};

export default ThemeLoader;