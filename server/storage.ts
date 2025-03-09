import { 
  User, InsertUser, users,
  Destination, InsertDestination, destinations,
  Swipe, InsertSwipe, swipes,
  TravelBuddy, InsertTravelBuddy, travelBuddies,
  Group, InsertGroup, groups,
  GroupMember, InsertGroupMember, groupMembers,
  GroupVote, InsertGroupVote, groupVotes,
  DestinationDetail, InsertDestinationDetail, destinationDetails
} from "@shared/schema";
import { FilterOptions, DestinationCategory, Region, PriceLevel } from "@shared/types";

// Storage interface with CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;

  // Destination methods
  getDestination(id: number): Promise<Destination | undefined>;
  getAllDestinations(): Promise<Destination[]>;
  getFilteredDestinations(filters: FilterOptions): Promise<Destination[]>;
  createDestination(destination: InsertDestination): Promise<Destination>;

  // Swipe methods
  createSwipe(swipe: InsertSwipe): Promise<Swipe>;
  getUserSwipes(userId: number): Promise<Swipe[]>;
  getUserLikes(userId: number): Promise<Swipe[]>;

  // Travel Buddy methods
  createTravelBuddy(travelBuddy: InsertTravelBuddy): Promise<TravelBuddy>;
  getTravelBuddyMatches(userId: number): Promise<TravelBuddy[]>;
  updateTravelBuddyStatus(id: number, status: string): Promise<TravelBuddy | undefined>;

  // Group methods
  createGroup(group: InsertGroup): Promise<Group>;
  getGroup(id: number): Promise<Group | undefined>;
  getUserGroups(userId: number): Promise<Group[]>;

  // Group Member methods
  addGroupMember(groupMember: InsertGroupMember): Promise<GroupMember>;
  getGroupMembers(groupId: number): Promise<GroupMember[]>;

  // Group Vote methods
  createGroupVote(vote: InsertGroupVote): Promise<GroupVote>;
  getGroupVotes(groupId: number): Promise<GroupVote[]>;

  // Destination Details methods
  getDestinationDetails(destinationId: number): Promise<DestinationDetail | undefined>;
  createDestinationDetails(details: InsertDestinationDetail): Promise<DestinationDetail>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private destinations: Map<number, Destination>;
  private swipes: Map<number, Swipe>;
  private travelBuddies: Map<number, TravelBuddy>;
  private groups: Map<number, Group>;
  private groupMembers: Map<number, GroupMember>;
  private groupVotes: Map<number, GroupVote>;
  private destinationDetails: Map<number, DestinationDetail>;
  
  private userIdCounter: number;
  private destinationIdCounter: number;
  private swipeIdCounter: number;
  private travelBuddyIdCounter: number;
  private groupIdCounter: number;
  private groupMemberIdCounter: number;
  private groupVoteIdCounter: number;
  private destinationDetailIdCounter: number;

  constructor() {
    this.users = new Map();
    this.destinations = new Map();
    this.swipes = new Map();
    this.travelBuddies = new Map();
    this.groups = new Map();
    this.groupMembers = new Map();
    this.groupVotes = new Map();
    this.destinationDetails = new Map();
    
    this.userIdCounter = 1;
    this.destinationIdCounter = 1;
    this.swipeIdCounter = 1;
    this.travelBuddyIdCounter = 1;
    this.groupIdCounter = 1;
    this.groupMemberIdCounter = 1;
    this.groupVoteIdCounter = 1;
    this.destinationDetailIdCounter = 1;
    
    // Initialize with sample destinations
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample destinations
    const sampleDestinations: InsertDestination[] = [
      {
        name: "Bali",
        country: "Indonesia",
        description: "Perfect for adventure and relaxation",
        imageUrl: "https://images.unsplash.com/photo-1564648351416-3eec9f3e85de?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        priceLevel: 2,
        categories: ["Beach", "Adventure", "Relaxation"],
        region: "Asia"
      },
      {
        name: "Paris",
        country: "France",
        description: "The city of love and culture",
        imageUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        priceLevel: 3,
        categories: ["City", "Cultural"],
        region: "Europe"
      },
      {
        name: "Tokyo",
        country: "Japan",
        description: "Where tradition meets innovation",
        imageUrl: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        priceLevel: 3,
        categories: ["City", "Cultural"],
        region: "Asia"
      },
      {
        name: "Santorini",
        country: "Greece",
        description: "Beautiful sunsets and white buildings",
        imageUrl: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        priceLevel: 3,
        categories: ["Beach", "Relaxation"],
        region: "Europe"
      },
      {
        name: "New York",
        country: "USA",
        description: "The city that never sleeps",
        imageUrl: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        priceLevel: 3,
        categories: ["City", "Cultural"],
        region: "North America"
      },
      {
        name: "Kyoto",
        country: "Japan",
        description: "Traditional Japanese culture",
        imageUrl: "https://images.unsplash.com/photo-1558862107-d49ef2a04d72?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        priceLevel: 2,
        categories: ["Cultural", "City"],
        region: "Asia"
      },
      {
        name: "Barcelona",
        country: "Spain",
        description: "Amazing architecture and beaches",
        imageUrl: "https://images.unsplash.com/photo-1583422409516-2895a77efded?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        priceLevel: 2,
        categories: ["City", "Beach"],
        region: "Europe"
      },
      {
        name: "Machu Picchu",
        country: "Peru",
        description: "Ancient ruins and mountain views",
        imageUrl: "https://images.unsplash.com/photo-1526392060635-9d6019884377?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        priceLevel: 2,
        categories: ["Mountain", "Adventure", "Cultural"],
        region: "South America"
      }
    ];

    // Add destinations
    sampleDestinations.forEach(dest => {
      this.createDestination(dest);
    });

    // Add details for Bali
    this.createDestinationDetails({
      destinationId: 1, // Bali
      bestTimeToVisit: "April to October (dry season) is ideal for beach activities and exploring.",
      attractions: [
        "Ubud Monkey Forest",
        "Uluwatu Temple",
        "Tegallalang Rice Terraces",
        "Kuta and Seminyak Beaches",
        "Mount Batur Sunrise Trek"
      ],
      hotelOptions: [
        {
          name: "Four Seasons Resort Bali",
          stars: 5,
          description: "Luxury beachfront resort with private villas",
          price: "$350/night",
          imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&q=80"
        },
        {
          name: "Ubud Village Resort",
          stars: 4,
          description: "Serene resort surrounded by rice fields",
          price: "$150/night",
          imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&q=80"
        },
        {
          name: "Kuta Beach Hostel",
          stars: 3,
          description: "Budget-friendly option near the beach",
          price: "$30/night",
          imageUrl: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&q=80"
        }
      ],
      travelTips: {
        safety: [
          "Be cautious of monkeys at temples - they can snatch belongings",
          "Wear a helmet when riding scooters",
          "Stay hydrated in the tropical climate",
          "Be aware of rip currents at certain beaches"
        ],
        localCustoms: [
          "Dress respectfully when visiting temples (cover shoulders and knees)",
          "Remove shoes before entering homes and temples",
          "Use your right hand for giving or receiving",
          "Learn basic Indonesian phrases as a courtesy"
        ],
        food: [
          "Try local dishes like Nasi Goreng, Babi Guling, and Satay",
          "Drink bottled water only",
          "Be cautious with street food if you have a sensitive stomach",
          "Warungs (local restaurants) offer authentic food at lower prices"
        ]
      },
      costs: {
        accommodation: "$30-150/night",
        meals: "$5-25/meal",
        transportation: "$5-15/day",
        activities: "$10-50/activity"
      }
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Destination methods
  async getDestination(id: number): Promise<Destination | undefined> {
    return this.destinations.get(id);
  }

  async getAllDestinations(): Promise<Destination[]> {
    return Array.from(this.destinations.values());
  }

  async getFilteredDestinations(filters: FilterOptions): Promise<Destination[]> {
    let destinations = Array.from(this.destinations.values());
    
    // Apply filters
    if (filters.priceLevel && filters.priceLevel.length > 0) {
      destinations = destinations.filter(d => 
        filters.priceLevel!.includes(d.priceLevel as PriceLevel)
      );
    }
    
    if (filters.categories && filters.categories.length > 0) {
      destinations = destinations.filter(d => 
        d.categories.some(c => filters.categories!.includes(c as DestinationCategory))
      );
    }
    
    if (filters.region) {
      destinations = destinations.filter(d => d.region === filters.region);
    }
    
    return destinations;
  }

  async createDestination(insertDest: InsertDestination): Promise<Destination> {
    const id = this.destinationIdCounter++;
    const destination: Destination = { ...insertDest, id };
    this.destinations.set(id, destination);
    return destination;
  }

  // Swipe methods
  async createSwipe(insertSwipe: InsertSwipe): Promise<Swipe> {
    const id = this.swipeIdCounter++;
    const now = new Date();
    const swipe: Swipe = { ...insertSwipe, id, createdAt: now };
    this.swipes.set(id, swipe);
    return swipe;
  }

  async getUserSwipes(userId: number): Promise<Swipe[]> {
    return Array.from(this.swipes.values()).filter(
      (swipe) => swipe.userId === userId
    );
  }

  async getUserLikes(userId: number): Promise<Swipe[]> {
    return Array.from(this.swipes.values()).filter(
      (swipe) => swipe.userId === userId && swipe.liked
    );
  }

  // Travel Buddy methods
  async createTravelBuddy(insertTravelBuddy: InsertTravelBuddy): Promise<TravelBuddy> {
    const id = this.travelBuddyIdCounter++;
    const now = new Date();
    const travelBuddy: TravelBuddy = { ...insertTravelBuddy, id, createdAt: now };
    this.travelBuddies.set(id, travelBuddy);
    return travelBuddy;
  }

  async getTravelBuddyMatches(userId: number): Promise<TravelBuddy[]> {
    return Array.from(this.travelBuddies.values()).filter(
      (buddy) => buddy.user1Id === userId || buddy.user2Id === userId
    );
  }

  async updateTravelBuddyStatus(id: number, status: string): Promise<TravelBuddy | undefined> {
    const buddy = this.travelBuddies.get(id);
    if (!buddy) return undefined;
    
    const updatedBuddy = { ...buddy, status };
    this.travelBuddies.set(id, updatedBuddy);
    return updatedBuddy;
  }

  // Group methods
  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const id = this.groupIdCounter++;
    const now = new Date();
    const group: Group = { ...insertGroup, id, createdAt: now };
    this.groups.set(id, group);
    return group;
  }

  async getGroup(id: number): Promise<Group | undefined> {
    return this.groups.get(id);
  }

  async getUserGroups(userId: number): Promise<Group[]> {
    // Get groups where user is creator
    const createdGroups = Array.from(this.groups.values()).filter(
      (group) => group.creatorId === userId
    );
    
    // Get groups where user is a member
    const memberGroupIds = Array.from(this.groupMembers.values())
      .filter((member) => member.userId === userId)
      .map((member) => member.groupId);
    
    const memberGroups = memberGroupIds
      .map((groupId) => this.groups.get(groupId))
      .filter((group): group is Group => group !== undefined);
    
    return [...createdGroups, ...memberGroups];
  }

  // Group Member methods
  async addGroupMember(insertMember: InsertGroupMember): Promise<GroupMember> {
    const id = this.groupMemberIdCounter++;
    const now = new Date();
    const member: GroupMember = { ...insertMember, id, joinedAt: now };
    this.groupMembers.set(id, member);
    return member;
  }

  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return Array.from(this.groupMembers.values()).filter(
      (member) => member.groupId === groupId
    );
  }

  // Group Vote methods
  async createGroupVote(insertVote: InsertGroupVote): Promise<GroupVote> {
    const id = this.groupVoteIdCounter++;
    const now = new Date();
    const vote: GroupVote = { ...insertVote, id, createdAt: now };
    this.groupVotes.set(id, vote);
    return vote;
  }

  async getGroupVotes(groupId: number): Promise<GroupVote[]> {
    return Array.from(this.groupVotes.values()).filter(
      (vote) => vote.groupId === groupId
    );
  }

  // Destination Details methods
  async getDestinationDetails(destinationId: number): Promise<DestinationDetail | undefined> {
    return Array.from(this.destinationDetails.values()).find(
      (detail) => detail.destinationId === destinationId
    );
  }

  async createDestinationDetails(insertDetails: InsertDestinationDetail): Promise<DestinationDetail> {
    const id = this.destinationDetailIdCounter++;
    const details: DestinationDetail = { ...insertDetails, id };
    this.destinationDetails.set(id, details);
    return details;
  }
}

export const storage = new MemStorage();
