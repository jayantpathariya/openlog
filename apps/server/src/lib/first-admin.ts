import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * Hook to make the first registered user an admin
 * Should be called after user creation
 */
export async function makeFirstUserAdmin(userId: string): Promise<boolean> {
  // Count existing users
  const userCount = await db.select().from(users).limit(2);

  // If this is the first user, make them admin
  if (userCount.length === 1) {
    await db.update(users).set({ isAdmin: true }).where(eq(users.id, userId));

    console.log(`🔑 First user ${userId} has been made admin`);
    return true;
  }

  return false;
}

/**
 * Check if a user is an admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const user = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user[0]?.isAdmin ?? false;
}
