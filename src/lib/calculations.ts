import { differenceInDays, parseISO, startOfYear, endOfYear } from "date-fns";
import type {
  NetSheetCalculation,
  ExtractedContractData,
  FeeSchedule,
  FeeLineItem,
} from "@/types";

export function calculateProratedTaxes(
  annualTaxAmount: number,
  closingDate: string
): number {
  const closing = parseISO(closingDate);
  const yearStart = startOfYear(closing);
  const yearEnd = endOfYear(closing);
  const totalDaysInYear = differenceInDays(yearEnd, yearStart) + 1;
  const daysFromJan1 = differenceInDays(closing, yearStart);
  return (annualTaxAmount / totalDaysInYear) * daysFromJan1;
}

export function calculateTitleFee(
  salesPrice: number,
  schedule: FeeSchedule
): number {
  const tier = schedule.tiers.find(
    (t) => salesPrice >= t.minPrice && salesPrice <= t.maxPrice
  );
  if (!tier) return 0;
  return tier.baseFee + salesPrice * (tier.rate / 100);
}

export function buildNetSheet(
  extracted: ExtractedContractData,
  mortgagePayoff: number,
  annualTaxAmount: number,
  feeSchedule?: FeeSchedule,
  additionalFees: Array<{ label: string; amount: number }> = []
): NetSheetCalculation {
  const salesPrice = extracted.salesPrice ?? 0;
  const earnestMoney = extracted.earnestMoney ?? 0;
  const closingDate = extracted.closingDate ?? new Date().toISOString().split("T")[0];

  const listingCommissionPct = extracted.listingCommissionPct ?? 3;
  const buyerCommissionPct = extracted.buyerCommissionPct ?? 3;

  const listingCommission = salesPrice * (listingCommissionPct / 100);
  const buyerCommission = salesPrice * (buyerCommissionPct / 100);
  const proratedTaxes = annualTaxAmount > 0 ? calculateProratedTaxes(annualTaxAmount, closingDate) : 0;
  const titleFees = feeSchedule ? calculateTitleFee(salesPrice, feeSchedule) : 0;

  const lineItems: FeeLineItem[] = [
    {
      id: "listing-commission",
      label: `Listing Commission (${listingCommissionPct}%)`,
      amount: listingCommission,
      paidBy: "seller",
      category: "commission",
      editable: false,
    },
    {
      id: "buyer-commission",
      label: `Buyer Agent Commission (${buyerCommissionPct}%)`,
      amount: buyerCommission,
      paidBy: "seller",
      category: "commission",
      editable: false,
    },
    {
      id: "prorated-taxes",
      label: "Prorated Property Taxes",
      amount: proratedTaxes,
      paidBy: "seller",
      category: "tax",
      editable: true,
    },
  ];

  if (feeSchedule) {
    lineItems.push({
      id: "title-insurance",
      label: "Title Insurance Premium",
      amount: titleFees,
      paidBy: extracted.titleInsurancePaidBy === "buyer" ? "buyer" : "seller",
      category: "title",
      editable: false,
    });

    feeSchedule.flatFees.forEach((f) => {
      lineItems.push({
        id: f.id,
        label: f.label,
        amount: f.amount,
        paidBy: f.paidBy,
        category: "title",
        editable: true,
      });
    });
  }

  additionalFees.forEach((f, i) => {
    lineItems.push({
      id: `misc-${i}`,
      label: f.label,
      amount: f.amount,
      paidBy: "seller",
      category: "misc",
      editable: true,
    });
  });

  const sellerItems = lineItems.filter((l) => l.paidBy === "seller");
  const miscFees = additionalFees.reduce((s, f) => s + f.amount, 0);

  const totalDeductions =
    mortgagePayoff +
    sellerItems.reduce((sum, l) => sum + l.amount, 0);

  const netProceeds = salesPrice - totalDeductions + earnestMoney;

  return {
    salesPrice,
    earnestMoney,
    mortgagePayoff,
    listingCommission,
    buyerCommission,
    titleFees,
    proratedTaxes,
    miscFees,
    totalDeductions,
    netProceeds,
    lineItems,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}
