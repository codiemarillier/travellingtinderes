import {
  users, destinations, hotels, userLikes, destinationHighlights,
  travelCrews, crewMembers, travelBuddies,
  type User, type InsertUser, type Destination, type InsertDestination,
  type Hotel, type InsertHotel, type UserLike, type InsertUserLike,
  type DestinationHighlight, type InsertDestinationHighlight,
  type TravelCrew, type InsertTravelCrew, type CrewMember, type InsertCrewMember,
  type TravelBuddy, type InsertTravelBuddy
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Destination operations
  getDestinations(): Promise<Destination[]>;
  getDestination(id: number): Promise<Destination | undefined>;
  createDestination(destination: InsertDestination): Promise<Destination>;
  
  // Hotel operations
  getHotels(destinationId: number): Promise<Hotel[]>;
  createHotel(hotel: InsertHotel): Promise<Hotel>;
  
  // User likes operations
  getUserLikes(userId: number): Promise<UserLike[]>;
  createUserLike(userLike: InsertUserLike): Promise<UserLike>;
  getUserLikeByUserAndDestination(userId: number, destinationId: number): Promise<UserLike | undefined>;
  
  // Destination highlights operations
  getDestinationHighlights(destinationId: number): Promise<DestinationHighlight[]>;
  createDestinationHighlight(highlight: InsertDestinationHighlight): Promise<DestinationHighlight>;
  
  // Travel crews operations
  getTravelCrews(): Promise<TravelCrew[]>;
  getTravelCrew(id: number): Promise<TravelCrew | undefined>;
  createTravelCrew(crew: InsertTravelCrew): Promise<TravelCrew>;
  getTravelCrewsByUserId(userId: number): Promise<TravelCrew[]>;
  
  // Crew members operations
  getCrewMembers(crewId: number): Promise<CrewMember[]>;
  createCrewMember(member: InsertCrewMember): Promise<CrewMember>;
  
  // Travel buddies operations
  getTravelBuddies(userId: number): Promise<TravelBuddy[]>;
  getTravelBuddyMatches(userId: number, destinationId: number): Promise<TravelBuddy[]>;
  createTravelBuddy(buddy: InsertTravelBuddy): Promise<TravelBuddy>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private destinations: Map<number, Destination>;
  private hotels: Map<number, Hotel>;
  private userLikes: Map<number, UserLike>;
  private destinationHighlights: Map<number, DestinationHighlight>;
  private travelCrews: Map<number, TravelCrew>;
  private crewMembers: Map<number, CrewMember>;
  private travelBuddies: Map<number, TravelBuddy>;
  
  currentUserId: number;
  currentDestinationId: number;
  currentHotelId: number;
  currentUserLikeId: number;
  currentDestinationHighlightId: number;
  currentTravelCrewId: number;
  currentCrewMemberId: number;
  currentTravelBuddyId: number;

  constructor() {
    this.users = new Map();
    this.destinations = new Map();
    this.hotels = new Map();
    this.userLikes = new Map();
    this.destinationHighlights = new Map();
    this.travelCrews = new Map();
    this.crewMembers = new Map();
    this.travelBuddies = new Map();
    
    this.currentUserId = 1;
    this.currentDestinationId = 1;
    this.currentHotelId = 1;
    this.currentUserLikeId = 1;
    this.currentDestinationHighlightId = 1;
    this.currentTravelCrewId = 1;
    this.currentCrewMemberId = 1;
    this.currentTravelBuddyId = 1;
    
    // Initialize with sample destinations
    this.initializeData();
  }

  private initializeData() {
    // Add some sample destinations
    const tokyo = this.createDestination({
      name: "Tokyo",
      country: "Japan",
      description: "Tokyo is a vibrant metropolis that blends ultramodern with traditional. From ancient temples to neon-lit skyscrapers, Tokyo offers something for every traveler.",
      imageUrl: "https://images.unsplash.com/photo-1537996194471-e657df975ab4",
      rating: "4.8",
      priceRange: "$120-300 per night",
      bestTimeToVisit: "April-May, Sept-Nov",
      tags: ["Urban", "Culture", "Food"]
    });
    
    const santorini = this.createDestination({
      name: "Santorini",
      country: "Greece",
      description: "Witness stunning sunsets over white buildings and blue domes.",
      imageUrl: "https://images.unsplash.com/photo-1557269381-e2986f256055",
      rating: "4.9",
      priceRange: "$150-400 per night",
      bestTimeToVisit: "May-Sept",
      tags: ["Beach", "Romantic", "Scenic"]
    });
    
    const london = this.createDestination({
      name: "London",
      country: "UK",
      description: "Visit Big Ben, Buckingham Palace, and enjoy British pubs.",
      imageUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad",
      rating: "4.7",
      priceRange: "$100-350 per night",
      bestTimeToVisit: "May-Sept",
      tags: ["City", "History", "Shopping"]
    });
    
    const bali = this.createDestination({
      name: "Bali",
      country: "Indonesia",
      description: "Experience lush rice terraces, vibrant beaches, and spiritual temples.",
      imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4",
      rating: "4.8",
      priceRange: "$50-300 per night",
      bestTimeToVisit: "April-Sept",
      tags: ["Beach", "Nature", "Culture"]
    });
    
    const paris = this.createDestination({
      name: "Paris",
      country: "France",
      description: "Explore the Eiffel Tower, Louvre, and charming neighborhoods.",
      imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34",
      rating: "4.8",
      priceRange: "$120-400 per night",
      bestTimeToVisit: "April-June, Sept-Oct",
      tags: ["City", "Culture", "Food"]
    });
    
    // Add hotels for Tokyo
    this.createHotel({
      destinationId: tokyo.id,
      name: "Park Hyatt Tokyo",
      imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945",
      rating: "5.0",
      pricePerNight: "$300"
    });
    
    this.createHotel({
      destinationId: tokyo.id,
      name: "Shibuya Stream Excel Hotel",
      imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa",
      rating: "4.5",
      pricePerNight: "$220"
    });
    
    this.createHotel({
      destinationId: tokyo.id,
      name: "Hotel Gracery Shinjuku",
      imageUrl: "https://images.unsplash.com/photo-1611892440504-42a792e24d32",
      rating: "4.0",
      pricePerNight: "$150"
    });
    
    // Add destination highlights for Tokyo
    this.createDestinationHighlight({
      destinationId: tokyo.id,
      icon: "restaurant",
      text: "World-class dining"
    });
    
    this.createDestinationHighlight({
      destinationId: tokyo.id,
      icon: "local_mall",
      text: "Shopping districts"
    });
    
    this.createDestinationHighlight({
      destinationId: tokyo.id,
      icon: "temple_buddhist",
      text: "Historic temples"
    });
    
    this.createDestinationHighlight({
      destinationId: tokyo.id,
      icon: "park",
      text: "Beautiful parks"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  // Destination methods
  async getDestinations(): Promise<Destination[]> {
    return Array.from(this.destinations.values());
  }

  async getDestination(id: number): Promise<Destination | undefined> {
    return this.destinations.get(id);
  }

  async createDestination(insertDestination: InsertDestination): Promise<Destination> {
    const id = this.currentDestinationId++;
    const destination: Destination = { ...insertDestination, id };
    this.destinations.set(id, destination);
    return destination;
  }

  // Hotel methods
  async getHotels(destinationId: number): Promise<Hotel[]> {
    return Array.from(this.hotels.values()).filter(
      (hotel) => hotel.destinationId === destinationId,
    );
  }

  async createHotel(insertHotel: InsertHotel): Promise<Hotel> {
    const id = this.currentHotelId++;
    const hotel: Hotel = { ...insertHotel, id };
    this.hotels.set(id, hotel);
    return hotel;
  }

  // User likes methods
  async getUserLikes(userId: number): Promise<UserLike[]> {
    return Array.from(this.userLikes.values()).filter(
      (like) => like.userId === userId,
    );
  }

  async createUserLike(insertUserLike: InsertUserLike): Promise<UserLike> {
    const id = this.currentUserLikeId++;
    const now = new Date();
    const userLike: UserLike = { ...insertUserLike, id, savedAt: now };
    this.userLikes.set(id, userLike);
    return userLike;
  }

  async getUserLikeByUserAndDestination(userId: number, destinationId: number): Promise<UserLike | undefined> {
    return Array.from(this.userLikes.values()).find(
      (like) => like.userId === userId && like.destinationId === destinationId,
    );
  }

  // Destination highlights methods
  async getDestinationHighlights(destinationId: number): Promise<DestinationHighlight[]> {
    return Array.from(this.destinationHighlights.values()).filter(
      (highlight) => highlight.destinationId === destinationId,
    );
  }

  async createDestinationHighlight(insertHighlight: InsertDestinationHighlight): Promise<DestinationHighlight> {
    const id = this.currentDestinationHighlightId++;
    const highlight: DestinationHighlight = { ...insertHighlight, id };
    this.destinationHighlights.set(id, highlight);
    return highlight;
  }

  // Travel crews methods
  async getTravelCrews(): Promise<TravelCrew[]> {
    return Array.from(this.travelCrews.values());
  }

  async getTravelCrew(id: number): Promise<TravelCrew | undefined> {
    return this.travelCrews.get(id);
  }

  async createTravelCrew(insertCrew: InsertTravelCrew): Promise<TravelCrew> {
    const id = this.currentTravelCrewId++;
    const now = new Date();
    const crew: TravelCrew = { ...insertCrew, id, createdAt: now };
    this.travelCrews.set(id, crew);
    return crew;
  }

  async getTravelCrewsByUserId(userId: number): Promise<TravelCrew[]> {
    // Get all crews where user is a member
    const userCrewIds = Array.from(this.crewMembers.values())
      .filter(member => member.userId === userId)
      .map(member => member.crewId);
    
    // Get all crews where user is the creator
    const createdCrews = Array.from(this.travelCrews.values())
      .filter(crew => crew.creatorId === userId);
    
    // Get crews where user is a member but not the creator
    const memberCrews = Array.from(this.travelCrews.values())
      .filter(crew => userCrewIds.includes(crew.id) && crew.creatorId !== userId);
    
    // Combine both lists and return
    return [...createdCrews, ...memberCrews];
  }

  // Crew members methods
  async getCrewMembers(crewId: number): Promise<CrewMember[]> {
    return Array.from(this.crewMembers.values()).filter(
      (member) => member.crewId === crewId,
    );
  }

  async createCrewMember(insertMember: InsertCrewMember): Promise<CrewMember> {
    const id = this.currentCrewMemberId++;
    const now = new Date();
    const member: CrewMember = { ...insertMember, id, joinedAt: now };
    this.crewMembers.set(id, member);
    return member;
  }

  // Travel buddies methods
  async getTravelBuddies(userId: number): Promise<TravelBuddy[]> {
    return Array.from(this.travelBuddies.values()).filter(
      (buddy) => buddy.userOneId === userId || buddy.userTwoId === userId,
    );
  }

  async getTravelBuddyMatches(userId: number, destinationId: number): Promise<TravelBuddy[]> {
    return Array.from(this.travelBuddies.values()).filter(
      (buddy) => 
        (buddy.userOneId === userId || buddy.userTwoId === userId) && 
        buddy.destinationId === destinationId,
    );
  }

  async createTravelBuddy(insertBuddy: InsertTravelBuddy): Promise<TravelBuddy> {
    const id = this.currentTravelBuddyId++;
    const now = new Date();
    const buddy: TravelBuddy = { ...insertBuddy, id, matchedAt: now };
    this.travelBuddies.set(id, buddy);
    return buddy;
  }
}

export const storage = new MemStorage();
