import React, { useState } from 'react';
import { FilterOptions, DestinationCategory, Region, PriceLevel } from '@shared/types';

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onApplyFilters: (filters: FilterOptions) => void;
}

const FilterSheet: React.FC<FilterSheetProps> = ({ 
  isOpen, 
  onClose, 
  filters, 
  onApplyFilters 
}) => {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  const handleReset = () => {
    setLocalFilters({});
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const togglePriceLevel = (level: PriceLevel) => {
    setLocalFilters(prev => {
      const priceLevels = prev.priceLevel || [];
      const newPriceLevels = priceLevels.includes(level)
        ? priceLevels.filter(l => l !== level)
        : [...priceLevels, level];
        
      return {
        ...prev,
        priceLevel: newPriceLevels.length > 0 ? newPriceLevels : undefined
      };
    });
  };

  const toggleCategory = (category: DestinationCategory) => {
    setLocalFilters(prev => {
      const categories = prev.categories || [];
      const newCategories = categories.includes(category)
        ? categories.filter(c => c !== category)
        : [...categories, category];
        
      return {
        ...prev,
        categories: newCategories.length > 0 ? newCategories : undefined
      };
    });
  };

  const setRegion = (region: Region | undefined) => {
    setLocalFilters(prev => ({
      ...prev,
      region
    }));
  };

  const isPriceLevelSelected = (level: PriceLevel) => {
    return localFilters.priceLevel?.includes(level) || false;
  };

  const isCategorySelected = (category: DestinationCategory) => {
    return localFilters.categories?.includes(category) || false;
  };

  return (
    <div 
      className={`bottom-sheet fixed inset-x-0 bottom-0 max-h-[80vh] bg-white rounded-t-2xl shadow-lg z-30 overflow-y-auto transition-transform ${isOpen ? 'transform-none' : 'translate-y-full'}`}
    >
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Filters</h3>
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-light"
            onClick={onClose}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="mb-6">
          <h4 className="font-medium mb-2">Budget</h4>
          <div className="flex items-center gap-3 mb-2">
            <div 
              className={`py-2 px-3 rounded flex-1 text-center cursor-pointer transition-colors ${isPriceLevelSelected(1) ? 'bg-dark text-white' : 'bg-light'}`}
              onClick={() => togglePriceLevel(1)}
            >
              <i className="fas fa-dollar-sign"></i>
              <span className="ml-1">Budget</span>
            </div>
            <div 
              className={`py-2 px-3 rounded flex-1 text-center cursor-pointer transition-colors ${isPriceLevelSelected(2) ? 'bg-dark text-white' : 'bg-light'}`}
              onClick={() => togglePriceLevel(2)}
            >
              <i className="fas fa-dollar-sign"></i><i className="fas fa-dollar-sign"></i>
              <span className="ml-1">Moderate</span>
            </div>
            <div 
              className={`py-2 px-3 rounded flex-1 text-center cursor-pointer transition-colors ${isPriceLevelSelected(3) ? 'bg-dark text-white' : 'bg-light'}`}
              onClick={() => togglePriceLevel(3)}
            >
              <i className="fas fa-dollar-sign"></i><i className="fas fa-dollar-sign"></i><i className="fas fa-dollar-sign"></i>
              <span className="ml-1">Luxury</span>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="font-medium mb-2">Destination Type</h4>
          <div className="grid grid-cols-2 gap-3">
            {(['Beach', 'Mountain', 'City', 'Cultural', 'Adventure', 'Relaxation'] as DestinationCategory[]).map(category => (
              <div 
                key={category}
                className={`py-2 px-3 rounded flex items-center cursor-pointer transition-colors ${isCategorySelected(category) ? 'bg-dark text-white' : 'bg-light'}`}
                onClick={() => toggleCategory(category)}
              >
                <input 
                  type="checkbox" 
                  checked={isCategorySelected(category)}
                  readOnly
                  className="mr-2"
                />
                <label>{category}</label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="font-medium mb-2">Region</h4>
          <div className="relative">
            <select 
              className="w-full py-2 px-3 border border-gray-300 rounded bg-white appearance-none pr-8"
              value={localFilters.region || ''}
              onChange={(e) => setRegion(e.target.value as Region || undefined)}
            >
              <option value="">All Regions</option>
              {(['Asia', 'Europe', 'North America', 'South America', 'Africa', 'Oceania'] as Region[]).map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <i className="fas fa-chevron-down text-gray-400"></i>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            className="py-3 rounded-lg border border-gray-300 font-medium"
            onClick={handleReset}
          >
            Reset
          </button>
          <button 
            className="py-3 rounded-lg bg-primary text-white font-medium"
            onClick={handleApply}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterSheet;
