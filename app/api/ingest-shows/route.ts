import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { MeiliSearch } from "meilisearch";
import { normalizeDate } from "@/app/lib/normalize-date";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");

  if (secret !== process.env.INGEST_SECRET) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  return runIngest();
}

async function runIngest() {
  try {
    const contestsUrl = "https://npcnewsonline.com/contests/";

    const response = await fetch(contestsUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    const shows: any[] = [];

    $(".contest-list-item").each((_, el) => {
      const title = $(el).find("h2.title").text().trim();
      if (!title) return;

      const location =
        $(el).find(".location").text().trim() ||
        $(el).find(".contest-location").text().trim() ||
        "";

      const dateText =
        $(el).find(".date").text().trim() ||
        $(el).find(".contest-date").text().trim() ||
        "";

      const link = $(el).find("a").attr("href") || contestsUrl;

      shows.push({
        title,
        location,
        date: normalizeDate(dateText),
        sourceUrl: link,
      });
    });

    if (shows.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Selectors returned no shows. NPC page structure changed.",
      });
    }

    const client = new MeiliSearch({
      host: process.env.MEILI_HOST!,
      apiKey: process.env.MEILI_WRITE_SHOWS_KEY!,
    });

    const index = client.index("shows");
    const task = await index.addDocuments(shows);

    return NextResponse.json({
      success: true,
      count: shows.length,
      task,
    });

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
