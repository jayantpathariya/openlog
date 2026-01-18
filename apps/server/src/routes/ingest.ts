import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";
import { logs, projects } from "../db/schema";
import { eq } from "drizzle-orm";
import { logEntrySchema, logBatchSchema } from "@openlog/shared/validators";

const ingest = new Hono();

// Middleware to validate API key and get project
async function validateApiKey(apiKey: string) {
  if (!apiKey) return null;

  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.apiKey, apiKey))
    .limit(1);

  return project[0] || null;
}

// Single log ingestion
ingest.post("/", zValidator("json", logEntrySchema), async (c) => {
  const apiKey =
    c.req.header("x-api-key") ||
    c.req.header("Authorization")?.replace("Bearer ", "");

  if (!apiKey) {
    return c.json({ success: false, error: "API key required" }, 401);
  }

  const project = await validateApiKey(apiKey);
  if (!project) {
    return c.json({ success: false, error: "Invalid API key" }, 401);
  }

  const logData = c.req.valid("json");

  const [insertedLog] = await db
    .insert(logs)
    .values({
      projectId: project.id,
      timestamp: logData.timestamp,
      level: logData.level,
      message: logData.message,
      metadata: logData.metadata,
      traceId: logData.traceId,
      spanId: logData.spanId,
      parentSpanId: logData.parentSpanId,
      service: logData.service,
      environment: logData.environment,
      stackTrace: logData.stackTrace,
      tags: logData.tags,
      duration: logData.duration,
      statusCode: logData.statusCode,
      path: logData.path,
      method: logData.method,
      userId: logData.userId,
    })
    .returning({ id: logs.id });

  return c.json({
    success: true,
    data: { id: insertedLog.id },
  });
});

// Batch log ingestion
ingest.post("/batch", zValidator("json", logBatchSchema), async (c) => {
  const apiKey =
    c.req.header("x-api-key") ||
    c.req.header("Authorization")?.replace("Bearer ", "");

  if (!apiKey) {
    return c.json({ success: false, error: "API key required" }, 401);
  }

  const project = await validateApiKey(apiKey);
  if (!project) {
    return c.json({ success: false, error: "Invalid API key" }, 401);
  }

  const { logs: logEntries } = c.req.valid("json");

  const insertedLogs = await db
    .insert(logs)
    .values(
      logEntries.map((log) => ({
        projectId: project.id,
        timestamp: log.timestamp,
        level: log.level,
        message: log.message,
        metadata: log.metadata,
        traceId: log.traceId,
        spanId: log.spanId,
        parentSpanId: log.parentSpanId,
        service: log.service,
        environment: log.environment,
        stackTrace: log.stackTrace,
        tags: log.tags,
        duration: log.duration,
        statusCode: log.statusCode,
        path: log.path,
        method: log.method,
        userId: log.userId,
      }))
    )
    .returning({ id: logs.id });

  return c.json({
    success: true,
    data: {
      count: insertedLogs.length,
      ids: insertedLogs.map((l) => l.id),
    },
  });
});

// Health check for SDK
ingest.get("/health", (c) => {
  return c.json({ status: "ok" });
});

export default ingest;
