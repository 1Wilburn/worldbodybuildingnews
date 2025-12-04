import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const MEILI_HOST = process.env.MEILI_HOST!;
const MEILI_MASTER_KEY = process.env.MEILI_MASTER_KEY!;

// Fetch HTML with no caching
async function fetchHTML(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch: ${url}`);
  return await res.text();
}

/* -------------------- NPC SHOW PAGE PARSER -------------------- */
function parseNPCShowPage(html: string, url: string) {
  const $ = cheerio.load(html);

  const title = $("h1").first().text().trim();
  const rawDate = $("time").first().text().trim();
  const location = $(".tribe-events-venue, .venue-details")
    .first()
    .text()
    .trim()
    .replace(/\s+/g, " ");

  return {
    id: url,
    name: title || "NPC Contest",
    federation: "NPC",
    location,
    date: rawDate,
    url,
  };
}

/* -------------------- IFBB SHOW PAGE PARSER -------------------- */
function parseIFBBShowPage(html: string, url: string) {
  const $ = cheerio.load(html);

  const title = $("h1, .fusion-title-heading").first().text().trim();
  const rawDate = $(".fusion-events-date, time").first().text().trim();
  const location = $(".fusion-events-address, .tribe-events-venue")
    .first()
    .text()
    .trim()
    .replace(/\s+/g, " ");

  return {
    id: url,
    name: title || "IFBB Pro Event",
    federation: "IFBB Pro League",
    location,
    date: rawDate,
    url,
  };
}

/* -------------------- SCRAPE NPC -------------------- */
async function scrapeNPC() {
  const indexURL = "https://npcnewsonline.com/schedule/";
  const indexHTML = await fetchHTML(indexURL);
  const $ = cheerio.load(indexHTML);

  const links: string[] = [];

  $("a").each((_, el: cheerio.AnyNode) => {
    const href = $(el).attr("href");
    if (!href) return;

    if (href.includes("/contest-details/") || href.includes("/event/")) {
      const full = href.startsWith("http") ? href : `https://npcnewsonline.com${href}`;
      links.push(full);
    }
  });

  const uniqueLinks = [...new Set(links)];
  const shows = [];

  for (const link of uniqueLinks) {
    try {
      const html = await fetchHTML(link);
      shows.push(parseNPCShowPage(html, link));
    } catch (err) {
      console.log("NPC scrape error:", link, err);
    }
  }

  return shows;
}

/* -------------------- SCRAPE IFBB -------------------- */
async function scrapeIFBB() {
  const indexURL = "https://ifbbpro.com/events/";
  const indexHTML = await fetchHTML(indexURL);
  const $ = cheerio.load(indexHTML);

  const links: string[] = [];

  $("a").each((_, el: cheerio.AnyNode) => {
    const href = $(el).attr("href");
    if (!href) return;

    if (href.includes("/event/") || href.includes("/competition/")) {
      const full = href.startsWith("http") ? href : `https://ifbbpro.com${href}`;
      links.push(full);
    }
  });

  const uniqueLinks = [...new Set(links)];
  const shows = [];

  for (const link of uniqueLinks) {
    try {
      const html = await fetchHTML(link);
      shows.push(parseIFBBShowPage(html, link));
    } catch (err) {
      console.log("IFBB scrape error:", link, err);
    }
  }

  return shows;
}

/* -------------------- MAIN GET HANDLER -------------------- */
export async function GET() {
  try {
    const npcShows = await scrapeNPC();
    const ifbbShows = await scrapeIFBB();

    const allShows = [...npcShows, ...ifbbShows];

    // PUSH TO MEILISEARCH
    const res = await fetch(`${MEILI_HOST}/indexes/shows/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MEILI_MASTER_KEY}`,
      },
      body: JSON.stringify(allShows),
    });

    const result = await res.json();

    return NextResponse.json({
      ok: true,
      indexed: allShows.length,
      meiliResponse: result,
      message: "Shows index updated.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message },
      { status: 500 }
    );
  }
}
