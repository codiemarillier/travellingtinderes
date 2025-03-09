import React, { useState, useRef, useEffect } from 'react';
import { DestinationCard } from '@shared/types';
import { formatPriceLevel, categoryToColor } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useSwipe } from '@/hooks/use-swipe';

interface SwipeCardProps {
  destination: DestinationCard;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onTap: () => void;
  isActive: boolean;
  zIndex: number;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ 
  destination, 
  onSwipeLeft, 
  onSwipeRight, 
  onTap,
  isActive,
  zIndex
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Use our custom swipe hook for better touch handling
  const { 
    handleTouchStart, 
    handleTouchMove, 
    handleTouchEnd,
    swipingDirection,
    swipePercentage
  } = useSwipe({
    onSwipeLeft: () => {
      if (isActive) onSwipeLeft();
    },
    onSwipeRight: () => {
      if (isActive) onSwipeRight();
    },
    threshold: 0.4, // 40% of the element width
  });
  
  // Calculate rotation and opacity based on swipe percentage
  const rotation = swipePercentage * 10; // max 10 degrees rotation
  
  // Handle tap/click events
  const handleCardClick = () => {
    if (isActive && !swipingDirection) {
      setIsClicked(true);
      onTap();
      
      // Reset click state after animation
      setTimeout(() => {
        setIsClicked(false);
      }, 150);
    }
  };
  
  // Handle image load event
  const handleImageLoad = () => {
    setImageLoaded(true);
  };
  
  // Handle component visibility
  useEffect(() => {
    // Preload the image when component is mounted
    if (destination.imageUrl) {
      const img = new Image();
      img.src = destination.imageUrl;
      img.onload = handleImageLoad;
    }
  }, [destination.imageUrl]);
  
  return (
    <div 
      ref={cardRef}
      className={cn(
        "card absolute w-full h-full rounded-2xl shadow-lg overflow-hidden select-none transition-all",
        isClicked && "scale-[0.98]",
        !isActive && "pointer-events-none"
      )}
      style={{ 
        transform: swipingDirection ? `translateX(${swipePercentage * 80}px) rotate(${rotation}deg)` : 'none',
        zIndex,
        opacity: isActive ? 1 : 0.5,
        transition: swipingDirection ? 'none' : 'all 0.3s ease',
      }}
      onMouseDown={isActive ? handleTouchStart : undefined}
      onTouchStart={isActive ? handleTouchStart : undefined}
      onMouseMove={isActive ? handleTouchMove : undefined}
      onTouchMove={isActive ? handleTouchMove : undefined}
      onMouseUp={isActive ? handleTouchEnd : undefined}
      onTouchEnd={isActive ? handleTouchEnd : undefined}
      onMouseLeave={isActive ? handleTouchEnd : undefined}
      onClick={handleCardClick}
    >
      {/* Like indicator */}
      {swipingDirection === 'right' && (
        <div className="absolute top-5 right-5 py-2 px-4 bg-primary border-2 border-white text-white font-bold rounded-lg transform -rotate-15 z-10">
          LIKE
        </div>
      )}
      
      {/* Nope indicator */}
      {swipingDirection === 'left' && (
        <div className="absolute top-5 left-5 py-2 px-4 bg-secondary border-2 border-white text-white font-bold rounded-lg transform rotate-15 z-10">
          NOPE
        </div>
      )}
      
      {/* Image loading skeleton */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Background image with fade-in effect */}
      <img 
        src={destination.imageUrl} 
        alt={`${destination.name}, ${destination.country}`}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          imageLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={handleImageLoad}
      />
      
      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-semibold mb-1 font-['Poppins']">
              {destination.name}, {destination.country}
            </h2>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <div className="text-amber-400 font-medium">
                {formatPriceLevel(destination.priceLevel)}
              </div>
              {destination.categories.map(category => (
                <span key={category} className={`text-xs px-2 py-0.5 rounded-full ${categoryToColor(category)}`}>
                  {category}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-black/40 p-1 rounded-full">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white cursor-pointer" onClick={(e) => {
              e.stopPropagation();
              onTap();
            }}>
              <i className="fas fa-info"></i>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-200 line-clamp-2">{destination.description}</p>
      </div>
    </div>
  );
};

export default SwipeCard;
