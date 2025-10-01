import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { system, user, temperature } = await req.json();
    const credential = (process.env.GOOGLE_API_KEY || "").trim();
    const model = (process.env.GEMINI_MODEL || "gemini-2.5-flash-lite").trim();

    if (!credential) {
      return NextResponse.json(
        { error: "Missing GOOGLE_API_KEY on server" },
        { status: 500 }
      );
    }

    const looksLikeApiKey = credential.startsWith("AIza");
    let url: string;
    let headers: Record<string, string> = { "Content-Type": "application/json" };
    let body: any;

    if (looksLikeApiKey) {
      // Google AI Studio Generative Language API (API key)
      url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${credential}`;
      body = {
        contents: [
          {
            parts: [{ text: `${system}\n\n${user}` }]
          }
        ],
        generationConfig: {
          temperature: typeof temperature === "number" ? temperature : 0,
          topP: 1,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        }
      };
    } else {
      // Vertex AI publishers API (OAuth bearer token)
      url = `https://aiplatform.googleapis.com/v1/publishers/google/models/${encodeURIComponent(model)}:generateContent`;
      headers = { ...headers, Authorization: `Bearer ${credential}` };
      body = {
        contents: [
          {
            role: "user",
            parts: [{ text: `${system}\n\n${user}` }]
          }
        ],
        generationConfig: {
          temperature: typeof temperature === "number" ? temperature : 0,
          topP: 1,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        }
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.error?.message || error?.message || "LLM API error");
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
