import type { ManualSource } from "@/lib/ingest/manifest";

const CATEGORY_LABELS: Record<string, string> = {
  account: "アカウント",
  registration: "登録",
  "flight-permit": "飛行許可・承認申請",
  "flight-plan": "飛行計画通報",
  "incident-report": "事故報告",
  "aircraft-certification": "機体認証",
  license: "技能証明",
  general: "一般",
};

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function buildEmbeddingText(
  source: Pick<ManualSource, "manualName" | "category">,
  page: number,
  chunkText: string,
  sectionTitle?: string,
): string {
  const categoryLabel = getCategoryLabel(source.category);

  const header = [
    `マニュアル名: ${source.manualName}`,
    `カテゴリ: ${categoryLabel}`,
    `ページ: P.${page}`,
  ];

  if (sectionTitle) {
    header.push(`セクション: ${sectionTitle}`);
  }

  return [...header, "", chunkText].join("\n");
}
