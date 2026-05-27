import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { SafeSignInButton } from "@/components/auth/safe-sign-in-button";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-16 sm:px-6">
      <section className="space-y-4 text-center">
        <p className="text-sm font-medium text-primary">DIPS Manual AI Search</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          DIPSナビAI
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          国土交通省が公開しているDIPS（ドローン情報基盤システム）のマニュアル群を検索し、
          オペレーターの問い合わせに対して「どのマニュアルの何ページを参照すべきか」と回答ヒントを提示します。
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Show when="signed-in">
            <Link href="/search" className={cn(buttonVariants({ size: "lg" }))}>
              マニュアルを検索する
            </Link>
          </Show>
          <Show when="signed-out">
            <SafeSignInButton size="lg">ログインして検索へ</SafeSignInButton>
          </Show>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            title: "一問一答検索",
            body: "Google検索のように質問を1発入力。対話履歴は引き継ぎません。",
          },
          {
            title: "根拠の明示",
            body: "参照マニュアル名・該当ページ・オペレーター向けヒントを必ず表示。",
          },
          {
            title: "検索履歴",
            body: "過去の調査内容をサイドバーからいつでも振り返れます。",
          },
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle className="text-base">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {item.body}
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
