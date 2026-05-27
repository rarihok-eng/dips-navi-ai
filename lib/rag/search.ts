import { getChatModel } from "@/lib/rag/embed";
import { buildRagPrompt } from "@/lib/rag/prompt";
import { queryManualChunks } from "@/lib/rag/pinecone";
import { enrichSearchResults } from "@/lib/search/resolve-cited-page-titles";

export async function searchManuals(query: string) {
  const chunks = await queryManualChunks(query);
  const { sources, materials, pageTitleCache } =
    await enrichSearchResults(chunks);
  const prompt = buildRagPrompt(query, chunks);

  return { chunks, prompt, sources, materials, pageTitleCache };
}

export async function streamManualAnswer(query: string) {
  const { chunks, prompt, sources, materials, pageTitleCache } =
    await searchManuals(query);
  const model = getChatModel();
  const streamResult = await model.generateContentStream(prompt);

  return {
    stream: streamResult.stream,
    sources,
    materials,
    chunks,
    pageTitleCache,
  };
}
