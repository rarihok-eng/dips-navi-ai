const FILENAME_LABELS: Record<string, string> = {
  "DIPS-REG-Manual_Ja_Owner_Open-Account.pdf": "アカウント作成手順",
  "DIPS-REG-Manual_Ja_Owner_Change-Account.pdf": "アカウント情報変更手順",
  "DIPS-REG-Manual_Ja_Owner_Read-Card.pdf":
    "マイナンバーカードの券面情報を読み取る方法",
  "DIPS-Manual_FPA_ALL_Ja.pdf":
    "ドローン情報基盤システム操作マニュアル（飛行許可・承認申請・日本語）",
  "DIPS-Manual_FPR_ALL_Ja.pdf":
    "ドローン情報基盤システム操作マニュアル（飛行計画通報・日本語）",
  "DIPS-Manual_IR_ALL_Ja.pdf":
    "ドローン情報基盤システム操作マニュアル（事故等報告・日本語）",
  "DIPS-Manual_LCA_Number_ALL_Ja.pdf":
    "技能証明申請者番号マニュアル一式（一括PDF）",
  "DIPS-Manual_LCA_ALL_Ja.pdf": "技能証明マニュアル一式（一括PDF）",
  "DIPS-Manual_LCA_ALL_Ja_RequestToAg.pdf":
    "技能証明マニュアル一式・代理人依頼（一括PDF）",
  "DIPS-Manual_LCA_Number_ALL_Ja_Ag.pdf":
    "技能証明申請者番号マニュアル一式・代理人向け（一括PDF）",
  "DIPS-Manual_LCA_ALL_Ja_Ag.pdf":
    "技能証明マニュアル一式・代理人向け（一括PDF）",
  "00.DIPS-Manual_COM_JP_ALL_LCA.pdf":
    "技能証明関連マニュアル総合（一括PDF）",
  "00.DIPS-Manual_COM_JP_ALL_LCA_Ag.pdf":
    "技能証明関連マニュアル総合・代理人向け（一括PDF）",
  "DIPS-Manual_TAA_ALL_Ja.pdf": "型式認証マニュアル一式（一括PDF）",
  "DIPS-Manual_ACA_ALL_Ja.pdf": "機体認証マニュアル一式（一括PDF）",
  "DIPS-Manual_ACA_ALL_Ja_Ag.pdf":
    "機体認証マニュアル一式・代理人向け（一括PDF）",
  "00.DIPS-Manual_COM_JP_ALL_ACA.pdf":
    "機体認証関連マニュアル総合（一括PDF）",
  "00.DIPS-Manual_COM_JP_ALL_ACA_Ag.pdf":
    "機体認証関連マニュアル総合・代理人向け（一括PDF）",
};

export const BULK_MANUAL_SLUGS = [
  "contents-lic-preview-dips-manual-lca-number-all-ja-pdf",
  "contents-lic-preview-dips-manual-lca-all-ja-pdf",
  "contents-lic-preview-dips-manual-lca-all-ja-requesttoag-pdf",
  "contents-lic-preview-dips-manual-lca-number-all-ja-ag-pdf",
  "contents-lic-preview-dips-manual-lca-all-ja-ag-pdf",
  "contents-common-preview-00-dips-manual-com-jp-all-lca-pdf",
  "contents-common-preview-00-dips-manual-com-jp-all-lca-ag-pdf",
  "contents-drn-preview-dips-manual-taa-all-ja-pdf",
  "contents-drn-preview-dips-manual-aca-all-ja-pdf",
  "contents-drn-preview-dips-manual-aca-all-ja-ag-pdf",
  "contents-common-preview-00-dips-manual-com-jp-all-aca-pdf",
  "contents-common-preview-00-dips-manual-com-jp-all-aca-ag-pdf",
] as const;

function getPdfFilename(pdfUrl: string): string {
  return decodeURIComponent(new URL(pdfUrl).pathname.split("/").pop() ?? "");
}

export function isBulkDownloadLinkTitle(title: string): boolean {
  const cleaned = title
    .replace(/&emsp;|&nbsp;|&#\d+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return /マニュアル.*一括.*(で)?ダウンロード/i.test(cleaned);
}

export function resolveManualNameFromPdfUrl(pdfUrl: string): string | undefined {
  const filename = getPdfFilename(pdfUrl);
  return FILENAME_LABELS[filename];
}

export function resolveManualDisplayName(
  pdfUrl: string,
  fallbackName: string,
): string {
  const fromFilename = resolveManualNameFromPdfUrl(pdfUrl);
  if (fromFilename) return fromFilename;

  if (isBulkDownloadLinkTitle(fallbackName)) {
    const filename = getPdfFilename(pdfUrl);
    return filename.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ");
  }

  return fallbackName;
}

export function deriveManualName(title: string, pdfUrl: string): string {
  const fromFilename = resolveManualNameFromPdfUrl(pdfUrl);
  if (fromFilename) return fromFilename;

  const cleaned = title
    .replace(/&emsp;|&nbsp;|&#\d+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (isBulkDownloadLinkTitle(cleaned)) {
    const filename = getPdfFilename(pdfUrl);
    return filename.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ");
  }

  if (cleaned.length > 2) {
    return cleaned;
  }

  const filename = getPdfFilename(pdfUrl);
  return filename.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ");
}
