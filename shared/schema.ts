import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  bio: text("bio"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  bio: true,
  profileImage: true,
});

export const destinations = pgTable("destinations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  rating: text("rating"),
  priceRange: text("price_range"),
  bestTimeToVisit: text("best_time_to_visit"),
  tags: text("tags").array(),
});

export const insertDestinationSchema = createInsertSchema(destinations).pick({
  name: true,
  country: true,
  description: true,
  imageUrl: true,
  rating: true,
  priceRange: true,
  bestTimeToVisit: true,
  tags: true,
});

export const hotels = pgTable("hotels", {
  id: serial("id").primaryKey(),
  destinationId: integer("destination_id").notNull(),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  rating: text("rating").notNull(),
  pricePerNight: text("price_per_night").notNull(),
});

export const insertHotelSchema = createInsertSchema(hotels).pick({
  destinationId: true,
  name: true,
  imageUrl: true,
  rating: true,
  pricePerNight: true,
});

export const userLikes = pgTable("user_likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  destinationId: integer("destination_id").notNull(),
  liked: boolean("liked").notNull(),
  savedAt: timestamp("saved_at").defaultNow().notNull(),
});

export const insertUserLikeSchema = createInsertSchema(userLikes).pick({
  userId: true,
  destinationId: true,
  liked: true,
});

export const destinationHighlights = pgTable("destination_highlights", {
  id: serial("id").primaryKey(),
  destinationId: integer("destination_id").notNull(),
  icon: text("icon").notNull(),
  text: text("text").notNull(),
});

export const insertDestinationHighlightSchema = createInsertSchema(destinationHighlights).pick({
  destinationId: true,
  icon: true,
  text: true,
});

export const travelCrews = pgTable("travel_crews", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  creatorId: integer("creator_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertTravelCrewSchema = createInsertSchema(travelCrews).pick({
  name: true,
  creatorId: true,
  isActive: true,
});

export const crewMembers = pgTable("crew_members", {
  id: serial("id").primaryKey(),
  crewId: integer("crew_id").notNull(),
  userId: integer("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const insertCrewMemberSchema = createInsertSchema(crewMembers).pick({
  crewId: true,
  userId: true,
});

export const travelBuddies = pgTable("travel_buddies", {
  id: serial("id").primaryKey(),
  userOneId: integer("user_one_id").notNull(),
  userTwoId: integer("user_two_id").notNull(),
  destinationId: integer("destination_id").notNull(),
  matchedAt: timestamp("matched_at").defaultNow().notNull(),
});

export const insertTravelBuddySchema = createInsertSchema(travelBuddies).pick({
  userOneId: true,
  userTwoId: true,
  destinationId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDestination = z.infer<typeof insertDestinationSchema>;
export type Destination = typeof destinations.$inferSelect;

export type InsertHotel = z.infer<typeof insertHotelSchema>;
export type Hotel = typeof hotels.$inferSelect;

export type InsertUserLike = z.infer<typeof insertUserLikeSchema>;
export type UserLike = typeof userLikes.$inferSelect;

export type InsertDestinationHighlight = z.infer<typeof insertDestinationHighlightSchema>;
export type DestinationHighlight = typeof destinationHighlights.$inferSelect;

export type InsertTravelCrew = z.infer<typeof insertTravelCrewSchema>;
export type TravelCrew = typeof travelCrews.$inferSelect;

export type InsertCrewMember = z.infer<typeof insertCrewMemberSchema>;
export type CrewMember = typeof crewMembers.$inferSelect;

export type InsertTravelBuddy = z.infer<typeof insertTravelBuddySchema>;
export type TravelBuddy = typeof travelBuddies.$inferSelect;
