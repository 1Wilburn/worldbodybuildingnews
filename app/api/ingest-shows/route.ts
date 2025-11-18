import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

/**
 * Fetch HTML and load cheerio
 */
async function load(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    cache: "no-cache"
  });
  const html = await res.text();
  return cheerio.load(html);
}

/**
 * Scrape IFBB Pro Show Listings (list page)
 */
async function scrapeIFBBShowList() {
  const url = "https://ifbbpro.com/";
  const $ = await load(url);

  const events: any[] = [];

  $("article").each((i, el) => {
    const title = $(el).find("h2").text().trim();
    const link = $(el).find("a").attr("href") ?? "";
    const date = $(el).find(".published").text().trim();

    if (!title || !link) return;

    events.push({
      id: `ifbbpro-${i}`,
      federation: "IFBB Pro League",
      title,
      date,
      url: link
    });
  });

  return events;
}

/**
 * Scrape NPC News Online Show Listings (list page)
 */
async function scrapeNPCShowList() {
  const url = "https://npcnewsonline.com/schedule/";
  const $ = await load(url);

  const events: any[] = [];

  $(".fusion-post-wrapper").each((i, el) => {
    const title = $(el).find(".fusion-post-title").text().trim();
    const link = $(el).find("a").attr("href") ?? "";
    const date = $(el).find(".fusion-alignleft").text().trim();

    if (!title || !link) return;

    events.push({
      id: `npc-${i}`,
      federation: "NPC",
      title,
      date,
      url: link
    });
  });

  return events;
}

/**
 * Send data to MeiliSearch
 */
async function indexShows(documents: any[]) {
  const host = process.env.MEILI_HOST!;
  const apiKey = process.env.MEILI_MASTER_KEY!;

  const res = await fetch(`${host}/indexes/shows/documents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(documents)
  });

  const data = await res.json();
  return data;
}

/**
 * MAIN ROUTE HANDLER
 */
export async function GET() {
  try {
    console.log("Scraping IFBB & NPC show data…");

    const [ifbb, npc] = await Promise.all([
      scrapeIFBBShowList(),
      scrapeNPCShowList()
    ]);

    const allShows = [...ifbb, ...npc];

    console.log(`Found ${allShows.length} shows.`);

    const result = await indexShows(allShows);

    return NextResponse.json({
      ok: true,
      total: allShows.length,
      result,
      message: "Shows index updated."
    });
  } catch (err: any) {
    return NextResponse.json
