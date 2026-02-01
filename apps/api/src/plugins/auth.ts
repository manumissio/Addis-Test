import fp from "fastify-plugin";
import { eq, lt } from "drizzle-orm";
import { sessions, users } from "@addis/db";
import type { FastifyRequest, FastifyReply } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    userId: number | null;
    user: { id: number; username: string; profileImageUrl: string | null; role: "user" | "sponsor" | "admin" } | null;
  }
}

export default fp(async (fastify) => {
  fastify.decorateRequest("userId", null);
  fastify.decorateRequest("user", null);

  // Clean up expired sessions periodically (every 10 minutes)
  const cleanupInterval = setInterval(async () => {
    try {
      await fastify.db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
    } catch {
      // Non-critical; log and continue
      fastify.log.warn("Failed to clean expired sessions");
    }
  }, 10 * 60 * 1000);

  fastify.addHook("onClose", () => clearInterval(cleanupInterval));

  fastify.addHook("onRequest", async (request: FastifyRequest) => {
    const sessionId = request.cookies.session;
    if (!sessionId) return;

    const result = await fastify.db
      .select({
        sessionId: sessions.id,
        userId: sessions.userId,
        expiresAt: sessions.expiresAt,
        username: users.username,
        profileImageUrl: users.profileImageUrl,
        role: users.role,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.id, sessionId))
      .limit(1);

    const session = result[0];
    if (!session || session.expiresAt < new Date()) {
      // Delete expired session on access
      if (session) {
        await fastify.db.delete(sessions).where(eq(sessions.id, sessionId));
      }
      return;
    }

    request.userId = session.userId;
    request.user = {
      id: session.userId,
      username: session.username,
      profileImageUrl: session.profileImageUrl,
      role: session.role,
    };
  });
});

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!request.userId) {
    return reply.status(401).send({ error: "Authentication required" });
  }
}
