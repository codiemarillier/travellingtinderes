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

interface HeaderProps {
  user: UserProfile;
  onLogout: () => void;
  appMode: AppMode;
  onToggleMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, appMode, onToggleMode }) => {
  const [location, setLocation] = useLocation();
  const [showLocation, setShowLocation] = useState(false);

  // Function to get initials from username
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="bg-white py-3 px-4 flex justify-between items-center shadow-sm z-10">
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
          onClick={() => setShowLocation(!showLocation)}
        >
          <i className="fas fa-sliders-h"></i>
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
      
      {/* Mode toggle and location selector */}
      <div className={`absolute top-full left-0 right-0 bg-white rounded-b-2xl shadow-sm p-3 transition-transform duration-200 ${showLocation ? 'transform-none' : '-translate-y-full pointer-events-none'}`}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Solo Mode</span>
            <Switch 
              checked={appMode === 'Crew'}
              onCheckedChange={onToggleMode}
            />
            <span className={`text-sm font-medium ${appMode === 'Crew' ? 'text-primary' : 'text-gray-400'}`}>Crew Mode</span>
          </div>
          <div className="text-sm font-medium text-gray-500 flex items-center gap-1 mt-1">
            <i className="fas fa-map-marker-alt text-primary"></i>
            <span>Anywhere</span>
            <i className="fas fa-chevron-down text-xs ml-1"></i>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
