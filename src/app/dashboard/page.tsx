"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadZone } from "@/components/upload/UploadZone";
import { ProcessingState } from "@/components/upload/ProcessingState";
import { Sidebar } from "@/components/layout/Sidebar";
import { useDocumentUpload } from "@/hooks/useDocumentUpload";
import { useAuthState } from "@/hooks/useAuthState";
import { collection, query, where, orderBy, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatCurrency } from "@/lib/calculations";
import { ArrowRight, FileText, Clock, TrendingUp, UploadCloud } from "lucide-react";
import Link from "next/link";
import { Pattern } from "@/components/ui/Pattern";
import type { Document } from "@/types";

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 48;
  const h = 24;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const d = `M ${pts.join(" L ")}`;
  const fill = `M ${pts[0]} L ${pts.join(" L ")} L ${w},${h} L 0,${h} Z`;
  return (
    <svg width={w} height={h} className="shrink-0">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#sg)" />
      <path d={d} fill="none" stroke="#FCD34D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuthState();
  const router = useRouter();
  const [fileName, setFileName] = useState("");
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);

  const { status, progress, error, upload, reset } = useDocumentUpload(user?.uid ?? "anonymous");

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "documents"),
      where("titleCompanyId", "==", user.uid),
      orderBy("uploadedAt", "desc"),
      limit(20)
    );
    getDocs(q).then((snap) => {
      setRecentDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Document)));
      setDocsLoading(false);
    });
  }, [user]);

  const handleFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      try {
        const result = await upload(file);
        router.push(`/review/${result.documentId}`);
      } catch {
        // error handled by hook
      }
    },
    [upload, router]
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-4 w-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const isProcessing = ["uploading", "processing", "extracting"].includes(status);

  const now = new Date();
  const thisMonth = recentDocs.filter((d) => {
    if (!d.uploadedAt) return false;
    const dt = new Date(d.uploadedAt);
    return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
  });
  const withNetSheet = recentDocs.filter((d) => d.netSheet?.netProceeds);
  const avgNet =
    withNetSheet.length > 0
      ? withNetSheet.reduce((s, d) => s + (d.netSheet?.netProceeds ?? 0), 0) / withNetSheet.length
      : null;
  const netValues = recentDocs
    .slice(0, 10)
    .reverse()
    .map((d) => d.netSheet?.netProceeds ?? 0)
    .filter(Boolean);

  const METRICS = [
    {
      label: "Total processed",
      value: recentDocs.length.toString(),
      sub: `${thisMonth.length} this month`,
      spark: recentDocs.slice(0, 10).reverse().map((_, i) => i + 1),
      primary: true,
    },
    {
      label: "This month",
      value: thisMonth.length.toString(),
      sub: thisMonth.length === 1 ? "contract" : "contracts",
      spark: null,
      primary: false,
    },
    {
      label: "Avg net proceeds",
      value: avgNet != null ? formatCurrency(avgNet) : "—",
      sub: withNetSheet.length > 0 ? `across ${withNetSheet.length} sheets` : "no data yet",
      spark: netValues.length >= 2 ? netValues : null,
      primary: false,
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Top toolbar */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div>
            <h1 className="text-[14px] font-semibold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-[11px] text-slate-400 font-mono">
              {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400" aria-hidden="true">
            <kbd className="font-mono bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded text-[10px] leading-none border border-slate-200">⌘K</kbd>
            <span>quick open</span>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Metric banner */}
          <div className="relative rounded-xl overflow-hidden">
            <Pattern opacity={1} />
            {/* overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30" />
            <div className="relative z-10 px-5 py-4">
              <p className="text-[11px] font-medium text-teal-200/70 uppercase tracking-widest mb-3">Overview</p>
              <div className="grid grid-cols-3 gap-3">
                {METRICS.map(({ label, value, sub, spark, primary }) => (
                  <div
                    key={label}
                    className={`rounded-lg p-4 backdrop-blur-sm border ${
                      primary
                        ? "bg-white/15 border-white/25"
                        : "bg-white/10 border-white/15"
                    }`}
                  >
                    <p className="text-[11px] text-teal-100/70 font-medium mb-2">{label}</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className={`text-2xl font-bold tabular-nums tracking-tight leading-none ${primary ? "text-amber-300" : "text-white"}`}>
                          {docsLoading ? <span className="text-white/30">—</span> : value}
                        </p>
                        <p className="text-[11px] text-teal-100/50 mt-1">{sub}</p>
                      </div>
                      {spark && <Sparkline values={spark} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Two-col: upload + recent */}
          <div className="grid grid-cols-5 gap-4">
            {/* Upload zone */}
            <div className="col-span-2">
              <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="px-4 py-2.5 border-b border-slate-200 flex items-center gap-2">
                  <UploadCloud size={13} className="text-slate-400" strokeWidth={1.8} />
                  <p className="text-[12px] font-medium text-slate-600">New net sheet</p>
                </div>
                <div className="p-4">
                  {status === "idle" || status === "error" ? (
                    <>
                      <UploadZone onFile={handleFile} />
                      {status === "error" && (
                        <div className="mt-3 flex items-center justify-between rounded bg-red-50 border border-red-200 px-3 py-2">
                          <p className="text-[12px] text-red-600">{error}</p>
                          <button onClick={reset} className="text-[11px] text-red-500 hover:text-red-700 underline ml-3 shrink-0">
                            Retry
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <ProcessingState status={status} progress={0} fileName={fileName} />
                  )}
                </div>
                {!isProcessing && status === "idle" && (
                  <div className="border-t border-slate-100 px-4 py-3 space-y-2 bg-slate-50">
                    {[
                      { icon: FileText, tip: "Works with blurry faxes & photocopies" },
                      { icon: Clock, tip: "Under 45 s from upload to net sheet" },
                      { icon: TrendingUp, tip: "Commissions, title fees, prorated taxes" },
                    ].map(({ icon: Icon, tip }) => (
                      <div key={tip} className="flex items-start gap-2">
                        <Icon size={11} className="text-amber-500 mt-0.5 shrink-0" strokeWidth={1.8} />
                        <p className="text-[11px] text-slate-500 leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent docs */}
            <div className="col-span-3">
              <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={13} className="text-slate-400" strokeWidth={1.8} />
                    <p className="text-[12px] font-medium text-slate-600">Recent net sheets</p>
                  </div>
                  <Link href="/review" className="text-[11px] text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1">
                    All sheets <ArrowRight size={11} />
                  </Link>
                </div>

                {docsLoading ? (
                  <div className="px-4 py-3 space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-8 rounded bg-slate-100 animate-pulse" />
                    ))}
                  </div>
                ) : recentDocs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                    <FileText size={20} className="text-slate-300" strokeWidth={1.5} />
                    <p className="text-[12px] text-slate-400">No sheets yet — upload your first contract</p>
                  </div>
                ) : (
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left px-3 py-2 text-[11px] text-slate-400 font-medium">Address</th>
                        <th className="text-left px-3 py-2 text-[11px] text-slate-400 font-medium hidden sm:table-cell">Seller</th>
                        <th className="text-right px-3 py-2 text-[11px] text-slate-400 font-medium tabular-nums">Net proceeds</th>
                        <th className="text-right px-3 py-2 text-[11px] text-slate-400 font-medium font-mono hidden md:table-cell">Date</th>
                        <th className="w-6" />
                      </tr>
                    </thead>
                    <tbody>
                      {recentDocs.slice(0, 8).map((doc) => (
                        <tr
                          key={doc.id}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-75 group"
                        >
                          <td className="px-3 py-2 text-slate-700 max-w-[140px] truncate">
                            <Link href={`/review/${doc.id}`} className="hover:text-slate-900 transition-colors">
                              {doc.extractedData?.propertyAddress ?? doc.fileName}
                            </Link>
                          </td>
                          <td className="px-3 py-2 text-slate-400 hidden sm:table-cell truncate max-w-[100px]">
                            {doc.extractedData?.sellerName ?? "—"}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {doc.netSheet?.netProceeds != null ? (
                              <span className="text-amber-600 font-medium">{formatCurrency(doc.netSheet.netProceeds)}</span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-400 font-mono hidden md:table-cell">
                            {doc.uploadedAt
                              ? new Date(doc.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                              : "—"}
                          </td>
                          <td className="px-2 py-2 text-right">
                            <Link href={`/review/${doc.id}`}>
                              <ArrowRight size={12} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
