import { NextResponse } from "next/server";
import { MeiliSearch } from "meilisearch";
import { scrapeNPCShows } from "./npc-scraper";
import { scrapeIFBBProShows } from "./ifbbpro-scraper";
import { normalizeShows } from "./transform";

export async function GET() {
  try {
    const client = new MeiliSearch({
      host: process.env.MEILI_HOST!,
      apiKey: process.env.MEILI_WRITE_KEY!  // your write-shows key
    });

    const index = client.index("shows");

    // --- SCRAPE SOURCES ---
    const [npc, ifbb] = await Promise.all([
      scrapeNPCShows(),
      scrapeIFBBProShows(),
    ]);

    const combined = [...npc, ...ifbb];

    const documents = normalizeShows(combined);

    // replace all existing
    await index.deleteAllDocuments();
    const result = await index.addDocuments(documents);

    return NextResponse.json({
      ok: true,
      total: documents.length,
      shows: documents
    });

  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}
