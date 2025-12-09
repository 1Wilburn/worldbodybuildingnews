import { NextResponse } from "next/server";

const MEILI_HOST = process.env.MEILI_HOST;
const MEILI_API_KEY = process.env.MEILI_API_KEY; // your read/search key

export async function GET() {
  if (!MEILI_HOST || !MEILI_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Search not configured. Please set MEILI_HOST and MEILI_API_KEY in Vercel env.",
      },
      { status: 500 }
    );
  }

  try {
    // Empty query q: "" -> Meilisearch returns all docs (up to limit)
    const res = await fetch(`${MEILI_HOST}/indexes/shows/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MEILI_API_KEY}`,
      },
      body: JSON.stringify({
        q: "",
        limit: 1000, // plenty for all 2025+ shows
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Meilisearch error: ${res.status} ${text}` },
        { status: 500 }
      );
    }

    const data = await res.json();
    // data.hits should be array of documents from your `shows` index
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err?.message || "Failed to fetch shows from Meilisearch.",
      },
      { status: 500 }
    );
  }
}
