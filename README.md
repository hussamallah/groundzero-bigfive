# Ground Zero — Deterministic Big Five Assessment

A zero-backend, deterministic Big Five personality assessment built with **Next.js 14 App Router**.  
All calculations happen entirely in the browser—your data never leaves the client until **you** choose to export it.

---

## ✨ Key Features

• **Per-Domain Scoring** – Calculates the Big Five for every domain rather than a single global score.  
• **Deterministic Outputs** – No random number generators; the same answers always yield the same scores.  
• **Local-Only Storage** – Results live in memory; export to JSON when you’re ready.  
• **Edge-Ready** AI summariser – An `/api/llm` route streams OpenAI completions to write a short psych profile from any result JSON.  
• **Type-Safe** with TypeScript & Zod schemas end-to-end.  
• **Dark-first UI** using minimal CSS-tokens for rapid theming.

---

## 🛠️ Getting Started

```bash
pnpm install          # install deps
pnpm dev -p 3001      # start local dev server
```

Then open <http://localhost:3001>.

### Building & Previewing Production

```bash
pnpm build            # ⇢ .next/
pnpm start -p 3001    # run compiled build
```

The project is Vercel-ready—just push to GitHub and **Import Project**.

---

## 🗂️ Project Layout

```
app/                  ← Next.js App Router routes
│   layout.tsx        ← Root layout
│   page.tsx          ← Landing page (overview + start btn)
│
├── api/llm/          ← Streaming OpenAI route (edge runtime)
│   └── route.ts
│
├── assessment/       ← Wizard container pages
│   ├── [domain]/     ← Dynamic step for each domain facet
│   │   └── page.tsx
│   └── page.tsx      ← Assessment entry page
│
├── full/             ← 120-item full test
│   └── page.tsx
│
├── results/          ← Results & export page
│   └── page.tsx
│
└── who/              ← "Who-you-are" mini prompt picker
    └── page.tsx

components/
├── assessment/       ← Pure UI components (client-only)
│   ├── Assessment.tsx
│   ├── FullAssessment.tsx
│   ├── FullResults.tsx
│   └── PsychProfileAI.tsx
└── …

lib/
├── bigfive/          ← Pure math & text for Big Five
│   ├── constants.ts
│   ├── format.ts
│   ├── logic.ts
│   ├── who.ts
│   └── who_bank_renderer.ts
├── crypto/sha256.ts  ← Browser SHA-256 helper
├── data/buildPayload.ts  ← Serialises answers for LLM
├── logic/            ← Generic Zod schemas, guards, predicates
└── services/writePsychProfile.ts ← Calls OpenAI & streams markdown

public/prompts/       ← System & user prompt templates
styles/globals.css    ← Design-token CSS variables

docs/                 ← Long-form guides & architecture notes
```

---

## 🔄 Scripts

| command        | description                           |
|----------------|---------------------------------------|
| `pnpm dev`     | Next.js dev with Turbopack            |
| `pnpm build`   | Compile for production                |
| `pnpm start`   | Start compiled build                  |
| `pnpm lint`    | Run ESLint (Next.js config)           |

---

## 📄 Exporting Results

On the **Results** page click **Export JSON** to download a portable snapshot of all question responses and computed facet/domain scores.  
The JSON can be re-imported later or fed to the `/api/llm` endpoint for an AI narrative.

---

## 🔐 Environment Variables

The only required secret is your OpenAI key for the optional AI summary route:

```bash
# .env.local
OPENAI_API_KEY=sk-…
```

If undefined, the Psych Profile AI component will hide itself.

---

## 🧑‍💻 Contributing

1. Fork & clone
2. Create a feature branch
3. Commit with conventional messages
4. Open a PR – be kind & descriptive ✨

---

## © License

MIT — Copyright © 2025 Ground Zero


