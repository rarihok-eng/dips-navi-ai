type ResultHeaderProps = {
  query: string;
};

export function ResultHeader({ query }: ResultHeaderProps) {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        「{query}」の検索結果
      </h1>
      <p className="text-sm text-muted-foreground">
        以下はマニュアルに基づく回答ヒントです。最終確認は公式マニュアルで行ってください。
      </p>
    </header>
  );
}
