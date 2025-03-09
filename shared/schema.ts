import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  profileImage: text("profile_image"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  profileImage: true,
  bio: true,
});

// Destinations
export const destinations = pgTable("destinations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  priceLevel: integer("price_level").notNull(), // 1-3 representing $ to $$$
  categories: text("categories").array().notNull(), // Beach, Mountain, City, etc.
  region: text("region").notNull(), // Asia, Europe, etc.
});

export const insertDestinationSchema = createInsertSchema(destinations).pick({
  name: true,
  country: true,
  description: true,
  imageUrl: true,
  priceLevel: true,
  categories: true,
  region: true,
});

// User Swipes (Likes/Dislikes)
export const swipes = pgTable("swipes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  destinationId: integer("destination_id").notNull().references(() => destinations.id),
  liked: boolean("liked").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSwipeSchema = createInsertSchema(swipes).pick({
  userId: true,
  destinationId: true,
  liked: true,
});

// Travel Buddies (Matches)
export const travelBuddies = pgTable("travel_buddies", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").notNull().references(() => users.id),
  user2Id: integer("user2_id").notNull().references(() => users.id),
  destinationId: integer("destination_id").notNull().references(() => destinations.id),
  status: text("status").notNull(), // "pending", "accepted", "rejected"
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTravelBuddySchema = createInsertSchema(travelBuddies).pick({
  user1Id: true,
  user2Id: true,
  destinationId: true,
  status: true,
});

// Groups (for Crew Mode)
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  voteEndTime: timestamp("vote_end_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGroupSchema = createInsertSchema(groups).pick({
  name: true,
  creatorId: true,
  voteEndTime: true,
});

// Group Members
export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groups.id),
  userId: integer("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const insertGroupMemberSchema = createInsertSchema(groupMembers).pick({
  groupId: true,
  userId: true,
});

// Group Destination Votes
export const groupVotes = pgTable("group_votes", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groups.id),
  userId: integer("user_id").notNull().references(() => users.id),
  destinationId: integer("destination_id").notNull().references(() => destinations.id),
  liked: boolean("liked").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGroupVoteSchema = createInsertSchema(groupVotes).pick({
  groupId: true,
  userId: true,
  destinationId: true,
  liked: true,
});

// Destination Details
export const destinationDetails = pgTable("destination_details", {
  id: serial("id").primaryKey(),
  destinationId: integer("destination_id").notNull().references(() => destinations.id),
  bestTimeToVisit: text("best_time_to_visit"),
  attractions: text("attractions").array(),
  hotelOptions: jsonb("hotel_options"), // Array of hotels with names, ratings, descriptions, prices
  travelTips: jsonb("travel_tips"), // Object with safety, local customs, food tips
  costs: jsonb("costs"), // Object with accommodation, meals, transportation, activities costs
});

export const insertDestinationDetailSchema = createInsertSchema(destinationDetails).pick({
  destinationId: true,
  bestTimeToVisit: true,
  attractions: true,
  hotelOptions: true,
  travelTips: true,
  costs: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Destination = typeof destinations.$inferSelect;
export type InsertDestination = z.infer<typeof insertDestinationSchema>;

export type Swipe = typeof swipes.$inferSelect;
export type InsertSwipe = z.infer<typeof insertSwipeSchema>;

export type TravelBuddy = typeof travelBuddies.$inferSelect;
export type InsertTravelBuddy = z.infer<typeof insertTravelBuddySchema>;

export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;

export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;

export type GroupVote = typeof groupVotes.$inferSelect;
export type InsertGroupVote = z.infer<typeof insertGroupVoteSchema>;

export type DestinationDetail = typeof destinationDetails.$inferSelect;
export type InsertDestinationDetail = z.infer<typeof insertDestinationDetailSchema>;
