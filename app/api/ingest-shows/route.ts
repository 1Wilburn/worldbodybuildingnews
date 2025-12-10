import { NextResponse } from "next/server";
import * as cheerio from "cheerio"; 
import { MeiliSearch } from "meilisearch";
import { normalizeDate } from "@/app/lib/normalize-date";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");

  if (secret !== process.env.INGEST_SECRET) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  return runIngest();
}

export async function POST(req: Request) {
  const { secret } = await req.json();
  if (secret !== process.env.INGEST_SECRET) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
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

    $(".masonry-item").each((_, el) => {
      const title =
        $(el).find(".contest-title").text().trim() ||
        $(el).find("h3").text().trim() ||
        null;

      if (!title) return;

      const location =
        $(el).find(".contest-location").text().trim() ||
        $(el).find(".location").text().trim() ||
        "";

      const dateText =
        $(el).find(".contest-date").text().trim() ||
        $(el).find(".date").text().trim() ||
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
        error: "Selectors returned no shows. Page structure likely changed.",
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
      {
        success: false,
        error: err?.message || "Unknown server error",
      },
      { status: 500 }
    );
  }
}
