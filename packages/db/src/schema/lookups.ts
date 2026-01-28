import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const lookupTopics = pgTable("lookup_topics", {
  id: serial("id").primaryKey(),
  topicName: varchar("topic_name", { length: 255 }).unique().notNull(),
});

export const lookupStakeholders = pgTable("lookup_stakeholders", {
  id: serial("id").primaryKey(),
  stakeholder: varchar("stakeholder", { length: 255 }).unique().notNull(),
});
