import React, { useState } from 'react';
import { UserProfile, AppMode } from '@shared/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from '@/components/ui/switch';
import { useLocation } from 'wouter';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HeaderProps {
  user: UserProfile;
  onLogout: () => void;
  appMode: AppMode;
  onToggleMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, appMode, onToggleMode }) => {
  const [location, setLocation] = useLocation();
  const [showLocationFilter, setShowLocationFilter] = useState(false);

  // Function to get initials from username
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="header-container z-10">
      <header className="bg-white py-3 px-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold font-heading text-dark">
            <span className="text-primary">Swipe</span>Trip
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full bg-light flex items-center justify-center text-dark hover:bg-gray-200"
            onClick={() => setShowLocationFilter(!showLocationFilter)}
          >
            <i className="fas fa-map-marker-alt"></i>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="w-8 h-8 cursor-pointer">
                <AvatarImage src={user.profileImage} />
                <AvatarFallback className="bg-gray-200">{getInitials(user.username)}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation('/profile')}>
                <i className="fas fa-user mr-2"></i>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('/settings')}>
                <i className="fas fa-cog mr-2"></i>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-red-500">
                <i className="fas fa-sign-out-alt mr-2"></i>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      {/* Mode toggle tabs */}
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <Tabs 
          defaultValue={appMode} 
          value={appMode} 
          onValueChange={(value) => {
            if (value === 'Solo' || value === 'Crew') {
              onToggleMode();
            }
          }}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="Solo" className="text-base">
              <i className="fas fa-user mr-2"></i>
              Solo Mode
            </TabsTrigger>
            <TabsTrigger value="Crew" className="text-base">
              <i className="fas fa-users mr-2"></i>
              Crew Mode
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Location filter */}
      <div className={`bg-white border-b border-gray-100 px-4 py-2 transition-all duration-200 ${showLocationFilter ? 'max-h-20' : 'max-h-0 overflow-hidden opacity-0'}`}>
        <div className="text-sm font-medium text-gray-500 flex items-center gap-1">
          <i className="fas fa-globe-americas text-primary"></i>
          <span>Destination Region:</span>
          <select className="ml-2 bg-light rounded px-2 py-1 text-sm">
            <option>Anywhere</option>
            <option>Europe</option>
            <option>Asia</option>
            <option>North America</option>
            <option>South America</option>
            <option>Africa</option>
            <option>Oceania</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Header;
