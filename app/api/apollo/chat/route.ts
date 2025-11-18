import { NextResponse } from "next/server";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatRequest = {
  prompt?: string;
  history?: ChatMessage[];
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as ChatRequest;
  const prompt = body.prompt?.trim();
  const history = Array.isArray(body.history) ? body.history : [];

  if (!prompt) {
    return NextResponse.json(
      { error: "Prompt is required." },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  const sanitizedHistory = history
    .filter(
      (message): message is ChatMessage =>
        Boolean(message) &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0,
    )
    .slice(-10);

  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are Apollo, a concise technical writing assistant. " +
        "Focus on accurate, well-structured answers that can be saved into an archive.",
    },
    ...sanitizedHistory,
    { role: "user", content: prompt },
  ];

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages,
        temperature: 0.4,
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        payload?.error?.message || "OpenAI API returned an error response.";
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const answer =
      payload?.choices?.[0]?.message?.content?.trim() ??
      "No answer was returned.";

    return NextResponse.json({
      answer,
      usage: payload?.usage,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
