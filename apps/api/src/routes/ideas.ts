import type { FastifyPluginAsync } from "fastify";
import { eq, sql, and, desc, ilike, or } from "drizzle-orm";
import {
  ideas,
  ideaLikes,
  ideaViews,
  ideaTopics,
  ideaAddressedTo,
  collaborations,
  messageThreads,
  messages,
  users,
} from "@addis/db";
import { createIdeaSchema, updateIdeaSchema, paginationSchema, messageSchema, topicSchema, stakeholderSchema } from "@addis/shared";
import { requireAuth } from "../plugins/auth.js";
import { requireIdeaOwnership } from "../utils/ownership.js";
import { handleUniqueViolation } from "../utils/errors.js";

export const ideasRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/ideas — feed
  app.get<{ Querystring: Record<string, string> }>("/", async (request) => {
    const pagination = paginationSchema.parse(request.query);

    const feed = await app.db
      .select({
        id: ideas.id,
        title: ideas.title,
        description: ideas.description,
        imageUrl: ideas.imageUrl,
        locationCity: ideas.locationCity,
        locationState: ideas.locationState,
        locationCountry: ideas.locationCountry,
        likesCount: ideas.likesCount,
        viewsCount: ideas.viewsCount,
        collaboratorsCount: ideas.collaboratorsCount,
        commentsCount: ideas.commentsCount,
        createdAt: ideas.createdAt,
        creatorUsername: users.username,
        creatorImageUrl: users.profileImageUrl,
      })
      .from(ideas)
      .innerJoin(users, eq(ideas.creatorId, users.id))
      .orderBy(desc(ideas.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset);

    // If logged in, get which ideas the user has liked
    let likedIdeaIds: number[] = [];
    if (request.userId) {
      const liked = await app.db
        .select({ ideaId: ideaLikes.ideaId })
        .from(ideaLikes)
        .where(eq(ideaLikes.userId, request.userId));
      likedIdeaIds = liked.map((l) => l.ideaId);
    }

    return { ideas: feed, likedIdeaIds };
  });

  // GET /api/ideas/:id
  app.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const ideaId = parseInt(request.params.id, 10);
    if (isNaN(ideaId)) {
      return reply.status(400).send({ error: "Invalid idea ID" });
    }

    const result = await app.db
      .select({
        id: ideas.id,
        title: ideas.title,
        description: ideas.description,
        imageUrl: ideas.imageUrl,
        locationCity: ideas.locationCity,
        locationState: ideas.locationState,
        locationCountry: ideas.locationCountry,
        likesCount: ideas.likesCount,
        viewsCount: ideas.viewsCount,
        collaboratorsCount: ideas.collaboratorsCount,
        commentsCount: ideas.commentsCount,
        createdAt: ideas.createdAt,
        creatorId: ideas.creatorId,
        creatorUsername: users.username,
        creatorImageUrl: users.profileImageUrl,
      })
      .from(ideas)
      .innerJoin(users, eq(ideas.creatorId, users.id))
      .where(eq(ideas.id, ideaId))
      .limit(1);

    const idea = result[0];
    if (!idea) {
      return reply.status(404).send({ error: "Idea not found" });
    }

    const [topics, addressedTo] = await Promise.all([
      app.db
        .select({ topicName: ideaTopics.topicName })
        .from(ideaTopics)
        .where(eq(ideaTopics.ideaId, ideaId)),
      app.db
        .select({ stakeholder: ideaAddressedTo.stakeholder })
        .from(ideaAddressedTo)
        .where(eq(ideaAddressedTo.ideaId, ideaId)),
    ]);

    // Check user's relationship to this idea
    let isLiked = false;
    let isCollaborating = false;
    if (request.userId) {
      const [likeCheck, collabCheck] = await Promise.all([
        app.db
          .select({ id: ideaLikes.id })
          .from(ideaLikes)
          .where(and(eq(ideaLikes.userId, request.userId), eq(ideaLikes.ideaId, ideaId)))
          .limit(1),
        app.db
          .select({ id: collaborations.id })
          .from(collaborations)
          .where(and(eq(collaborations.userId, request.userId), eq(collaborations.ideaId, ideaId)))
          .limit(1),
      ]);
      isLiked = likeCheck.length > 0;
      isCollaborating = collabCheck.length > 0;

      // Record view
      await app.db.insert(ideaViews).values({ userId: request.userId, ideaId });
      await app.db
        .update(ideas)
        .set({ viewsCount: sql`${ideas.viewsCount} + 1` })
        .where(eq(ideas.id, ideaId));
    }

    return { idea, topics, addressedTo, isLiked, isCollaborating };
  });

  // POST /api/ideas
  app.post("/", { preHandler: [requireAuth] }, async (request, reply) => {
    const parsed = createIdeaSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    // Check title uniqueness
    const existing = await app.db
      .select({ id: ideas.id })
      .from(ideas)
      .where(eq(ideas.title, parsed.data.title))
      .limit(1);

    if (existing.length > 0) {
      return reply.status(409).send({ error: "An idea with this title already exists" });
    }

    const [newIdea] = await app.db
      .insert(ideas)
      .values({
        ...parsed.data,
        creatorId: request.userId!,
      })
      .returning({ id: ideas.id, title: ideas.title });

    // Create collaboration and comment threads for the idea
    await app.db.insert(messageThreads).values([
      { ideaId: newIdea.id, messageType: "collaboration" },
      { ideaId: newIdea.id, messageType: "comment" },
    ]);

    return reply.status(201).send({ idea: newIdea });
  });

  // PATCH /api/ideas/:id
  app.patch<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const ideaId = parseInt(request.params.id, 10);
      if (isNaN(ideaId)) {
        return reply.status(400).send({ error: "Invalid idea ID" });
      }

      // Verify ownership
      await requireIdeaOwnership(app.db, reply, ideaId, request.userId!);

      const parsed = updateIdeaSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
      }

      await app.db.update(ideas).set(parsed.data).where(eq(ideas.id, ideaId));
      return { success: true };
    }
  );

  // DELETE /api/ideas/:id
  app.delete<{ Params: { id: string } }>(
    "/:id",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const ideaId = parseInt(request.params.id, 10);
      if (isNaN(ideaId)) {
        return reply.status(400).send({ error: "Invalid idea ID" });
      }

      // Verify ownership
      await requireIdeaOwnership(app.db, reply, ideaId, request.userId!);

      // Cascade deletes handle related records (likes, topics, etc.)
      await app.db.delete(ideas).where(eq(ideas.id, ideaId));
      return { success: true };
    }
  );

  // POST /api/ideas/:id/like
  app.post<{ Params: { id: string } }>(
    "/:id/like",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const ideaId = parseInt(request.params.id, 10);
      if (isNaN(ideaId)) return reply.status(400).send({ error: "Invalid idea ID" });

      try {
        await app.db.insert(ideaLikes).values({ userId: request.userId!, ideaId });
        await app.db
          .update(ideas)
          .set({ likesCount: sql`${ideas.likesCount} + 1` })
          .where(eq(ideas.id, ideaId));
      } catch (err: unknown) {
        handleUniqueViolation(err, "Already liked");
      }

      return { success: true };
    }
  );

  // DELETE /api/ideas/:id/like
  app.delete<{ Params: { id: string } }>(
    "/:id/like",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const ideaId = parseInt(request.params.id, 10);
      if (isNaN(ideaId)) return reply.status(400).send({ error: "Invalid idea ID" });

      const deleted = await app.db
        .delete(ideaLikes)
        .where(and(eq(ideaLikes.userId, request.userId!), eq(ideaLikes.ideaId, ideaId)))
        .returning({ id: ideaLikes.id });

      if (deleted.length > 0) {
        await app.db
          .update(ideas)
          .set({ likesCount: sql`greatest(${ideas.likesCount} - 1, 0)` })
          .where(eq(ideas.id, ideaId));
      }

      return { success: true };
    }
  );

  // POST /api/ideas/:id/collaborate
  app.post<{ Params: { id: string } }>(
    "/:id/collaborate",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const ideaId = parseInt(request.params.id, 10);
      if (isNaN(ideaId)) return reply.status(400).send({ error: "Invalid idea ID" });

      const idea = await app.db
        .select({ creatorId: ideas.creatorId })
        .from(ideas)
        .where(eq(ideas.id, ideaId))
        .limit(1);

      if (idea.length === 0) return reply.status(404).send({ error: "Idea not found" });

      const isAdmin = idea[0].creatorId === request.userId;

      try {
        await app.db.insert(collaborations).values({
          userId: request.userId!,
          ideaId,
          isAdmin,
        });

        await app.db
          .update(ideas)
          .set({ collaboratorsCount: sql`${ideas.collaboratorsCount} + 1` })
          .where(eq(ideas.id, ideaId));
      } catch (err: unknown) {
        handleUniqueViolation(err, "Already collaborating");
      }

      return { success: true };
    }
  );

  // DELETE /api/ideas/:id/collaborate
  app.delete<{ Params: { id: string } }>(
    "/:id/collaborate",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const ideaId = parseInt(request.params.id, 10);
      if (isNaN(ideaId)) return reply.status(400).send({ error: "Invalid idea ID" });

      const deleted = await app.db
        .delete(collaborations)
        .where(and(eq(collaborations.userId, request.userId!), eq(collaborations.ideaId, ideaId)))
        .returning({ id: collaborations.id });

      if (deleted.length > 0) {
        await app.db
          .update(ideas)
          .set({ collaboratorsCount: sql`greatest(${ideas.collaboratorsCount} - 1, 0)` })
          .where(eq(ideas.id, ideaId));
      }

      return { success: true };
    }
  );

  // GET /api/ideas/:id/comments
  app.get<{ Params: { id: string }; Querystring: Record<string, string> }>(
    "/:id/comments",
    async (request, reply) => {
      const ideaId = parseInt(request.params.id, 10);
      if (isNaN(ideaId)) return reply.status(400).send({ error: "Invalid idea ID" });
      const pagination = paginationSchema.parse(request.query);

      const thread = await app.db
        .select({ id: messageThreads.id })
        .from(messageThreads)
        .where(
          and(eq(messageThreads.ideaId, ideaId), eq(messageThreads.messageType, "comment"))
        )
        .limit(1);

      if (thread.length === 0) {
        return { comments: [] };
      }

      const comments = await app.db
        .select({
          id: messages.id,
          content: messages.content,
          createdAt: messages.createdAt,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
        })
        .from(messages)
        .innerJoin(users, eq(messages.userId, users.id))
        .where(eq(messages.threadId, thread[0].id))
        .orderBy(desc(messages.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset);

      return { comments };
    }
  );

  // POST /api/ideas/:id/comments
  app.post<{ Params: { id: string } }>(
    "/:id/comments",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const ideaId = parseInt(request.params.id, 10);
      if (isNaN(ideaId)) return reply.status(400).send({ error: "Invalid idea ID" });

      const parsed = messageSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
      }

      const thread = await app.db
        .select({ id: messageThreads.id })
        .from(messageThreads)
        .where(
          and(eq(messageThreads.ideaId, ideaId), eq(messageThreads.messageType, "comment"))
        )
        .limit(1);

      if (thread.length === 0) {
        return reply.status(404).send({ error: "Comment thread not found" });
      }

      const [comment] = await app.db
        .insert(messages)
        .values({
          threadId: thread[0].id,
          userId: request.userId!,
          content: parsed.data.content,
        })
        .returning();

      await app.db
        .update(ideas)
        .set({ commentsCount: sql`${ideas.commentsCount} + 1` })
        .where(eq(ideas.id, ideaId));

      return reply.status(201).send({ comment });
    }
  );

  // POST /api/ideas/:id/topics
  app.post<{ Params: { id: string } }>(
    "/:id/topics",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const ideaId = parseInt(request.params.id, 10);
      if (isNaN(ideaId)) return reply.status(400).send({ error: "Invalid idea ID" });

      // Verify ownership
      await requireIdeaOwnership(app.db, reply, ideaId, request.userId!);

      const parsed = topicSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
      }

      const trimmed = parsed.data.topicName.trim();

      const existing = await app.db
        .select({ id: ideaTopics.id })
        .from(ideaTopics)
        .where(and(eq(ideaTopics.ideaId, ideaId), eq(ideaTopics.topicName, trimmed)))
        .limit(1);

      if (existing.length > 0) {
        return reply.status(409).send({ error: "Topic already added" });
      }

      await app.db.insert(ideaTopics).values({ ideaId, topicName: trimmed });
      return { success: true };
    }
  );

  // DELETE /api/ideas/:id/topics/:topicName
  app.delete<{ Params: { id: string; topicName: string } }>(
    "/:id/topics/:topicName",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const ideaId = parseInt(request.params.id, 10);
      if (isNaN(ideaId)) return reply.status(400).send({ error: "Invalid idea ID" });

      // Verify ownership
      await requireIdeaOwnership(app.db, reply, ideaId, request.userId!);

      const topicName = decodeURIComponent(request.params.topicName);
      await app.db
        .delete(ideaTopics)
        .where(and(eq(ideaTopics.ideaId, ideaId), eq(ideaTopics.topicName, topicName)));

      return { success: true };
    }
  );

  // POST /api/ideas/:id/addressed-to
  app.post<{ Params: { id: string } }>(
    "/:id/addressed-to",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const ideaId = parseInt(request.params.id, 10);
      if (isNaN(ideaId)) return reply.status(400).send({ error: "Invalid idea ID" });

      // Verify ownership
      await requireIdeaOwnership(app.db, reply, ideaId, request.userId!);

      const parsed = stakeholderSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
      }

      const trimmed = parsed.data.stakeholder.trim();

      const existing = await app.db
        .select({ id: ideaAddressedTo.id })
        .from(ideaAddressedTo)
        .where(
          and(eq(ideaAddressedTo.ideaId, ideaId), eq(ideaAddressedTo.stakeholder, trimmed))
        )
        .limit(1);

      if (existing.length > 0) {
        return reply.status(409).send({ error: "Stakeholder already added" });
      }

      await app.db.insert(ideaAddressedTo).values({ ideaId, stakeholder: trimmed });
      return { success: true };
    }
  );

  // DELETE /api/ideas/:id/addressed-to/:stakeholder
  app.delete<{ Params: { id: string; stakeholder: string } }>(
    "/:id/addressed-to/:stakeholder",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const ideaId = parseInt(request.params.id, 10);
      if (isNaN(ideaId)) return reply.status(400).send({ error: "Invalid idea ID" });

      // Verify ownership
      await requireIdeaOwnership(app.db, reply, ideaId, request.userId!);

      const stakeholder = decodeURIComponent(request.params.stakeholder);
      await app.db
        .delete(ideaAddressedTo)
        .where(
          and(eq(ideaAddressedTo.ideaId, ideaId), eq(ideaAddressedTo.stakeholder, stakeholder))
        );

      return { success: true };
    }
  );

  // GET /api/ideas/:id/collaborators
  app.get<{ Params: { id: string } }>(
    "/:id/collaborators",
    async (request, reply) => {
      const ideaId = parseInt(request.params.id, 10);
      if (isNaN(ideaId)) return reply.status(400).send({ error: "Invalid idea ID" });

      const collaboratorsList = await app.db
        .select({
          userId: collaborations.userId,
          isAdmin: collaborations.isAdmin,
          joinedAt: collaborations.createdAt,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
        })
        .from(collaborations)
        .innerJoin(users, eq(collaborations.userId, users.id))
        .where(eq(collaborations.ideaId, ideaId))
        .orderBy(collaborations.createdAt);

      return { collaborators: collaboratorsList };
    }
  );

  // GET /api/ideas/search?q=...&topic=...
  app.get<{ Querystring: Record<string, string> }>(
    "/search",
    async (request) => {
      const pagination = paginationSchema.parse(request.query);
      const q = (request.query.q ?? "").trim();
      const topic = (request.query.topic ?? "").trim();

      let query = app.db
        .select({
          id: ideas.id,
          title: ideas.title,
          description: ideas.description,
          imageUrl: ideas.imageUrl,
          locationCity: ideas.locationCity,
          locationState: ideas.locationState,
          locationCountry: ideas.locationCountry,
          likesCount: ideas.likesCount,
          viewsCount: ideas.viewsCount,
          collaboratorsCount: ideas.collaboratorsCount,
          commentsCount: ideas.commentsCount,
          createdAt: ideas.createdAt,
          creatorUsername: users.username,
          creatorImageUrl: users.profileImageUrl,
        })
        .from(ideas)
        .innerJoin(users, eq(ideas.creatorId, users.id))
        .$dynamic();

      const conditions = [];

      if (q) {
        const pattern = `%${q}%`;
        conditions.push(
          or(ilike(ideas.title, pattern), ilike(ideas.description, pattern))!
        );
      }

      if (topic) {
        // Filter ideas that have this topic
        conditions.push(
          sql`${ideas.id} in (select idea_id from idea_topics where topic_name = ${topic})`
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const results = await query
        .orderBy(desc(ideas.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset);

      // Return liked IDs for logged-in user
      let likedIdeaIds: number[] = [];
      if (request.userId) {
        const liked = await app.db
          .select({ ideaId: ideaLikes.ideaId })
          .from(ideaLikes)
          .where(eq(ideaLikes.userId, request.userId));
        likedIdeaIds = liked.map((l) => l.ideaId);
      }

      return { ideas: results, likedIdeaIds };
    }
  );
};
