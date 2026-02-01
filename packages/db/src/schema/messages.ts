import {
  pgTable,
  pgEnum,
  serial,
  integer,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { ideas } from "./ideas";

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
}, (t) => ({
  ideaIdx: index("message_threads_idea_id_idx").on(t.ideaId),
}));

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
}, (t) => ({
  threadIdx: index("messages_thread_id_idx").on(t.threadId),
  userIdx: index("messages_user_id_idx").on(t.userId),
  createdAtIdx: index("messages_created_at_idx").on(t.createdAt),
}));

export const threadParticipants = pgTable("thread_participants", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id")
    .references(() => messageThreads.id, { onDelete: "cascade" })
    .notNull(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
}, (t) => ({
  threadIdx: index("thread_participants_thread_id_idx").on(t.threadId),
  userIdx: index("thread_participants_user_id_idx").on(t.userId),
}));
