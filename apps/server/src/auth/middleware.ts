import { Context, Next } from "hono";
import { auth } from "./auth";

/**
 * Middleware to protect routes - requires authentication
 */
export async function requireAuth(c: Context, next: Next) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  c.set("user", session.user);
  c.set("session", session.session);

  return next();
}

/**
 * Middleware to require admin role
 */
export async function requireAdmin(c: Context, next: Next) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  // Check admin status from the user object (custom field)
  const user = session.user as typeof session.user & { isAdmin?: boolean };
  if (!user.isAdmin) {
    return c.json(
      { success: false, error: "Forbidden: Admin access required" },
      403
    );
  }

  c.set("user", session.user);
  c.set("session", session.session);

  return next();
}

/**
 * Optional auth - attaches user if authenticated, but doesn't require it
 */
export async function optionalAuth(c: Context, next: Next) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (session) {
    c.set("user", session.user);
    c.set("session", session.session);
  }

  return next();
}
