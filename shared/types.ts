// Define commonly used types across the application

export type UserProfile = {
  id: number;
  username: string;
  email: string;
  profileImage?: string;
  bio?: string;
};

export type DestinationCategory = 
  | 'Beach' 
  | 'Mountain' 
  | 'City' 
  | 'Cultural' 
  | 'Adventure' 
  | 'Relaxation';

export type Region = 
  | 'Asia' 
  | 'Europe' 
  | 'North America' 
  | 'South America' 
  | 'Africa' 
  | 'Oceania';

export type PriceLevel = 1 | 2 | 3; // $ to $$$

export interface DestinationCard {
  id: number;
  name: string;
  country: string;
  description: string;
  imageUrl: string;
  priceLevel: PriceLevel;
  categories: DestinationCategory[];
  region: Region;
}

export interface HotelOption {
  name: string;
  stars: number;
  description: string;
  price: string;
  imageUrl: string;
}

export interface TravelTips {
  safety: string[];
  localCustoms: string[];
  food: string[];
}

export interface Costs {
  accommodation: string;
  meals: string;
  transportation: string;
  activities: string;
}

export interface DestinationDetails {
  id: number;
  destinationId: number;
  bestTimeToVisit?: string;
  attractions?: string[];
  hotelOptions?: HotelOption[];
  travelTips?: TravelTips;
  costs?: Costs;
}

export interface FilterOptions {
  priceLevel?: PriceLevel[];
  categories?: DestinationCategory[];
  region?: Region;
}

export type AppMode = 'Solo' | 'Crew';

export interface TravelBuddyMatch {
  id: number;
  userId: number;
  matchedUserId: number;
  matchedUsername: string;
  matchedProfileImage?: string;
  destinationId: number;
  destinationName: string;
  status: 'pending' | 'accepted' | 'rejected';
}
