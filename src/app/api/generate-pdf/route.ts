import { NextRequest, NextResponse } from "next/server";
import { formatCurrency } from "@/lib/calculations";
import type { NetSheetCalculation, ExtractedContractData, TitleCompany } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      netSheet,
      extracted,
      company,
      agentName,
    }: {
      netSheet: NetSheetCalculation;
      extracted: ExtractedContractData;
      company: TitleCompany;
      agentName: string;
    } = body;

    const html = buildNetSheetHtml({ netSheet, extracted, company, agentName });

    // Return HTML for client-side PDF generation via html2canvas + jsPDF
    return NextResponse.json({ html });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

function buildNetSheetHtml({
  netSheet,
  extracted,
  company,
  agentName,
}: {
  netSheet: NetSheetCalculation;
  extracted: ExtractedContractData;
  company: TitleCompany;
  agentName: string;
}): string {
  const accent = company.primaryColor ?? "#d97706";
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const rows = netSheet.lineItems
    .map(
      (item) => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #1f2937;color:#d1d5db;">${item.label}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #1f2937;text-align:right;color:#f3f4f6;font-variant-numeric:tabular-nums;">
        ${item.paidBy === "seller" ? `(${formatCurrency(item.amount)})` : formatCurrency(item.amount)}
      </td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#111827; color:#f9fafb; font-family:'Helvetica Neue',Arial,sans-serif; }
  .page { max-width:720px; margin:0 auto; padding:48px 40px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px; border-bottom:2px solid ${accent}; padding-bottom:24px; position:relative; overflow:hidden; }
  .header-pattern { position:absolute; inset:0; opacity:0.13; background: radial-gradient(25px at calc(100% + calc(25px * 0.866)) 50%, #762b52 99%, transparent 101%) 0 calc(-5 * 25px / 2), radial-gradient(25px at calc(100% + calc(25px * 0.866)) 50%, #762b52 99%, transparent 101%) calc(-2 * calc(25px * 0.866)) calc(25px / 2), radial-gradient(25px at 100% 50%, #d36164 99%, transparent 101%) 0 calc(-2 * 25px), radial-gradient(25px, #762b52 99%, transparent 101%) calc(25px * 0.866) calc(-5 * 25px / 2), radial-gradient(25px, #d36164 99%, transparent 101%) calc(25px * 0.866) calc(5 * 25px / 2), radial-gradient(25px at 100% 100%, #762b52 99%, transparent 101%) 0 calc(-1 * 25px), radial-gradient(25px at 0% 50%, #762b52 99%, transparent 101%) 0 calc(-4 * 25px), radial-gradient(25px, #762b52 99%, transparent 101%) calc(25px * 0.866) calc(25px / 2) #d36164; background-size: calc(4 * calc(25px * 0.866)) calc(6 * 25px); }
  .company-name { font-size:22px; font-weight:700; color:#fff; letter-spacing:-0.02em; }
  .doc-title { font-size:13px; text-transform:uppercase; letter-spacing:0.08em; color:#6b7280; margin-top:4px; }
  .meta { text-align:right; font-size:13px; color:#6b7280; line-height:1.8; }
  .property { background:#1f2937; border-radius:8px; padding:20px 24px; margin-bottom:32px; }
  .property-address { font-size:18px; font-weight:600; color:#fff; letter-spacing:-0.01em; }
  .property-meta { font-size:13px; color:#9ca3af; margin-top:4px; }
  .sales-price { display:flex; justify-content:space-between; align-items:center; background:#1f2937; border-radius:8px; padding:16px 24px; margin-bottom:8px; }
  .sp-label { font-size:13px; color:#9ca3af; text-transform:uppercase; letter-spacing:0.06em; }
  .sp-value { font-size:28px; font-weight:700; color:#fff; font-variant-numeric:tabular-nums; letter-spacing:-0.02em; }
  table { width:100%; border-collapse:collapse; margin-bottom:8px; }
  .section-label { font-size:11px; text-transform:uppercase; letter-spacing:0.1em; color:${accent}; padding:16px 16px 8px; }
  .net-row { background:${accent}22; }
  .net-row td { padding:16px; font-size:20px; font-weight:700; color:${accent}; font-variant-numeric:tabular-nums; }
  .footer { margin-top:40px; padding-top:24px; border-top:1px solid #374151; font-size:11px; color:#4b5563; text-align:center; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-pattern"></div>
    <div style="position:relative;z-index:1;">
      <div class="company-name">${company.name}</div>
      <div class="doc-title">Seller Net Sheet</div>
    </div>
    <div class="meta" style="position:relative;z-index:1;">
      <div>Prepared: ${today}</div>
      <div>Agent: ${agentName}</div>
      ${extracted.closingDate ? `<div>Est. Close: ${extracted.closingDate}</div>` : ""}
    </div>
  </div>

  <div class="property">
    <div class="property-address">${extracted.propertyAddress ?? "Property Address"}</div>
    <div class="property-meta">Seller: ${extracted.sellerName ?? "—"} &nbsp;·&nbsp; Buyer: ${extracted.buyerName ?? "—"}</div>
  </div>

  <div class="sales-price">
    <div class="sp-label">Contract Sales Price</div>
    <div class="sp-value">${formatCurrency(netSheet.salesPrice)}</div>
  </div>

  <table>
    <tr><td colspan="2" class="section-label">Deductions</td></tr>
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #1f2937;color:#d1d5db;">Mortgage Payoff</td>
      <td style="padding:10px 16px;border-bottom:1px solid #1f2937;text-align:right;color:#f3f4f6;font-variant-numeric:tabular-nums;">(${formatCurrency(netSheet.mortgagePayoff)})</td>
    </tr>
    ${rows}
  </table>

  <table>
    <tr class="net-row">
      <td>Estimated Net Proceeds to Seller</td>
      <td style="text-align:right;">${formatCurrency(netSheet.netProceeds)}</td>
    </tr>
  </table>

  <div class="footer">
    This is an estimate only. Actual closing figures may vary. Contact ${company.name} for a complete Closing Disclosure.
    &nbsp;·&nbsp; Prepared with TitleSnap AI
  </div>
</div>
</body>
</html>`;
}
