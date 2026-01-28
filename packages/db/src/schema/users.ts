import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  date,
  boolean,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 25 }).unique().notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  about: text("about"),
  profession: varchar("profession", { length: 255 }),
  profileImageUrl: text("profile_image_url"),
  dob: date("dob"),
  locationCity: varchar("location_city", { length: 255 }),
  locationState: varchar("location_state", { length: 255 }),
  locationCountry: varchar("location_country", { length: 255 }),
  isPrivate: boolean("is_private").default(false).notNull(),
  tempPasswordHash: text("temp_password_hash"),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: serial("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const userTopics = pgTable("user_topics", {
  id: serial("id").primaryKey(),
  userId: serial("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  topicName: varchar("topic_name", { length: 255 }).notNull(),
});

export const profileViews = pgTable("profile_views", {
  id: serial("id").primaryKey(),
  viewerId: serial("viewer_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  viewedId: serial("viewed_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referringId: serial("referring_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  referredId: serial("referred_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
