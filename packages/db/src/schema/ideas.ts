import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

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
}, (t) => ({
  creatorIdx: index("ideas_creator_id_idx").on(t.creatorId),
  createdAtIdx: index("ideas_created_at_idx").on(t.createdAt),
}));

export const ideaLikes = pgTable("idea_likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  ideaId: integer("idea_id")
    .references(() => ideas.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  unqLike: uniqueIndex("unique_user_idea_like").on(t.userId, t.ideaId),
  ideaIdx: index("idea_likes_idea_id_idx").on(t.ideaId),
}));

export const ideaTopics = pgTable("idea_topics", {
  id: serial("id").primaryKey(),
  ideaId: integer("idea_id")
    .references(() => ideas.id, { onDelete: "cascade" })
    .notNull(),
  topicName: varchar("topic_name", { length: 255 }).notNull(),
}, (t) => ({
  ideaIdx: index("idea_topics_idea_id_idx").on(t.ideaId),
  topicIdx: index("idea_topics_name_idx").on(t.topicName),
}));

export const ideaAddressedTo = pgTable("idea_addressed_to", {
  id: serial("id").primaryKey(),
  ideaId: integer("idea_id")
    .references(() => ideas.id, { onDelete: "cascade" })
    .notNull(),
  stakeholder: varchar("stakeholder", { length: 255 }).notNull(),
}, (t) => ({
  ideaIdx: index("idea_addressed_idea_id_idx").on(t.ideaId),
}));

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
}, (t) => ({
  unqCollab: uniqueIndex("unique_user_idea_collab").on(t.userId, t.ideaId),
}));

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
