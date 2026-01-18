import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
  real,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ============================================================================
// AUTHENTICATION TABLES (Better Auth)
// ============================================================================

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false),
  name: text("name"),
  image: text("image"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verifications = pgTable("verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// PROJECT TABLES
// ============================================================================

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    apiKey: text("api_key").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    settings: jsonb("settings").$type<{
      retentionDays?: number;
      environments?: string[];
    }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("projects_user_id_idx").on(table.userId),
    uniqueIndex("projects_api_key_idx").on(table.apiKey),
  ]
);

// ============================================================================
// LOG TABLES
// ============================================================================

export const logs = pgTable(
  "logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
    level: text("level").notNull(), // debug, info, warn, error, fatal
    message: text("message").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    traceId: text("trace_id"),
    spanId: text("span_id"),
    parentSpanId: text("parent_span_id"),
    service: text("service"),
    environment: text("environment"),
    stackTrace: text("stack_trace"),
    tags: jsonb("tags").$type<string[]>(),
    duration: integer("duration"), // milliseconds
    statusCode: integer("status_code"),
    path: text("path"),
    method: text("method"),
    userId: text("user_id"), // Application user ID (not OpenLog user)
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("logs_project_id_idx").on(table.projectId),
    index("logs_timestamp_idx").on(table.timestamp),
    index("logs_level_idx").on(table.level),
    index("logs_service_idx").on(table.service),
    index("logs_trace_id_idx").on(table.traceId),
    index("logs_environment_idx").on(table.environment),
    index("logs_project_timestamp_idx").on(table.projectId, table.timestamp),
  ]
);

// ============================================================================
// ANALYTICS TABLES
// ============================================================================

export const analyticsHourly = pgTable(
  "analytics_hourly",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    timestamp: timestamp("timestamp").notNull(), // Truncated to hour
    service: text("service"),
    level: text("level"),
    environment: text("environment"),
    count: integer("count").notNull().default(0),
    avgDuration: real("avg_duration"),
    errorCount: integer("error_count").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("analytics_hourly_project_timestamp_idx").on(
      table.projectId,
      table.timestamp
    ),
  ]
);

export const analyticsDaily = pgTable(
  "analytics_daily",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    service: text("service"),
    level: text("level"),
    environment: text("environment"),
    count: integer("count").notNull().default(0),
    avgDuration: real("avg_duration"),
    errorCount: integer("error_count").default(0),
    errorRate: real("error_rate"),
    p50Duration: real("p50_duration"),
    p95Duration: real("p95_duration"),
    p99Duration: real("p99_duration"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("analytics_daily_project_date_idx").on(table.projectId, table.date),
  ]
);

// ============================================================================
// SAVED SEARCHES
// ============================================================================

export const savedSearches = pgTable(
  "saved_searches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    query: jsonb("query").$type<{
      search?: string;
      levels?: string[];
      services?: string[];
      environments?: string[];
      dateRange?: { from: string; to: string };
    }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("saved_searches_user_id_idx").on(table.userId),
    index("saved_searches_project_id_idx").on(table.projectId),
  ]
);

// ============================================================================
// PLUGINS
// ============================================================================

export const plugins = pgTable("plugins", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  version: text("version").notNull(),
  description: text("description"),
  enabled: boolean("enabled").default(false),
  config: jsonb("config").$type<Record<string, unknown>>(),
  installedAt: timestamp("installed_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Log = typeof logs.$inferSelect;
export type NewLog = typeof logs.$inferInsert;

export type AnalyticsHourly = typeof analyticsHourly.$inferSelect;
export type AnalyticsDaily = typeof analyticsDaily.$inferSelect;

export type SavedSearch = typeof savedSearches.$inferSelect;
export type NewSavedSearch = typeof savedSearches.$inferInsert;

export type Plugin = typeof plugins.$inferSelect;
