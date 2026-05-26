import { auth } from "@clerk/nextjs/server";

export async function requireAdmin() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return { ok: false as const, status: 401, message: "Unauthorized" };
  }

  const role = (sessionClaims?.publicMetadata as { role?: string } | undefined)
    ?.role;

  if (role !== "admin") {
    return { ok: false as const, status: 403, message: "Forbidden" };
  }

  return { ok: true as const, userId };
}
