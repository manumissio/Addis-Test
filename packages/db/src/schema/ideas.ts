import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const ideas = pgTable("ideas", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).unique().notNull(),
  description: text("description").notNull(),
  creatorId: integer("creator_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  imageUrl: text("image_url"),
  locationCity: varchar("location_city", { length: 255 }),
  locationState: varchar("location_state", { length: 255 }),
  locationCountry: varchar("location_country", { length: 255 }),
  likesCount: integer("likes_count").default(0).notNull(),
  viewsCount: integer("views_count").default(0).notNull(),
  collaboratorsCount: integer("collaborators_count").default(0).notNull(),
  commentsCount: integer("comments_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const ideaLikes = pgTable("idea_likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  ideaId: integer("idea_id")
    .references(() => ideas.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const ideaTopics = pgTable("idea_topics", {
  id: serial("id").primaryKey(),
  ideaId: integer("idea_id")
    .references(() => ideas.id, { onDelete: "cascade" })
    .notNull(),
  topicName: varchar("topic_name", { length: 255 }).notNull(),
});

export const ideaAddressedTo = pgTable("idea_addressed_to", {
  id: serial("id").primaryKey(),
  ideaId: integer("idea_id")
    .references(() => ideas.id, { onDelete: "cascade" })
    .notNull(),
  stakeholder: varchar("stakeholder", { length: 255 }).notNull(),
});

export const collaborations = pgTable("collaborations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  ideaId: integer("idea_id")
    .references(() => ideas.id, { onDelete: "cascade" })
    .notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const ideaViews = pgTable("idea_views", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  ideaId: integer("idea_id")
    .references(() => ideas.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
