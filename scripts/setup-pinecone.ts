import { config } from "dotenv";
import { Pinecone } from "@pinecone-database/pinecone";
import {
  EMBEDDING_DIMENSION,
  getPineconeIndexName,
} from "../lib/config/models";

config({ path: ".env.local" });
config();

async function waitForReady(
  pc: Pinecone,
  indexName: string,
  maxAttempts = 30,
) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const index = await pc.describeIndex(indexName);
    const state = index.status?.state;
    console.log(`  status: ${state ?? "unknown"} (${attempt}/${maxAttempts})`);

    if (state === "Ready") return index;
    if (state === "Failed") {
      throw new Error(`Index "${indexName}" creation failed`);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error(`Index "${indexName}" did not become ready in time`);
}

async function main() {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    throw new Error("PINECONE_API_KEY is not set");
  }

  const indexName = getPineconeIndexName();
  const cloud = process.env.PINECONE_CLOUD ?? "aws";
  const region = process.env.PINECONE_REGION ?? "us-east-1";

  const pc = new Pinecone({ apiKey });

  const existing = await pc.listIndexes();
  const found = existing.indexes?.find((index) => index.name === indexName);

  if (found) {
    console.log(
      `Index "${indexName}" already exists (dimension: ${found.dimension}, state: ${found.status?.state}).`,
    );
    return;
  }

  console.log(
    `Creating index "${indexName}" (dimension=${EMBEDDING_DIMENSION}, serverless ${cloud}/${region})...`,
  );

  await pc.createIndex({
    name: indexName,
    dimension: EMBEDDING_DIMENSION,
    metric: "cosine",
    spec: {
      serverless: {
        cloud,
        region,
      },
    },
    waitUntilReady: true,
  });

  const index = await waitForReady(pc, indexName);
  console.log(`Index "${index.name}" is ready. Host: ${index.host}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
