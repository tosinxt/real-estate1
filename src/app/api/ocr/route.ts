import { NextRequest, NextResponse } from "next/server";
import { buildExtractionPrompt } from "@/lib/gemini-prompt";
import type { ExtractedContractData } from "@/types";

// POST /api/ocr  — accepts { fileUrl: string } or multipart file
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const fileUrl = formData.get("fileUrl") as string | null;

    if (!file && !fileUrl) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Step 1: Get file bytes
    let fileBytes: Buffer;
    let mimeType: string;

    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      fileBytes = Buffer.from(arrayBuffer);
      mimeType = file.type;
    } else {
      const res = await fetch(fileUrl!);
      const arrayBuffer = await res.arrayBuffer();
      fileBytes = Buffer.from(arrayBuffer);
      mimeType = res.headers.get("content-type") ?? "application/pdf";
    }

    // Step 2: Google Vision OCR
    const visionApiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!visionApiKey) throw new Error("GOOGLE_VISION_API_KEY not set");

    const base64Content = fileBytes.toString("base64");

    // For PDFs, use async batch; for images, use sync annotate
    const isPdf = mimeType === "application/pdf";

    let ocrText = "";

    if (isPdf) {
      // For PDF: use Vision's document text detection on first page via base64
      // In production this should use async GCS batch for multi-page
      const visionRes = await fetch(
        `https://vision.googleapis.com/v1/files:annotate?key=${visionApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: [
              {
                inputConfig: {
                  content: base64Content,
                  mimeType: "application/pdf",
                },
                features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
                pages: [1, 2, 3, 4],
              },
            ],
          }),
        }
      );
      const visionData = await visionRes.json();
      console.log("[OCR] files:annotate raw response", JSON.stringify(visionData).slice(0, 500));

      // files:annotate returns: { responses: [{ responses: [{ fullTextAnnotation }] }] }
      // The outer responses[] is per-file, inner responses[] is per-page
      type PageResponse = { fullTextAnnotation?: { text?: string } };
      type FileResponse = { responses?: PageResponse[]; fullTextAnnotation?: { text?: string } };
      const fileResp: FileResponse = visionData.responses?.[0] ?? {};
      if (fileResp.responses) {
        // Nested per-page structure
        ocrText = fileResp.responses
          .map((p: PageResponse) => p.fullTextAnnotation?.text ?? "")
          .join("\n");
      } else {
        // Flat structure fallback
        ocrText = fileResp.fullTextAnnotation?.text ?? "";
      }
    } else {
      // Image
      const visionRes = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: [
              {
                image: { content: base64Content },
                features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
              },
            ],
          }),
        }
      );
      const visionData = await visionRes.json();
      ocrText = visionData.responses?.[0]?.fullTextAnnotation?.text ?? "";
    }

    console.log("[OCR] Extracted text length:", ocrText.length);
    console.log("[OCR] First 300 chars:", ocrText.slice(0, 300));

    if (!ocrText.trim()) {
      return NextResponse.json({ error: "OCR produced no text" }, { status: 422 });
    }

    // Step 3: Gemini extraction
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) throw new Error("GEMINI_API_KEY not set");

    const prompt = buildExtractionPrompt(ocrText);

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    const geminiData = await geminiRes.json();
    const rawJson =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    let extracted: ExtractedContractData = {};
    try {
      extracted = JSON.parse(rawJson);
    } catch {
      // Attempt to strip markdown fences
      const cleaned = rawJson.replace(/```json\n?|\n?```/g, "").trim();
      extracted = JSON.parse(cleaned);
    }

    extracted.rawText = ocrText;

    return NextResponse.json({ extracted, ocrText });
  } catch (err) {
    console.error("[OCR API]", err);
    return NextResponse.json(
      { error: "Processing failed", details: String(err) },
      { status: 500 }
    );
  }
}
