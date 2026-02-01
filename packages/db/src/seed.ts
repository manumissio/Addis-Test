import { createDb } from "./index";
import { users, sponsorProfiles, ideas, ideaLikes, ideaViews, ideaTopics, ideaAddressedTo, ideaSponsorships, messageThreads, threadParticipants, messages } from "./schema/index";
import { eq } from "drizzle-orm";
import { scrypt } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = "7f8c8d7f8c8d7f8c"; // Fixed salt for seed consistency
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function seed() {
  const dbUrl = process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/addisideas";
  const db = createDb(dbUrl);

  console.log("🌱 Seeding database...");

  // 1. Create Users
  const pw = await hashPassword("password123");
  
  const [admin] = await db.insert(users).values({
    username: "admin",
    email: "admin@addisideas.org",
    passwordHash: pw,
    role: "admin",
    firstName: "System",
    lastName: "Administrator",
  }).onConflictDoNothing().returning();

  const [innovator1] = await db.insert(users).values({
    username: "abenezer",
    email: "abenezer@gmail.com",
    passwordHash: pw,
    role: "user",
    firstName: "Abenezer",
    lastName: "Tessema",
    profession: "Environmental Engineer",
    locationCity: "Addis Ababa",
    locationCountry: "Ethiopia",
    about: "Passionate about sustainable urban development and clean water access.",
  }).onConflictDoNothing().returning();

  const [innovator2] = await db.insert(users).values({
    username: "samrawit",
    email: "samrawit@outlook.com",
    passwordHash: pw,
    role: "user",
    firstName: "Samrawit",
    lastName: "Bekele",
    profession: "Full Stack Developer",
    locationCity: "Nairobi",
    locationCountry: "Kenya",
    about: "Building digital tools for agricultural transparency in East Africa.",
  }).onConflictDoNothing().returning();

  const [sponsorUser] = await db.insert(users).values({
    username: "impact_fund",
    email: "grants@impactfund.org",
    passwordHash: pw,
    role: "sponsor",
    firstName: "Sarah",
    lastName: "Chen",
  }).onConflictDoNothing().returning();

  // 2. Create Sponsor Profile
  if (sponsorUser) {
    await db.insert(sponsorProfiles).values({
      userId: sponsorUser.id,
      companyName: "Global Impact Initiative",
      website: "https://impactinitiative.org",
      industry: "Venture Philanthropy",
      fundingFocus: "Clean Energy, Digital Literacy, Healthcare",
    }).onConflictDoNothing();
  }

  // 3. Create Ideas
  if (innovator1) {
    const [idea1] = await db.insert(ideas).values({
      title: "Addis Solar Micro-Grid",
      description: "A community-owned solar micro-grid designed for the Mercato district to ensure 24/7 power for small businesses while reducing carbon emissions by 40%.",
      creatorId: innovator1.id,
      locationCity: "Addis Ababa",
      locationCountry: "Ethiopia",
      likesCount: 15,
      viewsCount: 142,
      collaboratorsCount: 3,
      commentsCount: 2,
    }).returning();

    if (idea1) {
      await db.insert(ideaTopics).values([
        { ideaId: idea1.id, topicName: "Sustainability" },
        { ideaId: idea1.id, topicName: "Energy" },
      ]);
      await db.insert(ideaAddressedTo).values([
        { ideaId: idea1.id, stakeholder: "Addis Ababa City Admin" },
        { ideaId: idea1.id, stakeholder: "Ministry of Water & Energy" },
      ]);
      
      // Create Threads
      const [collabThread] = await db.insert(messageThreads).values({ ideaId: idea1.id, messageType: "collaboration" }).returning();
      const [commentThread] = await db.insert(messageThreads).values({ ideaId: idea1.id, messageType: "comment" }).returning();

      if (commentThread && innovator2) {
        await db.insert(messages).values({
          threadId: commentThread.id,
          userId: innovator2.id,
          content: "This is crucial for the market sellers. How do you plan to handle maintenance costs?",
        });
      }
      
      // Sponsorship
      if (sponsorUser) {
        await db.insert(ideaSponsorships).values({
          ideaId: idea1.id,
          sponsorId: sponsorUser.id,
          status: "accepted",
          amount: "$50,000",
          message: "We are impressed by the feasibility of this grid. Let's discuss deployment.",
        });
      }
    }
  }

  if (innovator2) {
    const [idea2] = await db.insert(ideas).values({
      title: "AgriTrack: Supply Chain Transparency",
      description: "A blockchain-based platform for Ethiopian coffee farmers to track their produce from farm to export, ensuring fair pricing and preventing middleman exploitation.",
      creatorId: innovator2.id,
      locationCity: "Jimma",
      locationCountry: "Ethiopia",
      likesCount: 28,
      viewsCount: 310,
      collaboratorsCount: 5,
      commentsCount: 0,
    }).returning();

    if (idea2) {
      await db.insert(ideaTopics).values([
        { ideaId: idea2.id, topicName: "Technology" },
        { ideaId: idea2.id, topicName: "Agriculture" },
      ]);
      await db.insert(ideaAddressedTo).values([
        { ideaId: idea2.id, stakeholder: "Agricultural Transformation Institute" },
      ]);
      
      await db.insert(messageThreads).values([
        { ideaId: idea2.id, messageType: "collaboration" },
        { ideaId: idea2.id, messageType: "comment" },
      ]);
    }
  }

  console.log("✅ Seeding complete!");
}

seed().catch(err => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
