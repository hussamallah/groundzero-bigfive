import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { system, user, temperature } = await req.json();
    const apiKey = (process.env.GOOGLE_API_KEY || "").trim();
    const model = (process.env.GEMINI_MODEL || "gemini-2.5-flash-lite").trim();

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GOOGLE_API_KEY on server" },
        { status: 500 }
      );
    }
    
    // Use Vertex publishers endpoint with API key (no project/locations required)
    const url = `https://aiplatform.googleapis.com/v1/publishers/google/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${system}\n\n${user}` }]
          }
        ],
        generationConfig: {
          temperature: typeof temperature === "number" ? temperature : 0,
          topP: 1,
          maxOutputTokens: 1200,
          responseMimeType: "application/json",
        }
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.error?.message || "Google AI Studio API error");
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return NextResponse.json({ text });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to call LLM" },
      { status: 500 }
    );
  }
}
