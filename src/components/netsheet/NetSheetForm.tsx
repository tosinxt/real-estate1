"use client";
import { useState, useEffect, useCallback } from "react";
import { formatCurrency, buildNetSheet } from "@/lib/calculations";
import { Plus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExtractedContractData, NetSheetCalculation, FeeSchedule } from "@/types";

interface Props {
  extracted: ExtractedContractData;
  feeSchedule?: FeeSchedule;
  onNetSheetChange: (ns: NetSheetCalculation) => void;
}

interface ExtraFee { label: string; amount: string }

type FinancingType = "conventional" | "assumption" | "va" | "cash" | "fha" | "usda";
const FINANCING_OPTIONS: { key: FinancingType; label: string }[] = [
  { key: "conventional", label: "Conventional" },
  { key: "assumption", label: "Assumption" },
  { key: "va", label: "VA" },
  { key: "cash", label: "Cash" },
  { key: "fha", label: "FHA" },
  { key: "usda", label: "USDA" },
];

function CurrencyInput({
  value,
  onChange,
  placeholder = "0.00",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative flex items-center", className)}>
      <span className="absolute left-2 text-amber-600 text-sm font-semibold select-none">$</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-5 pr-2 py-1 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-amber-400 focus:bg-white transition-colors duration-100 tabular-nums"
      />
    </div>
  );
}

function FieldInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "bg-transparent border-b border-slate-200 px-1 py-0.5 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-amber-500 transition-colors duration-100 w-full",
        className
      )}
    />
  );
}

