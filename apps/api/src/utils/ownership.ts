import type { FastifyReply } from "fastify";
import type { Database } from "@addis/db";
import { eq } from "drizzle-orm";
import { ideas } from "@addis/db";
import { NotFoundError, UnauthorizedError } from "./errors";

/**
 * Verifies that a user owns a specific idea.
 * Returns the idea data if ownership is confirmed.
 * Throws NotFoundError or UnauthorizedError on failure.
 */
export async function requireIdeaOwnership<T extends { creatorId: number }>(
  db: Database,
  reply: FastifyReply,
  ideaId: number,
  userId: number,
  /** Columns to select from the ideas table */
  selectColumns: Record<string, any> = { creatorId: ideas.creatorId }
): Promise<T> {
  const result = await db
    .select(selectColumns)
    .from(ideas)
    .where(eq(ideas.id, ideaId))
    .limit(1);

  if (result.length === 0) {
    throw new NotFoundError("Idea not found");
  }

  const idea = result[0] as T;
  if (idea.creatorId !== userId) {
    throw new UnauthorizedError("Not authorized to access this idea");
  }

  return idea;
}
