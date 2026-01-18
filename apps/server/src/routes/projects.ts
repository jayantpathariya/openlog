import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db";
import { projects } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../auth";
import {
  createProjectSchema,
  updateProjectSchema,
} from "@openlog/shared/validators";
import { auth } from "../auth";

// Define the context type
type Variables = {
  user: typeof auth.$Infer.Session.user;
  session: typeof auth.$Infer.Session.session;
};

const projectRoutes = new Hono<{ Variables: Variables }>();

// Generate a random API key
function generateApiKey(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const prefix = "olk_"; // OpenLog Key
  let key = prefix;
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// List all projects for the current user
projectRoutes.get("/", requireAuth, async (c) => {
  const user = c.get("user");

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, user.id))
    .orderBy(projects.createdAt);

  return c.json({
    success: true,
    data: userProjects,
  });
});

// Get a single project by ID
projectRoutes.get("/:id", requireAuth, async (c) => {
  const user = c.get("user");
  const projectId = c.req.param("id");

  const project = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
    .limit(1);

  if (!project[0]) {
    return c.json({ success: false, error: "Project not found" }, 404);
  }

  return c.json({
    success: true,
    data: project[0],
  });
});

// Create a new project
projectRoutes.post(
  "/",
  requireAuth,
  zValidator("json", createProjectSchema),
  async (c) => {
    const user = c.get("user");
    const data = c.req.valid("json");

    const [newProject] = await db
      .insert(projects)
      .values({
        name: data.name,
        description: data.description,
        apiKey: generateApiKey(),
        userId: user.id,
        settings: data.settings,
      })
      .returning();

    return c.json(
      {
        success: true,
        data: newProject,
      },
      201
    );
  }
);

// Update a project
projectRoutes.patch(
  "/:id",
  requireAuth,
  zValidator("json", updateProjectSchema),
  async (c) => {
    const user = c.get("user");
    const projectId = c.req.param("id");
    const data = c.req.valid("json");

    // Check if project exists and belongs to user
    const existing = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
      .limit(1);

    if (!existing[0]) {
      return c.json({ success: false, error: "Project not found" }, 404);
    }

    const [updated] = await db
      .update(projects)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning();

    return c.json({
      success: true,
      data: updated,
    });
  }
);

// Delete a project
projectRoutes.delete("/:id", requireAuth, async (c) => {
  const user = c.get("user");
  const projectId = c.req.param("id");

  // Check if project exists and belongs to user
  const existing = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
    .limit(1);

  if (!existing[0]) {
    return c.json({ success: false, error: "Project not found" }, 404);
  }

  await db.delete(projects).where(eq(projects.id, projectId));

  return c.json({
    success: true,
    message: "Project deleted",
  });
});

// Regenerate API key
projectRoutes.post("/:id/regenerate-key", requireAuth, async (c) => {
  const user = c.get("user");
  const projectId = c.req.param("id");

  // Check if project exists and belongs to user
  const existing = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
    .limit(1);

  if (!existing[0]) {
    return c.json({ success: false, error: "Project not found" }, 404);
  }

  const [updated] = await db
    .update(projects)
    .set({
      apiKey: generateApiKey(),
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId))
    .returning();

  return c.json({
    success: true,
    data: { apiKey: updated.apiKey },
  });
});

export default projectRoutes;
