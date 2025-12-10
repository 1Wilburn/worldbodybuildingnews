import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { v4 as uuidv4 } from "uuid";
import { parse, format } from "date-fns";

/* -------------------------------------------
   Utility: Safe date normalizer
-------------------------------------------- */
function normalizeDate(dateText: string | null): string {
  if (!dateText || typeof dateText !== "string") {
    return ""; // fallback
  }

  try {
    const parsed = parse(dateText.trim(), "MMMM d, yyyy", new Date());
    return format(parsed, "yyyy-MM-dd");
  } catch (error) {
    return "";
  }
}

/* -------------------------------------------
   Utility: Fetch HTML safely
-------------------------------------------- */
async function fetchHTML(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.text();
  } catch (error) {
    return null;
  }
}

/* -------------------------------------------
   SCRAPER: Example ingestion from a webpage
-------------------------------------------- */
async function scrapeShows() {
  const url = "https://www.ifbbpro.com/events"; // example URL
  const html = await fetchHTML(url);

  if (!html) return [];

  const $ = cheerio.load(html);
  const shows: any[] = [];

  $(".event-card").each((i, el) => {
    const title = $(el).find(".event-title").text().trim() || "Untitled Event";
    const location = $(el).find(".event-location").text().trim() || "";
    const dateText = $(el).find(".event-date").text().trim() || null;

    const show = {
      id: uuidv4(),
      title,
      location,
      date: normalizeDate(dateText),
      sourceUrl: url
    };

    shows.push(show);
  });

  return shows;
}

/* -------------------------------------------
   POST: Ingest into Meilisearch
-------------------------------------------- */
export async function POST() {
  try {
    const shows = await scrapeShows();

    const res = await fetch(
      `${process.env.MEILI_HOST}/indexes/shows/documents`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MEILI_WRITE_KEY}`
        },
        body: JSON.stringify(shows)
      }
    );

    const data = await res.json();

    return NextResponse.json({
      success: true,
      count: shows.length,
      data
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/* -------------------------------------------
   GET: Allows triggering ingestion manually
-------------------------------------------- */
export async function GET() {
  return POST();
}
