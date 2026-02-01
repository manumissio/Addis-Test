import {
  pgTable,
  pgEnum,
  serial,
  integer,
  text,
  timestamp,
  varchar,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { ideas } from "./ideas";

export const sponsorshipStatusEnum = pgEnum("sponsorship_status", [
  "pending",
  "accepted",
  "rejected",
]);

export const sponsorProfiles = pgTable("sponsor_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  website: varchar("website", { length: 255 }),
  industry: varchar("industry", { length: 255 }),
  fundingFocus: text("funding_focus"), // e.g., "Sustainability, Education"
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const ideaSponsorships = pgTable("idea_sponsorships", {
  id: serial("id").primaryKey(),
  ideaId: integer("idea_id")
    .references(() => ideas.id, { onDelete: "cascade" })
    .notNull(),
  sponsorId: integer("sponsor_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  status: sponsorshipStatusEnum("status").default("pending").notNull(),
  message: text("message"), // Initial offer message
  amount: varchar("amount", { length: 100 }), // Optional funding amount
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  ideaIdx: index("idea_sponsorships_idea_id_idx").on(t.ideaId),
  sponsorIdx: index("idea_sponsorships_sponsor_id_idx").on(t.sponsorId),
}));
