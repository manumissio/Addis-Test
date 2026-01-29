import { z } from "zod";

// Mirrors the original regex: 3-25 chars, alphanumeric with . and _, no leading/trailing/consecutive special chars
export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(25, "Username must be at most 25 characters")
  .regex(
    /^(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/,
    "Username can only contain letters, numbers, dots, and underscores"
  );

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const emailSchema = z.string().email("Invalid email address");

export const registerSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  email: emailSchema,
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  referral: z.string().max(255).optional(),
});

export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, "Password is required"),
});

export const createIdeaSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().min(1, "Description is required"),
  locationCity: z.string().max(255).optional(),
  locationState: z.string().max(255).optional(),
  locationCountry: z.string().max(255).optional(),
});

export const updateIdeaSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().min(1).optional(),
  locationCity: z.string().max(255).nullable().optional(),
  locationState: z.string().max(255).nullable().optional(),
  locationCountry: z.string().max(255).nullable().optional(),
});

export const updateProfileSchema = z.object({
  about: z.string().max(2000).optional(),
  profession: z.string().max(255).optional(),
  locationCity: z.string().max(255).nullable().optional(),
  locationState: z.string().max(255).nullable().optional(),
  locationCountry: z.string().max(255).nullable().optional(),
  dob: z.string().date().optional(),
  isPrivate: z.boolean().optional(),
});

export const updateUsernameSchema = z.object({
  username: usernameSchema,
});

export const updateEmailSchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

export const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(5000),
});

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});

export const topicSchema = z.object({
  topicName: z.string().min(1, "Topic name is required").max(255),
});

export const stakeholderSchema = z.object({
  stakeholder: z.string().min(1, "Stakeholder is required").max(255),
});

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export const passwordResetConfirmSchema = z.object({
  email: emailSchema,
  tempPassword: z.string().min(1, "Temporary password is required"),
  newPassword: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateIdeaInput = z.infer<typeof createIdeaSchema>;
export type UpdateIdeaInput = z.infer<typeof updateIdeaSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type TopicInput = z.infer<typeof topicSchema>;
export type StakeholderInput = z.infer<typeof stakeholderSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;
