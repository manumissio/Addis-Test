import type { FastifyPluginAsync } from "fastify";
import { eq, and, or, sql } from "drizzle-orm";
import { messages, messageThreads, threadParticipants, users } from "@addis/db";
import { messageSchema, paginationSchema } from "@addis/shared";
import { requireAuth } from "../plugins/auth.js";

export const messagesRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/messages/threads — list user's private message threads
  app.get("/threads", { preHandler: [requireAuth] }, async (request) => {
    const threads = await app.db
      .select({
        threadId: threadParticipants.threadId,
        messageType: messageThreads.messageType,
        createdAt: messageThreads.createdAt,
      })
      .from(threadParticipants)
      .innerJoin(messageThreads, eq(threadParticipants.threadId, messageThreads.id))
      .where(
        and(
          eq(threadParticipants.userId, request.userId!),
          eq(messageThreads.messageType, "private")
        )
      )
      .orderBy(sql`${messageThreads.createdAt} desc`);

    return { threads };
  });

  // GET /api/messages/threads/:threadId
  app.get<{ Params: { threadId: string }; Querystring: Record<string, string> }>(
    "/threads/:threadId",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const threadId = parseInt(request.params.threadId, 10);
      if (isNaN(threadId)) return reply.status(400).send({ error: "Invalid thread ID" });
      const pagination = paginationSchema.parse(request.query);

      // Verify user is a participant
      const participant = await app.db
        .select({ id: threadParticipants.id })
        .from(threadParticipants)
        .where(
          and(
            eq(threadParticipants.threadId, threadId),
            eq(threadParticipants.userId, request.userId!)
          )
        )
        .limit(1);

      if (participant.length === 0) {
        return reply.status(403).send({ error: "Not authorized to view this thread" });
      }

      const threadMessages = await app.db
        .select({
          id: messages.id,
          content: messages.content,
          createdAt: messages.createdAt,
          username: users.username,
          userId: messages.userId,
          profileImageUrl: users.profileImageUrl,
        })
        .from(messages)
        .innerJoin(users, eq(messages.userId, users.id))
        .where(eq(messages.threadId, threadId))
        .orderBy(sql`${messages.createdAt} desc`)
        .limit(pagination.limit)
        .offset(pagination.offset);

      return { messages: threadMessages };
    }
  );

  // POST /api/messages/send/:recipientId — send private message
  app.post<{ Params: { recipientId: string } }>(
    "/send/:recipientId",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const recipientId = parseInt(request.params.recipientId, 10);
      if (isNaN(recipientId)) return reply.status(400).send({ error: "Invalid recipient ID" });

      const parsed = messageSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
      }

      // Find existing thread between these two users
      const existingThread = await app.db
        .select({ threadId: threadParticipants.threadId })
        .from(threadParticipants)
        .where(eq(threadParticipants.userId, request.userId!))
        .intersect(
          app.db
            .select({ threadId: threadParticipants.threadId })
            .from(threadParticipants)
            .where(eq(threadParticipants.userId, recipientId))
        );

      let threadId: number;

      if (existingThread.length > 0) {
        threadId = existingThread[0].threadId;
      } else {
        // Create new thread
        const [newThread] = await app.db
          .insert(messageThreads)
          .values({ messageType: "private" })
          .returning({ id: messageThreads.id });

        threadId = newThread.id;

        // Add both users as participants
        await app.db.insert(threadParticipants).values([
          { threadId, userId: request.userId! },
          { threadId, userId: recipientId },
        ]);
      }

      const [message] = await app.db
        .insert(messages)
        .values({
          threadId,
          userId: request.userId!,
          content: parsed.data.content,
        })
        .returning();

      return reply.status(201).send({ message, threadId });
    }
  );

  // DELETE /api/messages/:messageId
  app.delete<{ Params: { messageId: string } }>(
    "/:messageId",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const messageId = parseInt(request.params.messageId, 10);
      if (isNaN(messageId)) return reply.status(400).send({ error: "Invalid message ID" });

      // Verify ownership
      const msg = await app.db
        .select({ userId: messages.userId })
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1);

      if (msg.length === 0) {
        return reply.status(404).send({ error: "Message not found" });
      }
      if (msg[0].userId !== request.userId) {
        return reply.status(403).send({ error: "Not authorized to delete this message" });
      }

      await app.db.delete(messages).where(eq(messages.id, messageId));
      return { success: true };
    }
  );
};
