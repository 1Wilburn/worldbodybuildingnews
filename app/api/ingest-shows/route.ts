import { NextResponse } from "next/server";
import { MeiliSearch } from "meilisearch";
import cheerio from "cheerio";
import { normalizeDate } from "@/app/lib/normalize-date";

export const dynamic = "force-dynamic";

/**
 * Allow GET for browser testing
 * Require secret key for authorization
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (secret !== process.env.INGEST_SECRET) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  return runIngestion();
}

export async function POST(request: Request) {
  const { secret } = await request.json();

  if (secret !== process.env.INGEST_SECRET) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  return runIngestion();
}

// ---------------------------
// MAIN INGESTION LOGIC
// ---------------------------
async function runIngestion() {
  const host = process.env.MEILI_HOST!;
  const key = process.env.MEILI_WRITE_SHOWS_KEY!;

  const client = new MeiliSearch({ host, apiKey: key });
  const index = client.index("shows");

  const res = await fetch("https://npcnewsonline.com/contests/");
  const html = await res.text();
  const $ = cheerio.load(html);

  const shows: any[] = [];

  $(".contest-item").each((_, el) => {
    const title = $(el).find(".contest-title").text().trim();
    const location = $(el).find(".contest-location").text().trim();
    const dateText = $(el).find(".contest-date").text().trim();

    shows.push({
      title,
      location,
      date: normalizeDate(dateText),
      sourceUrl: "https://npcnewsonline.com/contests/",
    });
  });

  const task = await index.addDocuments(shows);

  return NextResponse.json({
    success: true,
    inserted: shows.length,
    task,
  });
}
