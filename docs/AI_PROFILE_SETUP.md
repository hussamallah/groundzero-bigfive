# AI Psychological Profile Setup

This system uses a **guardrailed micro-AI rewriter** to generate personality profiles from localStorage data.

## 🏗️ Architecture

```
localStorage (browser) 
  ↓
buildPayload.ts (load facts)
  ↓
predicates.ts (compute flags)
  ↓
writePsychProfile.ts (call LLM)
  ↓
schema.ts (validate output)
  ↓
PsychProfileAI.tsx (render)
```

## ✅ What's Already Done

1. ✅ Data loader (`lib/data/buildPayload.ts`)
2. ✅ Predicate logic (`lib/logic/predicates.ts`)
3. ✅ System & user prompts (`public/prompts/`)
4. ✅ Zod schema validation (`lib/logic/schema.ts`)
5. ✅ Service wrapper (`lib/services/writePsychProfile.ts`)
6. ✅ React component (`components/assessment/PsychProfileAI.tsx`)
7. ✅ API route placeholder (`app/api/llm/route.ts`)
8. ✅ Integration in `/who` page

## 🔧 Next Step: Connect a Real LLM

The system currently returns **mock data**. To connect a real LLM provider:

### Option 1: OpenAI (GPT-4)

1. Get your API key from https://platform.openai.com/api-keys

2. Add to `.env.local`:
```bash
OPENAI_API_KEY=sk-...
```

3. Update `app/api/llm/route.ts`:
```typescript
export async function POST(req: NextRequest) {
  try {
    const { system, user, temperature } = await req.json();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // or "gpt-4o" for better quality
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        temperature,
        max_tokens: 1000,
        response_format: { type: "json_object" }, // Force JSON mode
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "OpenAI API error");
    }

    const data = await response.json();
    return NextResponse.json({ text: data.choices[0].message.content });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to call LLM" },
      { status: 500 }
    );
  }
}
```

### Option 2: Anthropic (Claude)

1. Get your API key from https://console.anthropic.com/

2. Add to `.env.local`:
```bash
ANTHROPIC_API_KEY=sk-ant-...
```

3. Install Anthropic SDK:
```bash
pnpm add @anthropic-ai/sdk
```

4. Update `app/api/llm/route.ts`:
```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { system, user } = await req.json();

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      temperature: 0,
      system,
      messages: [{ role: "user", content: user }],
    });

    const text = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    return NextResponse.json({ text });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to call LLM" },
      { status: 500 }
    );
  }
}
```

### Option 3: Google Gemini

1. Get your API key from https://aistudio.google.com/apikey

2. Add to `.env.local`:
```bash
GOOGLE_API_KEY=AIza...
```

3. Update `app/api/llm/route.ts`:
```typescript
export async function POST(req: NextRequest) {
  try {
    const { system, user } = await req.json();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${system}\n\n${user}`
            }]
          }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 1024,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    return NextResponse.json({ text });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to call LLM" },
      { status: 500 }
    );
  }
}
```

## 🛡️ Guardrails in Place

1. **Temperature = 0** → Deterministic output
2. **Zod schema validation** → Rejects malformed responses
3. **Prompt constraints** → No emojis, no scores, facts-only
4. **Predicate logic in code** → Selection happens in TypeScript, not LLM
5. **Max tokens limit** → Prevents runaway generation

## 🧪 Testing

1. Take the full assessment (or load test data into localStorage)
2. Visit `/who` page
3. The AI profile will appear below the deterministic render
4. Check console for any schema validation errors
5. Verify all facts match the buckets from localStorage

## 📊 Data Flow

```
User Assessment
  ↓ (saves to)
localStorage: gz_full_results
  ↓ (reads from)
buildPayload.ts: loadFacts()
  ↓ (creates)
GZFacts { domains: { O, C, E, A, N } }
  ↓ (computes)
predicates(facts) → { O_high, C_low, ... }
  ↓ (templates into)
System + User prompts
  ↓ (sends to)
LLM API (temperature=0)
  ↓ (returns)
Raw JSON string
  ↓ (validates with)
Zod schema
  ✓ (renders)
PsychProfileAI component
```

## 🔍 Debugging

- **"No results in localStorage"** → Take the assessment first
- **"AI did not return valid JSON"** → Check LLM response in console
- **"Profile failed schema guard"** → Check schema validation errors in console
- **Mock data showing** → LLM provider not configured yet

## 📝 Customization

To add new predicates:
1. Edit `lib/logic/predicates.ts`
2. Add new predicate like `C_highSelfDiscipline: C.bucket["Self-Discipline"] === "High"`
3. Update `public/prompts/psych_profile.user.txt` with new mandatory lines
4. Predicates are automatically passed to LLM in JSON format

To modify sections:
1. Edit `lib/logic/schema.ts` to add/remove section fields
2. Update `public/prompts/psych_profile.user.txt` with new section instructions
3. Update `components/assessment/PsychProfileAI.tsx` to render new sections

## ⚡ Performance

- First call: ~2-5s (depends on LLM provider)
- Cached by suiteHash: You can add caching logic in the API route
- Temperature=0: Same input → same output (deterministic)

---

**Current Status**: ✅ Architecture complete, mock data active
**Next Step**: Connect real LLM provider (see options above)
