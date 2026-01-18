import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./auth";
import ingestRoutes from "./routes/ingest";
import projectRoutes from "./routes/projects";

// Types for context variables
type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

const app = new Hono<{ Variables: Variables }>();

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

// Better Auth routes
app.on(["POST", "GET"], "/api/auth/**", (c) => {
  return auth.handler(c.req.raw);
});

// API Routes
app.route("/api/ingest", ingestRoutes);
app.route("/api/projects", projectRoutes);

// Start server
const port = Number(process.env.PORT) || 4000;

console.log(`🚀 OpenLog server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
export type AppType = typeof app;
