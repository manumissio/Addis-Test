import {
  pgTable,
  pgEnum,
  serial,
  integer,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { ideas } from "./ideas.js";

export const messageTypeEnum = pgEnum("message_type", [
  "collaboration",
  "comment",
  "private",
]);

export const messageThreads = pgTable("message_threads", {
  id: serial("id").primaryKey(),
  ideaId: integer("idea_id").references(() => ideas.id, { onDelete: "cascade" }),
  messageType: messageTypeEnum("message_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id")
    .references(() => messageThreads.id, { onDelete: "cascade" })
    .notNull(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const threadParticipants = pgTable("thread_participants", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id")
    .references(() => messageThreads.id, { onDelete: "cascade" })
    .notNull(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
});
