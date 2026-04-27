# TitleSnap AI — Setup Guide

## Quick Start

### 1. Firebase Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project named `titlesnap-ai`
3. Enable **Authentication** → Google sign-in
4. Enable **Firestore** (start in production mode)
5. Enable **Storage**
6. Copy your web app config keys

### 2. Google Cloud Vision API
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Enable the **Cloud Vision API**
3. Create an API key (restrict to Vision API)
4. Copy the key

### 3. Gemini API
1. Go to [ai.google.dev](https://ai.google.dev)
2. Create an API key for **Gemini 1.5 Pro**

### 4. Resend (Email)
1. Sign up at [resend.com](https://resend.com)
2. Verify your domain
3. Create an API key

### 5. Environment Variables
Copy `.env.local.example` to `.env.local` and fill in your keys:

```bash
cp .env.local.example .env.local
```

### 6. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules,storage
```

### 7. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Architecture

```
Upload → Firebase Storage
       → /api/ocr (Google Vision → Gemini extraction)
       → Firestore (document + extracted data)
       → /review/[id] (editable net sheet form)
       → /api/generate-pdf (branded HTML → jsPDF)
       → /api/send-email (Resend)
```

## Fee Schedule CSV Format
Upload flat fees from Settings → Import CSV:

```csv
label,amount,paidBy
Settlement Fee,395,seller
Title Search,200,seller
Recording Fees,75,seller
Survey,450,buyer
```

## Firestore Collections
- `documents/{id}` — uploaded contracts + extracted data + net sheets
- `titleCompanies/{uid}` — company branding + fee schedule

## The Moat (per CTO note)
The extraction prompt is in `src/lib/gemini-prompt.ts`.
The calculation engine is in `src/lib/calculations.ts`.
Both are the core IP — tune them for edge cases (non-standard closings, split fees, etc.).
