import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/src/lib/utils';

interface BeforeAfterSliderProps {
  before: string;
  after: string;
  className?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ before, after, className }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    let x = 0;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
    } else {
      x = (e as MouseEvent).clientX - rect.left;
    }

    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  };

  const handleMouseDown = () => {
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseUp = () => {
    window.removeEventListener('mousemove', handleMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = () => {
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleTouchEnd);
  };

  const handleTouchEnd = () => {
    window.removeEventListener('touchmove', handleMove);
    window.removeEventListener('touchend', handleTouchEnd);
  };

  return (
    <div 
      ref={containerRef}
      className={cn("relative select-none overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100", className)}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <img 
        src={after} 
        alt="After" 
        className="block w-full h-full object-contain"
        referrerPolicy="no-referrer"
      />
      
      <div 
        className="absolute top-0 left-0 h-full overflow-hidden border-r-2 border-white shadow-lg"
        style={{ width: `${sliderPosition}%` }}
      >
        <img 
          src={before} 
          alt="Before" 
          className="block h-full object-cover"
          style={{ width: `${100 / (sliderPosition / 100)}%`, maxWidth: 'none' }}
          referrerPolicy="no-referrer"
        />
      </div>

      <div 
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center cursor-ew-resize z-10 border border-neutral-200"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="flex gap-1">
          <div className="w-0.5 h-4 bg-neutral-400 rounded-full" />
          <div className="w-0.5 h-4 bg-neutral-400 rounded-full" />
        </div>
      </div>

      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded uppercase tracking-wider font-medium">
        Gốc
      </div>
      <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded uppercase tracking-wider font-medium">
        Phục chế
      </div>
    </div>
  );
};
