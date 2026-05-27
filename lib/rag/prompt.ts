import type { RetrievedChunk } from "@/lib/rag/pinecone";
import { getDipsOperatorContext } from "@/lib/rag/dips-context";
import { resolveManualDisplayName } from "@/lib/ingest/manual-names";
import { resolveSectionTitle } from "@/lib/search/infer-section-title";
import { dedupeSearchSources } from "@/lib/search/dedupe-sources";
import type { SearchMaterial, SearchSource } from "@/lib/types/search";

function truncateExcerpt(text: string, maxLength = 120): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}…`;
}

export function buildRagPrompt(query: string, chunks: RetrievedChunk[]): string {
  const context = chunks
    .map(
      (chunk, index) =>
        `[PDF資料${index + 1}（資料${index + 1}）]\nマニュアル名: ${resolveManualDisplayName(chunk.sourceUrl, chunk.manualName)}${chunk.sectionTitle ? `\nセクション: ${chunk.sectionTitle}` : ""}\nページ: P.${chunk.page}\n本文:\n${chunk.text}`,
    )
    .join("\n\n---\n\n");

  const dipsContext = getDipsOperatorContext();

  return `あなたはDIPS（ドローン情報基盤システム）マニュアルの検索補助AI「DIPSナビAI」です。
オペレーターからの問い合わせに対し、提供されたマニュアル抜粋を主根拠とし、DIPS補足知識で回答を詳細化してください。

## 厳守事項
1. 回答には必ず以下7セクションを含めること:
   - **参照マニュアル名**（『』で囲む。資料から特定できるもののみ）
   - **該当ページ数**（例: P.15）
   - **質問タイプ**（error / how_to / term / eligibility / general のいずれか1行のみ）
   - **次にやること**（具体的な最初の1アクション。資料N P.xx は付けない）
   - **かんたん要約**（初心者向け。3〜5文で平易な言葉。重要な注意・エラー・不可事項を明記）
   - **回答ヒント**（マニュアル手順に基づく内容のみ）
   - **DIPS補足**（制度・用語・顧客説明の背景。マニュアル外は「※DIPS補足」と明記）
2. 「回答ヒント」は提供コンテキスト（マニュアル抜粋）に根拠がある内容のみ。推測しない。
3. 「DIPS補足」は下記のDIPS補足知識から、質問に関連する一般情報を要約して記載する。マニュアルと矛盾する場合はマニュアルを優先する。
4. 該当箇所を特定できない場合はその旨を明記する。
5. 最終確認は公式マニュアルで行うよう、必要に応じて一言添える。
6. 日本語で簡潔かつ実用的に回答する。
7. 「かんたん要約」は必ず以下2行ラベルで書くこと:
   【原因】2〜4文で記載。第1文の冒頭で **未入力・不備・入力ミス・重複** など、具体的な原因種別を明示すること（例: 「主な原因は、追加基準の**未入力**または入力内容の**不備**です。」）。専門用語は括弧で短く説明する。
   【修正場所】1〜2文で、DIPSの画面名・項目名を具体的に（例: 「飛行許可申請画面の追加基準入力欄」）
   - 根拠ページは【修正場所】行末に \`（資料N P.xx）\` を付ける（PDFリンク用。資料N = 参照マニュアル抜粋のPDF通し番号）
8. 「次にやること」は具体的な1アクションを1文で書くこと。
   - 「エラーメッセージを確認してください」だけの抽象的な文は禁止
   - \`（資料N P.xx）\` は付けない（PDFリンクは要約・回答ヒント側で付与）
   - 例: 「飛行許可申請画面を開き、追加基準タブの未入力項目を入力してください。」
9. エラー・不可・却下・必須・期限など重要事項は、かんたん要約と回答ヒントの両方で明確に書くこと。
10. 「回答ヒント」の手順は必ず番号付きリスト（1. 2. …）とし、各行末に根拠を付けること: \`（資料N P.xx）\`
   - 例: \`1. DIPSにログインします。（資料1 P.12）\`
   - 資料N は上記「参照マニュアル抜粋」の [PDF資料N] と一致させること（画面では公式PDF名と対応付けて表示される）
   - 手順ごとに主たる根拠ページを1つ指定すること
11. 質問タイプ別の回答重点:
   - error: 【原因】で未入力・不備・入力ミスを明示 → 【修正場所】で具体的画面・項目 → 次にやることでエラー確認
   - how_to: 【原因】で必要な前提 → 【修正場所】で操作画面 → 次にやることで最初の手順
   - term: 【原因】で用語の意味 → 【修正場所】で関連手続き → 次にやることで確認すべきこと
   - eligibility: 【原因】で可否の理由 → 【修正場所】で確認画面 → 次にやることで結論確認
   - general: 上記に当てはまらない場合
12. 注意・警告・不可・期限・必須・エラー原因は \`**太字**\` で囲むこと。一般名詞（「飛行許可申請」等）を無差別に太字にしない。
13. 質問タイプが term の場合、用語ミニ辞書の平易説明をベースに回答すること。

${dipsContext}

## 参照マニュアル抜粋
${context || "（関連する抜粋が見つかりませんでした）"}

## オペレーターの質問
${query}

## 回答形式（見出しを含める）
### 参照マニュアル
### 該当ページ
### 質問タイプ
### 次にやること
### かんたん要約
（【原因】と【修正場所】の2行ラベル形式で記載）
### 回答ヒント
### DIPS補足`;
}

