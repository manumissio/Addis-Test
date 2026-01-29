import type { FastifyPluginAsync } from "fastify";
import { eq, sql } from "drizzle-orm";
import { users, ideas, profileViews, messages, userTopics, collaborations } from "@addis/db";
import { updateProfileSchema, updateUsernameSchema, updateEmailSchema, paginationSchema } from "@addis/shared";
import { requireAuth } from "../plugins/auth.js";

export const usersRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/users/:username
  app.get<{ Params: { username: string } }>("/:username", async (request, reply) => {
    const { username } = request.params;

    const result = await app.db
      .select({
        id: users.id,
        username: users.username,
        about: users.about,
        profession: users.profession,
        profileImageUrl: users.profileImageUrl,
        locationCity: users.locationCity,
        locationState: users.locationState,
        locationCountry: users.locationCountry,
        createdAt: users.createdAt,
        ideasCount: sql<number>`(select count(*) from ideas where creator_id = ${users.id})`,
        viewsCount: sql<number>`(select count(*) from profile_views where viewed_id = ${users.id})`,
      })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    const user = result[0];
    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    // Record profile view if viewer is logged in and not viewing own profile
    if (request.userId && request.userId !== user.id) {
      await app.db.insert(profileViews).values({
        viewerId: request.userId,
        viewedId: user.id,
      });
    }

    return { user };
  });

  // GET /api/users/:username/ideas
  app.get<{ Params: { username: string }; Querystring: Record<string, string> }>(
    "/:username/ideas",
    async (request, reply) => {
      const { username } = request.params;
      const pagination = paginationSchema.parse(request.query);

      const user = await app.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (user.length === 0) {
        return reply.status(404).send({ error: "User not found" });
      }

      const userIdeas = await app.db
        .select()
        .from(ideas)
        .where(eq(ideas.creatorId, user[0].id))
        .orderBy(sql`created_at desc`)
        .limit(pagination.limit)
        .offset(pagination.offset);

      return { ideas: userIdeas };
    }
  );

  // GET /api/users/:username/topics
  app.get<{ Params: { username: string } }>("/:username/topics", async (request, reply) => {
    const { username } = request.params;

    const user = await app.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (user.length === 0) {
      return reply.status(404).send({ error: "User not found" });
    }

    const topics = await app.db
      .select({ topicName: userTopics.topicName })
      .from(userTopics)
      .where(eq(userTopics.userId, user[0].id));

    return { topics };
  });

  // GET /api/users/:username/collaborations
  app.get<{ Params: { username: string } }>(
    "/:username/collaborations",
    async (request, reply) => {
      const { username } = request.params;

      const user = await app.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (user.length === 0) {
        return reply.status(404).send({ error: "User not found" });
      }

      // Fetch ideas this user is collaborating on (excluding their own ideas)
      const collabs = await app.db
        .select({
          id: ideas.id,
          title: ideas.title,
          description: ideas.description,
          imageUrl: ideas.imageUrl,
          likesCount: ideas.likesCount,
          commentsCount: ideas.commentsCount,
          createdAt: ideas.createdAt,
          creatorUsername: users.username,
        })
        .from(collaborations)
        .innerJoin(ideas, eq(collaborations.ideaId, ideas.id))
        .innerJoin(users, eq(ideas.creatorId, users.id))
        .where(eq(collaborations.userId, user[0].id))
        .orderBy(sql`${collaborations.createdAt} desc`)
        .limit(20);

      return { collaborations: collabs };
    }
  );

  // PATCH /api/users/profile
  app.patch("/profile", { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = updateProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    await app.db
      .update(users)
      .set(parsed.data)
      .where(eq(users.id, request.userId!));

    return { success: true };
  });

  // PATCH /api/users/username
  app.patch("/username", { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = updateUsernameSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const existing = await app.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, parsed.data.username))
      .limit(1);

    if (existing.length > 0) {
      return reply.status(409).send({ error: "Username already taken" });
    }

    await app.db
      .update(users)
      .set({ username: parsed.data.username })
      .where(eq(users.id, request.userId!));

    return { success: true };
  });

  // PATCH /api/users/email
  app.patch("/email", { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = updateEmailSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const existing = await app.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, parsed.data.email))
      .limit(1);

    if (existing.length > 0) {
      return reply.status(409).send({ error: "Email already in use" });
    }

    await app.db
      .update(users)
      .set({ email: parsed.data.email })
      .where(eq(users.id, request.userId!));

    return { success: true };
  });

  // POST /api/users/topics
  app.post("/topics", { preHandler: [requireAuth] }, async (request, reply) => {
    const { topicName } = request.body as { topicName: string };
    if (!topicName || topicName.length > 255) {
      return reply.status(400).send({ error: "Invalid topic name" });
    }

    // Check if already added
    const existing = await app.db
      .select({ id: userTopics.id })
      .from(userTopics)
      .where(
        sql`${userTopics.userId} = ${request.userId!} and ${userTopics.topicName} = ${topicName}`
      )
      .limit(1);

    if (existing.length > 0) {
      return reply.status(409).send({ error: "Topic already added" });
    }

    await app.db.insert(userTopics).values({
      userId: request.userId!,
      topicName,
    });

    return { success: true };
  });

  // DELETE /api/users/topics/:topicName
  app.delete<{ Params: { topicName: string } }>(
    "/topics/:topicName",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      // Decode URL-encoded topic name
      const topicName = decodeURIComponent(request.params.topicName);

      await app.db
        .delete(userTopics)
        .where(
          sql`${userTopics.userId} = ${request.userId!} and ${userTopics.topicName} = ${topicName}`
        );

      return { success: true };
    }
  );
};