export function NetSheetForm({ extracted, feeSchedule, onNetSheetChange }: Props) {
  const [fields, setFields] = useState({
    salesPrice: String(extracted.salesPrice ?? ""),
    closingDate: extracted.closingDate ?? "",
    preparedDate: new Date().toLocaleDateString("en-US"),
    agentName: "",
    propertyAddress: extracted.propertyAddress ?? "",
    buyerName: extracted.buyerName ?? "",
    sellerName: extracted.sellerName ?? "",
    listingCommissionPct: String(extracted.listingCommissionPct ?? "3"),
    buyerCommissionPct: String(extracted.buyerCommissionPct ?? "3"),
    earnestMoney: String(extracted.earnestMoney ?? ""),
    mortgagePayoff: "",
    loanAmount: "",
    annualTaxAmount: "",
    preparedBy: "",
  });

  const [financing, setFinancing] = useState<FinancingType>("conventional");
  const [extraFees, setExtraFees] = useState<ExtraFee[]>([
    { label: "", amount: "" },
    { label: "", amount: "" },
    { label: "", amount: "" },
  ]);
  const [netSheet, setNetSheet] = useState<NetSheetCalculation | null>(null);

  const recalc = useCallback(() => {
    const sp = parseFloat(fields.salesPrice.replace(/,/g, "")) || 0;
    const payoff = parseFloat(fields.mortgagePayoff.replace(/,/g, "")) || 0;
    const taxes = parseFloat(fields.annualTaxAmount.replace(/,/g, "")) || 0;

    const extData: ExtractedContractData = {
      ...extracted,
      salesPrice: sp,
      closingDate: fields.closingDate || new Date().toISOString().split("T")[0],
      listingCommissionPct: parseFloat(fields.listingCommissionPct) || 3,
      buyerCommissionPct: parseFloat(fields.buyerCommissionPct) || 3,
      earnestMoney: parseFloat(fields.earnestMoney.replace(/,/g, "")) || 0,
    };

    const additionalFees = extraFees
      .filter((f) => f.label && parseFloat(f.amount) > 0)
      .map((f) => ({ label: f.label, amount: parseFloat(f.amount) }));

    const ns = buildNetSheet(extData, payoff, taxes, feeSchedule, additionalFees);
    setNetSheet(ns);
    onNetSheetChange(ns);
  }, [fields, extraFees, feeSchedule, extracted, onNetSheetChange]);

  useEffect(() => { recalc(); }, [recalc]);

  const set = (key: keyof typeof fields) => (v: string) =>
    setFields((f) => ({ ...f, [key]: v }));

  const brokerFee = netSheet
    ? (parseFloat(fields.listingCommissionPct) || 0) + (parseFloat(fields.buyerCommissionPct) || 0)
    : 0;

  const EMPTY_ROWS = 14;

  return (
    <div className="font-sans text-sm select-none rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      {/* ── HEADER ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="h-4 w-1 rounded-full bg-amber-500" />
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              Seller Estimate Net Sheet
            </h1>
          </div>
          <p className="text-slate-400 text-xs ml-3">Estimate a seller&apos;s net proceeds for a specific property.</p>
        </div>
        <div className="text-[11px] text-slate-400 font-mono tabular-nums text-right">
          <p>TitleSnap AI</p>
          <p className="text-amber-600">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
        </div>
      </div>

      {/* ── META FIELDS ── */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 grid grid-cols-2 gap-x-8 gap-y-2">
        <div className="grid grid-cols-[auto_1fr_auto_1fr] items-center gap-x-2 gap-y-2">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Date</span>
          <FieldInput value={fields.preparedDate} onChange={set("preparedDate")} />
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Anticipated Closing</span>
          <FieldInput value={fields.closingDate} onChange={set("closingDate")} placeholder="MM/DD/YYYY" />

          <span className="text-xs font-semibold text-slate-500 col-span-1">Property Address</span>
          <FieldInput value={fields.propertyAddress} onChange={set("propertyAddress")} className="col-span-3" />
        </div>

        <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-2">
          <span className="text-xs font-semibold text-slate-500">Agent</span>
          <FieldInput value={fields.agentName} onChange={set("agentName")} />
          <span className="text-xs font-semibold text-slate-500">Buyer</span>
          <FieldInput value={fields.buyerName} onChange={set("buyerName")} />
          <span className="text-xs font-semibold text-slate-500">Seller</span>
          <FieldInput value={fields.sellerName} onChange={set("sellerName")} />
        </div>
      </div>

      {/* ── FINANCING ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5">
        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2">Anticipating Financing</p>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          {FINANCING_OPTIONS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-1.5 cursor-pointer">
              <div
                onClick={() => setFinancing(key)}
                className={cn(
                  "h-3.5 w-3.5 rounded-sm border transition-colors cursor-pointer",
                  financing === key
                    ? "bg-amber-500 border-amber-500"
                    : "border-slate-300 bg-white hover:border-amber-400"
                )}
              />
              <span className="text-xs text-slate-600">{label}</span>
            </label>
          ))}
          <label className="flex items-center gap-1.5">
            <div className="h-3.5 w-3.5 rounded-sm border border-slate-300" />
            <span className="text-xs text-slate-600">Other</span>
            <input className="bg-transparent border-b border-slate-300 w-20 text-xs text-slate-600 px-1 focus:outline-none focus:border-amber-500 transition-colors duration-100" />
          </label>
        </div>
      </div>

      {/* ── TWO COLUMN BODY ── */}
      <div className="grid grid-cols-2">

        {/* LEFT — APPROXIMATE COSTS */}
        <div className="border-r border-slate-200">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-1.5">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Approximate Costs</p>
          </div>

          <div className="flex flex-col divide-y divide-slate-100">
            {/* Broker's fees */}
            <div className="flex items-center gap-2 px-4 py-1.5">
              <span className="text-xs font-semibold text-slate-600 w-24 shrink-0">Broker&apos;s Fees</span>
              <div className="relative w-14">
                <input
                  type="text"
                  value={brokerFee > 0 ? `${brokerFee}` : ""}
                  readOnly
                  placeholder="0"
                  className="w-full pr-5 pl-1 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-500 text-right placeholder:text-slate-300 focus:outline-none tabular-nums"
                />
                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-amber-500 text-xs">%</span>
              </div>
              <CurrencyInput
                className="flex-1"
                value={netSheet ? String(Math.round(netSheet.listingCommission + netSheet.buyerCommission)) : ""}
                onChange={() => {}}
              />
            </div>

            {/* Commission split */}
            <div className="flex items-center gap-2 px-4 py-1.5">
              <span className="text-xs text-slate-400 w-24 shrink-0">Listing ({fields.listingCommissionPct}%)</span>
              <div className="flex gap-1 flex-1">
                <input
                  type="text"
                  value={fields.listingCommissionPct}
                  onChange={(e) => setFields((f) => ({ ...f, listingCommissionPct: e.target.value }))}
                  className="w-10 text-center py-0.5 bg-transparent border-b border-slate-200 text-xs text-slate-500 focus:outline-none focus:border-amber-400 transition-colors duration-100"
                />
                <span className="text-slate-400 text-xs">/ Buyer ({fields.buyerCommissionPct}%)</span>
                <input
                  type="text"
                  value={fields.buyerCommissionPct}
                  onChange={(e) => setFields((f) => ({ ...f, buyerCommissionPct: e.target.value }))}
                  className="w-10 text-center py-0.5 bg-transparent border-b border-slate-200 text-xs text-slate-500 focus:outline-none focus:border-amber-400 transition-colors duration-100"
                />
              </div>
            </div>

            {/* Mortgage payoff */}
            <div className="flex items-center gap-2 px-4 py-1.5">
              <span className="text-xs text-slate-600 w-24 shrink-0 truncate">Mortgage Payoff</span>
              <CurrencyInput className="flex-1" value={fields.mortgagePayoff} onChange={set("mortgagePayoff")} />
            </div>

            {/* Title fees from schedule */}
            {netSheet?.lineItems
              .filter((l) => l.category === "title")
              .map((item) => (
                <div key={item.id} className="flex items-center gap-2 px-4 py-1.5">
                  <span className="text-xs text-slate-600 flex-1 truncate">{item.label}</span>
                  <CurrencyInput className="w-32" value={String(Math.round(item.amount))} onChange={() => {}} />
                </div>
              ))}

            {/* Prorated taxes */}
            <div className="flex items-center gap-2 px-4 py-1.5">
              <span className="text-xs text-slate-600 w-24 shrink-0 truncate">Annual Tax Est.</span>
              <CurrencyInput className="flex-1" value={fields.annualTaxAmount} onChange={set("annualTaxAmount")} placeholder="Annual amount" />
            </div>
            {(netSheet?.proratedTaxes ?? 0) > 0 && (
              <div className="flex items-center gap-2 px-4 py-1">
                <span className="text-xs text-slate-400 flex-1 pl-2">↳ Prorated taxes</span>
                <span className="text-xs text-slate-500 tabular-nums w-32 text-right pr-1">
                  {formatCurrency(netSheet!.proratedTaxes)}
                </span>
              </div>
            )}

            {/* Extra fee rows */}
            {extraFees.map((fee, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-1.5">
                <input
                  value={fee.label}
                  onChange={(e) => setExtraFees((f) => f.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                  placeholder="Fee description"
                  className="flex-1 bg-transparent border-b border-slate-200 text-xs text-slate-600 placeholder:text-slate-300 focus:outline-none focus:border-amber-400 transition-colors duration-100 px-1 py-0.5"
                />
                <CurrencyInput
                  className="w-32"
                  value={fee.amount}
                  onChange={(v) => setExtraFees((f) => f.map((x, j) => j === i ? { ...x, amount: v } : x))}
                />
              </div>
            ))}

            {/* Empty rows */}
            {Array.from({ length: Math.max(0, EMPTY_ROWS - extraFees.length - 5) }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center gap-2 px-4 py-1.5">
                <div className="flex-1 border-b border-slate-100 h-5" />
                <div className="w-32 border-b border-slate-100 h-5" />
              </div>
            ))}

            {/* Add row */}
            <div className="px-4 py-1.5">
              <button
                onClick={() => setExtraFees((f) => [...f, { label: "", amount: "" }])}
                className="text-xs text-amber-600 hover:text-amber-700 transition-colors"
              >
                <Plus size={11} className="inline mr-1" />Add line item
              </button>
            </div>

            {/* Total costs */}
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-t border-amber-100">
              <span className="text-xs font-bold text-slate-700 flex-1">Total Approximate Costs</span>
              <CurrencyInput className="w-32" value={netSheet ? String(Math.round(netSheet.totalDeductions)) : ""} onChange={() => {}} />
            </div>
          </div>
        </div>

        {/* RIGHT — APPROXIMATE NET PROCEEDS */}
        <div>
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-1.5">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Approximate Net Proceeds to Seller</p>
          </div>

          <div className="flex flex-col divide-y divide-slate-100">
            <div className="flex items-center gap-2 px-4 py-1.5">
              <span className="text-xs font-semibold text-slate-700 flex-1">Sales Price</span>
              <CurrencyInput className="w-36" value={fields.salesPrice} onChange={set("salesPrice")} />
            </div>

            <div className="flex items-center gap-2 px-4 py-1.5">
              <span className="text-xs text-slate-600 flex-1">Total Approximate Costs</span>
              <CurrencyInput className="w-36" value={netSheet ? String(Math.round(netSheet.totalDeductions)) : ""} onChange={() => {}} />
            </div>

            <div className="flex items-center gap-2 px-4 py-1.5">
              <span className="text-xs text-slate-600 flex-1">Less Mortgage Payoff</span>
              <CurrencyInput className="w-36" value={fields.mortgagePayoff} onChange={set("mortgagePayoff")} />
            </div>

            <div className="flex items-center gap-2 px-4 py-1.5">
              <span className="text-xs text-slate-600 flex-1">Less Earnest Money (credit)</span>
              <CurrencyInput className="w-36" value={fields.earnestMoney} onChange={set("earnestMoney")} />
            </div>

            {/* Empty rows */}
            {Array.from({ length: EMPTY_ROWS }).map((_, i) => (
              <div key={`r-empty-${i}`} className="flex items-center gap-2 px-4 py-1.5">
                <div className="flex-1 border-b border-slate-100 h-5" />
                <div className="w-36 border-b border-slate-100 h-5" />
              </div>
            ))}

            {/* Net proceeds total */}
            <div
              className={cn(
                "flex items-center gap-2 px-4 py-3 border-t",
                (netSheet?.netProceeds ?? 0) >= 0 ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100"
              )}
            >
              <span className={cn(
                "text-sm font-bold flex-1",
                (netSheet?.netProceeds ?? 0) >= 0 ? "text-slate-700" : "text-red-700"
              )}>
                Est. Net Proceeds to Seller
              </span>
              <div className="relative flex items-center w-36">
                <span className={cn(
                  "absolute left-2 font-bold text-sm",
                  (netSheet?.netProceeds ?? 0) >= 0 ? "text-amber-600" : "text-red-500"
                )}>$</span>
                <input
                  readOnly
                  value={netSheet ? Math.round(netSheet.netProceeds).toLocaleString() : "0"}
                  className={cn(
                    "w-full pl-5 pr-2 py-1 rounded font-bold text-sm tabular-nums border focus:outline-none",
                    (netSheet?.netProceeds ?? 0) >= 0
                      ? "bg-amber-50 border-amber-200 text-amber-800"
                      : "bg-red-50 border-red-200 text-red-700"
                  )}
                />
              </div>
            </div>

            {(netSheet?.netProceeds ?? 0) < 0 && (
              <div className="flex items-start gap-2 px-4 py-2 bg-red-50">
                <AlertTriangle size={12} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-600">Net is negative — check payoff amount and deductions.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="bg-slate-50 border-t border-slate-200 px-6 py-3">
        <p className="text-xs text-slate-400 italic leading-relaxed">
          Submits these costs as reasonable approximations of the charges the seller will receive.
          Since these charges are made by others, this estimate cannot be used as a guarantee.
        </p>
      </div>
      <div className="flex items-center gap-8 border-t border-slate-200 px-6 py-3 bg-white">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Prepared by</span>
          <FieldInput value={fields.preparedBy} onChange={set("preparedBy")} className="w-40" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Seller</span>
          <FieldInput value={fields.sellerName} onChange={set("sellerName")} className="w-48" />
        </div>
      </div>
    </div>
  );
}
