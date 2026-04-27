"use client";
import { useEffect, useState, useMemo } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthState } from "@/hooks/useAuthState";
import { Sidebar } from "@/components/layout/Sidebar";
import { formatCurrency } from "@/lib/calculations";
import { FileText, ArrowRight, ChevronUp, ChevronDown, Plus, Search } from "lucide-react";
import Link from "next/link";
import type { Document } from "@/types";

type SortKey = "uploadedAt" | "netProceeds" | "salesPrice";
type SortDir = "asc" | "desc";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    ready: { label: "Ready", color: "text-emerald-600" },
    processing: { label: "Processing", color: "text-amber-600" },
    extracting: { label: "Extracting", color: "text-amber-600" },
    uploading: { label: "Uploading", color: "text-slate-500" },
    error: { label: "Error", color: "text-red-600" },
    idle: { label: "Draft", color: "text-slate-400" },
  };
  const s = map[status] ?? { label: status, color: "text-slate-400" };
  return (
    <span className={`font-mono text-[11px] ${s.color} flex items-center gap-1`}>
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronUp size={10} className="text-slate-300" />;
  return dir === "asc" ? <ChevronUp size={10} className="text-amber-500" /> : <ChevronDown size={10} className="text-amber-500" />;
}

export default function NetSheetsPage() {
  const { user, loading: authLoading } = useAuthState();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("uploadedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "documents"),
      where("titleCompanyId", "==", user.uid),
      orderBy("uploadedAt", "desc")
    );
    getDocs(q).then((snap) => {
      setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Document)));
      setLoading(false);
    });
  }, [user]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = q
      ? docs.filter(
          (d) =>
            (d.extractedData?.propertyAddress ?? d.fileName).toLowerCase().includes(q) ||
            (d.extractedData?.sellerName ?? "").toLowerCase().includes(q) ||
            (d.extractedData?.buyerName ?? "").toLowerCase().includes(q)
        )
      : docs;

    return [...list].sort((a, b) => {
      let va = 0, vb = 0;
      if (sortKey === "uploadedAt") {
        va = new Date(a.uploadedAt ?? 0).getTime();
        vb = new Date(b.uploadedAt ?? 0).getTime();
      } else if (sortKey === "netProceeds") {
        va = a.netSheet?.netProceeds ?? 0;
        vb = b.netSheet?.netProceeds ?? 0;
      } else if (sortKey === "salesPrice") {
        va = a.extractedData?.salesPrice ?? 0;
        vb = b.extractedData?.salesPrice ?? 0;
      }
      return sortDir === "asc" ? va - vb : vb - va;
    });
  }, [docs, search, sortKey, sortDir]);

  const isLoading = loading || authLoading;

  const ColHeader = ({
    label,
    sortable,
    className = "",
  }: {
    label: string;
    sortable?: SortKey;
    className?: string;
  }) => (
    <th
      className={`px-3 py-2 text-left text-[11px] text-slate-400 font-medium select-none ${sortable ? "cursor-pointer hover:text-slate-600" : ""} ${className}`}
      onClick={sortable ? () => toggleSort(sortable) : undefined}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortable && <SortIcon active={sortKey === sortable} dir={sortDir} />}
      </span>
    </th>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 px-6 py-2.5 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-[14px] font-semibold text-slate-900 tracking-tight">Net Sheets</h1>
            {!isLoading && (
              <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                {filtered.length} / {docs.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search address, seller…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-56 pl-7 pr-3 rounded bg-slate-50 border border-slate-200 text-[12px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-amber-400 focus:bg-white transition-colors duration-100"
              />
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded bg-amber-500 hover:bg-amber-600 active:opacity-70 text-white text-[12px] font-medium transition-colors duration-100"
            >
              <Plus size={12} strokeWidth={2.5} />
              New sheet
            </Link>
          </div>
        </div>

        <div className="px-6 py-4">
          {isLoading ? (
            <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
              <table className="w-full">
                <tbody>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="px-3 py-2.5" colSpan={6}>
                        <div className="h-4 rounded bg-slate-100 animate-pulse w-full" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3 rounded-lg border border-slate-200 bg-white shadow-sm">
              <FileText size={24} className="text-slate-300" strokeWidth={1.5} />
              <div>
                <p className="text-[13px] text-slate-600 font-medium">No net sheets yet</p>
                <p className="text-[12px] text-slate-400 mt-1">Upload your first contract to get started</p>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 mt-1 h-8 px-3 rounded bg-amber-500 hover:bg-amber-600 active:opacity-70 text-white text-[12px] font-medium transition-colors duration-100"
              >
                <Plus size={12} strokeWidth={2.5} /> Upload contract
              </Link>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
              <table className="w-full text-[12px]">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] text-slate-400 font-medium w-6 tabular-nums">#</th>
                    <ColHeader label="Address / file" />
                    <ColHeader label="Seller" className="hidden md:table-cell" />
                    <ColHeader label="Sale price" sortable="salesPrice" className="text-right hidden lg:table-cell" />
                    <ColHeader label="Net proceeds" sortable="netProceeds" className="text-right" />
                    <ColHeader label="Date" sortable="uploadedAt" className="text-right hidden sm:table-cell" />
                    <ColHeader label="Status" className="hidden md:table-cell" />
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-[12px] text-slate-400">
                        No results for &ldquo;{search}&rdquo;
                      </td>
                    </tr>
                  ) : (
                    filtered.map((doc, i) => (
                      <tr
                        key={doc.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-75 group"
                      >
                        <td className="px-3 py-2 text-slate-300 font-mono tabular-nums text-[11px]">
                          {i + 1}
                        </td>
                        <td className="px-3 py-2 text-slate-700 max-w-[180px]">
                          <Link href={`/review/${doc.id}`} className="hover:text-slate-900 truncate block transition-colors">
                            {doc.extractedData?.propertyAddress ?? doc.fileName}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-slate-400 hidden md:table-cell truncate max-w-[120px]">
                          {doc.extractedData?.sellerName ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-500 tabular-nums hidden lg:table-cell">
                          {doc.extractedData?.salesPrice != null
                            ? formatCurrency(doc.extractedData.salesPrice)
                            : "—"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium">
                          {doc.netSheet?.netProceeds != null ? (
                            <span className="text-amber-600">{formatCurrency(doc.netSheet.netProceeds)}</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-400 font-mono hidden sm:table-cell">
                          {doc.uploadedAt
                            ? new Date(doc.uploadedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "2-digit",
                              })
                            : "—"}
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell">
                          <StatusBadge status={doc.status} />
                        </td>
                        <td className="px-2 py-2 text-right">
                          <Link href={`/review/${doc.id}`}>
                            <ArrowRight size={12} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <p className="text-[11px] text-slate-400 font-mono tabular-nums">
                  {filtered.length} sheet{filtered.length !== 1 ? "s" : ""}
                </p>
                <p className="text-[11px] text-slate-400">
                  <kbd className="font-mono bg-white border border-slate-200 text-slate-400 px-1 py-0.5 rounded text-[10px]">J</kbd>
                  <kbd className="font-mono bg-white border border-slate-200 text-slate-400 px-1 py-0.5 rounded text-[10px] ml-1">K</kbd>
                  <span className="ml-1.5">to navigate</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
