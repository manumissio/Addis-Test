import type { FastifyPluginAsync } from "fastify";
import { eq, and, desc, ne, inArray, sql } from "drizzle-orm";
import { messages, messageThreads, threadParticipants, users } from "@addis/db";
import { messageSchema, paginationSchema } from "@addis/shared";
import { requireAuth } from "../plugins/auth";
import { validateThreadId, validateRecipientId, validateMessageId } from "../middleware/validateId";
import { sanitizeRichText } from "../utils/sanitize";
import { createNotification } from "../utils/notifications";

// Response types
type ThreadSummary = {
  threadId: number;
  participant: {
    userId: number;
    username: string;
    profileImageUrl: string | null;
  } | null;
  lastMessage: {
    content: string;
    createdAt: Date;
    senderUsername: string;
  } | null;
};

type Message = {
  id: number;
  content: string;
  createdAt: Date;
  userId: number;
  username: string;
  profileImageUrl: string | null;
};

type ThreadParticipant = {
  userId: number;
  username: string;
  profileImageUrl: string | null;
};

export const messagesRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/messages/threads — list user's private message threads with participant info
  app.get("/threads", { preHandler: [requireAuth] }, async (request): Promise<{ threads: ThreadSummary[] }> => {
    // Get thread IDs the user participates in
    const userThreads = await app.db
      .select({ threadId: threadParticipants.threadId })
      .from(threadParticipants)
      .innerJoin(messageThreads, eq(threadParticipants.threadId, messageThreads.id))
      .where(
        and(
          eq(threadParticipants.userId, request.userId!),
          eq(messageThreads.messageType, "private")
        )
      );

    if (userThreads.length === 0) {
      return { threads: [] };
    }

    const threadIds = userThreads.map((t) => t.threadId);

    // Batch fetch: get all partners in ONE query
    const partners = await app.db
      .select({
        threadId: threadParticipants.threadId,
        userId: users.id,
        username: users.username,
        profileImageUrl: users.profileImageUrl,
      })
      .from(threadParticipants)
      .innerJoin(users, eq(threadParticipants.userId, users.id))
      .where(
        and(
          inArray(threadParticipants.threadId, threadIds),
          ne(threadParticipants.userId, request.userId!)
        )
      );

    // Batch fetch: get latest message per thread using DISTINCT ON
    const latestMessages = await app.db
      .selectDistinctOn([messages.threadId], {
        threadId: messages.threadId,
        content: messages.content,
        createdAt: messages.createdAt,
        senderUsername: users.username,
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(inArray(messages.threadId, threadIds))
      .orderBy(messages.threadId, desc(messages.createdAt));

    // Combine in memory
    const threads = threadIds.map((threadId) => {
      const partner = partners.find((p) => p.threadId === threadId);
      const msg = latestMessages.find((m) => m.threadId === threadId);
      return {
        threadId,
        participant: partner
          ? { userId: partner.userId, username: partner.username, profileImageUrl: partner.profileImageUrl }
          : null,
        lastMessage: msg
          ? { content: msg.content, createdAt: msg.createdAt, senderUsername: msg.senderUsername }
          : null,
      };
    });

    // Sort by latest message timestamp (most recent first), threads without messages last
    threads.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    return { threads };
  });

  // GET /api/messages/threads/:threadId — get messages in a thread
  app.get<{ Params: { threadId: string }; Querystring: Record<string, string> }>(
    "/threads/:threadId",
    { preHandler: [requireAuth, validateThreadId] },
    async (request, reply): Promise<{ messages: Message[]; participant: ThreadParticipant | null } | void> => {
      const threadId = (request as any).threadId as number;
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

      // Get other participant info
      const otherParticipant = await app.db
        .select({
          userId: users.id,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
        })
        .from(threadParticipants)
        .innerJoin(users, eq(threadParticipants.userId, users.id))
        .where(
          and(
            eq(threadParticipants.threadId, threadId),
            ne(threadParticipants.userId, request.userId!)
          )
        )
        .limit(1);

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
        .orderBy(desc(messages.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset);

      return {
        messages: threadMessages,
        participant: otherParticipant[0] ?? null,
      };
    }
  );

  // POST /api/messages/send/:recipientId — send private message
  app.post<{ Params: { recipientId: string } }>(
    "/send/:recipientId",
    { preHandler: [requireAuth, validateRecipientId] },
    async (request, reply): Promise<void> => {
      const recipientId = (request as any).recipientId as number;

      // Prevent self-messaging
      if (recipientId === request.userId) {
        return reply.status(400).send({ error: "Cannot send a message to yourself" });
      }

      // Verify recipient exists
      const recipient = await app.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, recipientId))
        .limit(1);

      if (recipient.length === 0) {
        return reply.status(404).send({ error: "Recipient not found" });
      }

      const parsed = messageSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
      }

      // Sanitize message content to prevent XSS
      const sanitizedContent = sanitizeRichText(parsed.data.content);

      // Find existing private thread between these two users
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

      // Filter to only private threads (not collaboration/comment threads)
      let threadId: number | null = null;
      for (const t of existingThread) {
        const thread = await app.db
          .select({ messageType: messageThreads.messageType })
          .from(messageThreads)
          .where(eq(messageThreads.id, t.threadId))
          .limit(1);
        if (thread[0]?.messageType === "private") {
          threadId = t.threadId;
          break;
        }
      }

      if (!threadId) {
        // Create new private thread
        const [newThread] = await app.db
          .insert(messageThreads)
          .values({ messageType: "private" })
          .returning({ id: messageThreads.id });

        threadId = newThread.id;

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
          content: sanitizedContent,
        })
        .returning();

      // Notify recipient
      await createNotification(app.db, {
        recipientId,
        senderId: request.userId!,
        type: "message",
        message: "sent you a message",
        link: `/messages/${threadId}`,
      });

      return reply.status(201).send({ message, threadId });
    }
  );

  // DELETE /api/messages/:messageId — delete own message
  app.delete<{ Params: { messageId: string } }>(
    "/:messageId",
    { preHandler: [requireAuth, validateMessageId] },
    async (request, reply): Promise<{ success: boolean } | void> => {
      const messageId = (request as any).messageId as number;

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
