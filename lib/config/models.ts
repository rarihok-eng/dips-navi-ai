export const CHAT_MODEL = "gemini-2.5-flash";
export const EMBEDDING_MODEL = "gemini-embedding-001";
export const PINECONE_NAMESPACE = "dips-manuals";
export const EMBEDDING_DIMENSION = 768;

/** Long-paragraph split: prefer breaking at 「。」 above this threshold. */
export const CHUNK_MIN_SIZE = 400;
/** Target max characters per chunk (Japanese manuals). */
export const CHUNK_MAX_SIZE = 1800;
/** Overlap between consecutive chunks to preserve boundary context. */
export const CHUNK_OVERLAP = 200;
/** Chunks shorter than this are merged with neighbors; otherwise discarded. */
export const CHUNK_MIN_LENGTH = 30;
/** Max characters stored in Pinecone metadata `text`. */
export const METADATA_TEXT_MAX = 8000;
export const SEARCH_TOP_K = 10;

export function getPineconeIndexName(): string {
  const index = process.env.PINECONE_INDEX;
  if (!index) {
    throw new Error("PINECONE_INDEX is not set");
  }
  return index;
}

export function getDynamoTableName(): string {
  return process.env.DYNAMODB_TABLE_NAME ?? "DipsNavi-Logs";
}
