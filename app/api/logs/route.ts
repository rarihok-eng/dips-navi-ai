import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { listSearchLogs, saveSearchLog } from "@/lib/db/logs";

const postSchema = z.object({
  query: z.string().min(1),
  answer: z.string().min(1),
  sources: z.array(
    z.object({
      manualName: z.string(),
      page: z.number().int().positive(),
      sourceUrl: z.string().url().optional(),
      excerpt: z.string().optional(),
    }),
  ),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const logs = await listSearchLogs(userId);
    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Failed to list logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch search logs" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const log = await saveSearchLog(userId, parsed.data);
    return NextResponse.json({ log });
  } catch (error) {
    console.error("Failed to save log:", error);
    return NextResponse.json(
      { error: "Failed to save search log" },
      { status: 500 },
    );
  }
}
