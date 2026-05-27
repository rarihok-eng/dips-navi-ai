import { auth } from "@clerk/nextjs/server";
import { saveSearchLog } from "@/lib/db/logs";
import {
  resolveCitedPageTitleIndex,
} from "@/lib/search/resolve-cited-page-titles";
import { streamManualAnswer } from "@/lib/rag/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encodeSse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let query = "";
  try {
    const body = (await request.json()) as { query?: string };
    query = body.query?.trim() ?? "";
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!query) {
    return new Response(JSON.stringify({ error: "Query is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let answer = "";

      try {
        const {
          stream: geminiStream,
          sources,
          chunks,
          materials,
          pageTitleCache,
        } = await streamManualAnswer(query);

        controller.enqueue(
          encoder.encode(encodeSse("sources", { sources, materials })),
        );

        for await (const chunk of geminiStream) {
          const text = chunk.text();
          if (!text) continue;
          answer += text;
          controller.enqueue(encoder.encode(encodeSse("token", { text })));
        }

        const pageTitleIndex = await resolveCitedPageTitleIndex(
          answer,
          chunks,
          materials,
          sources,
          pageTitleCache,
        );

        const log = await saveSearchLog(userId, {
          query,
          answer,
          sources,
        });

        controller.enqueue(
          encoder.encode(
            encodeSse("done", {
              logId: log?.logId,
              answer,
              sources,
              materials,
              pageTitleIndex,
            }),
          ),
        );
      } catch (error) {
        console.error("Search stream failed:", error);
        controller.enqueue(
          encoder.encode(
            encodeSse("error", {
              message:
                error instanceof Error
                  ? error.message
                  : "Search failed unexpectedly",
            }),
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
