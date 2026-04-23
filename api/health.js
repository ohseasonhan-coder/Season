import { json, optionsHandler } from "./_lib/quotes.js";

export function OPTIONS() {
  return optionsHandler();
}

export function GET() {
  return json({ ok: true, service: "quotes", env: "vercel" });
}
