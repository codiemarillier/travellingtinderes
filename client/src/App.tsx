import { Route, Switch } from "wouter";
import { useState, useEffect } from "react";
import Explore from "@/pages/explore";
import Favorites from "@/pages/favorites";
import Buddies from "@/pages/buddies";
import Trips from "@/pages/trips";
import Auth from "@/pages/auth";
import NotFound from "@/pages/not-found";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { UserProfile, AppMode } from "@shared/types";

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [appMode, setAppMode] = useState<AppMode>("Solo");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check local storage for user data on app initialization
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // If parse fails, clear stored user
        localStorage.removeItem("user");
      }
    }
    
    // Check for app mode preference
    const storedAppMode = localStorage.getItem("appMode") as AppMode | null;
    if (storedAppMode && (storedAppMode === "Solo" || storedAppMode === "Crew")) {
      setAppMode(storedAppMode);
    }
    
    setIsLoading(false);
  }, []);

  const handleLogin = (userData: UserProfile) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const toggleAppMode = () => {
    const newMode = appMode === "Solo" ? "Crew" : "Solo";
    setAppMode(newMode);
    localStorage.setItem("appMode", newMode);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-medium text-dark">Loading SwipeTrip...</p>
      </div>
    );
  }

  // Show auth screen if user is not logged in
  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="app-container flex flex-col h-screen overflow-hidden bg-light">
      <Header 
        user={user} 
        onLogout={handleLogout} 
        appMode={appMode} 
        onToggleMode={toggleAppMode} 
      />
      
      <main className="flex-1 overflow-hidden">
        <Switch>
          <Route path="/" component={() => <Explore user={user} appMode={appMode} />} />
          <Route path="/favorites" component={() => <Favorites user={user} />} />
          <Route path="/buddies" component={() => <Buddies user={user} />} />
          <Route path="/trips" component={() => <Trips user={user} appMode={appMode} />} />
          <Route component={NotFound} />
        </Switch>
      </main>
      
      <BottomNavigation />
    </div>
  );
}

export default App;
