import { useState, useRef, useEffect } from 'react';

interface SwipeHandlers {
  handleTouchStart: (e: React.TouchEvent | React.MouseEvent) => void;
  handleTouchMove: (e: React.TouchEvent | React.MouseEvent) => void;
  handleTouchEnd: () => void;
  swipingDirection: 'left' | 'right' | null;
  swipePercentage: number;
}

export function useSwipe(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  threshold = 0.3
): SwipeHandlers {
  const [startX, setStartX] = useState<number | null>(null);
  const [currentX, setCurrentX] = useState<number | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  const [swipingDirection, setSwipingDirection] = useState<'left' | 'right' | null>(null);
  const [swipePercentage, setSwipePercentage] = useState<number>(0);

  useEffect(() => {
    // Reset when component unmounts or deps change
    return () => {
      setStartX(null);
      setCurrentX(null);
      setSwipingDirection(null);
      setSwipePercentage(0);
    };
  }, [onSwipeLeft, onSwipeRight]);

  const getClientX = (e: React.TouchEvent | React.MouseEvent): number => {
    // @ts-ignore - TouchEvent and MouseEvent don't share a common interface for clientX
    return e.touches?.[0].clientX ?? e.clientX;
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    // Save the element reference if we don't have it
    if (!elementRef.current && e.currentTarget instanceof HTMLElement) {
      elementRef.current = e.currentTarget;
    }
    
    setStartX(getClientX(e));
    setCurrentX(getClientX(e));
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (startX === null) return;
    
    const clientX = getClientX(e);
    setCurrentX(clientX);
    
    const deltaX = clientX - startX;
    const elementWidth = elementRef.current?.offsetWidth || window.innerWidth;
    const percentageMoved = Math.abs(deltaX) / elementWidth;
    
    setSwipePercentage(percentageMoved);
    
    if (deltaX > 0) {
      setSwipingDirection('right');
    } else if (deltaX < 0) {
      setSwipingDirection('left');
    } else {
      setSwipingDirection(null);
    }
  };

  const handleTouchEnd = () => {
    if (startX === null || currentX === null) return;
    
    const deltaX = currentX - startX;
    const elementWidth = elementRef.current?.offsetWidth || window.innerWidth;
    const percentageMoved = Math.abs(deltaX) / elementWidth;
    
    if (percentageMoved >= threshold) {
      if (deltaX > 0) {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
    }
    
    // Reset state
    setStartX(null);
    setCurrentX(null);
    setSwipingDirection(null);
    setSwipePercentage(0);
  };

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    swipingDirection,
    swipePercentage
  };
}

export default useSwipe;
