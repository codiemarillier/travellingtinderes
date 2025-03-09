import React, { useState } from 'react';
import SwipeDeck from '@/components/SwipeDeck';
import FilterSheet from '@/components/FilterSheet';
import { UserProfile, FilterOptions, AppMode } from '@shared/types';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

const categoryFilters = ['All', 'Beach', 'Mountain', 'City', 'Cultural', 'Adventure', 'Relaxation'];

interface ExploreProps {
  user: UserProfile;
  appMode: AppMode;
}

const Explore: React.FC<ExploreProps> = ({ user, appMode }) => {
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // For crew mode, we need to get the active group
  const [activeGroupId, setActiveGroupId] = useState<number | undefined>(undefined);
  
  // Query to fetch user's groups if in Crew mode
  const { data: groups = [] } = useQuery({
    queryKey: [`/api/users/${user.id}/groups`],
    enabled: appMode === 'Crew',
  });
  
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
  
  return (
    <div className="py-4 px-4 h-full flex flex-col">
      <div className="bg-white rounded-t-2xl shadow-sm p-3 mb-4 flex items-center gap-2">
        {appMode === 'Crew' && (
          <div className="flex-1">
            <select 
              className="bg-light px-3 py-1 rounded text-sm"
              value={activeGroupId || ''}
              onChange={(e) => setActiveGroupId(Number(e.target.value) || undefined)}
            >
              <option value="">Select a trip group</option>
              {groups.map((group: any) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>
        )}
        
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
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
              className={`filter-pill px-4 py-2 rounded-full bg-white text-sm font-medium shadow-sm hover:shadow transition-all ${selectedCategory === category ? 'bg-dark text-white' : ''}`}
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
            <div className="text-secondary text-5xl mb-4">
              <i className="fas fa-users"></i>
            </div>
            <h3 className="text-xl font-bold mb-2">Select a Trip Group</h3>
            <p className="text-gray-600 mb-4 text-center">
              Choose a group or create a new one to start swiping with friends
            </p>
            <Button 
              onClick={() => setShowFilterSheet(true)}
              variant="default"
            >
              Create New Group
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
    </div>
  );
};

export default Explore;
