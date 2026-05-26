export type GlossaryEntry = {
  term: string;
  plain: string;
  relatedProcedures: string[];
};

export const TERM_GLOSSARY: GlossaryEntry[] = [
  {
    term: "DIPS2.0",
    plain:
      "国土交通省が運用する無人航空機のオンライン手続きシステム。アカウント開設後、ログインして各種申請・通報を行う。",
    relatedProcedures: ["アカウント開設", "機体登録", "飛行許可申請", "飛行計画通報"],
  },
  {
    term: "DIPS",
    plain:
      "ドローン情報基盤システム。無人航空機の登録・許可・通報などをオンラインで行う国交省の情報基盤。",
    relatedProcedures: ["アカウント開設", "機体登録"],
  },
  {
    term: "機体登録",
    plain:
      "250g以上等の条件を満たす無人航空機をDIPS上で登録する手続。所有者情報と機体情報を登録し、更新が必要。",
    relatedProcedures: ["機体登録申請", "機体登録情報変更"],
  },
  {
    term: "機体認証",
    plain:
      "個々の無人航空機の安全性能を国が認める制度（UAC）。型式認証とは別の手続。",
    relatedProcedures: ["機体認証の新規申請", "機体認証の更新申請"],
  },
  {
    term: "型式認証",
    plain:
      "無人航空機の型式（設計・性能）を国が認める制度。量産機などに関係する。",
    relatedProcedures: ["型式認証の新規申請", "型式認証の更新申請"],
  },
  {
    term: "技能証明",
    plain:
      "操縦者の技能・知識を国が認める資格（LCA）。一等・二等があり、申請・更新・再交付などの手続がある。",
    relatedProcedures: ["技能証明の新規申請", "技能証明書の新規交付"],
  },
  {
    term: "FPA",
    plain:
      "飛行許可・承認申請。条例・法規上、許可や承認が必要な飛行を事前に申請する手続。",
    relatedProcedures: ["飛行許可・承認申請"],
  },
  {
    term: "FPR",
    plain:
      "飛行計画通報。許可・承認を受けた飛行について、飛行前に計画を通報する手続（期限あり）。",
    relatedProcedures: ["飛行計画通報"],
  },
  {
    term: "登録免許税",
    plain:
      "許可・承認・証明書交付などの手続きに必要な国税。Pay-easyや税務署で納付する。",
    relatedProcedures: ["技能証明書の新規交付", "飛行許可・承認申請"],
  },
  {
    term: "eKYC",
    plain:
      "オンライン本人確認。マイナンバーカード等を使い、自宅から本人確認を行う方法。",
    relatedProcedures: ["アカウント開設", "本人確認"],
  },
  {
    term: "Pay-easy",
    plain:
      "登録免許税などを銀行ATMやインターネットバンキングで納付できる仕組み。",
    relatedProcedures: ["登録免許税の納付"],
  },
  {
    term: "代理人",
    plain:
      "本人に代わってDIPS上の手続きを行う人。依頼・解除の手続が別途必要。",
    relatedProcedures: ["代理人への手続依頼", "代理人による申請"],
  },
];

export function formatGlossaryForPrompt(): string {
  const lines = TERM_GLOSSARY.map(
    (entry) =>
      `- **${entry.term}**: ${entry.plain}（関連: ${entry.relatedProcedures.join("、")}）`,
  );
  return `### 用語ミニ辞書（平易説明）
用語質問（term）では以下を優先参照し、他タイプでも初出の専門用語には括弧書きで短く補足する。

${lines.join("\n")}`;
}
