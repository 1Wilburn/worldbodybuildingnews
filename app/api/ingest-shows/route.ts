import { NextResponse } from "next/server";
import { ShowDocument } from "@/app/lib/show-types";

// -------------------------------
// ENV VARIABLES (required in Vercel):
// MEILI_HOST = https://ms-xxxxxxxx.nyc.meilisearch.io
// MEILI_WRITE_SHOWS_KEY = (your Write-shows key)
// -------------------------------

const MEILI_HOST = process.env.MEILI_HOST!;
const MEILI_WRITE_SHOWS_KEY = process.env.MEILI_WRITE_SHOWS_KEY!;

export async function GET() {
  try {
    if (!MEILI_HOST || !MEILI_WRITE_SHOWS_KEY) {
      return NextResponse.json(
        { ok: false, message: "Missing MEILI env vars." },
        { status: 500 }
      );
    }

    // ------------------------------------------
    // 1. Define the show documents to insert
    // Replace with real scraped shows later
    // ------------------------------------------
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
      }
    ];

    // ------------------------------------------
    // 2. Send documents to Meilisearch
    // ------------------------------------------
    const ingest = await fetch(`${MEILI_HOST}/indexes/shows/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MEILI_WRITE_SHOWS_KEY}`,
      },
      body: JSON.stringify(shows),
    });

    const ingestResult = await ingest.json();

    // If Meilisearch returns an error
    if (ingest.status >= 400) {
      return NextResponse.json(
        { ok: false, error: ingestResult },
        { status: ingest.status }
      );
    }

    // ------------------------------------------
    // 3. Return success
    // ------------------------------------------
    return NextResponse.json({
      ok: true,
      message: "Shows index updated.",
      task: ingestResult,
      totalInserted: shows.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
