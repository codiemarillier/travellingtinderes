import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserProfile, DestinationCard } from '@shared/types';
import { formatPriceLevel, categoryToColor } from '@/lib/utils';
import DestinationDetails from '@/components/DestinationDetails';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

interface FavoritesProps {
  user: UserProfile;
}

const Favorites: React.FC<FavoritesProps> = ({ user }) => {
  const [selectedDestination, setSelectedDestination] = useState<DestinationCard | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const { toast } = useToast();
  
  const { data: favorites = [], isLoading, isError } = useQuery<DestinationCard[]>({
    queryKey: [`/api/users/${user.id}/likes`],
  });
  
  const handleRemoveFavorite = async (destinationId: number) => {
    try {
      await apiRequest('POST', '/api/swipes', {
        userId: user.id,
        destinationId,
        liked: false
      });
      
      toast({
        title: "Removed from favorites",
        description: "Destination has been removed from your favorites",
      });
      
      // Invalidate favorites query to reflect the change
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/likes`] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove from favorites. Please try again.",
        variant: "destructive"
      });
      console.error("Error removing favorite:", error);
    }
  };
  
  const handleShowDetails = (destination: DestinationCard) => {
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
        <p className="text-lg font-medium text-dark">Loading your favorites...</p>
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
          We couldn't load your favorites. Please try again later.
        </p>
      </div>
    );
  }
  
  // Empty state
  if (favorites.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div className="text-gray-400 text-5xl mb-4">
          <i className="fas fa-heart-broken"></i>
        </div>
        <h3 className="text-xl font-bold mb-2">No favorites yet</h3>
        <p className="text-gray-600 mb-4 text-center">
          Swipe right on destinations you like to save them here.
        </p>
      </div>
    );
  }
  
  return (
    <div className="py-4 px-4">
      <h2 className="text-xl font-bold mb-4">Your Favorite Destinations</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {favorites.map(destination => (
          <div key={destination.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="relative h-40">
              <img 
                src={destination.imageUrl} 
                alt={`${destination.name}, ${destination.country}`}
                className="w-full h-full object-cover"
              />
              <button 
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-primary hover:bg-white"
                onClick={() => handleRemoveFavorite(destination.id)}
              >
                <i className="fas fa-heart"></i>
              </button>
            </div>
            
            <div className="p-3">
              <h3 className="font-bold text-lg">{destination.name}, {destination.country}</h3>
              
              <div className="flex items-center gap-2 mt-1 mb-2">
                <div className="text-accent">
                  {formatPriceLevel(destination.priceLevel)}
                </div>
                {destination.categories.slice(0, 2).map(category => (
                  <span key={category} className={`text-xs px-2 py-0.5 rounded ${categoryToColor(category)}`}>
                    {category}
                  </span>
                ))}
              </div>
              
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{destination.description}</p>
              
              <button 
                className="w-full py-2 bg-secondary text-white rounded-lg font-medium text-sm"
                onClick={() => handleShowDetails(destination)}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
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

export default Favorites;
