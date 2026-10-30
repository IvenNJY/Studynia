import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function LegalPageLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
          <Link href="/" aria-label="Studynia home" className="inline-flex items-center gap-2">
            <Image src="/logo 1.png" alt="" width={30} height={42} className="h-8 w-auto" />
            <span className="text-sm font-semibold tracking-tight">Studynia</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Back to home
          </Link>
        </div>
      </header>

      <article className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-8 sm:py-16">
        <div className="mb-10 border-b border-border/70 pb-8">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">{description}</p>
        </div>
        <div className="space-y-8 leading-7 text-foreground/90">{children}</div>
      </article>

      <footer className="border-t border-border/70 bg-muted/20">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© 2026 Studynia</p>
          <nav aria-label="Footer" className="flex gap-5">
            <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">Terms</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
