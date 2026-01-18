import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

// Health check
app.get("/", (c) => {
  return c.json({
    name: "OpenLog API",
    version: "0.1.0",
    status: "healthy",
  });
});

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server
const port = Number(process.env.PORT) || 4000;

console.log(`🚀 OpenLog server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
export type AppType = typeof app;
