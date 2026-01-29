import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";

/**
 * Custom error classes for better error handling
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(404, message, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Not authorized") {
    super(403, message, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, "CONFLICT");
    this.name = "ConflictError";
  }
}

/**
 * PostgreSQL error codes we handle
 */
const PG_ERROR_CODES = {
  UNIQUE_VIOLATION: "23505",
  FOREIGN_KEY_VIOLATION: "23503",
  NOT_NULL_VIOLATION: "23502",
  CHECK_VIOLATION: "23514",
} as const;

/**
 * Checks if an error is a PostgreSQL error with a specific code
 */
function isPostgresError(err: unknown, code?: string): boolean {
  if (!err || typeof err !== "object") return false;
  if (!("code" in err)) return false;
  if (code) return err.code === code;
  return typeof err.code === "string" && err.code.startsWith("23");
}

/**
 * Global error handler for Fastify
 */
export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  // Log all errors with context
  request.log.error(
    {
      err: error,
      url: request.url,
      method: request.method,
      userId: request.userId,
    },
    "Request error"
  );

  // Handle custom app errors
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      error: error.message,
      code: error.code,
    });
    return;
  }

  // Handle PostgreSQL errors
  if (isPostgresError(error, PG_ERROR_CODES.UNIQUE_VIOLATION)) {
    reply.status(409).send({
      error: "Resource already exists",
      code: "DUPLICATE_ENTRY",
    });
    return;
  }

  if (isPostgresError(error, PG_ERROR_CODES.FOREIGN_KEY_VIOLATION)) {
    reply.status(400).send({
      error: "Invalid reference to related resource",
      code: "INVALID_REFERENCE",
    });
    return;
  }

  if (isPostgresError(error, PG_ERROR_CODES.NOT_NULL_VIOLATION)) {
    reply.status(400).send({
      error: "Required field is missing",
      code: "MISSING_FIELD",
    });
    return;
  }

  if (isPostgresError(error)) {
    // Generic database error - don't expose details to client
    reply.status(500).send({
      error: "Database error occurred",
      code: "DATABASE_ERROR",
    });
    return;
  }

  // Handle Fastify validation errors
  if (error.validation) {
    reply.status(400).send({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: error.validation,
    });
    return;
  }

  // Default to 500 for unknown errors
  const statusCode = error.statusCode || 500;
  reply.status(statusCode).send({
    error: statusCode === 500 ? "Internal server error" : error.message,
    code: error.code || "INTERNAL_ERROR",
  });
}

/**
 * Helper to handle database constraint violations for specific cases
 * where we want custom error messages
 */
export function handleUniqueViolation(
  err: unknown,
  customMessage: string
): never | void {
  if (isPostgresError(err, PG_ERROR_CODES.UNIQUE_VIOLATION)) {
    throw new ConflictError(customMessage);
  }
  throw err;
}
