import React, { useState } from 'react';
import SwipeDeck from '@/components/SwipeDeck';
import FilterSheet from '@/components/FilterSheet';
import { UserProfile, FilterOptions, AppMode } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

const categoryFilters = ['All', 'Beach', 'Mountain', 'City', 'Cultural', 'Adventure', 'Relaxation'];

interface ExploreProps {
  user: UserProfile;
  appMode: AppMode;
}

const Explore: React.FC<ExploreProps> = ({ user, appMode }) => {
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showCrewDialog, setShowCrewDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupSize, setNewGroupSize] = useState('');
  const [preferredDestinations, setPreferredDestinations] = useState('');

  // For crew mode, we need to get the active group
  const [activeGroupId, setActiveGroupId] = useState<number | undefined>(undefined);
  
  const { toast } = useToast();
  
  // Define group interface
  interface Group {
    id: number;
    name: string;
    creatorId: number;
    createdAt: Date;
    voteEndTime?: Date | null;
  }

  // Query to fetch user's groups if in Crew mode
  const { data: groups = [], isLoading: isLoadingGroups } = useQuery<Group[]>({
    queryKey: [`/api/users/${user.id}/groups`],
    enabled: appMode === 'Crew',
  });

  // Mutation to create a new group
  const createGroupMutation = useMutation({
    mutationFn: (groupData: { name: string; creatorId: number; preferences: string }) => {
      return apiRequest<Group>('POST', '/api/groups', {
        name: groupData.name,
        creatorId: groupData.creatorId,
        preferences: groupData.preferences
      });
    },
    onSuccess: (data: Group) => {
      toast({
        title: "Trip Crew Created!",
        description: `${newGroupName} has been created successfully.`,
      });
      setActiveGroupId(data.id);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/groups`] });
      setShowCrewDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error Creating Trip Crew",
        description: "There was a problem creating your crew. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const handleCreateCrew = () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Name Required",
        description: "Please provide a name for your trip crew",
        variant: "destructive"
      });
      return;
    }
    
    createGroupMutation.mutate({
      name: newGroupName.trim(),
      creatorId: user.id,
      preferences: `Size: ${newGroupSize || 'Not specified'}, Destinations: ${preferredDestinations || 'Not specified'}`
    });
  };
  
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    
    if (category === 'All') {
      // Remove category filter
      const { categories, ...restFilters } = filters;
      setFilters(restFilters);
    } else {
      // Set category filter
      setFilters(prev => ({
        ...prev,
        categories: [category as any]
      }));
    }
  };
  
  const handleFilterApply = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  // Show crew creation dialog when switching to Crew mode
  React.useEffect(() => {
    if (appMode === 'Crew' && groups.length === 0 && !isLoadingGroups) {
      // Only show after we've confirmed user has no groups
      setShowCrewDialog(true);
    }
  }, [appMode, groups.length, isLoadingGroups]);
  
  return (
    <div className="py-4 px-4 h-full flex flex-col">
      {/* Top action bar */}
      <div className="bg-white rounded-lg shadow-sm p-3 mb-4 flex items-center gap-2">
        {appMode === 'Crew' && (
          <div className="flex-1">
            <select 
              className="bg-light px-3 py-1 rounded text-sm"
              value={activeGroupId || ''}
              onChange={(e) => setActiveGroupId(Number(e.target.value) || undefined)}
            >
              <option value="">Select a trip crew</option>
              {groups?.map((group: any) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
            
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => setShowCrewDialog(true)}
            >
              <i className="fas fa-plus mr-1"></i>
              New
            </Button>
          </div>
        )}
        
        <Button
          variant="outline"
          size="sm"
          className={appMode === 'Crew' ? '' : 'ml-auto'}
          onClick={() => setShowFilterSheet(true)}
        >
          <i className="fas fa-filter mr-2"></i>
          Filters
        </Button>
      </div>

      {/* Filter Pills */}
      <div className="overflow-x-auto whitespace-nowrap py-2 mb-4 -mx-4 px-4">
        <div className="inline-flex gap-2">
          {categoryFilters.map(category => (
            <button 
              key={category}
              className={`filter-pill px-4 py-2 rounded-full bg-white text-sm font-medium shadow-sm hover:shadow transition-all ${selectedCategory === category ? 'bg-primary text-white' : ''}`}
              onClick={() => handleCategoryChange(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Main SwipeDeck */}
      <div className="flex-1">
        {appMode === 'Crew' && !activeGroupId ? (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="text-primary text-6xl mb-6">
              <i className="fas fa-users"></i>
            </div>
            <h3 className="text-xl font-bold mb-3">Plan Trip with Friends</h3>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              In Crew Mode, you can create a trip group and invite friends to vote on destinations together.
              Each person swipes on destinations they like, and the most popular ones rise to the top!
            </p>
            <Button 
              onClick={() => setShowCrewDialog(true)}
              variant="default"
              size="lg"
              className="gap-2"
            >
              <i className="fas fa-plus-circle"></i>
              Create a Trip Crew
            </Button>
          </div>
        ) : (
          <SwipeDeck 
            user={user}
            filters={filters}
            appMode={appMode}
            groupId={activeGroupId}
          />
        )}
      </div>
      
      {/* Filter Sheet */}
      <FilterSheet
        isOpen={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        filters={filters}
        onApplyFilters={handleFilterApply}
      />

      {/* Crew Creation Dialog */}
      <Dialog open={showCrewDialog} onOpenChange={setShowCrewDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create a Trip Crew</DialogTitle>
            <DialogDescription>
              Set up a new trip crew and invite friends to join your planning adventure.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="crewName" className="text-right">
                Crew Name
              </Label>
              <Input 
                id="crewName" 
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Summer Adventure 2025" 
                className="col-span-3" 
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="crewSize" className="text-right">
                How many people?
              </Label>
              <Input 
                id="crewSize" 
                value={newGroupSize}
                onChange={(e) => setNewGroupSize(e.target.value)}
                placeholder="e.g., 4" 
                className="col-span-3" 
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="preferredDestinations" className="text-right">
                Destination Ideas
              </Label>
              <Input 
                id="preferredDestinations" 
                value={preferredDestinations}
                onChange={(e) => setPreferredDestinations(e.target.value)}
                placeholder="Greece, Japan, Costa Rica..." 
                className="col-span-3" 
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCrewDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateCrew} 
              disabled={createGroupMutation.isPending}
            >
              {createGroupMutation.isPending ? (
                <>
                  <i className="fas fa-circle-notch fa-spin mr-2"></i> 
                  Creating...
                </>
              ) : (
                'Create Crew'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Explore;
