import { z } from "zod";

// ============================================================================
// LOG VALIDATORS
// ============================================================================

export const logLevelSchema = z.enum([
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
]);

export const logEntrySchema = z.object({
  timestamp: z.coerce
    .date()
    .optional()
    .default(() => new Date()),
  level: logLevelSchema,
  message: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
  traceId: z.string().optional(),
  spanId: z.string().optional(),
  parentSpanId: z.string().optional(),
  service: z.string().optional(),
  environment: z.string().optional(),
  stackTrace: z.string().optional(),
  tags: z.array(z.string()).optional(),
  duration: z.number().int().optional(),
  statusCode: z.number().int().optional(),
  path: z.string().optional(),
  method: z.string().optional(),
  userId: z.string().optional(),
});

export const logBatchSchema = z.object({
  logs: z.array(logEntrySchema).min(1).max(1000),
});

export type LogEntryInput = z.infer<typeof logEntrySchema>;
export type LogBatchInput = z.infer<typeof logBatchSchema>;

// ============================================================================
// PROJECT VALIDATORS
// ============================================================================

export const projectSettingsSchema = z.object({
  retentionDays: z.number().int().min(1).max(365).optional(),
  environments: z.array(z.string()).optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  settings: projectSettingsSchema.optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  settings: projectSettingsSchema.optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// ============================================================================
// AUTH VALIDATORS
// ============================================================================

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// ============================================================================
// QUERY VALIDATORS
// ============================================================================

export const logQuerySchema = z.object({
  projectId: z.string().uuid(),
  search: z.string().optional(),
  levels: z.array(logLevelSchema).optional(),
  services: z.array(z.string()).optional(),
  environments: z.array(z.string()).optional(),
  traceId: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export type LogQueryInput = z.infer<typeof logQuerySchema>;

// ============================================================================
// SAVED SEARCH VALIDATORS
// ============================================================================

export const createSavedSearchSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(100),
  query: logQuerySchema.omit({ projectId: true, page: true, pageSize: true }),
});

export type CreateSavedSearchInput = z.infer<typeof createSavedSearchSchema>;
