import fp from "fastify-plugin";
import { eq } from "drizzle-orm";
import { sessions, users } from "@addis/db";
import type { FastifyRequest, FastifyReply } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    userId: number | null;
    user: { id: number; username: string } | null;
  }
}

export default fp(async (fastify) => {
  fastify.decorateRequest("userId", null);
  fastify.decorateRequest("user", null);

  fastify.addHook("onRequest", async (request: FastifyRequest) => {
    const sessionId = request.cookies.session;
    if (!sessionId) return;

    const result = await fastify.db
      .select({
        sessionId: sessions.id,
        userId: sessions.userId,
        expiresAt: sessions.expiresAt,
        username: users.username,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.id, sessionId))
      .limit(1);

    const session = result[0];
    if (!session || session.expiresAt < new Date()) return;

    request.userId = session.userId;
    request.user = { id: session.userId, username: session.username };
  });
});

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!request.userId) {
    reply.status(401).send({ error: "Authentication required" });
  }
}
