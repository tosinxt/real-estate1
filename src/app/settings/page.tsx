"use client";
import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthState } from "@/hooks/useAuthState";
import { Upload, Plus, Trash2, Save, CheckCircle2, Loader2 } from "lucide-react";
import Papa from "papaparse";
import type { FeeSchedule, FeeTier, FlatFee } from "@/types";

const DEFAULT_TIERS: FeeTier[] = [
  { minPrice: 0, maxPrice: 100000, rate: 0.575, baseFee: 175 },
  { minPrice: 100001, maxPrice: 500000, rate: 0.5, baseFee: 200 },
  { minPrice: 500001, maxPrice: 1000000, rate: 0.4, baseFee: 250 },
  { minPrice: 1000001, maxPrice: 999999999, rate: 0.35, baseFee: 300 },
];

const DEFAULT_FLAT: FlatFee[] = [
  { id: "settlement", label: "Settlement Fee", amount: 395, paidBy: "seller" },
  { id: "title-search", label: "Title Search", amount: 200, paidBy: "seller" },
  { id: "recording", label: "Recording Fees", amount: 75, paidBy: "seller" },
];

function NumInput({
  value,
  onChange,
  prefix,
  suffix,
  title,
}: {
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  title?: string;
}) {
  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-mono pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        title={title}
        className={`w-full h-8 rounded bg-slate-50 border border-slate-200 text-[12px] text-slate-700 tabular-nums font-mono focus:outline-none focus:border-amber-400 focus:bg-white transition-colors duration-100 ${prefix ? "pl-4 pr-2" : suffix ? "pl-2 pr-5" : "px-2"}`}
      />
      {suffix && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-mono pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuthState();
  const [companyName, setCompanyName] = useState("My Title Company");
  const [primaryColor, setPrimaryColor] = useState("#d97706");
  const [tiers, setTiers] = useState<FeeTier[]>(DEFAULT_TIERS);
  const [flatFees, setFlatFees] = useState<FlatFee[]>(DEFAULT_FLAT);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    try {
      const schedule: FeeSchedule = {
        id: user.uid,
        name: `${companyName} Rate Schedule`,
        effectiveDate: new Date().toISOString().split("T")[0],
        tiers,
        flatFees,
      };
      await setDoc(doc(db, "titleCompanies", user.uid), {
        id: user.uid,
        name: companyName,
        primaryColor,
        feeSchedule: schedule,
        createdAt: new Date().toISOString(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const parsed = (results.data as Record<string, string>[])
          .filter((r) => r.label && r.amount)
          .map((r, i) => ({
            id: `csv-${i}`,
            label: r.label,
            amount: parseFloat(r.amount) || 0,
            paidBy: (r.paidBy as "seller" | "buyer") ?? "seller",
          }));
        setFlatFees((f) => [...f, ...parsed]);
      },
    });
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Sticky toolbar */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-200 bg-white sticky top-0 z-10">
          <h1 className="text-[14px] font-semibold text-slate-900 tracking-tight">Settings</h1>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-mono">
                <CheckCircle2 size={11} /> Saved
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded bg-amber-500 hover:bg-amber-600 active:opacity-70 text-white text-[12px] font-medium transition-colors duration-100 disabled:opacity-50"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Save
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4 max-w-3xl">

          {/* Branding */}
          <section className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
              <p className="text-[12px] font-medium text-slate-600">Company branding</p>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Company name</label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full h-8 rounded bg-slate-50 border border-slate-200 px-2.5 text-[12px] text-slate-700 focus:outline-none focus:border-amber-400 focus:bg-white transition-colors duration-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Accent color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-8 w-10 rounded border border-slate-200 bg-transparent cursor-pointer shrink-0"
                  />
                  <input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 h-8 rounded bg-slate-50 border border-slate-200 px-2.5 text-[12px] text-slate-700 font-mono focus:outline-none focus:border-amber-400 focus:bg-white transition-colors duration-100"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Rate tiers */}
          <section className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <p className="text-[12px] font-medium text-slate-600">Title insurance rate tiers</p>
              <button
                onClick={() => setTiers((t) => [...t, { minPrice: 0, maxPrice: 0, rate: 0.5, baseFee: 200 }])}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Plus size={11} /> Add tier
              </button>
            </div>
            <table className="w-full text-[12px]">
              <thead className="border-b border-slate-100">
                <tr>
                  {["Min price", "Max price", "Base fee", "Rate %", ""].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-[11px] text-slate-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-1.5 w-36">
                      <NumInput value={tier.minPrice} onChange={(v) => setTiers((t) => t.map((x, j) => j === i ? { ...x, minPrice: v } : x))} prefix="$" title="Min price" />
                    </td>
                    <td className="px-3 py-1.5 w-36">
                      <NumInput value={tier.maxPrice} onChange={(v) => setTiers((t) => t.map((x, j) => j === i ? { ...x, maxPrice: v } : x))} prefix="$" title="Max price" />
                    </td>
                    <td className="px-3 py-1.5 w-32">
                      <NumInput value={tier.baseFee} onChange={(v) => setTiers((t) => t.map((x, j) => j === i ? { ...x, baseFee: v } : x))} prefix="$" title="Base fee" />
                    </td>
                    <td className="px-3 py-1.5 w-24">
                      <NumInput value={tier.rate} onChange={(v) => setTiers((t) => t.map((x, j) => j === i ? { ...x, rate: v } : x))} suffix="%" title="Rate" />
                    </td>
                    <td className="px-3 py-1.5 w-8 text-right">
                      <button onClick={() => setTiers((t) => t.filter((_, j) => j !== i))} className="text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Flat fees */}
          <section className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <p className="text-[12px] font-medium text-slate-600">Flat fees</p>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                  <Upload size={11} /> Import CSV
                  <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
                </label>
                <button
                  onClick={() => setFlatFees((f) => [...f, { id: `fee-${Date.now()}`, label: "", amount: 0, paidBy: "seller" }])}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Plus size={11} /> Add fee
                </button>
              </div>
            </div>
            <table className="w-full text-[12px]">
              <thead className="border-b border-slate-100">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] text-slate-400 font-medium">Label</th>
                  <th className="px-3 py-2 text-left text-[11px] text-slate-400 font-medium">Amount</th>
                  <th className="px-3 py-2 text-left text-[11px] text-slate-400 font-medium">Paid by</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {flatFees.map((fee, i) => (
                  <tr key={fee.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-1.5">
                      <input
                        value={fee.label}
                        onChange={(e) => setFlatFees((f) => f.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                        placeholder="Fee label"
                        className="w-full h-8 rounded bg-slate-50 border border-slate-200 px-2.5 text-[12px] text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-amber-400 focus:bg-white transition-colors duration-100"
                      />
                    </td>
                    <td className="px-3 py-1.5 w-32">
                      <NumInput value={fee.amount} onChange={(v) => setFlatFees((f) => f.map((x, j) => j === i ? { ...x, amount: v } : x))} prefix="$" title="Amount" />
                    </td>
                    <td className="px-3 py-1.5 w-28">
                      <select
                        value={fee.paidBy}
                        onChange={(e) => setFlatFees((f) => f.map((x, j) => j === i ? { ...x, paidBy: e.target.value as "seller" | "buyer" } : x))}
                        className="w-full h-8 rounded bg-slate-50 border border-slate-200 px-2 text-[12px] text-slate-700 focus:outline-none focus:border-amber-400 transition-colors duration-100"
                      >
                        <option value="seller">Seller</option>
                        <option value="buyer">Buyer</option>
                      </select>
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <button onClick={() => setFlatFees((f) => f.filter((_, j) => j !== i))} className="text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </main>
    </div>
  );
}
