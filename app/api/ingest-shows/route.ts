import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { MeiliSearch } from "meilisearch";
import { normalizeDate } from "@/app/lib/normalize-date";

/* ENV VARS */
const MEILI_HOST = process.env.MEILI_HOST!;
const MEILI_WRITE_KEY = process.env.MEILI_WRITE_SHOWS_KEY!;

/* ALLOW BROWSER GET / HEAD / POST */
export const GET = handler;
export const POST = handler;
export const HEAD = () => new Response("OK", { status: 200 });

async function handler() {
  try {
    const client = new MeiliSearch({
      host: MEILI_HOST,
      apiKey: MEILI_WRITE_KEY,
    });

    const index = client.index("shows");

    const urls = [
      "https://npcnewsonline.com/contests/",
      "https://ifbb.com/events/",
    ];

    const allShows: any[] = [];

    for (const url of urls) {
      const res = await fetch(url);
      const html = await res.text();
      const $ = cheerio.load(html);

      $("article, .event-item, .contest-item").each((i, el) => {
        const title = $(el).find("h2, .event-title, .contest-title").text().trim();
        const dateText = $(el).find(".date, time, .event-date").text().trim();
        const location = $(el).find(".location, .event-location").text().trim();

        if (!title) return;

        allShows.push({
          id: `${Date.now()}-${i}`,
          title,
          location: location || "",
          date: normalizeDate(dateText),
          sourceUrl: url,
        });
      });
    }

    if (allShows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No shows scraped",
      });
    }

    const task = await index.addDocuments(allShows);

    return NextResponse.json({
      success: true,
      count: allShows.length,
      data: task,
    });

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
