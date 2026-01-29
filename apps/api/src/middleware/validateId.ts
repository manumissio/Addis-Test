import type { FastifyRequest, FastifyReply, preHandlerHookHandler } from "fastify";

/**
 * Middleware to validate and parse numeric ID from route params
 * Attaches parsed ID to request object and returns 400 if invalid
 *
 * @param paramName - The name of the param to validate (e.g., "id", "threadId", "messageId")
 * @param attachAs - Optional custom property name to attach the parsed ID (defaults to paramName)
 */
export function validateId(
  paramName: string,
  attachAs?: string
): preHandlerHookHandler {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const params = request.params as Record<string, string>;
    const rawId = params[paramName];
    const parsedId = parseInt(rawId, 10);

    if (isNaN(parsedId) || parsedId <= 0) {
      return reply.status(400).send({
        error: `Invalid ${paramName.replace(/Id$/, " ID")}`,
      });
    }

    // Attach parsed ID to request for use in handler
    const propertyName = attachAs || paramName;
    (request as any)[propertyName] = parsedId;
  };
}

// Convenience validators for common ID params
export const validateIdeaId = validateId("id", "ideaId");
export const validateThreadId = validateId("threadId");
export const validateMessageId = validateId("messageId");
export const validateRecipientId = validateId("recipientId");
