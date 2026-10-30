"use client";

import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Circle,
  CircleDot,
  CheckCircle,
  ChevronDown,
  FileText,
  Folder,
  FolderPlus,
  PenTool,
  PieChart,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

const highlights = [
  "Canvas sync",
  "Active recall quizzes",
  "Real-time collaboration",
];

function CornerCross({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 15 15"
      fill="none"
      className={`pointer-events-none absolute z-20 h-3.5 w-3.5 text-foreground/25 ${className}`}
    >
      <path
        d="M7.5 0V15M0 7.5H15"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function Hero() {
  const [activePreview, setActivePreview] = useState("Canvas sync");
  const [typedNote, setTypedNote] = useState("");

  useEffect(() => {
    const activeIndex = highlights.indexOf(activePreview);
    const timer = window.setTimeout(() => {
      setActivePreview(highlights[(activeIndex + 1) % highlights.length]);
    }, 6500);

    return () => window.clearTimeout(timer);
  }, [activePreview]);

  useEffect(() => {
    if (activePreview !== "Real-time collaboration") {
      setTypedNote("");
      return;
    }

    const noteText = "A binary search tree stores smaller keys on the left and larger keys on the right.";
    let characterIndex = 0;
    setTypedNote("");
    const typingTimer = window.setInterval(() => {
      characterIndex += 1;
      setTypedNote(noteText.slice(0, characterIndex));
      if (characterIndex >= noteText.length) window.clearInterval(typingTimer);
    }, 52);

    return () => window.clearInterval(typingTimer);
  }, [activePreview]);

  return (
    <div className="relative flex w-full flex-col items-center bg-background selection:bg-primary/20 selection:text-primary">
      {/*
        Smooth scrolling + entrance keyframes live in CSS so this stays a
        Server Component (no client event handlers needed).
      */}
      <style>{`
        html { scroll-behavior: smooth; }
        @keyframes studynia-rise {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes studynia-pulse-subtle {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .studynia-rise {
          animation: studynia-rise 0.75s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .studynia-pulse {
          animation: studynia-pulse-subtle 3s ease-in-out infinite;
        }
        @keyframes studynia-preview-enter {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .studynia-preview-enter {
          animation: studynia-preview-enter 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          .studynia-rise, .studynia-pulse, .studynia-preview-enter { animation: none; }
        }
      `}</style>

      {/* ───────────────────────── HERO ───────────────────────── */}
      <section className="relative w-full overflow-hidden border-b border-border/70">
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-20 sm:px-8 sm:pb-20 sm:pt-24 lg:px-10 lg:pb-24 lg:pt-28">

          {/* Copy column */}
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            {/* Pill Badge */}

            {/* Headline */}
            <h1
              className="studynia-rise text-balance text-5xl font-semibold tracking-[-0.055em] text-foreground sm:text-7xl lg:text-[5.75rem] lg:leading-[0.98]"
              style={{ animationDelay: "80ms" }}
            >
              Just Study,{" "}
              <span className="text-primary">
                Studynia
              </span>
            </h1>

            {/* Subheadline */}
            <p
              className="studynia-rise mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:mt-7 sm:text-lg sm:leading-8"
              style={{ animationDelay: "160ms" }}
            >
              LMS , Notes , Quizzes , Progress Tracking , All in one place.
            </p>

            {/* Feature preview tabs */}
            <div
              role="group"
              aria-label="Studynia feature previews"
              className="studynia-rise mt-8 flex flex-wrap items-center justify-center gap-2.5 text-xs font-medium text-muted-foreground sm:gap-3 sm:text-sm"
              style={{ animationDelay: "240ms" }}
            >
              {highlights.map((feature) => (
                <button
                  key={feature}
                  id={`preview-tab-${feature.toLowerCase().replaceAll(" ", "-")}`}
                  type="button"
                  aria-pressed={activePreview === feature}
                  aria-controls="feature-preview-panel"
                  onClick={() => setActivePreview(feature)}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    activePreview === feature
                      ? "border-foreground/15 bg-foreground text-background shadow-sm"
                      : "border-border/70 bg-card/55 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {feature}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Studynia workspace preview */}
          <div
            id="feature-preview-panel"
            key={activePreview}
            role="region"
            aria-label={`${activePreview} preview`}
            aria-live="polite"
            className="studynia-preview-enter relative mx-auto mt-10 w-full sm:mt-2 lg:mt-6 max-w-0xl sm:max-w-3xl lg:max-w-5xl"
            style={{ animationDelay: "400ms" }}
          >
            <div className="relative rounded-[1.4rem] border border-border/80 bg-muted/40 p-1.5 shadow-md shadow-foreground/10 ring-1 ring-foreground/5 sm:rounded-[1.8rem] sm:p-2.5">
              <div className="overflow-hidden rounded-[1rem] border border-border/80 bg-card text-left sm:rounded-[1.35rem]">


                {activePreview === "Canvas sync" && (
                  <div className="studynia-preview-enter min-h-[340px] p-5 sm:p-7">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-xl font-semibold tracking-tight text-foreground">Course Folders</h3>
                        <p className="mt-1 text-xs text-muted-foreground">Your courses and synced Canvas materials.</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">All Semesters⌄</span>
                        <button type="button" className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground">
                          <RefreshCw className="h-3.5 w-3.5" /> Sync LMS
                        </button>
                        <button type="button" className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">
                          <FolderPlus className="h-3.5 w-3.5" /> Add course
                        </button>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        ["Introduction to Computer Science", "CS 101"],
                        ["Data Structures", "CS 210"],
                        ["Algorithms", "CS 301"],
                        ["Software Engineering", "CS 320"],
                      ].map(([course, code, count], index) => (
                        <div key={course} className={`group flex h-36 flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40`}>
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Folder className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="truncate text-sm font-semibold text-foreground">{course}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{code}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activePreview === "Active recall quizzes" && (
                  <div className="studynia-preview-enter min-h-[340px] p-5 sm:p-8">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Single Choice</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-foreground">4 <span className="text-muted-foreground">of 5</span></span>
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-muted"><div className="h-full w-4/5 bg-primary" /></div>
                      </div>
                    </div>
                    <h3 className="mt-6 text-xl font-bold leading-tight text-foreground sm:text-2xl">
                      What is the time complexity of binary search in a sorted array?
                    </h3>
                    <div className="mt-5 space-y-2.5">
                      {([
                        ["A", "O(log n)", true],
                        ["B", "O(n)", false],
                        ["C", "O(n log n)", false],
                      ] as const).map(([letter, answer, selected]) => (
                        <div key={letter} className={`flex items-start gap-3 rounded-xl border p-3.5 text-left sm:p-4 ${selected ? "border-primary bg-primary/5 shadow-[0_0_0_1px_rgba(var(--primary),1)]" : "border-border bg-muted/20"}`}>
                          <span className="mt-0.5 shrink-0 text-primary">{selected ? <CircleDot className="h-5 w-5" /> : <Circle className="h-5 w-5 text-muted-foreground" />}</span>
                          <span className={`text-sm font-semibold ${selected ? "text-primary" : "text-foreground"}`}>{letter}. {answer}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                      <button type="button" className="cursor-pointer rounded-md border border-border px-4 py-2 text-xs font-semibold text-muted-foreground">Previous</button>
                      <div className="flex items-center gap-3">
                        <button type="button" className="cursor-pointer px-2 py-2 text-xs font-semibold text-muted-foreground">Skip</button>
                        <button type="button" className="cursor-pointer rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">Next Question <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  </div>
                )}

                {activePreview === "Real-time collaboration" && (
                  <div className="studynia-preview-enter min-h-[340px] px-5 py-6 sm:px-10 sm:py-8">
                    <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><FileText className="h-4 w-4" /></span>
                        <span className="truncate text-xs text-muted-foreground">Notes <span className="px-1">/</span> Data Structures</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="hidden text-[11px] text-muted-foreground sm:inline">Saved</span>
                        <button type="button" className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground">
                          <Users className="h-3.5 w-3.5" /> Share
                        </button>
                      </div>
                    </div>
                    <div className="mx-auto mt-7 max-w-3xl">
                      <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">Binary Search Trees</h3>
                      <div className="mt-6 flex flex-wrap items-center gap-1 rounded-md border border-border/70 bg-muted/30 p-1 text-xs text-muted-foreground">
                        <span className="rounded bg-background px-2 py-1 font-semibold text-foreground shadow-sm">Text</span>
                        <span className="px-2 py-1 font-bold">B</span><span className="px-2 py-1 italic">I</span><span className="px-2 py-1 underline">U</span>
                        <span className="mx-1 h-4 w-px bg-border" /><span className="px-2 py-1">H1</span><span className="px-2 py-1">H2</span><span className="px-2 py-1">• List</span>
                      </div>
                      <div className="mt-6 space-y-4 text-sm leading-7 text-foreground/85">
                        <p>A binary search tree organizes values so each comparison eliminates half of the remaining search space.</p>
                        <p><span className="text-muted-foreground">{typedNote}</span><span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-primary align-middle" /></p>
                        <p className="text-muted-foreground">Balanced trees keep search, insertion, and deletion efficient as the data grows.</p>
                      </div>
                      <div className="mt-8 flex items-center gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" /> Changes sync live while you edit.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Scroll cue */}
          <div className="mt-8 flex justify-center sm:mt-10">
            <a
              href="#features"
              aria-label="Scroll to features"
              className="hidden items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:border-primary/30 hover:text-foreground md:inline-flex"
            >
              Scroll to explore
              <ChevronDown className="h-3.5 w-3.5 motion-safe:animate-bounce" />
            </a>
          </div>
        </div>
      </section>

      {/* ─────────────────────── FEATURES ─────────────────────── */}
      <section id="features" className="w-full scroll-mt-8 bg-background">
        <div className="relative mx-auto w-full max-w-6xl border-x border-dashed border-border/80 px-4 py-16 sm:px-8 sm:py-24">
          <CornerCross className="-left-[7px] -top-[7px] hidden sm:block" />
          <CornerCross className="-right-[7px] -top-[7px] hidden sm:block" />

          {/* Section Header */}
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              <Sparkles className="h-3.5 w-3.5" /> The Studynia toolkit
            </div>
            <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              From scattered materials to a smarter study rhythm.
            </h2>
            <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              One connected workspace for the whole learning loop: gather your
              course content, understand it, practice it, and see your progress.
            </p>
          </div>

          {/* Aceternity Flush Architectural Bento Grid */}
          <div className="relative mt-12 grid grid-cols-1 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm lg:mt-16 lg:grid-cols-6">
            {/* 1. Sync (4 cols on desktop) */}
            <article className="group relative flex flex-col justify-between border-b border-border/80 p-6 transition-colors hover:bg-muted/20 sm:p-8 lg:col-span-4 lg:border-r">
              <div className="grid gap-8 md:grid-cols-[0.95fr_1.05fr] md:items-center">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                    <BookOpen className="h-4 w-4" />
                    Stay in sync
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    Your courses, all together.
                  </h3>
                  <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
                    Bring Canvas materials into one organized study space, ready
                    when you are.
                  </p>
                </div>

                {/* Sync UI Card */}
                <div className="space-y-2 rounded-xl border border-border/80 bg-background/90 p-3.5 shadow-sm">
                  <div className="flex items-center justify-between px-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>Recent materials</span>
                    <RefreshCw className="h-3.5 w-3.5 text-primary transition-transform duration-700 group-hover:rotate-180" />
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">
                        Lecture slides · Week 04
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Neuroscience · PDF
                      </p>
                    </div>
                    <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">
                        Module notes · Memory
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Updated just now
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      Synced
                    </span>
                  </div>
                </div>
              </div>
            </article>

            {/* 2. Notes (2 cols on desktop) */}
            <article className="group relative flex flex-col justify-between border-b border-border/80 p-6 transition-colors hover:bg-muted/20 sm:p-8 lg:col-span-2">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  <PenTool className="h-4 w-4" />
                  Build together
                </div>
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  Notes that connect ideas.
                </h3>
                <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
                  Collaborate in real time and link your notes back to the
                  material they came from.
                </p>
              </div>

              <div className="mt-6 rounded-xl border border-border/70 bg-background/80 p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-primary/15 text-[10px] font-bold text-primary">
                      A
                    </span>
                    <span className="-ml-2.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-primary/25 text-[10px] font-bold text-primary">
                      M
                    </span>
                  </div>
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    Live notes
                  </span>
                </div>
                <p className="mt-2.5 text-xs font-medium text-muted-foreground">
                  Your study group, in sync
                </p>
              </div>
            </article>

            {/* 3. Quizzes (2 cols on desktop) */}
            <article className="group relative flex flex-col justify-between border-b border-border/80 p-6 transition-colors hover:bg-muted/20 sm:p-8 lg:col-span-2 lg:border-b-0 lg:border-r">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  <Target className="h-4 w-4" />
                  Practice with purpose
                </div>
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  Turn lessons into recall.
                </h3>
                <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
                  Generate personalized quizzes from your course content and
                  review what you missed.
                </p>
              </div>

              <div className="mt-6 space-y-2 rounded-xl border border-border/70 bg-background/80 p-3">
                <div className="flex items-center gap-2 rounded-lg bg-card p-2 text-xs font-medium text-foreground shadow-2xs">
                  <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
                  Review key concepts
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border/50 p-2 text-xs text-muted-foreground">
                  <span className="h-4 w-4 shrink-0 rounded-full border border-border" />
                  Try a practice question
                </div>
              </div>
            </article>

            {/* 4. Progress (4 cols on desktop) */}
            <article className="group relative flex flex-col justify-between p-6 transition-colors hover:bg-muted/20 sm:p-8 lg:col-span-4">
              <div className="grid gap-8 md:grid-cols-[0.95fr_1.05fr] md:items-center">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                    <PieChart className="h-4 w-4" />
                    See your progress
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    Know what to focus on next.
                  </h3>
                  <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
                    Track your attempts, spot weak areas, and make your next
                    study session count.
                  </p>
                </div>

                <div className="rounded-xl border border-border/80 bg-background/90 p-4">
                  <div className="mb-3 flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">
                      Weekly recall accuracy
                    </span>
                    <span className="font-semibold text-primary">82% avg</span>
                  </div>
                  <div className="flex h-28 items-end gap-2 pt-2">
                    <div className="h-[38%] flex-1 rounded-t bg-primary/25 transition-all duration-500 group-hover:h-[48%]" />
                    <div className="h-[55%] flex-1 rounded-t bg-primary/35 transition-all duration-500 group-hover:h-[65%]" />
                    <div className="h-[48%] flex-1 rounded-t bg-primary/45 transition-all duration-500 group-hover:h-[60%]" />
                    <div className="h-[74%] flex-1 rounded-t bg-primary/65 transition-all duration-500 group-hover:h-[85%]" />
                    <div className="h-full flex-1 rounded-t bg-primary" />
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
