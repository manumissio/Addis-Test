import type { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { users, sessions } from "@addis/db";
import { registerSchema, loginSchema, updatePasswordSchema, passwordSchema } from "@addis/shared";
import { requireAuth } from "../plugins/auth.js";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(":");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const keyBuffer = Buffer.from(key, "hex");
  return timingSafeEqual(derived, keyBuffer);
}

function generateSessionId(): string {
  return randomBytes(32).toString("hex");
}

const SESSION_DURATION_MS = 3 * 60 * 60 * 1000; // 3 hours, matching original

// Dummy hash for timing-safe comparison when user not found
const DUMMY_HASH = "0000000000000000000000000000000000000000000000000000000000000000:0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

// Stricter rate limits for auth endpoints (5 attempts per minute)
const authRateLimit = {
  max: 5,
  timeWindow: "1 minute",
};

export const authRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/auth/register
  app.post("/register", { config: { rateLimit: authRateLimit } }, async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }
    const { username, password, email, firstName, lastName } = parsed.data;

    // Check if username or email already taken
    const existing = await app.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existing.length > 0) {
      return reply.status(409).send({ error: "Username already taken" });
    }

    const existingEmail = await app.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingEmail.length > 0) {
      return reply.status(409).send({ error: "Email already in use" });
    }

    const passwordHash = await hashPassword(password);

    const [newUser] = await app.db
      .insert(users)
      .values({
        username,
        email,
        passwordHash,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
      })
      .returning({ id: users.id, username: users.username });

    // Create session
    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await app.db.insert(sessions).values({
      id: sessionId,
      userId: newUser.id,
      expiresAt,
    });

    reply.setCookie("session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: expiresAt,
    });

    return { user: { id: newUser.id, username: newUser.username } };
  });

  // POST /api/auth/login
  app.post("/login", { config: { rateLimit: authRateLimit } }, async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid credentials" });
    }
    const { username, password } = parsed.data;

    const result = await app.db
      .select({
        id: users.id,
        username: users.username,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    const user = result[0];
    // Always perform hash verification to prevent timing attacks
    const hashToVerify = user?.passwordHash ?? DUMMY_HASH;
    const isValid = await verifyPassword(password, hashToVerify);

    if (!user || !isValid) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    // Update last active
    await app.db
      .update(users)
      .set({ lastActiveAt: new Date() })
      .where(eq(users.id, user.id));

    // Create session
    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await app.db.insert(sessions).values({
      id: sessionId,
      userId: user.id,
      expiresAt,
    });

    reply.setCookie("session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      expires: expiresAt,
    });

    return { user: { id: user.id, username: user.username } };
  });

  // POST /api/auth/logout
  app.post("/logout", async (request, reply) => {
    const sessionId = request.cookies.session;
    if (sessionId) {
      await app.db.delete(sessions).where(eq(sessions.id, sessionId));
    }

    reply.clearCookie("session", { path: "/" });
    return { success: true };
  });

  // GET /api/auth/me
  app.get("/me", async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: "Not authenticated" });
    }
    return { user: request.user };
  });

  // POST /api/auth/password-reset/request
  app.post("/password-reset/request", { config: { rateLimit: authRateLimit } }, async (request, reply) => {
    const { email } = request.body as { email?: string };
    if (!email) {
      return reply.status(400).send({ error: "Email is required" });
    }

    const result = await app.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Always return success to avoid email enumeration
    if (result.length === 0) {
      return { success: true };
    }

    // Generate temporary password
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const tempPassword = Array.from(randomBytes(12))
      .map((b) => chars[b % chars.length])
      .join("");

    const tempHash = await hashPassword(tempPassword);
    await app.db
      .update(users)
      .set({ tempPasswordHash: tempHash })
      .where(eq(users.id, result[0].id));

    // TODO: Send email with tempPassword in production.
    if (process.env.NODE_ENV !== "production") {
      app.log.info({ email, tempPassword }, "Password reset requested (dev only)");
    }

    return { success: true };
  });

  // POST /api/auth/password-reset/confirm
  app.post("/password-reset/confirm", { config: { rateLimit: authRateLimit } }, async (request, reply) => {
    const { email, tempPassword, newPassword } = request.body as {
      email?: string;
      tempPassword?: string;
      newPassword?: string;
    };

    if (!email || !tempPassword || !newPassword) {
      return reply.status(400).send({ error: "All fields are required" });
    }

    // Validate new password strength
    const passwordParsed = passwordSchema.safeParse(newPassword);
    if (!passwordParsed.success) {
      return reply.status(400).send({ error: passwordParsed.error.flatten().fieldErrors });
    }

    const result = await app.db
      .select({
        id: users.id,
        tempPasswordHash: users.tempPasswordHash,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const user = result[0];
    if (!user?.tempPasswordHash) {
      return reply.status(400).send({ error: "Invalid reset request" });
    }

    const tempValid = await verifyPassword(tempPassword, user.tempPasswordHash);
    if (!tempValid) {
      return reply.status(400).send({ error: "Invalid temporary password" });
    }

    const newHash = await hashPassword(newPassword);
    await app.db
      .update(users)
      .set({ passwordHash: newHash, tempPasswordHash: null })
      .where(eq(users.id, user.id));

    return { success: true };
  });

  // POST /api/auth/password — change password (logged-in user)
  app.post("/password", { preHandler: [requireAuth], config: { rateLimit: authRateLimit } }, async (request, reply) => {
    const parsed = updatePasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const { currentPassword, newPassword } = parsed.data;

    const result = await app.db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, request.userId!))
      .limit(1);

    const user = result[0];
    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: "Current password is incorrect" });
    }

    const newHash = await hashPassword(newPassword);
    await app.db
      .update(users)
      .set({ passwordHash: newHash })
      .where(eq(users.id, request.userId!));

    return { success: true };
  });
};
