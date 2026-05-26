export type SupportResource = {
  label: string;
  description: string;
  href: string;
};

/** Official URLs verified against MLIT / DIPS2.0 domains (see lib/ingest/manifest.ts). */
export const SUPPORT_RESOURCES: SupportResource[] = [
  {
    label: "DIPS2.0 ログイン",
    description: "公式ポータルからログインして申請状況を確認",
    href: "https://www.dips-reg.mlit.go.jp/",
  },
  {
    label: "DIPS マニュアル一覧",
    description: "国交省公開の操作マニュアル（PDF）",
    href: "https://www.ossportal.dips.mlit.go.jp/portal/manual/",
  },
  {
    label: "国土交通省 DIPS 公式ページ",
    description: "制度・法令・お知らせなどの公式情報",
    href: "https://www.mlit.go.jp/koku/koku_ua_dips.html",
  },
];

export const SUPPORT_FOOTER_NOTE =
  "本ツールの回答で解決しない場合は、上記の公式マニュアル・公式サイトで最新情報をご確認ください。";
