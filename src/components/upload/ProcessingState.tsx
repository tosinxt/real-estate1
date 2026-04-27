"use client";
import { useEffect, useState } from "react";
import { Eye, BrainCircuit, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ui/Loader";
import type { ProcessingStatus } from "@/types";

interface Props {
  status: ProcessingStatus;
  progress: number;
  fileName: string;
}

const STEPS = [
  { key: "uploading", label: "Uploading contract", sub: "Sending to server" },
  { key: "processing", icon: Eye, label: "Running OCR", sub: "Google Vision scanning every line" },
  { key: "extracting", icon: BrainCircuit, label: "Extracting data", sub: "Gemini AI parsing contract fields" },
  { key: "ready", icon: CheckCircle2, label: "Ready to review", sub: "All key fields extracted" },
];

const STATUS_ORDER: ProcessingStatus[] = ["uploading", "processing", "extracting", "ready"];

export function ProcessingState({ status, progress, fileName }: Props) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (status === "ready") return;
    const id = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 400);
    return () => clearInterval(id);
  }, [status]);

  const currentIndex = STATUS_ORDER.indexOf(status);
  const isActive = status !== "ready";

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      {isActive && (
        <div className="flex flex-col items-center gap-4">
          <Loader />
          <p className="text-sm text-slate-500">
            {STEPS.find((s) => s.key === status)?.label}
            <span className="text-amber-500 font-mono">{dots}</span>
          </p>
          <p className="text-xs text-slate-400">
            {STEPS.find((s) => s.key === status)?.sub}
          </p>
        </div>
      )}

      {status === "ready" && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
            <CheckCircle2 size={24} className="text-emerald-600" />
          </div>
          <p className="text-sm font-medium text-slate-700">Ready to review</p>
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-100 border border-slate-200 w-full max-w-sm">
        <div className="h-8 w-8 rounded bg-white border border-slate-200 flex items-center justify-center shrink-0">
          <span className="text-amber-600 text-xs font-mono font-semibold">PDF</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-700 truncate">{fileName}</p>
          <p className="text-xs text-slate-400">Google Vision + Gemini</p>
        </div>
      </div>

      <div className="h-1 rounded-full bg-slate-200 overflow-hidden w-full max-w-sm">
        <div
          className="h-full bg-amber-500 transition-all duration-500 ease-out"
          style={{ width: `${status === "ready" ? 100 : Math.max(progress, 10)}%` }}
        />
      </div>

      <div className="flex items-center gap-2">
        {STATUS_ORDER.map((s, i) => {
          const done = i < currentIndex || status === "ready";
          const active = s === status;
          return (
            <div
              key={s}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                done ? "w-6 bg-emerald-500" : active ? "w-6 bg-amber-500" : "w-3 bg-slate-200"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
