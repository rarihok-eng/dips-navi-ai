import { getChatModel } from "@/lib/rag/embed";
import {
  extractSourcesFromChunks,
  buildRagPrompt,
} from "@/lib/rag/prompt";
import { queryManualChunks } from "@/lib/rag/pinecone";

export async function searchManuals(query: string) {
  const chunks = await queryManualChunks(query);
  const prompt = buildRagPrompt(query, chunks);
  const sources = extractSourcesFromChunks(chunks);

  return { chunks, prompt, sources };
}

export async function streamManualAnswer(query: string) {
  const { chunks, prompt, sources } = await searchManuals(query);
  const model = getChatModel();
  const streamResult = await model.generateContentStream(prompt);

  return {
    stream: streamResult.stream,
    sources,
    chunks,
  };
}
