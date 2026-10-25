import Link from "next/link"
import { BookOpen } from "lucide-react"
import { Toaster } from "@/components/ui/sonner"

function Brand() {
  return (
    <Link href="/" className="inline-flex w-fit items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <BookOpen className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-lg font-bold tracking-tight text-foreground">StudyNia</span>
        <span className="block text-xs text-muted-foreground">Your learning space</span>
      </span>
    </Link>
  )
}

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <main className="relative isolate grid min-h-svh overflow-hidden bg-background text-foreground lg:grid-cols-2">
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 -top-44 -z-10 h-[34rem] w-[34rem] rounded-full bg-primary/10 blur-3xl" />

      <aside className="relative hidden flex-col justify-between border-r border-border/70 bg-muted/20 px-10 py-10 lg:flex xl:px-16">
        <Brand />
        <div className="mx-auto w-full max-w-lg py-12">
          <p className="mb-4 text-sm font-medium text-primary">A calmer way to study</p>
          <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
            Bring your learning into focus.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">
            Keep course materials, notes, practice, and progress connected in one workspace built for your studies.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Learn at your pace. Pick up where you left off.</p>
      </aside>

      <section className="relative flex min-h-svh items-center justify-center px-4 sm:px-8 lg:px-12">
        <div className="absolute left-5 top-5 lg:hidden"><Brand /></div>
        <div className="w-full max-w-full pt-12 lg:pt-0">
          <Toaster />
          {children}
        </div>
      </section>
    </main>
  )
}