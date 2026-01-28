import { join } from "node:path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import { env } from "./env.js";
import dbPlugin from "./plugins/db.js";
import authPlugin from "./plugins/auth.js";
import { authRoutes } from "./routes/auth.js";
import { usersRoutes } from "./routes/users.js";
import { ideasRoutes } from "./routes/ideas.js";
import { messagesRoutes } from "./routes/messages.js";
import { uploadsRoutes } from "./routes/uploads.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
    },
  });

  // Security
  await app.register(helmet);
  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
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

  // Routes
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(usersRoutes, { prefix: "/api/users" });
  await app.register(ideasRoutes, { prefix: "/api/ideas" });
  await app.register(messagesRoutes, { prefix: "/api/messages" });
  await app.register(uploadsRoutes, { prefix: "/api/uploads" });

  // Health check
  app.get("/api/health", async () => ({ status: "ok" }));

  return app;
}
