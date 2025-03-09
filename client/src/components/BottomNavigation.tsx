import React from 'react';
import { useLocation, Link } from 'wouter';

const BottomNavigation: React.FC = () => {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <nav className="bg-white py-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around">
        <Link href="/">
          <div className={`flex flex-col items-center px-3 py-1 ${isActive('/') ? 'text-primary' : 'text-gray-400'} relative cursor-pointer`}>
            <i className="fas fa-compass fa-lg"></i>
            <span className="text-xs mt-1">Explore</span>
            {isActive('/') && <span className="absolute bottom-0 w-1/2 h-0.5 bg-primary rounded-full"></span>}
          </div>
        </Link>
        
        <Link href="/favorites">
          <div className={`flex flex-col items-center px-3 py-1 ${isActive('/favorites') ? 'text-primary' : 'text-gray-400'} relative cursor-pointer`}>
            <i className="fas fa-heart fa-lg"></i>
            <span className="text-xs mt-1">Favorites</span>
            {isActive('/favorites') && <span className="absolute bottom-0 w-1/2 h-0.5 bg-primary rounded-full"></span>}
          </div>
        </Link>
        
        <Link href="/buddies">
          <div className={`flex flex-col items-center px-3 py-1 ${isActive('/buddies') ? 'text-primary' : 'text-gray-400'} relative cursor-pointer`}>
            <i className="fas fa-user-friends fa-lg"></i>
            <span className="text-xs mt-1">Buddies</span>
            {isActive('/buddies') && <span className="absolute bottom-0 w-1/2 h-0.5 bg-primary rounded-full"></span>}
          </div>
        </Link>
        
        <Link href="/trips">
          <div className={`flex flex-col items-center px-3 py-1 ${isActive('/trips') ? 'text-primary' : 'text-gray-400'} relative cursor-pointer`}>
            <i className="fas fa-suitcase fa-lg"></i>
            <span className="text-xs mt-1">Trips</span>
            {isActive('/trips') && <span className="absolute bottom-0 w-1/2 h-0.5 bg-primary rounded-full"></span>}
          </div>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNavigation;
