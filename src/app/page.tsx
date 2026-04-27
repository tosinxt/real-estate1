"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ScanLine, Zap, FileDown, Shield } from "lucide-react";
import { JoinButton } from "@/components/ui/JoinButton";
import { Pattern } from "@/components/ui/Pattern";

export default function LandingPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Nav */}
      <header className="border-b border-zinc-800/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-amber-500 flex items-center justify-center">
            <span className="text-black font-bold text-xs">TS</span>
          </div>
          <span className="font-semibold text-white tracking-tight">TitleSnap AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors px-3 py-1.5"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Get started <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative flex flex-col items-center text-center px-6 pt-24 pb-16 max-w-4xl mx-auto overflow-hidden">
        <Pattern opacity={0.07} />
        <div className="relative z-10 flex flex-col items-center w-full">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
          <Zap size={11} /> Now with Gemini 1.5 Pro extraction
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight leading-[1.08] mb-6">
          Drop a contract.
          <br />
          <span className="text-amber-400">Get the net sheet.</span>
        </h1>

        <p className="text-lg text-zinc-400 max-w-2xl mb-10 leading-relaxed">
          Upload a PDF or photo of any sales contract. Google Vision reads it.
          Gemini extracts the numbers. Your branded net sheet is ready in under 45 seconds.
        </p>

        <div className="flex flex-col items-center gap-6">
          <div className="py-4">
            <JoinButton
              onClick={() => router.push("/login")}
              label1="Get Started"
              label2="Join Now"
            />
          </div>
          <span className="text-xs text-zinc-600">No credit card · works with blurry photocopies</span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-8 mt-20 pt-12 border-t border-zinc-800/60 w-full max-w-lg">
          {[
            { value: "< 45s", label: "Upload to net sheet" },
            { value: "95%+", label: "Field accuracy" },
            { value: "100%", label: "Branded PDF output" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-white tabular-nums tracking-tight">{s.value}</span>
              <span className="text-xs text-zinc-500">{s.label}</span>
            </div>
          ))}
        </div>
        </div>{/* end z-10 */}
      </main>

      {/* Feature cards */}
      <section className="max-w-5xl mx-auto px-6 pb-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: ScanLine,
            title: "Google Vision OCR",
            desc: "Handles blurry faxes, rotated scans, and 4-page PDFs",
          },
          {
            icon: Zap,
            title: "Gemini AI extraction",
            desc: "Pulls sales price, commission %, closing date, fee responsibility",
          },
          {
            icon: FileDown,
            title: "Branded PDF output",
            desc: "Dark-mode net sheet with your title company's logo",
          },
          {
            icon: Shield,
            title: "Title-company grade",
            desc: "Custom fee schedules, tiered rate tables, and prorated taxes",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-5"
          >
            <div className="h-9 w-9 rounded-lg bg-zinc-800 flex items-center justify-center text-amber-400">
              <Icon size={18} strokeWidth={1.5} />
            </div>
            <p className="font-medium text-white text-sm">{title}</p>
            <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
