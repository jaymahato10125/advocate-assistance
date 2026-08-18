import type { Metadata } from "next";
import {
  ArrowRight,
  FileSearch,
  FileText,
  Gauge,
  ListChecks,
  Lock,
  ScanText,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { RiskGauge } from "@/components/analysis/risk-gauge";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Advocate Contracts — AI contract review",
    description:
      "Upload a PDF or TXT contract and let Gemini read it like counsel: key clauses explained, risks flagged by severity, an overall risk level, and concrete recommendations.",
    alternates: { canonical: "/" },
    openGraph: {
      title: "Advocate Contracts — AI contract review",
      description:
        "Key clauses, severity-tagged risk flags, an overall risk level, and recommendations — from a single upload.",
      type: "website",
    },
  };
}

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <CtaSection />
      <MarketingFooter />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 bg-dotgrid [mask-image:radial-gradient(ellipse_60%_55%_at_50%_0%,black,transparent)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid max-w-6xl gap-14 px-4 pt-20 pb-24 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-28">
        <div>
          <Reveal>
            <Badge variant="outline" className="border-gold/40 bg-gold/10 text-gold">
              <Sparkles aria-hidden="true" />
              AI-powered contract review
            </Badge>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-5 font-display text-5xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
              Every clause, read.{" "}
              <span className="text-primary">Every risk, flagged.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Advocate Contracts extracts the text from your PDF or TXT agreements
              and runs a structured Gemini analysis — surfacing key clauses,
              severity-tagged risk flags, an overall risk level, and concrete
              recommendations in seconds.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  Open the dashboard
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#how-it-works">See how it works</Link>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.32}>
            <p className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
              <span>PDF &amp; TXT</span>
              <span aria-hidden="true" className="text-border">•</span>
              <span>Gemini analysis</span>
              <span aria-hidden="true" className="text-border">•</span>
              <span>No account needed</span>
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.2} className="relative">
          <HeroPreview />
        </Reveal>
      </div>
    </section>
  );
}

/** A live-rendered preview of the actual analysis UI, with sample data. */
function HeroPreview() {
  return (
    <div className="relative">
      <div
        className="absolute -inset-6 rounded-3xl bg-primary/10 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="truncate text-sm font-medium">
              master-services-agreement.pdf
            </span>
          </div>
          <Badge
            variant="outline"
            className="shrink-0 border-primary/30 bg-primary/10 text-primary"
          >
            Analyzed
          </Badge>
        </div>
        <div className="grid gap-5 px-5 py-5 sm:grid-cols-2">
          <RiskGauge level="medium" />
          <div className="space-y-3 self-center">
            <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Summary
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Mutual MSA with net-30 payment terms, a one-sided indemnification
              clause, and auto-renewal with a 60-day notice window.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="border-risk-high/30 bg-risk-high/10 text-risk-high"
              >
                1 high risk
              </Badge>
              <Badge
                variant="outline"
                className="border-risk-medium/30 bg-risk-medium/10 text-risk-medium"
              >
                2 medium
              </Badge>
            </div>
          </div>
        </div>
        <div className="border-t border-border/70 px-5 py-3.5">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldAlert className="size-3.5 shrink-0 text-risk-high" aria-hidden="true" />
            Indemnification is one-sided — negotiate a mutual cap before signing.
          </p>
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  {
    number: "01",
    icon: ScanText,
    title: "Upload a contract",
    description:
      "Drag in a PDF or TXT up to 10 MB. The file is stored, and its full text is extracted automatically — pages and words counted.",
  },
  {
    number: "02",
    icon: FileText,
    title: "Read the source text",
    description:
      "Every contract keeps a scrollable, copyable plain-text view of exactly what was extracted, so you can trust what the model sees.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Analyze with Gemini",
    description:
      "One click produces a summary, the contract type, key clauses explained, risk flags by severity, an overall risk level, and recommendations.",
  },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">
            How it works
          </p>
          <h2 className="mt-3 max-w-xl font-display text-4xl font-semibold tracking-tight text-balance">
            From upload to verdict in three steps
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, index) => (
            <Reveal key={step.number} delay={index * 0.12}>
              <div className="relative">
                <div className="flex items-center gap-4">
                  <span className="font-display text-5xl font-semibold text-primary/25">
                    {step.number}
                  </span>
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <step.icon className="size-5" aria-hidden="true" />
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: FileSearch,
    title: "Key clause extraction",
    description:
      "Indemnification, termination, liability caps, IP assignment — each clause is quoted, explained in plain language, and marked standard or non-standard.",
  },
  {
    icon: ShieldAlert,
    title: "Severity-tagged risk flags",
    description:
      "Every flag carries a severity from low to critical, the clause it refers to, and a specific recommendation — so you know what to negotiate first.",
  },
  {
    icon: Gauge,
    title: "Overall risk gauge",
    description:
      "A single, honest read on the whole document, animated into view the moment the analysis lands. No ambiguous scores, just a clear level.",
  },
  {
    icon: ListChecks,
    title: "Actionable recommendations",
    description:
      "Not vague warnings — a numbered list of concrete next steps you can hand straight to the counterparty or your counsel.",
  },
  {
    icon: ScanText,
    title: "Instant text extraction",
    description:
      "PDFs and plain text are parsed on upload with page and word counts, so the document view is ready before you even ask for analysis.",
  },
  {
    icon: Lock,
    title: "Private by design",
    description:
      "A single-tenant internal tool: your contracts stay in your MongoDB, and analysis runs under your own Gemini API key. No accounts, no tracking.",
  },
];

function FeaturesSection() {
  return (
    <section className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <Reveal>
          <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">
            Capabilities
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight text-balance">
            A second set of eyes that never gets tired
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
              Advocate Contracts does the first pass on every agreement — the
            tedious, error-prone read-through — so review time goes to the
            clauses that actually matter.
          </p>
        </Reveal>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <Reveal key={feature.title} delay={(index % 3) * 0.1}>
              <div className="group h-full rounded-xl border border-border/80 bg-card p-6 transition-colors duration-200 hover:border-primary/40">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="px-4 pb-24 sm:px-6">
      <Reveal className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-8 py-16 text-center sm:px-16">
          <div className="absolute inset-0 bg-noise opacity-[0.06]" aria-hidden="true" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-4xl font-semibold tracking-tight text-balance text-primary-foreground">
              Put your next contract under the lens
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              Upload an agreement and get a structured risk read before your
              next call — not after you have already signed.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 bg-background text-foreground shadow-lg hover:bg-background/90"
            >
              <Link href="/dashboard">
                Open the dashboard
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function MarketingFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-center sm:flex-row sm:px-6 sm:text-left">
        <p className="font-display text-sm font-semibold">
          Advocate <span className="font-sans font-medium text-muted-foreground">Contracts</span>
        </p>
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
          AI-assisted contract review powered by Google Gemini. Analysis
          output is informational and is not legal advice.
        </p>
      </div>
    </footer>
  );
}
