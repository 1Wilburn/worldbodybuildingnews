import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const MEILI_HOST = process.env.MEILI_HOST!;
const MEILI_MASTER_KEY = process.env.MEILI_MASTER_KEY!;

/* -------------------- Helpers -------------------- */

async function fetchHTML(url: string): Promise<string> {
  const res = await fetch(url, { cache: "no-store" });
  return await res.text();
}

function absolute(base: string, href: string): string {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  return base.replace(/\/$/, "") + "/" + href.replace(/^\//, "");
}

/* -------------------- NPC Parsing -------------------- */

function parseNPCShowPage(html: string, url: string) {
  const $ = cheerio.load(html);

  const title =
    $("h1").first().text().trim() ||
    $(".entry-title").first().text().trim();

  const dateText =
    $("time").first().text().trim() ||
    $(".tribe-event-date-start").first().text().trim();

  const location =
    $(".tribe-events-venue").first().text().trim().replace(/\s+/g, " ") ||
    $(".fusion-events-address").first().text().trim().replace(/\s+/g, " ");

  return {
    id: url,
    federation: "NPC",
    name: title || "NPC Contest",
    date: dateText || "",
    location: location || "",
    url,
  };
}

/* -------------------- IFBB Parsing -------------------- */

function parseIFBBShowPage(html: string, url: string) {
  const $ = cheerio.load(html);

  const title =
    $("h1").first().text().trim() ||
    $(".fusion-title").first().text().trim();

  const dateText =
    $(".fusion-events-date").first().text().trim() ||
    $("time").first().text().trim();

  const location =
    $(".fusion-events-address").first().text().trim().replace(/\s+/g, " ") ||
    $(".tribe-events-venue").first().text().trim().replace(/\s+/g, " ");

  return {
    id: url,
    federation: "IFBB Pro League",
    name: title || "IFBB Pro Show",
    date: dateText || "",
    location: location || "",
    url,
  };
}

/* -------------------- NPC Scraper -------------------- */

async function scrapeNPC() {
  const base = "https://npcnewsonline.com";
  const scheduleURL = `${base}/schedule/`;

  const html = await fetchHTML(scheduleURL);
  const $ = cheerio.load(html);

  const links: string[] = [];

  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (href && href.includes("/contest-details/")) {
      links.push(absolute(base, href));
    }
  });

  const shows: any[] = [];

  for (const link of [...new Set(links)]) {
    try {
      const pageHTML = await fetchHTML(link);
      shows.push(parseNPCShowPage(pageHTML, link));
    } catch {
      console.log("NPC error:", link);
    }
  }

  return shows;
}

/* -------------------- IFBB Scraper -------------------- */

async function scrapeIFBB() {
  const base = "https://ifbbpro.com";
  const eventsURL = `${base}/events/`;

  const html = await fetchHTML(eventsURL);
  const $ = cheerio.load(html);

  const links: string[] = [];

  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (href && href.includes("/event/")) {
      links.push(absolute(base, href));
    }
  });

  const shows: any[] = [];

  for (const link of [...new Set(links)]) {
    try {
      const pageHTML = await fetchHTML(link);
      shows.push(parseIFBBShowPage(pageHTML, link));
    } catch {
      console.log("IFBB error:", link);
    }
  }

  return shows;
}

/* -------------------- API Endpoint -------------------- */

export async function GET() {
  try {
    const npc = await scrapeNPC();
    const ifbb = await scrapeIFBB();

    const all = [...npc, ...ifbb];

    // Push into MeiliSearch
    await fetch(`${MEILI_HOST}/indexes/shows/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MEILI_MASTER_KEY}`,
      },
      body: JSON.stringify(all),
    });

    return NextResponse.json({
      ok: true,
      count: all.length,
      message: "Show data scraped and indexed.",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}
