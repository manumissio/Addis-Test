import type { FastifyPluginAsync } from "fastify";
import { eq, and, desc } from "drizzle-orm";
import { notifications, users } from "@addis/db";
import { paginationSchema } from "@addis/shared";
import { requireAuth } from "../plugins/auth";
import { validateId } from "../middleware/validateId";

export const notificationsRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/notifications
  app.get("/", { preHandler: [requireAuth] }, async (request) => {
    const pagination = paginationSchema.parse(request.query);

    const result = await app.db
      .select({
        id: notifications.id,
        type: notifications.type,
        message: notifications.message,
        link: notifications.link,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
        sender: {
          username: users.username,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.senderId, users.id))
      .where(eq(notifications.recipientId, request.userId!))
      .orderBy(desc(notifications.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset);

    return { notifications: result };
  });

  // GET /api/notifications/unread-count
  app.get("/unread-count", { preHandler: [requireAuth] }, async (request) => {
    const count = await app.db.$count(notifications, and(
      eq(notifications.recipientId, request.userId!),
      eq(notifications.isRead, false)
    ));

    return { count };
  });

  // PATCH /api/notifications/:id/read
  app.patch<{ Params: { id: string } }>(
    "/:id/read",
    { preHandler: [requireAuth, validateId("id")] },
    async (request, reply) => {
      const id = (request as any).id as number;

      await app.db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, id),
            eq(notifications.recipientId, request.userId!)
          )
        );

      return { success: true };
    }
  );

  // PATCH /api/notifications/read-all
  app.patch("/read-all", { preHandler: [requireAuth] }, async (request) => {
    await app.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.recipientId, request.userId!));

    return { success: true };
  });
};
