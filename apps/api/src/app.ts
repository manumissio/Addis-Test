import { join } from "node:path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import { env } from "./env";
import dbPlugin from "./plugins/db";
import authPlugin from "./plugins/auth";
import { authRoutes } from "./routes/auth";
import { usersRoutes } from "./routes/users";
import { ideasRoutes } from "./routes/ideas";
import { messagesRoutes } from "./routes/messages";
import { uploadsRoutes } from "./routes/uploads";
import { notificationsRoutes } from "./routes/notifications";
import { sponsorshipsRoutes } from "./routes/sponsorships";
import { errorHandler } from "./utils/errors";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
    },
  });

  // Security
  await app.register(helmet, {
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });
  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });
  await app.register(cookie, {
    secret: env.AUTH_SECRET,
    parseOptions: {},
  });
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });
  await app.register(multipart, {
    limits: { fileSize: 2 * 1024 * 1024 },
  });
  await app.register(fastifyStatic, {
    root: join(process.cwd(), "uploads"),
    prefix: "/uploads/",
    decorateReply: false,
  });

  // Database
  await app.register(dbPlugin);

  // Auth (session resolution)
  await app.register(authPlugin);

  // CSRF Protection Hook
  // Requires a custom header for all mutating requests to prevent CSRF.
  // This is effective because standard HTML forms cannot set custom headers,
  // and CORS policies will block unauthorized cross-origin AJAX requests.
  app.addHook("preHandler", async (request, reply) => {
    const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
    if (isMutating) {
      const csrfHeader = request.headers["x-requested-with"];
      if (!csrfHeader || csrfHeader !== "XMLHttpRequest") {
        return reply.status(403).send({ error: "CSRF protection: missing or invalid X-Requested-With header" });
      }
    }
  });

  // Error handling
  app.setErrorHandler(errorHandler);

  // Routes
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(usersRoutes, { prefix: "/api/users" });
  await app.register(ideasRoutes, { prefix: "/api/ideas" });
  await app.register(messagesRoutes, { prefix: "/api/messages" });
  await app.register(uploadsRoutes, { prefix: "/api/uploads" });
  await app.register(notificationsRoutes, { prefix: "/api/notifications" });
  await app.register(sponsorshipsRoutes, { prefix: "/api/sponsorships" });

  // Health check
  app.get("/api/health", async () => ({ status: "ok" }));

  return app;
}
