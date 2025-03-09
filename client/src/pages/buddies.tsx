import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { UserProfile, TravelBuddyMatch } from '@shared/types';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DestinationDetails from '@/components/DestinationDetails';

interface BuddiesProps {
  user: UserProfile;
}

const Buddies: React.FC<BuddiesProps> = ({ user }) => {
  const { toast } = useToast();
  const [selectedDestinationId, setSelectedDestinationId] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  // Query to fetch travel buddy matches
  const { data: buddies = [], isLoading, isError } = useQuery<TravelBuddyMatch[]>({
    queryKey: [`/api/users/${user.id}/buddies`],
  });

  // Separate matches by status
  const pendingBuddies = buddies.filter(buddy => buddy.status === 'pending');
  const acceptedBuddies = buddies.filter(buddy => buddy.status === 'accepted');

  // Mutation to update travel buddy status
  const updateStatusMutation = useMutation({
    mutationFn: ({ buddyId, status }: { buddyId: number, status: 'accepted' | 'rejected' }) => {
      return apiRequest('PATCH', `/api/buddies/${buddyId}/status`, {
        status,
        userId: user.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/buddies`] });
      toast({
        title: "Status Updated",
        description: "Travel buddy status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Could not update travel buddy status. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle accept/reject buddy request
  const handleResponseToRequest = (buddyId: number, status: 'accepted' | 'rejected') => {
    updateStatusMutation.mutate({ buddyId, status });
  };

  // Handle view destination details
  const handleViewDestination = (destinationId: number) => {
    setSelectedDestinationId(destinationId);
    setShowDetails(true);
  };

  // Close destination details modal
  const handleCloseDetails = () => {
    setShowDetails(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-medium text-dark">Finding your travel buddies...</p>
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
          We couldn't load your travel buddies. Please try again later.
        </p>
      </div>
    );
  }

  // Empty state
  if (buddies.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div className="text-gray-400 text-5xl mb-4">
          <i className="fas fa-user-friends"></i>
        </div>
        <h3 className="text-xl font-bold mb-2">No travel buddies yet</h3>
        <p className="text-gray-600 mb-4 text-center">
          When you and another user both like the same destination, you'll be matched as potential travel buddies.
        </p>
      </div>
    );
  }

  // User has travel buddies
  return (
    <div className="py-4 px-4">
      <h2 className="text-xl font-bold mb-4">Travel Buddies</h2>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="pending" className="flex-1">
            Pending
            {pendingBuddies.length > 0 && (
              <span className="ml-2 bg-primary text-white text-xs px-2 py-1 rounded-full">{pendingBuddies.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="accepted" className="flex-1">
            Connected
            {acceptedBuddies.length > 0 && (
              <span className="ml-2 bg-secondary text-white text-xs px-2 py-1 rounded-full">{acceptedBuddies.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingBuddies.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No pending buddy requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingBuddies.map(buddy => (
                <div key={buddy.id} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={buddy.matchedProfileImage} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {buddy.matchedUsername.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{buddy.matchedUsername}</h3>
                        <p className="text-sm text-gray-500">Wants to travel to {buddy.destinationName}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="px-3 border-secondary text-secondary hover:bg-secondary hover:text-white"
                        onClick={() => handleResponseToRequest(buddy.id, 'rejected')}
                      >
                        <i className="fas fa-times mr-2"></i>
                        Decline
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        className="px-3 bg-primary text-white"
                        onClick={() => handleResponseToRequest(buddy.id, 'accepted')}
                      >
                        <i className="fas fa-check mr-2"></i>
                        Accept
                      </Button>
                    </div>
                  </div>
                  <div className="bg-light rounded-lg p-3 flex justify-between items-center cursor-pointer" onClick={() => handleViewDestination(buddy.destinationId)}>
                    <span className="text-sm font-medium">View destination details</span>
                    <i className="fas fa-chevron-right text-gray-400"></i>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="accepted">
          {acceptedBuddies.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No travel buddies connected yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {acceptedBuddies.map(buddy => (
                <div key={buddy.id} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={buddy.matchedProfileImage} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {buddy.matchedUsername.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{buddy.matchedUsername}</h3>
                        <p className="text-sm text-gray-500">Matched for {buddy.destinationName}</p>
                      </div>
                    </div>
                    <Button 
                      variant="default" 
                      size="sm"
                      className="px-3 bg-secondary text-white"
                    >
                      <i className="fas fa-comment-alt mr-2"></i>
                      Message
                    </Button>
                  </div>
                  <div className="bg-light rounded-lg p-3 flex justify-between items-center cursor-pointer" onClick={() => handleViewDestination(buddy.destinationId)}>
                    <span className="text-sm font-medium">View destination details</span>
                    <i className="fas fa-chevron-right text-gray-400"></i>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedDestinationId && (
        <DestinationDetails
          destinationId={selectedDestinationId}
          isOpen={showDetails}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
};

export default Buddies;
