import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { to, subject, html, pdfBase64, fileName } = await req.json();

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) throw new Error("RESEND_API_KEY not set");

    const payload: Record<string, unknown> = {
      from: process.env.EMAIL_FROM ?? "netsheet@titlesnap.ai",
      to,
      subject: subject ?? "Your Seller Net Sheet — TitleSnap AI",
      html,
    };

    if (pdfBase64 && fileName) {
      payload.attachments = [
        {
          filename: fileName,
          content: pdfBase64,
        },
      ];
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend error: ${err}`);
    }

    const data = await res.json();
    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
