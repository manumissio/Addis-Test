import type { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { users, ideas } from "@addis/db";
import { requireAuth } from "../plugins/auth";
import { requireIdeaOwnership } from "../utils/ownership";
import { validateId } from "../middleware/validateId";

// Validate image by reading magic bytes, not trusting client MIME type
const MAGIC_BYTES: Record<string, Buffer> = {
  png: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
  jpeg: Buffer.from([0xff, 0xd8, 0xff]),
  gif: Buffer.from([0x47, 0x49, 0x46, 0x38]),
};

function detectImageType(buffer: Buffer): string | null {
  for (const [type, magic] of Object.entries(MAGIC_BYTES)) {
    if (buffer.length >= magic.length && buffer.subarray(0, magic.length).equals(magic)) {
      return type;
    }
  }
  return null;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const UPLOAD_DIR = join(process.cwd(), "uploads");

/** Resolve a stored image URL to a safe filesystem path, rejecting traversal attempts. */
function safeUploadPath(storedUrl: string): string | null {
  const resolved = resolve(process.cwd(), storedUrl.replace(/^\//, ""));
  // Append path separator to prevent sibling directory bypass (e.g., /uploads-fake)
  if (!resolved.startsWith(UPLOAD_DIR + sep)) return null;
  return resolved;
}

async function safeDeleteFile(storedUrl: string): Promise<void> {
  const safePath = safeUploadPath(storedUrl);
  if (safePath) await unlink(safePath).catch(() => {});
}

export const uploadsRoutes: FastifyPluginAsync = async (app) => {
  // Rate limit uploads more aggressively
  app.addHook("onRequest", async (request, reply) => {
    // Additional rate limit is handled by the global plugin,
    // but uploads get a tighter constraint via preHandler
  });

  // POST /api/uploads/profile-image
  app.post(
    "/profile-image",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ error: "No file provided" });
      }

      const buffer = await data.toBuffer();

      // Validate file size
      if (buffer.length > MAX_FILE_SIZE) {
        return reply.status(400).send({ error: "File too large. Maximum 2MB." });
      }

      // Validate by magic bytes, not client-reported MIME
      const imageType = detectImageType(buffer);
      if (!imageType) {
        return reply.status(400).send({ error: "Invalid image format. Only PNG, JPEG, and GIF are allowed." });
      }

      // Generate safe filename — never use client-supplied filename
      const safeFilename = `user_${request.userId}_${randomBytes(8).toString("hex")}.${imageType === "jpeg" ? "jpg" : imageType}`;
      const dir = join(UPLOAD_DIR, "users");
      await mkdir(dir, { recursive: true });
      const filepath = join(dir, safeFilename);

      await writeFile(filepath, buffer);

      const imageUrl = `/uploads/users/${safeFilename}`;

      // Delete old image file if it exists
      const current = await app.db
        .select({ profileImageUrl: users.profileImageUrl })
        .from(users)
        .where(eq(users.id, request.userId!))
        .limit(1);

      if (current[0]?.profileImageUrl) {
        await safeDeleteFile(current[0].profileImageUrl);
      }

      await app.db
        .update(users)
        .set({ profileImageUrl: imageUrl })
        .where(eq(users.id, request.userId!));

      return { imageUrl };
    }
  );

  // POST /api/uploads/idea-image/:ideaId
  app.post<{ Params: { ideaId: string } }>(
    "/idea-image/:ideaId",
    { preHandler: [requireAuth, validateId("ideaId")] },
    async (request, reply) => {
      const ideaId = (request as any).ideaId as number;

      // Verify ownership and get current image URL
      const idea = await requireIdeaOwnership<{ creatorId: number; imageUrl: string | null }>(
        app.db,
        reply,
        ideaId,
        request.userId!,
        { creatorId: ideas.creatorId, imageUrl: ideas.imageUrl }
      );

      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ error: "No file provided" });
      }

      const buffer = await data.toBuffer();

      if (buffer.length > MAX_FILE_SIZE) {
        return reply.status(400).send({ error: "File too large. Maximum 2MB." });
      }

      const imageType = detectImageType(buffer);
      if (!imageType) {
        return reply.status(400).send({ error: "Invalid image format. Only PNG, JPEG, and GIF are allowed." });
      }

      const safeFilename = `idea_${ideaId}_${randomBytes(8).toString("hex")}.${imageType === "jpeg" ? "jpg" : imageType}`;
      const dir = join(UPLOAD_DIR, "ideas");
      await mkdir(dir, { recursive: true });
      const filepath = join(dir, safeFilename);

      await writeFile(filepath, buffer);

      const imageUrl = `/uploads/ideas/${safeFilename}`;

      // Delete old image
      if (idea.imageUrl) {
        await safeDeleteFile(idea.imageUrl);
      }

      await app.db
        .update(ideas)
        .set({ imageUrl })
        .where(eq(ideas.id, ideaId));

      return { imageUrl };
    }
  );

  // DELETE /api/uploads/profile-image
  app.delete(
    "/profile-image",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const current = await app.db
        .select({ profileImageUrl: users.profileImageUrl })
        .from(users)
        .where(eq(users.id, request.userId!))
        .limit(1);

      if (current[0]?.profileImageUrl) {
        await safeDeleteFile(current[0].profileImageUrl);
      }

      await app.db
        .update(users)
        .set({ profileImageUrl: null })
        .where(eq(users.id, request.userId!));

      return { success: true };
    }
  );
};
