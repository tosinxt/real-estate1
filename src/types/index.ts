export type ProcessingStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "extracting"
  | "ready"
  | "error";

export interface ExtractedContractData {
  salesPrice?: number;
  closingDate?: string;
  listingCommissionPct?: number;
  buyerCommissionPct?: number;
  earnestMoney?: number;
  titleInsurancePaidBy?: "seller" | "buyer" | "split";
  surveyPaidBy?: "seller" | "buyer" | "split";
  propertyAddress?: string;
  sellerName?: string;
  buyerName?: string;
  rawText?: string;
  confidence?: Record<string, number>;
}

export interface FeeLineItem {
  id: string;
  label: string;
  amount: number;
  paidBy: "seller" | "buyer";
  category: "title" | "commission" | "tax" | "lender" | "misc";
  editable: boolean;
}

export interface NetSheetCalculation {
  salesPrice: number;
  earnestMoney: number;
  mortgagePayoff: number;
  listingCommission: number;
  buyerCommission: number;
  titleFees: number;
  proratedTaxes: number;
  miscFees: number;
  totalDeductions: number;
  netProceeds: number;
  lineItems: FeeLineItem[];
}

export interface FeeSchedule {
  id: string;
  name: string;
  effectiveDate: string;
  tiers: FeeTier[];
  flatFees: FlatFee[];
}

export interface FeeTier {
  minPrice: number;
  maxPrice: number;
  rate: number; // percentage
  baseFee: number;
}

export interface FlatFee {
  id: string;
  label: string;
  amount: number;
  paidBy: "seller" | "buyer";
}

export interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  status: ProcessingStatus;
  extractedData?: ExtractedContractData;
  netSheet?: NetSheetCalculation;
  titleCompanyId: string;
  agentEmail?: string;
}

export interface TitleCompany {
  id: string;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  feeSchedule?: FeeSchedule;
  createdAt: string;
}
