import { NextResponse } from "next/server";

// ENV VARIABLES (must exist in Vercel)
// MEILI_HOST = https://ms-xxxxx.nyc.meilisearch.io
// MEILI_WRITE_SHOWS_KEY = your write-shows scoped key

const MEILI_HOST = process.env.MEILI_HOST!;
const WRITE_KEY = process.env.MEILI_WRITE_SHOWS_KEY!;

export async function GET() {
  if (!MEILI_HOST || !WRITE_KEY) {
    return NextResponse.json(
      { ok: false, message: "Missing Meilisearch env vars" },
      { status: 500 }
    );
  }

  try {
    // -----------------------------------------------------------
    // 1. Define show documents
    // -----------------------------------------------------------
    const shows = [
      {
        id: "npc-east-2025",
        federation: "NPC",
        title: "NPC East Coast Championships 2025",
        date: "2025-11-22",
        location: "New York, NY",
        url: "https://npcnewsonline.com",
      },
      {
        id: "ifbb-pro-miami-2025",
        federation: "IFBB Pro League",
        title: "IFBB Pro Miami 2025",
        date: "2025-11-29",
        location: "Miami, FL",
        url: "https://ifbbpro.com",
      },
    ];

    // -----------------------------------------------------------
    // 2. Delete existing documents (so we don’t duplicate)
    // -----------------------------------------------------------
    const deleteRes = await fetch(`${MEILI_HOST}/indexes/shows/documents`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${WRITE_KEY}`,
        "Content-Type": "application/json",
      }
    });

    // If delete fails, warn but continue
    let deleteResult = null;
    try {
      deleteResult = await deleteRes.json();
    } catch {}

    // -----------------------------------------------------------
    // 3. Insert the NEW documents
    // -----------------------------------------------------------
    const ingest = await fetch(`${MEILI_HOST}/indexes/shows/documents`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WRITE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(shows),
    });

    const ingestResult = await ingest.json();

    if (ingest.status >= 400) {
      return NextResponse.json(
        { ok: false, message: "Insert error", error: ingestResult },
        { status: ingest.status }
      );
    }

    // -----------------------------------------------------------
    // 4. Return success
    // -----------------------------------------------------------
    return NextResponse.json({
      ok: true,
      message: "Shows index updated successfully.",
      deleted: deleteResult,
      insertedCount: shows.length,
      task: ingestResult,
    });

  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