function pageKey(sourceUrl: string, page: number): string {
  return `${sourceUrl}#${page}`;
}

function buildSectionTitleByPage(
  chunks: RetrievedChunk[],
  pageTitleCache?: Map<string, string>,
): Map<string, string> {
  const titles = new Map<string, string>();

  if (pageTitleCache) {
    for (const [key, title] of pageTitleCache) {
      titles.set(key, title);
    }
  }

  for (const chunk of chunks) {
    const title = resolveSectionTitle(chunk.sectionTitle, chunk.text);
    if (!title) continue;

    const key = pageKey(chunk.sourceUrl, chunk.page);
    const existing = titles.get(key);
    if (!existing || title.length > existing.length) {
      titles.set(key, title);
    }
  }

  return titles;
}

export function extractSourcesFromChunks(
  chunks: RetrievedChunk[],
  pageTitleCache?: Map<string, string>,
): SearchSource[] {
  const sectionTitleByPage = buildSectionTitleByPage(chunks, pageTitleCache);
  const sorted = [...chunks].sort((a, b) => b.score - a.score);
  const sources: SearchSource[] = sorted.map((chunk) => ({
    manualName: resolveManualDisplayName(chunk.sourceUrl, chunk.manualName),
    manualSlug: chunk.manualSlug,
    page: chunk.page,
    sourceUrl: chunk.sourceUrl,
    excerpt: truncateExcerpt(chunk.text),
    sectionTitle:
      sectionTitleByPage.get(pageKey(chunk.sourceUrl, chunk.page)) ??
      resolveSectionTitle(chunk.sectionTitle, chunk.text),
  }));

  return dedupeSearchSources(sources);
}

export function extractMaterialsFromChunks(
  chunks: RetrievedChunk[],
  pageTitleCache?: Map<string, string>,
): SearchMaterial[] {
  const sectionTitleByPage = buildSectionTitleByPage(chunks, pageTitleCache);

  return chunks.map((chunk, index) => ({
    index: index + 1,
    manualName: resolveManualDisplayName(chunk.sourceUrl, chunk.manualName),
    page: chunk.page,
    sourceUrl: chunk.sourceUrl,
    manualSlug: chunk.manualSlug,
    sectionTitle:
      sectionTitleByPage.get(pageKey(chunk.sourceUrl, chunk.page)) ??
      resolveSectionTitle(chunk.sectionTitle, chunk.text),
  }));
}
