import { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { insertUserSchema, insertSwipeSchema, insertTravelBuddySchema, insertGroupSchema, insertGroupMemberSchema, insertGroupVoteSchema } from "@shared/schema";
import { FilterOptions } from "@shared/types";

const wsClients = new Map<number, WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket setup for real-time features
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws'
  });
  
  console.log('WebSocket server initialized on path: /ws');
  
  wss.on("connection", (ws) => {
    let userId: number | undefined;
    
    ws.on("message", (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'auth' && data.userId) {
          userId = data.userId;
          wsClients.set(userId, ws);
          ws.send(JSON.stringify({ type: 'auth_success' }));
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });
    
    ws.on("close", () => {
      if (userId) {
        wsClients.delete(userId);
      }
    });
  });
  
  // API Routes
  // Prefix all routes with /api
  
  // Auth Routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // In a real app, you would hash the password here
      const newUser = await storage.createUser(userData);
      
      // Remove the password from the response
      const { password, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // In a real app, you would use JWT or sessions here
      
      // Remove the password from the response
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Destination Routes
  app.get("/api/destinations", async (req: Request, res: Response) => {
    try {
      const priceLevel = req.query.priceLevel ? 
        (Array.isArray(req.query.priceLevel) 
          ? req.query.priceLevel.map(p => parseInt(p as string)) 
          : [parseInt(req.query.priceLevel as string)]) 
        : undefined;
      
      const categories = req.query.categories ? 
        (Array.isArray(req.query.categories) 
          ? req.query.categories as string[] 
          : [req.query.categories as string]) 
        : undefined;
      
      const region = req.query.region as string | undefined;
      
      const filters: FilterOptions = {};
      
      if (priceLevel) filters.priceLevel = priceLevel as any;
      if (categories) filters.categories = categories as any;
      if (region) filters.region = region as any;
      
      const destinations = Object.keys(filters).length > 0 
        ? await storage.getFilteredDestinations(filters)
        : await storage.getAllDestinations();
      
      res.status(200).json(destinations);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/destinations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const destination = await storage.getDestination(id);
      
      if (!destination) {
        return res.status(404).json({ message: "Destination not found" });
      }
      
      res.status(200).json(destination);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/destinations/:id/details", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const details = await storage.getDestinationDetails(id);
      
      if (!details) {
        return res.status(404).json({ message: "Destination details not found" });
      }
      
      res.status(200).json(details);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Swipe Routes
  app.post("/api/swipes", async (req: Request, res: Response) => {
    try {
      const swipeData = insertSwipeSchema.parse(req.body);
      
      // Check if user exists
      const user = await storage.getUser(swipeData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if destination exists
      const destination = await storage.getDestination(swipeData.destinationId);
      if (!destination) {
        return res.status(404).json({ message: "Destination not found" });
      }
      
      const swipe = await storage.createSwipe(swipeData);
      
      // If liked, check for travel buddy matches
      if (swipe.liked) {
        // Find other users who liked the same destination
        const allSwipes = await storage.getAllDestinations();
        const otherUsersWhoLiked = Array.from(allSwipes)
          .filter(d => d.id === swipe.destinationId)
          .map(async d => {
            // For each user who swiped right on this destination
            const userSwipes = await storage.getUserSwipes(d.id);
            return userSwipes
              .filter(s => s.liked && s.destinationId === swipe.destinationId && s.userId !== swipe.userId)
              .map(s => s.userId);
          });
        
        // Flatten the array of user IDs
        const matchUserIds = (await Promise.all(otherUsersWhoLiked)).flat();
        
        // Create travel buddy matches
        for (const matchUserId of matchUserIds) {
          // Check if match already exists
          const existingMatches = await storage.getTravelBuddyMatches(swipe.userId);
          const alreadyMatched = existingMatches.some(
            m => (m.user1Id === swipe.userId && m.user2Id === matchUserId) || 
                 (m.user1Id === matchUserId && m.user2Id === swipe.userId)
          );
          
          if (!alreadyMatched) {
            await storage.createTravelBuddy({
              user1Id: swipe.userId,
              user2Id: matchUserId,
              destinationId: swipe.destinationId,
              status: "pending"
            });
            
            // Notify users via WebSocket if they're connected
            const matchedUserWs = wsClients.get(matchUserId);
            if (matchedUserWs) {
              matchedUserWs.send(JSON.stringify({
                type: "new_match",
                destinationId: swipe.destinationId
              }));
            }
          }
        }
      }
      
      res.status(201).json(swipe);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/users/:userId/likes", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const likes = await storage.getUserLikes(userId);
      
      // Get full destination data for each like
      const likedDestinations = await Promise.all(
        likes.map(async (like) => {
          const destination = await storage.getDestination(like.destinationId);
          return destination;
        })
      );
      
      // Filter out any undefined destinations
      const validDestinations = likedDestinations.filter(d => d !== undefined);
      
      res.status(200).json(validDestinations);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Travel Buddy Routes
  app.get("/api/users/:userId/buddies", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const matches = await storage.getTravelBuddyMatches(userId);
      
      // Enrich match data with user and destination info
      const enrichedMatches = await Promise.all(
        matches.map(async (match) => {
          const matchedUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
          const matchedUser = await storage.getUser(matchedUserId);
          const destination = await storage.getDestination(match.destinationId);
          
          if (!matchedUser || !destination) return null;
          
          return {
            id: match.id,
            userId,
            matchedUserId,
            matchedUsername: matchedUser.username,
            matchedProfileImage: matchedUser.profileImage,
            destinationId: match.destinationId,
            destinationName: destination.name,
            status: match.status
          };
        })
      );
      
      // Filter out any null results
      const validMatches = enrichedMatches.filter(m => m !== null);
      
      res.status(200).json(validMatches);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.patch("/api/buddies/:id/status", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      if (status !== "accepted" && status !== "rejected") {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updatedBuddy = await storage.updateTravelBuddyStatus(id, status);
      
      if (!updatedBuddy) {
        return res.status(404).json({ message: "Travel buddy not found" });
      }
      
      // Notify the other user via WebSocket
      const otherUserId = req.body.userId === updatedBuddy.user1Id 
        ? updatedBuddy.user2Id 
        : updatedBuddy.user1Id;
      
      const otherUserWs = wsClients.get(otherUserId);
      if (otherUserWs) {
        otherUserWs.send(JSON.stringify({
          type: "buddy_status_update",
          buddyId: id,
          status
        }));
      }
      
      res.status(200).json(updatedBuddy);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Group Routes (Crew Mode)
  app.post("/api/groups", async (req: Request, res: Response) => {
    try {
      const groupData = insertGroupSchema.parse(req.body);
      
      // Check if creator exists
      const creator = await storage.getUser(groupData.creatorId);
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }
      
      const group = await storage.createGroup(groupData);
      
      // Add creator as member
      await storage.addGroupMember({
        groupId: group.id,
        userId: group.creatorId
      });
      
      res.status(201).json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/groups/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const group = await storage.getGroup(id);
      
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      res.status(200).json(group);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/users/:userId/groups", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const groups = await storage.getUserGroups(userId);
      
      res.status(200).json(groups);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/groups/:groupId/members", async (req: Request, res: Response) => {
    try {
      const groupId = parseInt(req.params.groupId);
      
      if (isNaN(groupId)) {
        return res.status(400).json({ message: "Invalid group ID" });
      }
      
      const memberData = insertGroupMemberSchema.parse({
        ...req.body,
        groupId
      });
      
      // Check if group exists
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      // Check if user exists
      const user = await storage.getUser(memberData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user is already a member
      const members = await storage.getGroupMembers(groupId);
      const isAlreadyMember = members.some(m => m.userId === memberData.userId);
      
      if (isAlreadyMember) {
        return res.status(400).json({ message: "User is already a member" });
      }
      
      const member = await storage.addGroupMember(memberData);
      
      // Notify group members via WebSocket
      members.forEach(m => {
        const memberWs = wsClients.get(m.userId);
        if (memberWs) {
          memberWs.send(JSON.stringify({
            type: "new_group_member",
            groupId,
            userId: memberData.userId
          }));
        }
      });
      
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/groups/:groupId/members", async (req: Request, res: Response) => {
    try {
      const groupId = parseInt(req.params.groupId);
      
      if (isNaN(groupId)) {
        return res.status(400).json({ message: "Invalid group ID" });
      }
      
      const members = await storage.getGroupMembers(groupId);
      
      // Enrich with user data
      const enrichedMembers = await Promise.all(
        members.map(async (member) => {
          const user = await storage.getUser(member.userId);
          
          if (!user) return null;
          
          return {
            ...member,
            username: user.username,
            profileImage: user.profileImage
          };
        })
      );
      
      // Filter out any null results
      const validMembers = enrichedMembers.filter(m => m !== null);
      
      res.status(200).json(validMembers);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/groups/:groupId/votes", async (req: Request, res: Response) => {
    try {
      const groupId = parseInt(req.params.groupId);
      
      if (isNaN(groupId)) {
        return res.status(400).json({ message: "Invalid group ID" });
      }
      
      const voteData = insertGroupVoteSchema.parse({
        ...req.body,
        groupId
      });
      
      // Check if group exists
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      // Check if user is a member
      const members = await storage.getGroupMembers(groupId);
      const isMember = members.some(m => m.userId === voteData.userId);
      
      if (!isMember) {
        return res.status(403).json({ message: "User is not a member of this group" });
      }
      
      // Check if destination exists
      const destination = await storage.getDestination(voteData.destinationId);
      if (!destination) {
        return res.status(404).json({ message: "Destination not found" });
      }
      
      const vote = await storage.createGroupVote(voteData);
      
      // Notify group members via WebSocket
      members.forEach(m => {
        if (m.userId !== voteData.userId) { // Don't notify the voter
          const memberWs = wsClients.get(m.userId);
          if (memberWs) {
            memberWs.send(JSON.stringify({
              type: "new_group_vote",
              groupId,
              userId: voteData.userId,
              destinationId: voteData.destinationId,
              liked: voteData.liked
            }));
          }
        }
      });
      
      res.status(201).json(vote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/groups/:groupId/votes", async (req: Request, res: Response) => {
    try {
      const groupId = parseInt(req.params.groupId);
      
      if (isNaN(groupId)) {
        return res.status(400).json({ message: "Invalid group ID" });
      }
      
      const votes = await storage.getGroupVotes(groupId);
      
      // Group votes by destination and count likes
      const votesByDestination = votes.reduce((acc, vote) => {
        if (!acc[vote.destinationId]) {
          acc[vote.destinationId] = { likes: 0, total: 0 };
        }
        
        acc[vote.destinationId].total++;
        if (vote.liked) {
          acc[vote.destinationId].likes++;
        }
        
        return acc;
      }, {} as Record<number, { likes: number, total: number }>);
      
      // Enrich with destination data
      const results = await Promise.all(
        Object.entries(votesByDestination).map(async ([destId, counts]) => {
          const destination = await storage.getDestination(parseInt(destId));
          
          if (!destination) return null;
          
          return {
            destination,
            likes: counts.likes,
            total: counts.total,
            percentage: Math.round((counts.likes / counts.total) * 100)
          };
        })
      );
      
      // Filter out any null results and sort by percentage (highest first)
      const validResults = results
        .filter(r => r !== null)
        .sort((a, b) => b!.percentage - a!.percentage);
      
      res.status(200).json(validResults);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  return httpServer;
}
