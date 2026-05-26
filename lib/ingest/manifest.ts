export type ManualSource = {
  manualName: string;
  category: string;
  portalPage: string;
  pdfUrl: string;
  manualSlug: string;
};

export const PORTAL_PAGES = [
  "https://www.ossportal.dips.mlit.go.jp/portal/manual/",
  "https://www.uapc.dips.mlit.go.jp/contents/lic/manual.html",
  "https://www.uac.dips.mlit.go.jp/contents/drn/manual.html",
];

export const MANUAL_SOURCES: ManualSource[] = [
  {
    manualSlug: "account-create",
    manualName: "アカウント作成手順",
    category: "account",
    portalPage: "https://www.ossportal.dips.mlit.go.jp/portal/manual/",
    pdfUrl:
      "https://www.ossportal.dips.mlit.go.jp/portal/manual/download/account_create_manual.pdf",
  },
  {
    manualSlug: "registration-ja",
    manualName:
      "登録機能（無人航空機の新規登録・変更・更新等）およびDIPS APPの使い方（日本語）",
    category: "registration",
    portalPage: "https://www.ossportal.dips.mlit.go.jp/portal/manual/",
    pdfUrl:
      "https://www.ossportal.dips.mlit.go.jp/portal/manual/download/registration_manual_ja.pdf",
  },
  {
    manualSlug: "flight-permit-ja",
    manualName:
      "ドローン情報基盤システム操作マニュアル（飛行許可・承認申請・日本語）",
    category: "flight-permit",
    portalPage: "https://www.ossportal.dips.mlit.go.jp/portal/manual/",
    pdfUrl:
      "https://www.ossportal.dips.mlit.go.jp/portal/manual/download/flight_permit_manual_ja.pdf",
  },
  {
    manualSlug: "flight-plan-ja",
    manualName: "ドローン情報基盤システム操作マニュアル（飛行計画通報・日本語）",
    category: "flight-plan",
    portalPage: "https://www.ossportal.dips.mlit.go.jp/portal/manual/",
    pdfUrl:
      "https://www.ossportal.dips.mlit.go.jp/portal/manual/download/flight_plan_manual_ja.pdf",
  },
  {
    manualSlug: "incident-report-ja",
    manualName: "ドローン情報基盤システム操作マニュアル（事故等報告・日本語）",
    category: "incident-report",
    portalPage: "https://www.ossportal.dips.mlit.go.jp/portal/manual/",
    pdfUrl:
      "https://www.ossportal.dips.mlit.go.jp/portal/manual/download/incident_report_manual_ja.pdf",
  },
  {
    manualSlug: "aircraft-certification",
    manualName: "機体認証手続きマニュアル",
    category: "aircraft-certification",
    portalPage: "https://www.uac.dips.mlit.go.jp/contents/drn/manual.html",
    pdfUrl:
      "https://www.uac.dips.mlit.go.jp/contents/drn/manual/download/aircraft_certification_manual.pdf",
  },
];

export function slugifyManualName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function slugFromPdfUrl(pdfUrl: string): string {
  const pathname = decodeURIComponent(new URL(pdfUrl).pathname);
  return slugifyManualName(pathname.replace(/\//g, "-")) || "manual";
}

import {
  BULK_MANUAL_SLUGS,
  deriveManualName,
  resolveManualDisplayName,
} from "@/lib/ingest/manual-names";

export { BULK_MANUAL_SLUGS, deriveManualName, resolveManualDisplayName };

export function isIngestibleManual(source: ManualSource): boolean {
  const url = source.pdfUrl.toLowerCase();
  const name = source.manualName.toLowerCase();

  if (!url.endsWith(".pdf")) return false;
  if (url.match(/[_-]en[_\.-]|[_-]all_en\.pdf|\/en\//)) return false;
  if (name.includes("english") || name.match(/\ben\b/)) return false;
  if (url.includes("stat.go.jp")) return false;
  if (url.match(/mlit\.go\.jp\/common\/\d+\.pdf$/)) return false;

  return url.includes("dips.mlit.go.jp") || url.includes("mlit.go.jp/");
}

export function normalizeManualSource(
  link: Pick<ManualSource, "portalPage" | "pdfUrl"> & { title?: string },
): ManualSource | null {
  const manualName = deriveManualName(link.title ?? "", link.pdfUrl);
  const source: ManualSource = {
    manualName,
    category: guessCategory(manualName, link.pdfUrl),
    portalPage: link.portalPage,
    pdfUrl: link.pdfUrl,
    manualSlug: slugFromPdfUrl(link.pdfUrl),
  };

  return isIngestibleManual(source) ? source : null;
}

function guessCategory(title: string, pdfUrl: string): string {
  const text = `${title} ${pdfUrl}`;
  if (text.includes("アカウント") || text.includes("Account")) return "account";
  if (text.includes("REG") || text.includes("登録")) return "registration";
  if (text.includes("FPA") || text.includes("飛行許可") || text.includes("承認")) {
    return "flight-permit";
  }
  if (text.includes("FPR") || text.includes("飛行計画") || text.includes("通報")) {
    return "flight-plan";
  }
  if (text.includes("IR") || text.includes("事故") || text.includes("報告")) {
    return "incident-report";
  }
  if (
    text.includes("機体認証") ||
    text.includes("UAC") ||
    text.includes("ACA") ||
    text.includes("TAA")
  ) {
    return "aircraft-certification";
  }
  if (text.includes("技能証明") || text.includes("LCA") || text.includes("lic")) {
    return "license";
  }
  return "general";
}
