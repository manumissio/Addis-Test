import fp from "fastify-plugin";
import { createDb, type Database } from "@addis/db";
import { env } from "../env";

declare module "fastify" {
  interface FastifyInstance {
    db: Database;
  }
}

export default fp(async (fastify) => {
  const db = createDb(env.DATABASE_URL);
  fastify.decorate("db", db);
});
