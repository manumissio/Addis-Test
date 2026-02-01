import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  date,
  boolean,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "sponsor", "admin"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 25 }).unique().notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").default("user").notNull(),
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
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const userTopics = pgTable("user_topics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  topicName: varchar("topic_name", { length: 255 }).notNull(),
}, (t) => ({
  userIdx: index("user_topics_user_id_idx").on(t.userId),
}));

export const profileViews = pgTable("profile_views", {
  id: serial("id").primaryKey(),
  viewerId: integer("viewer_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  viewedId: integer("viewed_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  viewedIdx: index("profile_views_viewed_id_idx").on(t.viewedId),
}));

export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referringId: integer("referring_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  referredId: integer("referred_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
