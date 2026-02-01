import type { FastifyPluginAsync } from "fastify";
import { eq, and, desc } from "drizzle-orm";
import { ideaSponsorships, sponsorProfiles, ideas, users } from "@addis/db";
import { applySponsorshipSchema, sponsorProfileSchema } from "@addis/shared";
import { requireAuth } from "../plugins/auth";
import { requireIdeaOwnership } from "../utils/ownership";
import { validateId } from "../middleware/validateId";
import { createNotification } from "../utils/notifications";

export const sponsorshipsRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/sponsorships/profile - Create or update sponsor profile
  app.post("/profile", { preHandler: [requireAuth] }, async (request, reply) => {
    // Check if user is a sponsor
    const user = await app.db.select({ role: users.role }).from(users).where(eq(users.id, request.userId!)).limit(1);
    if (user[0]?.role !== "sponsor") {
      return reply.status(403).send({ error: "Only sponsors can have a sponsor profile" });
    }

    const parsed = sponsorProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const existing = await app.db.select().from(sponsorProfiles).where(eq(sponsorProfiles.userId, request.userId!)).limit(1);

    if (existing.length > 0) {
      await app.db.update(sponsorProfiles).set(parsed.data).where(eq(sponsorProfiles.userId, request.userId!));
    } else {
      await app.db.insert(sponsorProfiles).values({
        userId: request.userId!,
        ...parsed.data,
      });
    }

    return { success: true };
  });

  // GET /api/sponsorships/profile/:username
  app.get("/profile/:username", async (request, reply) => {
    const { username } = request.params as { username: string };
    const user = await app.db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
    if (!user[0]) return reply.status(404).send({ error: "User not found" });

    const profile = await app.db.select().from(sponsorProfiles).where(eq(sponsorProfiles.userId, user[0].id)).limit(1);
    return { profile: profile[0] || null };
  });

  // POST /api/sponsorships/apply/:ideaId
  app.post("/apply/:ideaId", { preHandler: [requireAuth, validateId("ideaId")] }, async (request, reply) => {
    const ideaId = (request as any).ideaId as number;

    // Check if user is a sponsor
    const user = await app.db.select({ role: users.role }).from(users).where(eq(users.id, request.userId!)).limit(1);
    if (user[0]?.role !== "sponsor") {
      return reply.status(403).send({ error: "Only sponsors can apply for sponsorship" });
    }

    const parsed = applySponsorshipSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    // Check if already applied
    const existing = await app.db.select().from(ideaSponsorships).where(and(eq(ideaSponsorships.ideaId, ideaId), eq(ideaSponsorships.sponsorId, request.userId!))).limit(1);
    if (existing.length > 0) {
      return reply.status(409).send({ error: "Sponsorship offer already pending" });
    }

    await app.db.insert(ideaSponsorships).values({
      ideaId,
      sponsorId: request.userId!,
      message: parsed.data.message,
      amount: parsed.data.amount,
      status: "pending",
    });

    // Notify idea creator
    const idea = await app.db.select({ creatorId: ideas.creatorId, title: ideas.title }).from(ideas).where(eq(ideas.id, ideaId)).limit(1);
    if (idea[0]) {
      await createNotification(app.db, {
        recipientId: idea[0].creatorId,
        senderId: request.userId!,
        type: "message", // Re-using message type for now, or could add 'sponsorship_offer'
        message: `offered to sponsor your idea "${idea[0].title}"`,
        link: `/ideas/${ideaId}/sponsorships`,
      });
    }

    return { success: true };
  });

  // GET /api/sponsorships/idea/:ideaId - Get sponsorship offers for an idea (creator only)
  app.get("/idea/:ideaId", { preHandler: [requireAuth, validateId("ideaId")] }, async (request, reply) => {
    const ideaId = (request as any).ideaId as number;
    await requireIdeaOwnership(app.db, reply, ideaId, request.userId!);

    const offers = await app.db
      .select({
        id: ideaSponsorships.id,
        status: ideaSponsorships.status,
        message: ideaSponsorships.message,
        amount: ideaSponsorships.amount,
        createdAt: ideaSponsorships.createdAt,
        sponsorName: sponsorProfiles.companyName,
        sponsorUsername: users.username,
      })
      .from(ideaSponsorships)
      .innerJoin(users, eq(ideaSponsorships.sponsorId, users.id))
      .leftJoin(sponsorProfiles, eq(sponsorProfiles.userId, users.id))
      .where(eq(ideaSponsorships.ideaId, ideaId))
      .orderBy(desc(ideaSponsorships.createdAt));

    return { offers };
  });

  // PATCH /api/sponsorships/:id/status - Accept/Reject offer
  app.patch("/:id/status", { preHandler: [requireAuth, validateId("id")] }, async (request, reply) => {
    const id = (request as any).id as number;
    const { status } = request.body as { status: "accepted" | "rejected" };

    if (!["accepted", "rejected"].includes(status)) {
      return reply.status(400).send({ error: "Invalid status" });
    }

    const offer = await app.db.select().from(ideaSponsorships).where(eq(ideaSponsorships.id, id)).limit(1);
    if (!offer[0]) return reply.status(404).send({ error: "Offer not found" });

    // Verify ownership of the idea
    await requireIdeaOwnership(app.db, reply, offer[0].ideaId, request.userId!);

    await app.db.update(ideaSponsorships).set({ status }).where(eq(ideaSponsorships.id, id));

    // Notify sponsor
    const idea = await app.db.select({ title: ideas.title }).from(ideas).where(eq(ideas.id, offer[0].ideaId)).limit(1);
    await createNotification(app.db, {
      recipientId: offer[0].sponsorId,
      senderId: request.userId!,
      type: "message",
      message: `${status} your sponsorship offer for "${idea[0].title}"`,
      link: `/ideas/${offer[0].ideaId}`,
    });

    return { success: true };
  });

  // GET /api/sponsorships/active/:ideaId - Get active sponsors for an idea (public)
  app.get("/active/:ideaId", { preHandler: [validateId("ideaId")] }, async (request) => {
    const ideaId = (request as any).ideaId as number;

    const sponsors = await app.db
      .select({
        companyName: sponsorProfiles.companyName,
        logoUrl: sponsorProfiles.logoUrl,
        website: sponsorProfiles.website,
      })
      .from(ideaSponsorships)
      .innerJoin(sponsorProfiles, eq(ideaSponsorships.sponsorId, sponsorProfiles.userId))
      .where(and(eq(ideaSponsorships.ideaId, ideaId), eq(ideaSponsorships.status, "accepted")));

    return { sponsors };
  });
};
