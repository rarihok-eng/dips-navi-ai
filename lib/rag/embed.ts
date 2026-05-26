import {
  EMBEDDING_DIMENSION,
  EMBEDDING_MODEL,
  CHAT_MODEL,
} from "@/lib/config/models";
import { GoogleGenerativeAI } from "@google/generative-ai";

type EmbedTaskType = "RETRIEVAL_QUERY" | "RETRIEVAL_DOCUMENT";

const EMBED_DELAY_MS = 700;
const MAX_RETRIES = 6;

let genAI: GoogleGenerativeAI | null = null;

function getApiKey(): string {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
  }
  return apiKey;
}

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(getApiKey());
  }
  return genAI;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeVector(values: number[]): number[] {
  const norm = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  if (norm === 0) return values;
  return values.map((value) => value / norm);
}

export class DailyQuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DailyQuotaExceededError";
  }
}

function isDailyQuotaError(status: number, errorBody: string): boolean {
  return (
    status === 429 &&
    errorBody.includes("EmbedContentRequestsPerDayPerUserPerProjectPerModel-FreeTier")
  );
}

function parseRetryDelayMs(errorBody: string): number {
  try {
    const parsed = JSON.parse(errorBody) as {
      error?: {
        details?: Array<{ retryDelay?: string; "@type"?: string }>;
      };
    };
    const retryInfo = parsed.error?.details?.find((detail) =>
      detail["@type"]?.includes("RetryInfo"),
    );
    if (retryInfo?.retryDelay) {
      const seconds = Number.parseFloat(retryInfo.retryDelay.replace("s", ""));
      if (!Number.isNaN(seconds)) {
        return Math.ceil(seconds * 1000) + 1000;
      }
    }
  } catch {
    // ignore parse errors
  }
  return 25000;
}

async function callEmbedApi(
  text: string,
  taskType: EmbedTaskType,
): Promise<number[]> {
  let lastError = "Unknown embedding error";

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": getApiKey(),
        },
        body: JSON.stringify({
          content: {
            parts: [{ text }],
          },
          taskType,
          outputDimensionality: EMBEDDING_DIMENSION,
        }),
      },
    );

    if (response.status === 429) {
      const errorBody = await response.text();
      if (isDailyQuotaError(response.status, errorBody)) {
        throw new DailyQuotaExceededError(
          "Gemini embedding の1日無料枠（1000リクエスト）に達しました。明日 npm run ingest を再実行してください。",
        );
      }
      lastError = `Gemini embedding failed (429): ${errorBody}`;
      const delay = parseRetryDelayMs(errorBody);
      console.warn(
        `Embedding rate limited. Retry ${attempt}/${MAX_RETRIES} in ${delay}ms...`,
      );
      await sleep(delay);
      continue;
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Gemini embedding failed (${response.status}): ${errorBody}`,
      );
    }

    const data = (await response.json()) as {
      embedding?: { values?: number[] };
    };

    const values = data.embedding?.values;
    if (!values?.length) {
      throw new Error("Gemini embedding returned empty vector");
    }

    if (values.length !== EMBEDDING_DIMENSION) {
      throw new Error(
        `Unexpected embedding dimension: ${values.length}, expected ${EMBEDDING_DIMENSION}`,
      );
    }

    return normalizeVector(values);
  }

  throw new Error(lastError);
}

export async function embedText(text: string): Promise<number[]> {
  return callEmbedApi(text, "RETRIEVAL_QUERY");
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (const text of texts) {
    embeddings.push(await callEmbedApi(text, "RETRIEVAL_DOCUMENT"));
    await sleep(EMBED_DELAY_MS);
  }

  return embeddings;
}

export function getChatModel() {
  return getGenAI().getGenerativeModel({ model: CHAT_MODEL });
}
