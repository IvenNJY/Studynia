import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle,
  ChevronDown,
  FileText,
  PenTool,
  PieChart,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

const highlights = [
  "Canvas sync",
  "Active recall quizzes",
  "Real-time collaboration",
];

export function Hero() {
  return (
    <div className="flex w-full flex-col items-center selection:bg-primary/20 selection:text-primary">
      {/*
        Smooth scrolling + float keyframes live in CSS so this stays a server
        component (no onClick handlers needed). Motion is disabled for users
        who prefer reduced motion.
      */}
      <style>{`
        html { scroll-behavior: smooth; }
        @keyframes studynia-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes studynia-rise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .studynia-rise { animation: studynia-rise .7s cubic-bezier(.22,1,.36,1) both; }
        .studynia-float { animation: studynia-float 7s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          .studynia-rise, .studynia-float { animation: none; }
        }
      `}</style>

      {/* ───────────────────────── HERO ───────────────────────── */}
      <section className="relative mx-auto flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-4 pb-14 pt-24 text-center sm:px-6 sm:pt-28 lg:pb-20 lg:pt-32">
        {/* Ambient grid + glows */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808014_1px,transparent_1px),linear-gradient(to_bottom,#80808014_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_70%_55%_at_50%_0%,#000_60%,transparent_100%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[18%] -z-10 h-[260px] w-[90vw] max-w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[110px] sm:h-[340px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-1/2 -z-10 hidden h-72 w-72 rounded-full b lg:block"
        />

        {/* Badge */}
        <a
          href="#features"
          className="studynia-rise group mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-medium text-primary shadow-sm transition-colors hover:bg-primary/10 sm:mb-8 sm:text-sm"
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
          <span className="truncate">Your AI-powered academic workspace</span>
          <ArrowRight className="hidden h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 sm:block" />
        </a>

        {/* Headline */}
        <h1
          className="studynia-rise max-w-4xl text-balance text-[2.5rem] font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-6xl lg:text-7xl"
          style={{ animationDelay: "80ms" }}
        >
          Your centralized{" "}
          <span className="relative inline-block">
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent">
              student knowledge
            </span>
            <svg
              aria-hidden
              className="absolute -bottom-1.5 left-0 h-2.5 w-full text-primary/40 sm:-bottom-2 sm:h-3"
              viewBox="0 0 200 12"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M2 9.5C50 2.5 150 2.5 198 9.5"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </span>{" "}
          system
        </h1>

        {/* Subheadline */}
        <p
          className="studynia-rise mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg lg:text-xl"
          style={{ animationDelay: "160ms" }}
        >
          Stop jumping between Canvas, AI tools, and siloed note apps. StudyNia
          synchronizes your LMS materials, generates personalized
          self-assessments, and tracks your progress, so you focus on learning,
          not file management.
        </p>

        {/* CTAs */}
        <div
          className="studynia-rise mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:items-center sm:gap-4"
          style={{ animationDelay: "240ms" }}
        >
          <Link
            href="/auth/login"
            className="group inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 sm:text-lg"
          >
            Get started free
            <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center justify-center rounded-full border border-border bg-background/60 px-8 py-3.5 text-base font-medium text-foreground backdrop-blur-sm transition-colors duration-200 hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-lg"
          >
            Explore features
          </a>
        </div>

        {/* Highlights */}
        <ul
          className="studynia-rise mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground sm:mt-8 sm:gap-x-6 sm:text-sm"
          style={{ animationDelay: "320ms" }}
        >
          {highlights.map((h) => (
            <li key={h} className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
              {h}
            </li>
          ))}
        </ul>

        {/* ───── Dashboard preview ───── */}
        <div
          className="studynia-rise relative mx-auto mt-12 w-full max-w-5xl sm:mt-14"
          style={{ animationDelay: "400ms" }}
        >
          {/* Glow behind the window */}
          <div
            aria-hidden
            className="absolute inset-x-8 -bottom-6 -z-10 h-24 rounded-full"
          />

          <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/75 text-left shadow-2xl shadow-primary/10 backdrop-blur-xl sm:rounded-3xl">
            {/* Browser bar */}
            <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/40 px-3 py-2.5 sm:px-5 sm:py-3">
              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-foreground/20 sm:h-3 sm:w-3" />
                <span className="h-2.5 w-2.5 rounded-full bg-foreground/20 sm:h-3 sm:w-3" />
                <span className="h-2.5 w-2.5 rounded-full bg-foreground/20 sm:h-3 sm:w-3" />
              </div>
              <div className="flex min-w-0 items-center gap-2 rounded-full border border-border/50 bg-background/70 px-3 py-1 text-[11px] font-medium text-muted-foreground sm:text-xs">
                <BrainCircuit className="hidden h-3.5 w-3.5 shrink-0 text-primary sm:block" />
                <span className="truncate">
                  studynia.com/
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-primary">
                <RefreshCw className="h-3.5 w-3.5 motion-safe:animate-[spin_4s_linear_infinite]" />
                <span className="hidden sm:inline">LMS synced</span>
              </div>
            </div>

            {/* Panels: 1 col phone → 2 col tablet → 3 col desktop */}
            <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:gap-4 sm:p-5 lg:grid-cols-3">
              {/* Modules */}
              <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-muted/30 p-4">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Canvas modules
                    </span>
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-background p-2.5 shadow-sm">
                      <FileText className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate text-xs font-medium">
                        Week 4: Synaptic Plasticity.pdf
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-lg border border-border/40 bg-background/60 p-2.5 text-muted-foreground">
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="truncate text-xs">
                        Lecture_05_Slides_Annotated.pdf
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
                  <span>Auto-synced 2m ago</span>
                  <span className="font-medium text-primary">12 files</span>
                </div>
              </div>

              {/* AI recall */}
              <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <Sparkles className="h-3.5 w-3.5" /> AI active recall
                    </span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      92% match
                    </span>
                  </div>
                  <p className="mb-2 text-xs font-semibold text-foreground">
                    Q: What role do NMDA receptors play in long-term
                    potentiation?
                  </p>
                  <div className="rounded-lg border border-border/60 bg-background/90 p-2.5 text-xs leading-relaxed text-muted-foreground">
                    They act as coincidence detectors, requiring both glutamate
                    binding and postsynaptic depolarization to expel Mg²⁺
                    ions...
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Card 4 of 15</span>
                  <span className="font-semibold text-primary">
                    Generate quiz →
                  </span>
                </div>
              </div>

              {/* GPA: full width on tablet so the 2-col grid stays balanced */}
              <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-muted/30 p-4 sm:col-span-2 lg:col-span-1">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      GPA
                    </span>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-foreground">
                      3.80
                    </span>
                    <span className="text-xs font-medium text-primary">
                      +0.2 this term
                    </span>
                  </div>
                  <div className="mt-4 flex h-16 items-end gap-2 pt-2 sm:h-20 lg:h-16">
                    <div className="h-[45%] flex-1 rounded-t bg-primary/20" />
                    <div className="h-[60%] flex-1 rounded-t bg-primary/35" />
                    <div className="h-[52%] flex-1 rounded-t bg-primary/50" />
                    <div className="h-[80%] flex-1 rounded-t bg-primary/70" />
                    <div className="h-full flex-1 rounded-t bg-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="studynia-float absolute -left-6 bottom-10 hidden w-44 rounded-2xl border border-border bg-background/95 p-4 shadow-xl backdrop-blur xl:block"
            style={{ animationDelay: "1.2s" }}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold">Mastery</span>
              <span className="font-medium text-primary">+12%</span>
            </div>
            <p className="mt-1 text-2xl font-extrabold">82%</p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
              <div className="h-full w-[82%] rounded-full bg-primary" />
            </div>
          </div>
        </div>

        {/* Scroll cue (hidden on short or small screens) */}
        <a
          href="#features"
          aria-label="Scroll to features"
          className="mt-8 hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inline-flex"
        >
          Scroll to explore
          <ChevronDown className="h-4 w-4 motion-safe:animate-bounce" />
        </a>
      </section>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* ─────────────────────── FEATURES ─────────────────────── */}
      <section
        id="features"
        className="w-full scroll-mt-8 bg-background px-4 py-16 sm:px-6 sm:py-20 lg:py-28"
      >
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 border-b border-border/70 pb-8 sm:mb-12 sm:gap-5 md:flex-row md:items-end md:justify-between md:pb-10">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                <Sparkles className="h-3.5 w-3.5" /> The StudyNia toolkit
              </div>
              <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                From scattered materials to a smarter study rhythm.
              </h2>
            </div>
            <p className="max-w-md text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              One connected workspace for the whole learning loop: gather your
              course content, understand it, practice it, and see your
              progress.
            </p>
          </div>

          {/* 1 col phone → 2 col tablet → 6 col bento on desktop */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-6">
            {/* Sync */}
            <article className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 sm:col-span-2 sm:p-8 lg:col-span-4">
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl transition-opacity group-hover:opacity-80" />
              <div className="relative grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
                <div>
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                    Stay in sync
                  </p>
                  <h3 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    Your courses, all together.
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                    Bring Canvas materials into one organized study
                    space, ready when you are.
                  </p>
                </div>
                <div className="space-y-2 rounded-2xl border border-border/70 bg-background/80 p-3 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between px-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>Recent materials</span>
                    <RefreshCw className="h-3.5 w-3.5 text-primary transition-transform duration-700 group-hover:rotate-180" />
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">
                        Lecture slides · Week 04
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Neuroscience · PDF
                      </p>
                    </div>
                    <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">
                        Module notes · Memory
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Updated just now
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                      Synced
                    </span>
                  </div>
                </div>
              </div>
            </article>

            {/* AI */}
          
            {/* Notes */}
            <article className="group rounded-3xl border border-border/70 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 sm:p-8 lg:col-span-2">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <PenTool className="h-5 w-5" />
              </div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Build together
              </p>
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                Notes that connect ideas.
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Collaborate in real time and link your notes back to the
                material they came from.
              </p>
              <div className="mt-6 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-primary/15 text-[10px] font-bold text-primary">
                  A
                </span>
                <span className="-ml-3 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-primary/25 text-[10px] font-bold text-primary">
                  M
                </span>
                <span className="ml-1 text-xs text-muted-foreground">
                  Your study group, in sync
                </span>
              </div>
            </article>

            {/* Quizzes */}
            <article className="group rounded-3xl border border-border/70 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 sm:p-8 lg:col-span-2">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Target className="h-5 w-5" />
              </div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Practice with purpose
              </p>
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                Turn lessons into recall.
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Generate personalized quizzes from your course content and
                review what you missed.
              </p>
              <div className="mt-6 space-y-2 rounded-xl border border-border/70 bg-muted/30 p-3">
                <div className="flex items-center gap-2 rounded-lg bg-background p-2 text-xs font-medium text-foreground shadow-sm">
                  <CheckCircle className="h-4 w-4 text-primary" /> Review key
                  concepts
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border/50 p-2 text-xs text-muted-foreground">
                  <span className="h-4 w-4 rounded-full border border-border" />{" "}
                  Try a practice question
                </div>
              </div>
            </article>

            {/* Progress: spans full row on tablet so 2-col grid has no orphan */}
            <article className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 sm:col-span-2 sm:p-8 lg:col-span-4">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <PieChart className="h-5 w-5" />
              </div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                See your progress
              </p>
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                Know what to focus on next.
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Track your attempts, spot weak areas, and make your next study
                session count.
              </p>
              <div className="mt-7 flex h-32 items-end gap-2 rounded-xl border border-border/60 bg-muted/30 px-4 pt-3">
                <div className="h-[38%] flex-1 rounded-t bg-primary/25 transition-all duration-500 group-hover:h-[48%]" />
                <div className="h-[55%] flex-1 rounded-t bg-primary/35 transition-all duration-500 group-hover:h-[65%]" />
                <div className="h-[48%] flex-1 rounded-t bg-primary/45 transition-all duration-500 group-hover:h-[60%]" />
                <div className="h-[74%] flex-1 rounded-t bg-primary/65 transition-all duration-500 group-hover:h-[85%]" />
                <div className="h-full flex-1 rounded-t bg-primary" />
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}