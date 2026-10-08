import { NextResponse } from "next/server";

const TO = "jamiesunderland@me.com";
const MAX_LENGTH = 5000;
const WINDOW_MS = 60 * 60 * 1000;
const MAX_HITS = 5;

const hits = new Map<string, { count: number; reset: number }>();

function limited(ip: string) {
  const now = Date.now();
  const current = hits.get(ip);
  if (!current || current.reset < now) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_HITS;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (process.env.NODE_ENV !== "development" && limited(ip)) {
    return NextResponse.json({ error: "Too many notes. Try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a note." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Send a note." }, { status: 400 });
  }

  const { message, email, company } = body as Record<string, unknown>;
  if (typeof company === "string" && company.trim()) {
    return NextResponse.json({ ok: true });
  }

  if (typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "Write a note first." }, { status: 400 });
  }

  const note = message.trim();
  if (note.length > MAX_LENGTH) {
    return NextResponse.json({ error: "That's a bit long. Shorten it and try again." }, { status: 400 });
  }

  let replyTo: string | undefined;
  if (typeof email === "string" && email.trim()) {
    const candidate = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) {
      return NextResponse.json({ error: "Your email doesn't look right" }, { status: 400 });
    }
    replyTo = candidate;
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Email isn't connected yet." }, { status: 503 });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.FEEDBACK_FROM ?? "Jamie Sunderland <onboarding@resend.dev>",
      to: [TO],
      reply_to: replyTo,
      subject: "Feedback from jamiesunderland.md",
      text: replyTo ? `${note}\n\nFrom: ${replyTo}` : note,
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Couldn't send that. Try again in a minute." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
