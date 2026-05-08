<<<<<<< HEAD
# 🚀 PlacePrep AI — Setup Guide

## ✅ Prerequisites
Install these before starting:
1. **Node.js 18+** → https://nodejs.org
2. **Firebase project** (Auth + Firestore)
3. **VS Code** (already have)
4. **Git** (optional)
5. **Python 3.9+** (for local code execution + PaddleOCR)

---

## 📦 Step 1 — Install Dependencies

Open VS Code terminal (`Ctrl + ~`) and run:

```bash
npm install
```

Wait for all packages to install (~2 mins first time).

---

## 🔑 Step 2 — Configure Environment

Edit the `.env.local` file in the root folder:

```env
# Firebase (required)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin (for server routes + seeds)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# LLM for recommendations (Groq)
GROQ_API_KEY=...
GROQ_MODEL=llama-3.1-8b-instant

# Resume OCR (PaddleOCR - local Python)
PADDLEOCR_PYTHON=python
PADDLEOCR_LANG=en
PADDLEOCR_MAX_PAGES=6

# Local code execution
PYTHON_EXECUTABLE=python
```

### Firebase Setup (Auth + Firestore)
1. Go to https://console.firebase.google.com
2. Create a project and enable **Email/Password** auth
3. Create Firestore database (test mode for dev)
4. Copy the web config to `NEXT_PUBLIC_FIREBASE_*` keys
5. Generate a service account and paste into `FIREBASE_*` keys

---

## 🚀 Step 3 — Start the App

```bash
npm run dev
```

Open browser: **http://localhost:3000**

---

## 🎮 Step 4 — Use the App

Use the Signup/Login screens with Firebase Auth.

---

## 📁 Project Structure

```
placement-prep/
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── login/          ← Login page
│   │   │   └── signup/         ← Signup page
│   │   ├── dashboard/          ← Main dashboard
│   │   ├── aptitude/           ← Aptitude tests
│   │   ├── coding/             ← Code editor (Monaco)
│   │   ├── resume/             ← AI Resume analyzer
│   │   ├── recommend/          ← AI recommendations
│   │   ├── analytics/          ← Performance charts
│   │   └── api/                ← Backend API routes
│   ├── components/             ← Reusable components
│   ├── lib/                    ← DB connection, models
│   └── styles/                 ← Global CSS
├── .env.local                  ← Your config (edit this!)
├── package.json
└── README.md
```

---

## 🧩 Modules Available

| Module | Route | Description |
|--------|-------|-------------|
| Login | `/auth/login` | JWT authentication |
| Signup | `/auth/signup` | User registration |
| Dashboard | `/dashboard` | Overview, stats, charts |
| Aptitude | `/aptitude` | Timed MCQ tests |
| Coding | `/coding` | Monaco code editor |
| Resume | `/resume` | AI PDF analyzer |
| Recommendations | `/recommend` | AI study planner |
| Analytics | `/analytics` | Performance charts |

---

## 🤖 AI + OCR

- **Recommendations** use Groq API (OpenAI-compatible endpoint).
- **Resume OCR** uses PaddleOCR (local Python) when PDFs are scanned.

---

## 🐛 Troubleshooting

### "Module not found" error:
```bash
rm -rf node_modules
npm install
```

### Firebase connection error:
- Check `NEXT_PUBLIC_FIREBASE_*` and `FIREBASE_*` in `.env.local`
- Ensure Firestore database exists and Auth provider is enabled

### Port already in use:
```bash
npm run dev -- -p 3001
```
Then open http://localhost:3001

### TypeScript errors:
```bash
npm run build
```
Check the error message — usually a missing import.

---

## 🏗️ Tools & Tech

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **UI/UX**: Recharts, Monaco Editor, Framer Motion, Lucide Icons
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore (client + admin)
- **Auth**: Firebase Auth (Email/Password)
- **AI**: Groq LLM API for recommendations
- **Resume OCR**: PaddleOCR (local Python)
- **Resume Parsing**: pdf-parse
- **Code Execution**: Local Python runner (no Docker)
- **PDF Report**: pdf-lib
- **Fonts**: Plus Jakarta Sans, Sora, JetBrains Mono

---

## 📊 For Viva / Presentation

Key talking points:
1. **Architecture**: Next.js App Router + API routes + Firebase
2. **Auth**: Firebase Authentication
3. **AI Layer**: Groq LLM for recommendations, OCR + PDF analysis
4. **Practice**: Aptitude tests + DSA coding editor
5. **Analytics**: Recharts for data visualization
6. **Design**: Light theme with orange/purple accents

---

Built with ❤️ for placement preparation
=======
# ai_powered_placement_prep
>>>>>>> 8589b3d58c3aca9f17339abe9398c57fb40baa9f
