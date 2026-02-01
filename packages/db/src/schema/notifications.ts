import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  recipientId: integer("recipient_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  senderId: integer("sender_id")
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'like', 'comment', 'collab_request', 'message'
  message: text("message").notNull(),
  link: text("link"), // URL to redirect to (e.g., /ideas/1)
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  recipientIdx: index("notifications_recipient_id_idx").on(t.recipientId),
  isReadIdx: index("notifications_is_read_idx").on(t.isRead),
}));
