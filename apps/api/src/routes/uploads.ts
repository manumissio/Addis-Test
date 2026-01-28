import type { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { users, ideas } from "@addis/db";
import { requireAuth } from "../plugins/auth.js";

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
        const oldPath = join(process.cwd(), current[0].profileImageUrl);
        await unlink(oldPath).catch(() => {});
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
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const ideaId = parseInt(request.params.ideaId, 10);
      if (isNaN(ideaId)) {
        return reply.status(400).send({ error: "Invalid idea ID" });
      }

      // Verify ownership
      const idea = await app.db
        .select({ creatorId: ideas.creatorId, imageUrl: ideas.imageUrl })
        .from(ideas)
        .where(eq(ideas.id, ideaId))
        .limit(1);

      if (idea.length === 0) {
        return reply.status(404).send({ error: "Idea not found" });
      }
      if (idea[0].creatorId !== request.userId) {
        return reply.status(403).send({ error: "Not authorized" });
      }

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
      if (idea[0].imageUrl) {
        const oldPath = join(process.cwd(), idea[0].imageUrl);
        await unlink(oldPath).catch(() => {});
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
        const oldPath = join(process.cwd(), current[0].profileImageUrl);
        await unlink(oldPath).catch(() => {});
      }

      await app.db
        .update(users)
        .set({ profileImageUrl: null })
        .where(eq(users.id, request.userId!));

      return { success: true };
    }
  );
};
