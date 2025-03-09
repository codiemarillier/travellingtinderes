import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DestinationCard, FilterOptions, UserProfile, AppMode } from '@shared/types';
import { apiRequest } from '@/lib/queryClient';
import SwipeCard from './SwipeCard';
import DestinationDetails from './DestinationDetails';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { Link } from 'wouter';

interface SwipeDeckProps {
  user: UserProfile;
  filters: FilterOptions;
  appMode: AppMode;
  groupId?: number;
}

const SwipeDeck: React.FC<SwipeDeckProps> = ({ user, filters, appMode, groupId }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedDestination, setSelectedDestination] = useState<DestinationCard | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [isLoadingMoreCards, setIsLoadingMoreCards] = useState<boolean>(false);
  
  const { toast } = useToast();
  
  // Construct query parameters for filters
  const getQueryParams = () => {
    const params = new URLSearchParams();
    
    if (filters.priceLevel?.length) {
      filters.priceLevel.forEach(level => {
        params.append('priceLevel', level.toString());
      });
    }
    
    if (filters.categories?.length) {
      filters.categories.forEach(category => {
        params.append('categories', category);
      });
    }
    
    if (filters.region) {
      params.append('region', filters.region);
    }
    
    return params.toString();
  };
  
  // Query to fetch destinations
  const { data: destinations = [], isLoading, isError, error } = useQuery<DestinationCard[]>({
    queryKey: [`/api/destinations?${getQueryParams()}`],
    staleTime: 60000, // 1 minute
  });
  
  // Mutation to record swipes
  const swipeMutation = useMutation({
    mutationFn: (swipeData: { userId: number, destinationId: number, liked: boolean, groupId?: number }) => {
      // For crew mode, submit a group vote
      if (appMode === 'Crew' && groupId) {
        return apiRequest('POST', `/api/groups/${groupId}/votes`, {
          userId: swipeData.userId,
          destinationId: swipeData.destinationId,
          liked: swipeData.liked
        });
      }
      
      // For solo mode, submit a regular swipe
      return apiRequest('POST', '/api/swipes', swipeData);
    },
    onSuccess: () => {
      // Invalidate relevant queries based on the app mode
      if (appMode === 'Crew' && groupId) {
        queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/votes`] });
      } else {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/likes`] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/buddies`] });
      }
    },
    onError: (error) => {
      toast({
        title: "Swipe Failed",
        description: "There was an error recording your choice. Please try again.",
        variant: "destructive"
      });
      console.error("Swipe error:", error);
    }
  });
  
  // Handle reaching the end of the deck
  useEffect(() => {
    if (destinations.length > 0 && currentIndex >= destinations.length - 1) {
      setIsLoadingMoreCards(true);
      
      // Simulate fetching more cards
      setTimeout(() => {
        setIsLoadingMoreCards(false);
        
        // If we can't get more cards, reset the index to show previous cards again
        if (currentIndex >= destinations.length - 1) {
          setCurrentIndex(0);
          toast({
            title: "Starting Over",
            description: "You've seen all destinations! Showing them again.",
          });
        }
      }, 1500);
    }
  }, [currentIndex, destinations.length, toast]);
  
  const handleSwipeLeft = () => {
    if (destinations.length === 0 || currentIndex >= destinations.length) return;
    
    const destination = destinations[currentIndex];
    
    swipeMutation.mutate({
      userId: user.id,
      destinationId: destination.id,
      liked: false,
      groupId: appMode === 'Crew' ? groupId : undefined
    });
    
    setCurrentIndex(prevIndex => prevIndex + 1);
  };
  
  const handleSwipeRight = () => {
    if (destinations.length === 0 || currentIndex >= destinations.length) return;
    
    const destination = destinations[currentIndex];
    
    swipeMutation.mutate({
      userId: user.id,
      destinationId: destination.id,
      liked: true,
      groupId: appMode === 'Crew' ? groupId : undefined
    });
    
    toast({
      title: "Destination Saved!",
      description: `${destination.name} has been added to your favorites.`,
      variant: "default"
    });
    
    setCurrentIndex(prevIndex => prevIndex + 1);
  };
  
  const handleRewind = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prevIndex => prevIndex - 1);
    } else {
      toast({
        title: "Can't Rewind",
        description: "You're already at the first destination.",
        variant: "destructive"
      });
    }
  };
  
  const handleTap = () => {
    if (destinations.length === 0 || currentIndex >= destinations.length) return;
    const destination = destinations[currentIndex];
    setSelectedDestination(destination);
    setShowDetails(true);
  };
  
  const handleCloseDetails = () => {
    setShowDetails(false);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-medium text-dark">Finding amazing destinations...</p>
      </div>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div className="text-error text-5xl mb-4">
          <i className="fas fa-exclamation-circle"></i>
        </div>
        <h3 className="text-xl font-bold mb-2">Oops! Something went wrong</h3>
        <p className="text-gray-600 mb-4 text-center">
          We couldn't load destinations. Please try again later.
        </p>
        <Button 
          onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/destinations`] })}
          variant="default"
        >
          Retry
        </Button>
      </div>
    );
  }
  
  // Empty state
  if (destinations.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div className="text-gray-400 text-5xl mb-4">
          <i className="fas fa-search"></i>
        </div>
        <h3 className="text-xl font-bold mb-2">No destinations found</h3>
        <p className="text-gray-600 mb-4 text-center">
          Try changing your filters to see more options.
        </p>
      </div>
    );
  }
  
  // Loading more cards state
  if (isLoadingMoreCards) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-medium text-dark">Finding more destinations...</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="card-container relative flex-1 max-w-md mx-auto w-full">
        {/* Instruction overlay when no cards have been swiped */}
        {currentIndex === 0 && (
          <div className="absolute inset-0 z-50 pointer-events-none flex flex-col items-center justify-center">
            <div className="bg-black/20 backdrop-blur-sm text-white p-4 rounded-xl text-center mx-4 mb-24">
              <div className="flex justify-center space-x-6 mb-3">
                <div className="flex flex-col items-center">
                  <i className="fas fa-arrow-left text-xl mb-1"></i>
                  <span className="text-sm">Swipe left</span>
                  <span className="text-xs">to skip</span>
                </div>
                <div className="flex flex-col items-center">
                  <i className="fas fa-arrow-right text-xl mb-1"></i>
                  <span className="text-sm">Swipe right</span>
                  <span className="text-xs">to like</span>
                </div>
              </div>
              <p className="text-xs">Tap for details</p>
            </div>
          </div>
        )}
        
        {destinations.map((destination, index) => {
          // Only render current card and next 2 to improve performance
          if (index < currentIndex || index > currentIndex + 2) return null;
          
          return (
            <SwipeCard
              key={destination.id}
              destination={destination}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              onTap={handleTap}
              isActive={index === currentIndex}
              zIndex={destinations.length - index}
            />
          );
        })}
        
        {/* Empty state when all cards have been swiped */}
        {destinations.length > 0 && currentIndex >= destinations.length && !isLoadingMoreCards && (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="text-primary text-6xl mb-4">
              <i className="fas fa-check-circle"></i>
            </div>
            <h3 className="text-xl font-bold mb-2">You've seen all destinations!</h3>
            <p className="text-gray-600 mb-5">
              Check out your matches or swipe through destinations again
            </p>
            <Button 
              onClick={() => setCurrentIndex(0)}
              variant="outline"
              className="mb-2"
            >
              Start Over
            </Button>
            <Link to="/favorites">
              <div className="text-primary font-medium cursor-pointer">
                View Your Favorites
              </div>
            </Link>
          </div>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="action-buttons flex justify-around py-5 max-w-sm mx-auto">
        <button 
          className="action-button w-12 h-12 rounded-full bg-light text-dark flex items-center justify-center shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-30"
          onClick={handleRewind}
          disabled={currentIndex === 0}
        >
          <i className="fas fa-undo-alt"></i>
        </button>
        
        <button 
          className="action-button w-14 h-14 rounded-full bg-secondary text-white flex items-center justify-center shadow-md hover:shadow-lg active:scale-95 transition-all"
          onClick={handleSwipeLeft}
          disabled={destinations.length === 0 || currentIndex >= destinations.length}
        >
          <i className="fas fa-times text-xl"></i>
        </button>
        
        <button 
          className="action-button w-12 h-12 rounded-full bg-white text-dark flex items-center justify-center shadow-md hover:shadow-lg active:scale-95 transition-all"
          onClick={handleTap}
          disabled={destinations.length === 0 || currentIndex >= destinations.length}
        >
          <i className="fas fa-info"></i>
        </button>
        
        <button 
          className="action-button w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:shadow-lg active:scale-95 transition-all"
          onClick={handleSwipeRight}
          disabled={destinations.length === 0 || currentIndex >= destinations.length}
        >
          <i className="fas fa-heart text-xl"></i>
        </button>
      </div>
      
      {selectedDestination && (
        <DestinationDetails
          destinationId={selectedDestination.id}
          isOpen={showDetails}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
};

export default SwipeDeck;
