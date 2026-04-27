"use client";
import { useState, useCallback } from "react";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { ExtractedContractData, ProcessingStatus } from "@/types";

const log = (step: string, data?: unknown) => {
  console.log(`[TitleSnap Upload] ${step}`, data ?? "");
};

interface UploadState {
  status: ProcessingStatus;
  progress: number;
  documentId: string | null;
  extracted: ExtractedContractData | null;
  error: string | null;
}

export function useDocumentUpload(userId: string) {
  const [state, setState] = useState<UploadState>({
    status: "idle",
    progress: 0,
    documentId: null,
    extracted: null,
    error: null,
  });

  const upload = useCallback(
    async (file: File) => {
      setState({ status: "uploading", progress: 0, documentId: null, extracted: null, error: null });

      const currentUser = auth.currentUser;
      log("Auth state", { uid: currentUser?.uid ?? null, email: currentUser?.email ?? null });

      if (!currentUser) {
        const msg = "Not signed in — please sign in before uploading";
        setState((s) => ({ ...s, status: "error", error: msg }));
        throw new Error(msg);
      }

      log("File", { name: file.name, size: file.size, type: file.type });

      try {
        // 1. Create Firestore record
        log("Step 1 — Creating Firestore document...");
        const docRef = await addDoc(collection(db, "documents"), {
          fileName: file.name,
          status: "processing",
          uploadedAt: serverTimestamp(),
          titleCompanyId: currentUser.uid,
        });
        log("Step 1 — Done", { id: docRef.id });
        setState((s) => ({ ...s, documentId: docRef.id, progress: 20 }));

        // 2. Send file directly to OCR API (no Storage)
        log("Step 2 — Sending to OCR API...");
        setState((s) => ({ ...s, status: "processing", progress: 40 }));

        const formData = new FormData();
        formData.append("file", file);

        const ocrRes = await fetch("/api/ocr", { method: "POST", body: formData });
        log("Step 2 — OCR response", { status: ocrRes.status, ok: ocrRes.ok });

        if (!ocrRes.ok) {
          const body = await ocrRes.text();
          log("Step 2 — OCR error", body);
          throw new Error(`OCR failed (${ocrRes.status}): ${body}`);
        }

        const ocrJson = await ocrRes.json();
        log("Step 2 — Extracted fields", ocrJson.extracted);
        const { extracted } = ocrJson;

        setState((s) => ({ ...s, progress: 80 }));

        // 3. Save extracted data to Firestore
        log("Step 3 — Saving to Firestore...");
        await updateDoc(doc(db, "documents", docRef.id), {
          extractedData: extracted,
          status: "ready",
        });
        log("Step 3 — Done");

        setState((s) => ({ ...s, status: "ready", extracted, progress: 100 }));
        return { documentId: docRef.id, extracted };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log("ERROR", { msg, raw: err });
        setState((s) => ({ ...s, status: "error", error: msg }));
        throw err;
      }
    },
    [userId]
  );

  const reset = useCallback(() => {
    setState({ status: "idle", progress: 0, documentId: null, extracted: null, error: null });
  }, []);

  return { ...state, upload, reset };
}
