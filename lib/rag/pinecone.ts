import { Pinecone } from "@pinecone-database/pinecone";
import {
  EMBEDDING_DIMENSION,
  getPineconeIndexName,
  PINECONE_NAMESPACE,
  SEARCH_TOP_K,
} from "@/lib/config/models";
import { embedText } from "@/lib/rag/embed";

let pineconeClient: Pinecone | null = null;

function getPinecone(): Pinecone {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error("PINECONE_API_KEY is not set");
    }
    pineconeClient = new Pinecone({ apiKey });
  }
  return pineconeClient;
}

export type ManualChunkMetadata = {
  manualName: string;
  category: string;
  page: number;
  text: string;
  sourceUrl: string;
  chunkIndex: number;
  manualSlug: string;
  sectionTitle?: string;
};

export type RetrievedChunk = ManualChunkMetadata & {
  score: number;
};

export function getPineconeIndex() {
  const indexName = getPineconeIndexName();
  return getPinecone().index(indexName);
}

export async function ensurePineconeIndexExists(): Promise<void> {
  const indexName = getPineconeIndexName();
  try {
    await getPinecone().describeIndex(indexName);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Pinecone error";
    if (message.includes("404")) {
      throw new Error(
        `Pinecone index "${indexName}" が見つかりません。先に npm run setup:pinecone を実行してください。`,
      );
    }
    throw error;
  }
}

export async function upsertChunks(
  vectors: Array<{
    id: string;
    values: number[];
    metadata: ManualChunkMetadata;
  }>,
) {
  await ensurePineconeIndexExists();
  const index = getPineconeIndex();
  const batchSize = 100;

  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await index.namespace(PINECONE_NAMESPACE).upsert({ records: batch });
  }
}

export async function queryManualChunks(
  query: string,
  topK = SEARCH_TOP_K,
): Promise<RetrievedChunk[]> {
  await ensurePineconeIndexExists();
  const index = getPineconeIndex();
  const vector = await embedText(query);

  if (vector.length !== EMBEDDING_DIMENSION) {
    throw new Error(
      `Unexpected embedding dimension: ${vector.length}, expected ${EMBEDDING_DIMENSION}`,
    );
  }

  const result = await index.namespace(PINECONE_NAMESPACE).query({
    vector,
    topK,
    includeMetadata: true,
  });

  return (result.matches ?? [])
    .filter((match) => match.metadata)
    .map((match) => ({
      manualName: String(match.metadata!.manualName),
      category: String(match.metadata!.category ?? "general"),
      page: Number(match.metadata!.page),
      text: String(match.metadata!.text),
      sourceUrl: String(match.metadata!.sourceUrl),
      chunkIndex: Number(match.metadata!.chunkIndex),
      manualSlug: String(match.metadata!.manualSlug),
      sectionTitle: match.metadata!.sectionTitle
        ? String(match.metadata!.sectionTitle)
        : undefined,
      score: match.score ?? 0,
    }));
}
