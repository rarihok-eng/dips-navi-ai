import { config } from "dotenv";
config({ path: ".env.local" });

import { inferSectionTitleFromPageText } from "../lib/search/infer-section-title";
import { queryManualChunks } from "../lib/rag/pinecone";
import { extractSourcesFromChunks } from "../lib/rag/prompt";

const samples = [
  "P.01-19 06.Step2：無人航空機情報を登録する (11/11) 登録記号を入力",
  "06 . Step 2 ： 無人航空機情報を登録する (4/11)",
];

async function main() {
  console.log("=== inference samples ===");
  for (const sample of samples) {
    console.log("OUT:", inferSectionTitleFromPageText(sample));
  }

  console.log("\n=== pinecone query ===");
  const chunks = await queryManualChunks("機体登録 登録記号 重複 エラー", 10);
  console.log("chunks:", chunks.length);
  for (const chunk of chunks) {
    const inferred = inferSectionTitleFromPageText(chunk.text);
    console.log(`P.${chunk.page} meta=${chunk.sectionTitle ?? "NONE"} inferred=${inferred ?? "NONE"}`);
    if (!inferred && !chunk.sectionTitle) {
      console.log("  text:", chunk.text.slice(0, 300).replace(/\n/g, " | "));
    }
  }

  const sources = extractSourcesFromChunks(chunks);
  console.log("\n=== sources ===");
  for (const source of sources) {
    console.log(
      `P.${source.page} sectionTitle=${source.sectionTitle ?? "NONE"}`,
    );
  }
}

main().catch(console.error);
