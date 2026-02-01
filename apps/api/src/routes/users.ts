import type { FastifyPluginAsync } from "fastify";
import { eq, sql } from "drizzle-orm";
import { users, ideas, profileViews, messages, userTopics, collaborations } from "@addis/db";
import { updateProfileSchema, updateUsernameSchema, updateEmailSchema, paginationSchema, topicSchema } from "@addis/shared";
import { requireAuth } from "../plugins/auth";
import { sanitizePlainText, sanitizeRichText } from "../utils/sanitize";
import { createNotification } from "../utils/notifications";

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

      await createNotification(app.db, {
        recipientId: user.id,
        senderId: request.userId,
        type: "profile_view",
        message: "viewed your profile",
        link: `/profile/${request.user?.username}`,
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

    // Sanitize user input to prevent XSS
    const sanitizedData: any = {};
    if (parsed.data.about !== undefined) sanitizedData.about = parsed.data.about ? sanitizeRichText(parsed.data.about) : null;
    if (parsed.data.profession !== undefined) sanitizedData.profession = parsed.data.profession ? sanitizePlainText(parsed.data.profession) : null;
    if (parsed.data.locationCity !== undefined) sanitizedData.locationCity = parsed.data.locationCity ? sanitizePlainText(parsed.data.locationCity) : null;
    if (parsed.data.locationState !== undefined) sanitizedData.locationState = parsed.data.locationState ? sanitizePlainText(parsed.data.locationState) : null;
    if (parsed.data.locationCountry !== undefined) sanitizedData.locationCountry = parsed.data.locationCountry ? sanitizePlainText(parsed.data.locationCountry) : null;
    if (parsed.data.dob !== undefined) sanitizedData.dob = parsed.data.dob;
    if (parsed.data.isPrivate !== undefined) sanitizedData.isPrivate = parsed.data.isPrivate;

    await app.db
      .update(users)
      .set(sanitizedData)
      .where(eq(users.id, request.userId!));

    return { success: true };
  });

  // PATCH /api/users/username
  app.patch("/username", { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = updateUsernameSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    // Sanitize username to prevent XSS
    const sanitizedUsername = sanitizePlainText(parsed.data.username);

    const existing = await app.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, sanitizedUsername))
      .limit(1);

    if (existing.length > 0) {
      return reply.status(409).send({ error: "Username already taken" });
    }

    await app.db
      .update(users)
      .set({ username: sanitizedUsername })
      .where(eq(users.id, request.userId!));

    return { success: true };
  });

  // PATCH /api/users/email
  app.patch("/email", { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = updateEmailSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    // Sanitize email to prevent XSS
    const sanitizedEmail = sanitizePlainText(parsed.data.email);

    const existing = await app.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, sanitizedEmail))
      .limit(1);

    if (existing.length > 0) {
      return reply.status(409).send({ error: "Email already in use" });
    }

    await app.db
      .update(users)
      .set({ email: sanitizedEmail })
      .where(eq(users.id, request.userId!));

    return { success: true };
  });

  // POST /api/users/topics
  app.post("/topics", { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = topicSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    // Sanitize topic name to prevent XSS
    const sanitizedTopic = sanitizePlainText(parsed.data.topicName);

    // Check if already added (using sanitized value)
    const existing = await app.db
      .select({ id: userTopics.id })
      .from(userTopics)
      .where(
        sql`${userTopics.userId} = ${request.userId!} and ${userTopics.topicName} = ${sanitizedTopic}`
      )
      .limit(1);

    if (existing.length > 0) {
      return reply.status(409).send({ error: "Topic already added" });
    }

    await app.db.insert(userTopics).values({
      userId: request.userId!,
      topicName: sanitizedTopic,
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
