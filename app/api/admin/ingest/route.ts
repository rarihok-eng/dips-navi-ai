import fs from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/auth/admin";
import { MANUAL_SOURCES, type ManualSource } from "@/lib/ingest/manifest";
import { ingestManualSources } from "@/lib/ingest/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function encodeSse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

async function loadSources(): Promise<ManualSource[]> {
  const generatedPath = path.join(
    /* turbopackIgnore: true */ process.cwd(),
    "manifest.generated.json",
  );
  try {
    const raw = await fs.readFile(generatedPath, "utf-8");
    const parsed = JSON.parse(raw) as ManualSource[];
    if (parsed.length > 0) return parsed;
  } catch {
    // fallback
  }
  return MANUAL_SOURCES;
}

export async function POST() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return new Response(JSON.stringify({ error: admin.message }), {
      status: admin.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sources = await loadSources();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await ingestManualSources(sources, (event) => {
          controller.enqueue(encoder.encode(encodeSse("progress", event)));
        });

        controller.enqueue(
          encoder.encode(
            encodeSse("complete", {
              totalChunks: result.totalChunks,
              errors: result.errors,
            }),
          ),
        );
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            encodeSse("error", {
              message:
                error instanceof Error ? error.message : "Ingestion failed",
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
