import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { UserProfile, AppMode } from '@shared/types';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from '@/lib/utils';
import DestinationDetails from '@/components/DestinationDetails';

interface TripsProps {
  user: UserProfile;
  appMode: AppMode;
}

interface Group {
  id: number;
  name: string;
  creatorId: number;
  voteEndTime?: Date;
  createdAt: Date;
}

interface GroupMember {
  id: number;
  groupId: number;
  userId: number;
  joinedAt: Date;
  username: string;
  profileImage?: string;
}

interface VoteResult {
  destination: {
    id: number;
    name: string;
    country: string;
    imageUrl: string;
  };
  likes: number;
  total: number;
  percentage: number;
}

const Trips: React.FC<TripsProps> = ({ user, appMode }) => {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [showVoteResults, setShowVoteResults] = useState(false);
  const [selectedDestinationId, setSelectedDestinationId] = useState<number | null>(null);
  const [showDestinationDetails, setShowDestinationDetails] = useState(false);

  // Query to fetch user's groups
  const { data: groups = [], isLoading: isLoadingGroups } = useQuery<Group[]>({
    queryKey: [`/api/users/${user.id}/groups`],
  });

  // Query to fetch group members when a group is selected
  const { data: groupMembers = [], isLoading: isLoadingMembers } = useQuery<GroupMember[]>({
    queryKey: [`/api/groups/${selectedGroupId}/members`],
    enabled: !!selectedGroupId,
  });

  // Query to fetch vote results when a group is selected
  const { data: voteResults = [], isLoading: isLoadingVotes } = useQuery<VoteResult[]>({
    queryKey: [`/api/groups/${selectedGroupId}/votes`],
    enabled: !!selectedGroupId && showVoteResults,
  });

  // Mutation to create a new group
  const createGroupMutation = useMutation({
    mutationFn: (groupData: { name: string; creatorId: number; voteEndTime?: Date }) => {
      return apiRequest('POST', '/api/groups', groupData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/groups`] });
      toast({
        title: "Group Created",
        description: "Your trip group has been created successfully.",
      });
      setCreateDialogOpen(false);
      setNewGroupName('');
      setSelectedGroupId(data.id);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation to add a member to a group (for inviting members)
  const addMemberMutation = useMutation({
    mutationFn: (data: { groupId: number; userId: number }) => {
      return apiRequest('POST', `/api/groups/${data.groupId}/members`, { userId: data.userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${selectedGroupId}/members`] });
      toast({
        title: "Member Added",
        description: "The user has been added to your trip group.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add member. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle creating a new group
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group name.",
        variant: "destructive"
      });
      return;
    }

    // Set vote end time to 24 hours from now
    const voteEndTime = new Date();
    voteEndTime.setHours(voteEndTime.getHours() + 24);

    createGroupMutation.mutate({
      name: newGroupName,
      creatorId: user.id,
      voteEndTime
    });
  };

  // Handle selecting a group
  const handleSelectGroup = (groupId: number) => {
    setSelectedGroupId(groupId);
    setShowVoteResults(false);
  };

  // Handle viewing destination details from vote results
  const handleViewDestination = (destinationId: number) => {
    setSelectedDestinationId(destinationId);
    setShowDestinationDetails(true);
  };

  // Loading state
  if (isLoadingGroups) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-medium text-dark">Loading your trips...</p>
      </div>
    );
  }

  return (
    <div className="py-4 px-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Your Trip Groups</h2>
        <Button 
          variant="default" 
          size="sm"
          className="bg-primary text-white"
          onClick={() => setCreateDialogOpen(true)}
        >
          <i className="fas fa-plus mr-2"></i>
          New Group
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-gray-400 text-5xl mb-4">
            <i className="fas fa-users"></i>
          </div>
          <h3 className="text-xl font-bold mb-2">No Trip Groups Yet</h3>
          <p className="text-gray-600 mb-6">
            Create a group and invite friends to plan your next adventure together.
          </p>
          <Button 
            variant="default"
            className="bg-primary text-white"
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Your First Group
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {groups.map(group => (
            <div 
              key={group.id} 
              className={`bg-white rounded-lg shadow-sm p-4 cursor-pointer transition-all hover:shadow-md ${selectedGroupId === group.id ? 'border-2 border-primary' : ''}`}
              onClick={() => handleSelectGroup(group.id)}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold">{group.name}</h3>
                {group.creatorId === user.id && (
                  <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded-full">
                    Creator
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-3">
                Created on {formatDate(new Date(group.createdAt))}
              </p>
              {group.voteEndTime && (
                <div className="bg-light rounded p-2 text-sm">
                  <i className="far fa-clock mr-1 text-secondary"></i>
                  Voting ends: {formatDate(new Date(group.voteEndTime))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedGroupId && (
        <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">
              {groups.find(g => g.id === selectedGroupId)?.name}
            </h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="text-secondary border-secondary"
                onClick={() => setShowVoteResults(!showVoteResults)}
              >
                <i className={`fas ${showVoteResults ? 'fa-users' : 'fa-chart-bar'} mr-2`}></i>
                {showVoteResults ? 'View Members' : 'View Results'}
              </Button>
              <Button 
                variant="default" 
                size="sm"
                className="bg-primary text-white"
                onClick={() => setSelectedGroupId(null)}
              >
                <i className="fas fa-chevron-left mr-2"></i>
                Back
              </Button>
            </div>
          </div>

          {isLoadingMembers || isLoadingVotes ? (
            <div className="flex justify-center py-6">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : showVoteResults ? (
            // Vote results view
            <div>
              <h4 className="font-medium mb-3">Destination Rankings</h4>
              {voteResults.length === 0 ? (
                <p className="text-center py-6 text-gray-500">
                  No votes have been cast yet. Start swiping to vote!
                </p>
              ) : (
                <div className="space-y-4">
                  {voteResults.map((result, index) => (
                    <div key={index} className="bg-light rounded-lg p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                        <img 
                          src={result.destination.imageUrl} 
                          alt={result.destination.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium">{result.destination.name}, {result.destination.country}</h5>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            {result.likes} of {result.total} votes
                          </span>
                          <span className="text-sm font-semibold text-primary">
                            {result.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${result.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="p-2"
                        onClick={() => handleViewDestination(result.destination.id)}
                      >
                        <i className="fas fa-info-circle"></i>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Members view
            <div>
              <h4 className="font-medium mb-3">Group Members ({groupMembers.length})</h4>
              <div className="space-y-2">
                {groupMembers.map(member => (
                  <div key={member.id} className="bg-light rounded-lg p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                        {member.profileImage ? (
                          <img 
                            src={member.profileImage} 
                            alt={member.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-medium text-gray-500">
                            {member.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{member.username}</p>
                        <p className="text-xs text-gray-500">
                          Joined {formatDate(new Date(member.joinedAt))}
                        </p>
                      </div>
                    </div>
                    {member.userId === groups.find(g => g.id === selectedGroupId)?.creatorId && (
                      <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded-full">
                        Creator
                      </span>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  className="w-full border-dashed"
                >
                  <i className="fas fa-user-plus mr-2"></i>
                  Invite Friends
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Group Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a New Trip Group</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="group-name">Group Name</Label>
            <Input 
              id="group-name" 
              placeholder="e.g., Summer Vacation 2023" 
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-2">
              <i className="fas fa-info-circle mr-1"></i>
              Group members will have 24 hours to vote on destinations.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-primary text-white"
              onClick={handleCreateGroup}
              disabled={createGroupMutation.isPending}
            >
              {createGroupMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating...
                </>
              ) : (
                <>Create Group</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Destination Details Dialog */}
      {selectedDestinationId && (
        <DestinationDetails
          destinationId={selectedDestinationId}
          isOpen={showDestinationDetails}
          onClose={() => setShowDestinationDetails(false)}
        />
      )}
    </div>
  );
};

export default Trips;
