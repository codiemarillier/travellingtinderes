import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DestinationCard, FilterOptions, UserProfile, AppMode } from '@shared/types';
import { apiRequest } from '@/lib/queryClient';
import SwipeCard from './SwipeCard';
import DestinationDetails from './DestinationDetails';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

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
      <div className="card-container relative flex-1 max-w-md mx-auto">
        {destinations.map((destination, index) => {
          // Only render cards that are the current one or the next few
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
      </div>
      
      <div className="action-buttons flex justify-around py-5 max-w-sm mx-auto">
        <button 
          className="action-button w-12 h-12 rounded-full bg-light text-dark flex items-center justify-center shadow-md hover:shadow-lg active:scale-95 transition-all"
          onClick={handleRewind}
          disabled={currentIndex === 0}
        >
          <i className="fas fa-undo-alt"></i>
        </button>
        
        <button 
          className="action-button w-14 h-14 rounded-full bg-secondary text-white flex items-center justify-center shadow-md hover:shadow-lg active:scale-95 transition-all"
          onClick={handleSwipeLeft}
        >
          <i className="fas fa-times text-xl"></i>
        </button>
        
        <button 
          className="action-button w-12 h-12 rounded-full bg-white text-dark flex items-center justify-center shadow-md hover:shadow-lg active:scale-95 transition-all"
          onClick={handleTap}
        >
          <i className="fas fa-info"></i>
        </button>
        
        <button 
          className="action-button w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:shadow-lg active:scale-95 transition-all"
          onClick={handleSwipeRight}
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
