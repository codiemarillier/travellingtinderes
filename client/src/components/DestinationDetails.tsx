import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatPriceLevel, categoryToColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { HotelOption, DestinationCard } from '@shared/types';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface DestinationDetailsProps {
  destinationId: number;
  isOpen: boolean;
  onClose: () => void;
}

const DestinationDetails: React.FC<DestinationDetailsProps> = ({ 
  destinationId, 
  isOpen, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'hotels' | 'tips'>('overview');
  const { toast } = useToast();
  
  // Fetch destination data
  const { data: destination, isLoading: isLoadingDestination } = useQuery<DestinationCard>({
    queryKey: [`/api/destinations/${destinationId}`],
    enabled: isOpen,
  });
  
  // Fetch destination details
  const { data: details, isLoading: isLoadingDetails } = useQuery({
    queryKey: [`/api/destinations/${destinationId}/details`],
    enabled: isOpen,
  });
  
  // Mutation to add to favorites
  const addToFavoritesMutation = useMutation({
    mutationFn: (data: { userId: number; destinationId: number; liked: boolean }) => {
      return apiRequest('POST', '/api/swipes', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/*/likes'] });
      toast({
        title: "Added to favorites",
        description: "This destination has been added to your favorites",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add to favorites. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const isLoading = isLoadingDestination || isLoadingDetails;
  
  if (!isOpen) return null;
  
  const handleAddToFavorites = () => {
    // In a real app, we would get the user ID from context or state
    const userId = 1; // Placeholder
    addToFavoritesMutation.mutate({
      userId,
      destinationId,
      liked: true
    });
  };
  
  return (
    <div 
      className={`detail-modal fixed inset-0 bg-black/50 z-50 flex items-center justify-center transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={onClose}
    >
      <div 
        className={`detail-content bg-white w-11/12 max-w-lg max-h-[90vh] rounded-2xl overflow-hidden overflow-y-auto transition-all ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
        onClick={e => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-10">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lg font-medium text-dark">Loading details...</p>
          </div>
        ) : destination ? (
          <>
            <div className="relative">
              <div className="h-56 overflow-hidden">
                <img 
                  src={destination.imageUrl} 
                  alt={`${destination.name}, ${destination.country}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <button 
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center text-dark"
                onClick={onClose}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold font-heading">
                    {destination.name}, {destination.country}
                  </h2>
                  <div className="flex items-center flex-wrap gap-2 mt-1">
                    <div className="text-dark">
                      {formatPriceLevel(destination.priceLevel)}
                    </div>
                    {destination.categories.map(category => (
                      <span key={category} className={`text-sm px-2 py-0.5 rounded ${categoryToColor(category).replace('text-white', 'text-secondary')}`}>
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
                <button 
                  className="w-10 h-10 rounded-full bg-light flex items-center justify-center text-gray-500"
                  onClick={handleAddToFavorites}
                >
                  <i className="far fa-heart"></i>
                </button>
              </div>
              
              <div className="border-b border-gray-200 mb-4">
                <div className="flex -mb-px">
                  <button 
                    className={`px-4 py-2 border-b-2 ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-gray-500'} font-medium`}
                    onClick={() => setActiveTab('overview')}
                  >
                    Overview
                  </button>
                  <button 
                    className={`px-4 py-2 border-b-2 ${activeTab === 'hotels' ? 'border-primary text-primary' : 'border-transparent text-gray-500'} font-medium`}
                    onClick={() => setActiveTab('hotels')}
                  >
                    Hotels
                  </button>
                  <button 
                    className={`px-4 py-2 border-b-2 ${activeTab === 'tips' ? 'border-primary text-primary' : 'border-transparent text-gray-500'} font-medium`}
                    onClick={() => setActiveTab('tips')}
                  >
                    Travel Tips
                  </button>
                </div>
              </div>
              
              {/* Overview Tab */}
              <div className={`tab-content ${activeTab === 'overview' ? 'block' : 'hidden'}`}>
                <p className="text-gray-700 mb-4">
                  {destination.description}
                </p>
                
                {details?.bestTimeToVisit && (
                  <>
                    <h3 className="font-bold text-lg mb-2">Best Time to Visit</h3>
                    <p className="text-gray-700 mb-4">{details.bestTimeToVisit}</p>
                  </>
                )}
                
                {details?.attractions && details.attractions.length > 0 && (
                  <>
                    <h3 className="font-bold text-lg mb-2">Top Attractions</h3>
                    <ul className="list-disc pl-5 text-gray-700 mb-4">
                      {details.attractions.map((attraction, index) => (
                        <li key={index}>{attraction}</li>
                      ))}
                    </ul>
                  </>
                )}
                
                {details?.costs && (
                  <>
                    <h3 className="font-bold text-lg mb-2">Average Costs</h3>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-light rounded p-3">
                        <p className="text-sm text-gray-500">Accommodation</p>
                        <p className="font-medium">{details.costs.accommodation}</p>
                      </div>
                      <div className="bg-light rounded p-3">
                        <p className="text-sm text-gray-500">Meals</p>
                        <p className="font-medium">{details.costs.meals}</p>
                      </div>
                      <div className="bg-light rounded p-3">
                        <p className="text-sm text-gray-500">Transportation</p>
                        <p className="font-medium">{details.costs.transportation}</p>
                      </div>
                      <div className="bg-light rounded p-3">
                        <p className="text-sm text-gray-500">Activities</p>
                        <p className="font-medium">{details.costs.activities}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {/* Hotels Tab */}
              <div className={`tab-content ${activeTab === 'hotels' ? 'block' : 'hidden'}`}>
                {details?.hotelOptions && details.hotelOptions.length > 0 ? (
                  <div className="space-y-4">
                    {details.hotelOptions.map((hotel: HotelOption, index: number) => (
                      <div key={index} className="bg-light rounded-lg p-3 flex gap-3">
                        <img 
                          src={hotel.imageUrl} 
                          className="w-20 h-20 rounded object-cover" 
                          alt={hotel.name} 
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{hotel.name}</h4>
                          <div className="flex items-center text-accent">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <i key={i} className={`fas fa-star text-sm ${i < hotel.stars ? '' : 'text-gray-300'}`}></i>
                            ))}
                          </div>
                          <p className="text-sm text-gray-500">{hotel.description}</p>
                          <p className="font-medium">{hotel.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <i className="fas fa-hotel text-4xl mb-2"></i>
                    <p>No hotel information available</p>
                  </div>
                )}
              </div>
              
              {/* Travel Tips Tab */}
              <div className={`tab-content ${activeTab === 'tips' ? 'block' : 'hidden'}`}>
                {details?.travelTips ? (
                  <div className="space-y-4">
                    {details.travelTips.safety && (
                      <div className="bg-light rounded-lg p-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <i className="fas fa-shield-alt text-secondary"></i>
                          Safety Tips
                        </h4>
                        <ul className="list-disc pl-5 text-gray-700 text-sm mt-2">
                          {details.travelTips.safety.map((tip, index) => (
                            <li key={index}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {details.travelTips.localCustoms && (
                      <div className="bg-light rounded-lg p-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <i className="fas fa-lightbulb text-accent"></i>
                          Local Customs
                        </h4>
                        <ul className="list-disc pl-5 text-gray-700 text-sm mt-2">
                          {details.travelTips.localCustoms.map((tip, index) => (
                            <li key={index}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {details.travelTips.food && (
                      <div className="bg-light rounded-lg p-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <i className="fas fa-utensils text-primary"></i>
                          Food & Dining
                        </h4>
                        <ul className="list-disc pl-5 text-gray-700 text-sm mt-2">
                          {details.travelTips.food.map((tip, index) => (
                            <li key={index}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <i className="fas fa-info-circle text-4xl mb-2"></i>
                    <p>No travel tips available</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex gap-3">
                <Button 
                  className="flex-1 py-3 bg-primary text-white font-medium"
                  onClick={handleAddToFavorites}
                >
                  <i className="fas fa-heart mr-2"></i> Save to Favorites
                </Button>
                <Button 
                  className="py-3 px-4 bg-secondary text-white font-medium"
                  variant="secondary"
                >
                  <i className="fas fa-share-alt"></i>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-6 text-center">
            <p className="text-lg text-gray-700">Destination not found</p>
            <Button className="mt-4" onClick={onClose}>Close</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DestinationDetails;
