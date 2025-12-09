import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const MEILI_HOST = process.env.MEILI_HOST!;
const MEILI_SHOWS_KEY = process.env.MEILI_SHOWS_KEY!;

// -------------------------------
// Utility: fetch page HTML
// -------------------------------
async function fetchHTML(url: string): Promise<string> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    return await res.text();
  } catch (err) {
    console.error("Fetch failed:", url);
    return "";
  }
}

// -------------------------------
// NPC: Parse individual show page
// -------------------------------
function parseNPCShowPage(html: string, url: string) {
  const $ = cheerio.load(html);

  const title =
    $("h1").first().text().trim() ||
    $(".entry-title").first().text().trim() ||
    "NPC Show";

  const dateText =
    $("time").first().text().trim() ||
    $(".event-date").first().text().trim() ||
    "";

  const location =
    $(".tribe-events-venue").first().text().trim().replace(/\s+/g, " ") ||
    $(".location").first().text().trim().replace(/\s+/g, " ") ||
    "";

  return {
    id: url,
    federation: "NPC",
    name: title,
    date: dateText,
    location,
    url,
  };
}

// -------------------------------
// IFBB PRO: Parse individual show page
// -------------------------------
function parseIFBBShowPage(html: string, url: string) {
  const $ = cheerio.load(html);

  const title =
    $("h1").first().text().trim() ||
    $(".fusion-title").first().text().trim() ||
    "IFBB Pro Show";

  const dateText =
    $(".fusion-events-date").first().text().trim() ||
    $("time").first().text().trim() ||
    "";

  const location =
    $(".fusion-events-address").first().text().trim().replace(/\s+/g, " ") ||
    $(".tribe-events-venue").first().text().trim().replace(/\s+/g, " ") ||
    "";

  return {
    id: url,
    federation: "IFBB Pro League",
    name: title,
    date: dateText,
    location,
    url,
  };
}

// -------------------------------
// SCRAPE NPC SHOW LIST
// -------------------------------
async function scrapeNPC() {
  const indexURL = "https://npcnewsonline.com/schedule/";
  const indexHTML = await fetchHTML(indexURL);
  const $ = cheerio.load(indexHTML);

  const links: string[] = [];

  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (href && href.includes("/schedule_event/")) {
      links.push(href);
    }
  });

  const uniqueLinks = [...new Set(links)];

  const shows = [];
  for (const link of uniqueLinks) {
    try {
      const html = await fetchHTML(link);
      if (html.length < 50) continue;
      shows.push(parseNPCShowPage(html, link));
    } catch {
      console.error("NPC parsing failed for:", link);
    }
  }

  return shows;
}

// -------------------------------
// SCRAPE IFBB PRO SHOW LIST
// -------------------------------
async function scrapeIFBB() {
  const indexURL = "https://ifbbpro.com/events/";
  const indexHTML = await fetchHTML(indexURL);
  const $ = cheerio.load(indexHTML);

  const links: string[] = [];

  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (href && href.includes("/competition/")) {
      links.push(href);
    }
  });

  const uniqueLinks = [...new Set(links)];

  const shows = [];
  for (const link of uniqueLinks) {
    try {
      const html = await fetchHTML(link);
      if (html.length < 50) continue;
      shows.push(parseIFBBShowPage(html, link));
    } catch {
      console.error("IFBB parsing failed for:", link);
    }
  }

  return shows;
}

// -------------------------------
// MAIN API ROUTE
// -------------------------------
export async function GET() {
  try {
    console.log("Scraping NPC + IFBB shows...");

    const npc = await scrapeNPC();
    const ifbb = await scrapeIFBB();

    const allShows = [...npc, ...ifbb];

    console.log("TOTAL SHOWS FOUND:", allShows.length);

    // Push into MeiliSearch
    const res = await fetch(`${MEILI_HOST}/indexes/shows/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MEILI_SHOWS_KEY}`,
      },
      body: JSON.stringify(allShows),
    });

    const json = await res.json();

    return NextResponse.json({
      ok: true,
      totalInserted: allShows.length,
      meiliResponse: json,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
