"use client";
import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { NetSheetForm } from "@/components/netsheet/NetSheetForm";
import { Sidebar } from "@/components/layout/Sidebar";
import { formatCurrency } from "@/lib/calculations";
import {
  Download,
  Send,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type {
  ExtractedContractData,
  NetSheetCalculation,
  TitleCompany,
} from "@/types";

const DEFAULT_COMPANY: TitleCompany = {
  id: "default",
  name: "Title Company",
  primaryColor: "#d97706",
  createdAt: new Date().toISOString(),
};

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();

  const [extracted, setExtracted] = useState<ExtractedContractData | null>(null);
  const [netSheet, setNetSheet] = useState<NetSheetCalculation | null>(null);
  const [company] = useState<TitleCompany>(DEFAULT_COMPANY);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "documents", id)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setExtracted(data.extractedData ?? {});
        if (data.netSheet) setNetSheet(data.netSheet);
      }
      setLoading(false);
    });
  }, [id]);

  const handleNetSheetChange = useCallback(
    async (ns: NetSheetCalculation) => {
      setNetSheet(ns);
      setSaved(false);
      if (id) {
        await updateDoc(doc(db, "documents", id), { netSheet: ns }).catch(() => {});
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    },
    [id]
  );

  async function handleDownloadPdf() {
    if (!netSheet || !extracted) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ netSheet, extracted, company, agentName: "Agent" }),
      });
      const { html } = await res.json();

      const container = document.createElement("div");
      container.innerHTML = html;
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "720px";
      document.body.appendChild(container);

      const canvas = await html2canvas(container, { scale: 2, useCORS: true });
      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      pdf.save(`net-sheet-${extracted.propertyAddress ?? id}.pdf`);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSendEmail() {
    if (!netSheet || !extracted || !emailTo) return;
    setSending(true);
    setSendError(null);
    setSendSuccess(false);
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailTo,
          subject: `Seller Net Sheet — ${extracted.propertyAddress ?? "Property"}`,
          html: `<p>Your net sheet is attached. Estimated proceeds: <strong>${formatCurrency(netSheet.netProceeds)}</strong></p><p>Prepared by ${company.name} via TitleSnap AI.</p>`,
        }),
      });
      if (!res.ok) throw new Error("Failed to send");
      setSendSuccess(true);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={20} className="animate-spin text-amber-500" />
        </div>
      </div>
    );
  }

  if (!extracted) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <AlertCircle size={24} className="text-red-500" />
          <p className="text-[13px] text-slate-600">Document not found.</p>
          <Link href="/dashboard" className="text-amber-600 text-[12px] underline">
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const address = extracted.propertyAddress ?? "Property";
  const seller = extracted.sellerName;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Sticky top bar */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200">
          {/* Breadcrumb + actions */}
          <div className="flex items-center justify-between px-6 py-2.5 gap-4">
            <nav className="flex items-center gap-1 text-[12px] text-slate-400 min-w-0">
              <Link href="/review" className="hover:text-slate-600 transition-colors shrink-0">Net sheets</Link>
              <ChevronRight size={11} className="shrink-0" />
              <span className="text-slate-600 truncate">{address}</span>
              {seller && (
                <>
                  <span className="mx-1 shrink-0">·</span>
                  <span className="text-slate-400 truncate">{seller}</span>
                </>
              )}
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              {saved && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-mono">
                  <CheckCircle2 size={11} /> Saved
                </span>
              )}
              <button
                onClick={handleDownloadPdf}
                disabled={!netSheet || generating}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded bg-slate-100 hover:bg-slate-200 active:opacity-70 text-slate-600 text-[12px] transition-colors duration-100 disabled:opacity-50"
              >
                {generating ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                PDF
              </button>

              <div className="flex items-center gap-1.5">
                <input
                  type="email"
                  placeholder="agent@email.com"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="h-8 w-40 px-2.5 rounded bg-slate-50 border border-slate-200 text-[12px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-amber-400 focus:bg-white transition-colors duration-100"
                />
                <button
                  onClick={handleSendEmail}
                  disabled={!emailTo || sending || !netSheet}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded bg-amber-500 hover:bg-amber-600 active:opacity-70 text-white text-[12px] font-medium transition-colors duration-100 disabled:opacity-50"
                >
                  {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Net proceeds strip */}
          {netSheet && (
            <div className="flex items-center gap-6 px-6 py-2 bg-amber-50 border-t border-amber-100 text-[12px]">
              <div className="flex items-center gap-2">
                <span className="text-amber-600/70">Net proceeds</span>
                <span className="text-amber-700 font-bold text-[15px] tabular-nums tracking-tight">
                  {formatCurrency(netSheet.netProceeds)}
                </span>
              </div>
              <div className="h-3 w-px bg-amber-200" />
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Sale price</span>
                <span className="text-slate-700 tabular-nums">{formatCurrency(netSheet.salesPrice)}</span>
              </div>
              <div className="h-3 w-px bg-slate-200" />
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Total deductions</span>
                <span className="text-slate-600 tabular-nums">{formatCurrency(netSheet.totalDeductions)}</span>
              </div>
              {netSheet.salesPrice > 0 && (
                <>
                  <div className="h-3 w-px bg-slate-200" />
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Net %</span>
                    <span className="text-slate-600 tabular-nums">
                      {((netSheet.netProceeds / netSheet.salesPrice) * 100).toFixed(1)}%
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Feedback toasts */}
        {(sendSuccess || sendError) && (
          <div className="px-6 pt-3">
            {sendSuccess && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12px] px-3 py-2 rounded mb-2">
                <CheckCircle2 size={13} /> Net sheet sent to {emailTo}
              </div>
            )}
            {sendError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-[12px] px-3 py-2 rounded mb-2">
                <AlertCircle size={13} /> {sendError}
              </div>
            )}
          </div>
        )}

        {/* Form area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <NetSheetForm
              extracted={extracted}
              onNetSheetChange={handleNetSheetChange}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
