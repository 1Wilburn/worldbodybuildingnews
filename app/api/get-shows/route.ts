import { NextResponse } from "next/server";

const MEILI_HOST = process.env.MEILI_HOST!;
const MEILI_SHOWS_KEY = process.env.MEILI_WRITE_SHOWS_KEY!;

export async function GET() {
  try {
    const res = await fetch(
      `${MEILI_HOST}/indexes/shows/search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MEILI_SHOWS_KEY}`,
        },
        body: JSON.stringify({
          q: "",          // empty query = return all documents
          limit: 10000,   // enough to cover entire NPC + IFBB schedules
        }),
      }
    );

    const json = await res.json();

    return NextResponse.json({
      ok: true,
      shows: json.hits || [],
      total: json.hits?.length || 0,
    });

  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to load shows" },
      { status: 500 }
    );
  }
}
