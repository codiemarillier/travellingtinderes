import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertUserLikeSchema, 
  insertTravelCrewSchema, 
  insertCrewMemberSchema,
  insertTravelBuddySchema
} from "@shared/schema";
import { z } from "zod";

// Middleware to protect routes requiring authentication
const authMiddleware = async (req: Request, res: Response, next: any) => {
  // For this demo, we'll use a simple query or session-based auth
  const userId = req.session?.userId;
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    const user = await storage.getUser(Number(userId));
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Set up session middleware
  const session = require("express-session");
  const MemoryStore = require("memorystore")(session);
  
  app.use(
    session({
      cookie: { maxAge: 86400000 },
      store: new MemoryStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || "swipetrip-secret",
    })
  );

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // Create new user
      const user = await storage.createUser(userData);
      
      // Store user ID in session
      req.session.userId = user.id;
      
      // Return user data (excluding password)
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Store user ID in session
      req.session.userId = user.id;
      
      // Return user data (excluding password)
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to authenticate" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", authMiddleware, (req, res) => {
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  // Destination routes
  app.get("/api/destinations", async (req, res) => {
    try {
      const destinations = await storage.getDestinations();
      res.json(destinations);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch destinations" });
    }
  });

  app.get("/api/destinations/:id", async (req, res) => {
    try {
      const destination = await storage.getDestination(Number(req.params.id));
      
      if (!destination) {
        return res.status(404).json({ message: "Destination not found" });
      }
      
      res.json(destination);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch destination" });
    }
  });

  // Hotel routes
  app.get("/api/destinations/:id/hotels", async (req, res) => {
    try {
      const hotels = await storage.getHotels(Number(req.params.id));
      res.json(hotels);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch hotels" });
    }
  });

  // Destination highlights routes
  app.get("/api/destinations/:id/highlights", async (req, res) => {
    try {
      const highlights = await storage.getDestinationHighlights(Number(req.params.id));
      res.json(highlights);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch highlights" });
    }
  });

  // User likes routes
  app.get("/api/user/likes", authMiddleware, async (req, res) => {
    try {
      const userLikes = await storage.getUserLikes(req.user.id);
      
      // Get full destination data for each liked destination
      const likedDestinations = [];
      for (const like of userLikes) {
        if (like.liked) {
          const destination = await storage.getDestination(like.destinationId);
          if (destination) {
            likedDestinations.push({
              ...destination,
              savedAt: like.savedAt
            });
          }
        }
      }
      
      res.json(likedDestinations);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch liked destinations" });
    }
  });

  app.post("/api/user/likes", authMiddleware, async (req, res) => {
    try {
      const likeData = insertUserLikeSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      // Check if user already liked/disliked this destination
      const existingLike = await storage.getUserLikeByUserAndDestination(
        likeData.userId,
        likeData.destinationId
      );
      
      if (existingLike) {
        return res.status(400).json({ message: "Already responded to this destination" });
      }
      
      const userLike = await storage.createUserLike(likeData);
      
      // If user liked the destination, check for potential travel buddy matches
      if (likeData.liked) {
        // Find other users who liked this destination
        const allLikes = await storage.getUserLikes(likeData.destinationId);
        const otherUsersWhoLiked = allLikes.filter(
          like => like.userId !== likeData.userId && like.liked
        );
        
        // Create travel buddy matches
        for (const otherLike of otherUsersWhoLiked) {
          await storage.createTravelBuddy({
            userOneId: likeData.userId,
            userTwoId: otherLike.userId,
            destinationId: likeData.destinationId
          });
        }
      }
      
      res.status(201).json(userLike);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to save destination response" });
    }
  });

  // Travel crew routes
  app.get("/api/crews", authMiddleware, async (req, res) => {
    try {
      const crews = await storage.getTravelCrewsByUserId(req.user.id);
      res.json(crews);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch travel crews" });
    }
  });

  app.post("/api/crews", authMiddleware, async (req, res) => {
    try {
      const crewData = insertTravelCrewSchema.parse({
        ...req.body,
        creatorId: req.user.id
      });
      
      const crew = await storage.createTravelCrew(crewData);
      
      // Add creator as a member
      await storage.createCrewMember({
        crewId: crew.id,
        userId: req.user.id
      });
      
      res.status(201).json(crew);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to create travel crew" });
    }
  });

  app.post("/api/crews/:id/members", authMiddleware, async (req, res) => {
    try {
      const crewId = Number(req.params.id);
      const crew = await storage.getTravelCrew(crewId);
      
      if (!crew) {
        return res.status(404).json({ message: "Travel crew not found" });
      }
      
      const memberData = insertCrewMemberSchema.parse({
        crewId,
        userId: req.body.userId
      });
      
      const member = await storage.createCrewMember(memberData);
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to add crew member" });
    }
  });

  // Travel buddy routes
  app.get("/api/user/travel-buddies", authMiddleware, async (req, res) => {
    try {
      const travelBuddies = await storage.getTravelBuddies(req.user.id);
      
      // Get user and destination info for each buddy match
      const buddyMatches = [];
      for (const buddy of travelBuddies) {
        const otherUserId = buddy.userOneId === req.user.id ? buddy.userTwoId : buddy.userOneId;
        const otherUser = await storage.getUser(otherUserId);
        const destination = await storage.getDestination(buddy.destinationId);
        
        if (otherUser && destination) {
          const { password, ...userWithoutPassword } = otherUser;
          buddyMatches.push({
            id: buddy.id,
            user: userWithoutPassword,
            destination,
            matchedAt: buddy.matchedAt
          });
        }
      }
      
      res.json(buddyMatches);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch travel buddies" });
    }
  });

  return httpServer;
}
