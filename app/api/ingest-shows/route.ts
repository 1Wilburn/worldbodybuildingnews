import { NextResponse } from "next/server";
import cheerio from "cheerio";
import { MeiliSearch } from "meilisearch";
import { normalizeDate } from "@/app/lib/normalize-date";

export const dynamic = "force-dynamic";

// Allow browser GET for testing
export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (secret !== process.env.INGEST_SECRET) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  return ingestShows();
}

// Allow POST (optional)
export async function POST(request: Request) {
  const { secret } = await request.json();
  if (secret !== process.env.INGEST_SECRET) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  return ingestShows();
}

// ----------------------
// MAIN INGEST FUNCTION
// ----------------------
async function ingestShows() {
  try {
    const res = await fetch("https://npcnewsonline.com/contests/", {
      headers: { "User-Agent": "Mozilla/5.0" } // avoids blocking
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    const shows: any[] = [];

    $(".contest-item").each((_, el) => {
      const title = $(el).find(".contest-title").text().trim();
      const location = $(el).find(".contest-location").text().trim();
      const dateText = $(el).find(".contest-date").text().trim();

      if (!title) return;

      shows.push({
        title,
        location,
        date: normalizeDate(dateText),
        sourceUrl: "https://npcnewsonline.com/contests/"
      });
    });

    // Connect to Meilisearch
    const client = new MeiliSearch({
      host: process.env.MEILI_HOST!,
      apiKey: process.env.MEILI_WRITE_SHOWS_KEY!
    });

    const index = client.index("shows");

    const task = await index.addDocuments(shows);

    return NextResponse.json({
      success: true,
      count: shows.length,
      task
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
