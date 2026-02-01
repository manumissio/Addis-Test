import type { FastifyPluginAsync } from "fastify";
import { eq, and } from "drizzle-orm";
import { ideas, ideaSponsorships } from "@addis/db";

export const systemRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/system/stats
  app.get("/stats", async () => {
    const totalProposals = await app.db.$count(ideas);
    const capitalAligned = await app.db.$count(ideaSponsorships, eq(ideaSponsorships.status, "accepted"));

    return {
      totalProposals,
      capitalAligned,
    };
  });
};
