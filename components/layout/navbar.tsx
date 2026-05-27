import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
import { SafeSignInButton } from "@/components/auth/safe-sign-in-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="text-lg text-primary">DIPS</span>
          <span className="text-muted-foreground">ナビAI</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Show when="signed-in">
            <Link href="/search" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              検索
            </Link>
            <UserButton />
          </Show>
          <Show when="signed-out">
            <SafeSignInButton size="sm">ログイン</SafeSignInButton>
          </Show>
        </nav>
      </div>
    </header>
  );
}
