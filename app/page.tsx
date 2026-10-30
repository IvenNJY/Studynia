import Link from "next/link";
import Image from "next/image";
import { Hero } from "@/components/hero";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col bg-background">
      <header className="w-full border-b border-border/70">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-8 lg:px-10">
          <Link href="/" aria-label="Studynia home" className="inline-flex items-center">
            <Image src="/logo 1.png" alt="Studynia logo" width={32} height={32} className="mr-2" />
          </Link>

          <nav aria-label="Account" className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/auth/login"
              className="inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Login
            </Link>
            <Link
              href="/auth/sign-up"
              className="inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <div className="w-full flex-1">
        <Hero />
      </div>

      <footer className="w-full border-t border-border/70 bg-muted/20">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8 sm:py-12 lg:px-10">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <Link href="/" aria-label="Studynia home" className="inline-flex items-center">
                <Image src="/logo 1.png" alt="Studynia logo" width={32} height={32} className="mr-2" />
              </Link>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                Your AI-powered academic workspace for learning, practice, and progress.
              </p>
            </div>

            <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-muted-foreground">
              <a href="#features" className="transition-colors hover:text-foreground">Features</a>
              <Link href="/auth/login" className="transition-colors hover:text-foreground">Login</Link>
              <Link href="/auth/sign-up" className="transition-colors hover:text-foreground">Sign up</Link>
              <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
              <Link href="/terms" className="transition-colors hover:text-foreground">Terms</Link>
            </nav>
          </div>

          <div className="mt-8 flex flex-col gap-2 border-t border-border/70 pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Studynia</p>
            <p>Built to make every study session count.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
