import React, { useState, useRef } from 'react';
import { DestinationCard } from '@shared/types';
import { formatPriceLevel, categoryToColor } from '@/lib/utils';

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
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [currentX, setCurrentX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isActive) return;
    setDragStartX(e.clientX);
    setIsDragging(true);
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isActive) return;
    setDragStartX(e.touches[0].clientX);
    setIsDragging(true);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || dragStartX === null) return;
    e.preventDefault();
    const diff = e.clientX - dragStartX;
    setCurrentX(diff);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || dragStartX === null) return;
    const diff = e.touches[0].clientX - dragStartX;
    setCurrentX(diff);
  };
  
  const handleTap = () => {
    if (!isDragging && isActive) {
      onTap();
    }
  };
  
  const handleDragEnd = () => {
    if (!isDragging) return;
    
    const threshold = window.innerWidth * 0.2; // 20% of screen width
    
    if (currentX > threshold) {
      onSwipeRight();
    } else if (currentX < -threshold) {
      onSwipeLeft();
    }
    
    setDragStartX(null);
    setCurrentX(0);
    setIsDragging(false);
  };
  
  // Calculate card rotation based on drag distance
  const rotation = currentX * 0.1; // 0.1 degrees per pixel
  
  // Calculate opacity for like/nope indicators
  const likeOpacity = Math.min(Math.max(currentX / 100, 0), 1);
  const nopeOpacity = Math.min(Math.max(-currentX / 100, 0), 1);
  
  // Apply transform styles based on drag state
  const transformStyle = isDragging
    ? { transform: `translateX(${currentX}px) rotate(${rotation}deg)` }
    : {};
    
  const isSwiping = currentX !== 0;
  const isSwipingRight = currentX > 0;
  const isSwipingLeft = currentX < 0;
  
  return (
    <div 
      ref={cardRef}
      className="card absolute w-full h-full rounded-2xl shadow-lg overflow-hidden"
      style={{ 
        ...transformStyle,
        zIndex,
        transition: isDragging ? 'none' : 'transform 0.3s ease'
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseUp={handleDragEnd}
      onTouchEnd={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onClick={handleTap}
    >
      {/* Like indicator */}
      <div 
        className="absolute top-5 right-5 py-2 px-4 bg-primary border-2 border-white text-white font-bold rounded-lg transform -rotate-15 z-10"
        style={{ 
          opacity: likeOpacity,
          transform: 'rotate(-15deg)'
        }}
      >
        LIKE
      </div>
      
      {/* Nope indicator */}
      <div 
        className="absolute top-5 left-5 py-2 px-4 bg-secondary border-2 border-white text-white font-bold rounded-lg transform -rotate-15 z-10"
        style={{ 
          opacity: nopeOpacity,
          transform: 'rotate(-15deg)'
        }}
      >
        NOPE
      </div>
      
      {/* Background image */}
      <img 
        src={destination.imageUrl} 
        alt={`${destination.name}, ${destination.country}`}
        className="w-full h-full object-cover"
      />
      
      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent text-white">
        <h2 className="text-2xl font-semibold mb-1 font-['Poppins']">
          {destination.name}, {destination.country}
        </h2>
        <div className="flex items-center gap-2 mb-1">
          <div className="text-accent">
            {formatPriceLevel(destination.priceLevel)}
          </div>
          {destination.categories.slice(0, 2).map(category => (
            <span key={category} className={`text-sm px-2 py-0.5 rounded ${categoryToColor(category)}`}>
              {category}
            </span>
          ))}
        </div>
        <p className="text-sm text-gray-200">{destination.description}</p>
      </div>
    </div>
  );
};

export default SwipeCard;
