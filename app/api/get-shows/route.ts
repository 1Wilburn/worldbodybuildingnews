import { NextResponse } from "next/server";

const MEILI_HOST = process.env.MEILI_HOST!;
const MEILI_SHOWS_KEY = process.env.MEILI_SHOWS_KEY!; // your Write or Search key

export async function GET() {
  try {
    const res = await fetch(`${MEILI_HOST}/indexes/shows/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MEILI_SHOWS_KEY}`,
      },
      body: JSON.stringify({
        q: "",
        limit: 500,
      }),
    });

    const json = await res.json();
    return NextResponse.json(json);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Show fetch failed" });
  }
}
