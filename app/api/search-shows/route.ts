import { NextResponse } from "next/server";

const host = process.env.MEILI_HOST!;
const apiKey = process.env.MEILI_SHOWS_KEY!; // your write/search key for "shows"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "*";

  try {
    const res = await fetch(`${host}/indexes/shows/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        q,
        limit: 500, // plenty for all shows
      }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Search failed" },
      { status: 500 }
    );
  }
}
