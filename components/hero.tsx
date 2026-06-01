import { ArrowRight, BookOpen, PenTool, BrainCircuit, Target, PieChart, Sparkles, FileText, RefreshCw, CheckCircle, TrendingUp } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <div className="flex flex-col w-full items-center">
      {/* Hero Section */}
      <section className="flex flex-col gap-8 items-center  text-center px-4 max-w-5xl mx-auto">
        <div className="inline-flex items-center rounded-full border border-foreground/20 px-3 py-1 text-sm text-foreground/80 backdrop-blur-sm">
          <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
          Join the waitlist today!
        </div>
        
        <h1 className="text-5xl lg:text-7xl color-primary text font-extrabold tracking-tight bg-clip-text bg-gradient-to-r from-primary to-primary/40 text-transparent/15">
          StudyNia
        </h1>
        
        <p className="text-2xl lg:text-3xl leading-tight max-w-3xl text-foreground font-medium">
          Your Centralized <span className="text-primary text-foreground/50 font-bold underline decoration-wavy decoration-2 underline-offset-4">Student Knowledge System</span>
        </p>
        
        <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
          Stop jumping between Canvas, AI tools, and siloed note apps. StudyNia synchronizes your LMS materials, generates personalized self-assessments, and tracks your progress—so you focus on learning, not file management.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full justify-center">
          <Link
            href="auth/login"
            className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-foreground text-background font-bold text-lg hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-xl"
          >
            Get Started Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center justify-center px-8 py-3 rounded-full border border-foreground/20 hover:bg-foreground/5 transition-colors text-lg font-medium backdrop-blur-sm scroll-smooth"
          >
            Explore Features
          </a>
        </div>
        
        {/* Social Proof / Stats */}
        <div className="mt-12 grid grid-cols-3 gap-8 text-center text-sm text-foreground/60 border-t border-foreground/10 pt-8 w-full max-w-2xl">
          <div>
            <div className="font-bold text-2xl text-foreground">57%</div>
            <div>Less Academic Stress</div>
          </div>
          <div>
            <div className="font-bold text-2xl text-foreground">10x</div>
            <div>Better Knowledge Retention</div>
          </div>
          <div>
            <div className="font-bold text-2xl text-foreground">100%</div>
            <div>Centralized Workflow</div>
          </div>
        </div>
      </section>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent my-12" />

      {/* Features Section */}
      <section id="features" className="scroll-smooth w-full min-h-screen py-16 lg:py-24 px-4 bg-background flex flex-col justify-center">
        <div className="max-w-6xl mx-auto w-full">
          <div className="inline-flex items-center border border-border px-3 py-1 text-sm text-muted-foreground mb-6 bg-background shadow-sm font-medium rounded-full">
            Features
          </div>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-16 gap-10 border-b border-border pb-12">
            <div className="max-w-xl">
              <h2 className="text-4xl lg:text-3xl font-extrabold text-foreground tracking-tight leading-tight">
                Streamline your academic workload.
              </h2>
            </div>
            <p className="text-muted-foreground max-w-md h-auto text-lg leading-relaxed lg:text-left">
              Whether you need to sync Canvas materials or generate practice quizzes, StudyNia centralizes your tasks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="flex flex-col gap-6">
              {/* Feature 1 (Large Left) */}
              <div className="group flex flex-col justify-between p-8 md:p-10 rounded-3xl bg-muted/50 border border-border/50 transition-all duration-300 hover:shadow-md hover:bg-muted relative overflow-hidden flex-1">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <BookOpen className="h-5 w-5 text-foreground" />
                    <h3 className="text-lg font-bold text-foreground">LMS Synchronization</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-md relative z-10">
                    Seamlessly pull PDFs, texts, and modules from external LMSs like Canvas or Moodle straight into your workspace. End the frustration of disorganized portals.
                  </p>
                </div>
                {/* Animated SVG Container */}
                <div className="mt-8 min-h-40 w-full rounded-2xl bg-background/60 border border-border/50 flex items-center justify-center relative py-6 overflow-hidden">
                  <div className="absolute top-4 left-1/4 w-2 h-2 rounded-full bg-foreground/30 group-hover:animate-ping"></div>
                  <div className="absolute text-muted/20 left-10 bottom-4 group-hover:-translate-x-2 transition-transform duration-700">
                     <FileText className="h-16 w-16" />
                  </div>
                  
                  <div className="flex items-center gap-4 sm:gap-8 z-10">
                    <div className="flex flex-col gap-2 items-center group-hover:-translate-y-2 transition-transform duration-500">
                      <div className="w-12 h-12 rounded-xl bg-foreground/5 flex items-center justify-center border border-border">
                        <BookOpen className="h-6 w-6 text-foreground/70" />
                      </div>
                      <div className="h-1.5 w-8 bg-muted rounded-full"></div>
                    </div>
                    
                    <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 text-foreground/80 animate-[spin_3s_linear_infinite]" />
                    
                    <div className="flex flex-col gap-2 items-center group-hover:translate-y-2 transition-transform duration-500 delay-75">
                      <div className="w-12 h-12 rounded-xl bg-foreground/5 flex items-center justify-center border border-border">
                        <FileText className="h-6 w-6 text-foreground/70" />
                      </div>
                      <div className="h-1.5 w-8 bg-muted rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 3 (Small Left) */}
              <div className="group flex flex-col justify-center p-8 md:p-10 rounded-3xl bg-background border border-border transition-all duration-300 hover:shadow-md hover:bg-muted/50">
                 <div className="flex items-center gap-3 mb-4">
                  <PenTool className="h-5 w-5 text-foreground" />
                  <h3 className="text-lg font-bold text-foreground">Collaborative Notes</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed text-md">
                  Work with your peers in real-time. Link lecture materials directly to your notes and build a unified knowledge base.
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6">
              {/* Feature 2 (Small Right) */}
              <div className="group flex flex-col justify-center p-8 md:p-10 rounded-3xl border border-border transition-all duration-300 hover:shadow-md hover:bg-muted/50 bg-background">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="h-5 w-5 text-foreground" />
                  <h3 className="text-lg font-bold text-foreground">AI Overview & Editor</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed text-md">
                  Instantly summarize complex materials and get tailored AI assistance without switching tabs.
                </p>
              </div>

              {/* Feature 4 (Large Right) */}
              <div className="group flex flex-col justify-between p-8 md:p-10 rounded-3xl bg-muted/50 border border-border/50 transition-all duration-300 hover:shadow-md hover:bg-muted relative overflow-hidden flex-1">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="h-5 w-5 text-foreground" />
                    <h3 className="text-lg font-bold text-foreground">Personalized Assessments</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-md relative z-10">
                    Automatically generate practice quizzes and exercises from your texts to drastically boost retention via active recall.
                  </p>
                </div>
                
                {/* Animated SVG Container */}
                <div className="mt-8 min-h-40 w-full rounded-2xl bg-background/60 border border-border/50 flex items-center justify-center relative py-6 overflow-hidden">
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                    <Target className="h-32 w-32 text-foreground group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  
                  <div className="flex flex-col gap-4 w-full max-w-[240px] z-10">
                    <div className="flex items-center gap-3 bg-background p-3 rounded-lg border border-border shadow-sm transform group-hover:-translate-y-1 group-hover:shadow-md transition-all duration-300">
                      <CheckCircle className="h-5 w-5 text-foreground/80 shrink-0" />
                      <div className="flex flex-col gap-2 w-full pl-2">
                        <div className="w-full h-2 bg-muted rounded-full"></div>
                        <div className="w-2/3 h-2 bg-muted rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-background p-3 rounded-lg border border-border shadow-sm transform group-hover:translate-y-1 group-hover:shadow-md transition-all duration-300 delay-100">
                      <div className="h-5 w-5 shrink-0 rounded-full border-2 border-muted flex items-center justify-center group-hover:border-foreground/80 transition-colors duration-500">
                        <div className="h-2.5 w-2.5 rounded-full bg-foreground/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-300 m-auto"></div>
                      </div>
                      <div className="flex flex-col gap-2 w-full pl-2">
                        <div className="w-3/4 h-2 bg-muted rounded-full"></div>
                        <div className="w-1/2 h-2 bg-muted rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
             {/* Feature 5 (Full Width Bottom) */}
            <div className="group grid md:grid-cols-2 gap-8 items-center p-8 md:p-10 rounded-3xl bg-muted/50 border border-border/50 md:col-span-2 transition-all duration-300 hover:shadow-md hover:bg-muted relative overflow-hidden">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <PieChart className="h-5 w-5 text-foreground" />
                  <h3 className="text-lg font-bold text-foreground">Study & Grade Tracker</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed text-md max-w-xl">
                  Visualize your knowledge gaps and academic performance with intuitive charts, helping you focus where it matters most.
                </p>
              </div>

              {/* Animated SVG Container */}
              <div className="h-48 w-full rounded-2xl bg-background/60 border border-border/50 flex items-end justify-center relative overflow-hidden px-4 py-8 sm:p-6 gap-3 sm:gap-6 mt-4 md:mt-0">
                {/* Chart lines background */}
                <div className="absolute inset-0 flex flex-col justify-between p-6 py-10 opacity-10">
                   <div className="w-full border-t-2 border-dashed border-foreground/50"></div>
                   <div className="w-full border-t-2 border-dashed border-foreground/50"></div>
                   <div className="w-full border-t-2 border-dashed border-foreground/50"></div>
                </div>
                
                {/* Bars */}
                <div className="w-8 sm:w-16 bg-foreground/20 rounded-t-md h-[30%] border border-border group-hover:h-[40%] transition-all duration-700 ease-out relative z-10"></div>
                <div className="w-8 sm:w-16 bg-foreground/40 rounded-t-md h-[50%] border border-border group-hover:h-[65%] transition-all duration-700 ease-out delay-100 relative z-10"></div>
                <div className="w-8 sm:w-16 bg-foreground/60 rounded-t-md h-[70%] border border-border group-hover:h-[85%] transition-all duration-700 ease-out delay-200 relative z-10"></div>
                <div className="w-8 sm:w-16 bg-foreground/80 rounded-t-md h-[90%] border border-border group-hover:h-[100%] transition-all duration-700 ease-out delay-300 relative z-10">
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-24 px-4">
        <div className="max-w-4xl mx-auto rounded-3xl bg-foreground/5 border border-foreground/10 p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
          <h2 className="text-3xl lg:text-5xl font-bold mb-6 relative z-10">Ready to lighten the cognitive load?</h2>
          <p className="text-xl text-foreground/70 mb-8 max-w-2xl mx-auto relative z-10">
            Join students who are conquering modern academic demands by centralizing their workflow in StudyNia.
          </p>
          <div className="relative z-10">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-foreground text-background font-bold text-xl hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
            >
              Start Streamlining Free
            </Link>
            <p className="mt-4 text-sm text-foreground/50">Seamless LMS integration • Empowered by AI</p>
          </div>
        </div>
      </section>
    </div>
  );
}
