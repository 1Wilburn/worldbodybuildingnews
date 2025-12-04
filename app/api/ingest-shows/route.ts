import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const MEILI_HOST = process.env.MEILI_HOST!;
const MEILI_MASTER_KEY = process.env.MEILI_MASTER_KEY!;

// Utility fetcher
async function fetchHTML(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  return await res.text();
}

// Ensure absolute URL
function abs(base: string, href: string) {
  if (!href.startsWith("http")) {
    return base.replace(/\/$/, "") + "/" + href.replace(/^\//, "");
  }
  return href;
}

/* ----------------------------------------------------
   NPC SCRAPER — Updated for new NPC site structure
-----------------------------------------------------*/
async function scrapeNPC() {
  const BASE = "https://npcnewsonline.com";
  const indexURL = `${BASE}/contests/`;
  const html = await fetchHTML(indexURL);

  const $ = cheerio.load(html);

  // NPC uses '.contest-thumb a' for event links
  const linksNPC: string[] = [];

  $(".contest-thumb a").each((i, el) => {
    const href = $(el).attr("href");
    if (href && href.includes("/contest/")) {
      linksNPC.push(abs(BASE, href));
    }
  });

  const unique = [...new Set(linksNPC)];
  console.log("NPC links found:", unique.length);

  const shows: any[] = [];

  for (const link of unique) {
    try {
      const page = await fetchHTML(link);
      const $$ = cheerio.load(page);

      const title = $$("h1").first().text().trim();
      const date = $$(".contest-date").first().text().trim();
      const location = $$(".contest-location").first().text().trim();

      shows.push({
        id: link,
        federation: "NPC",
        name: title,
        date,
        location,
        url: link,
      });
    } catch (err) {
      console.log("NPC page error:", link);
    }
  }

  return shows;
}

/* ----------------------------------------------------
   IFBB SCRAPER — Updated for new IFBB site structure
-----------------------------------------------------*/
async function scrapeIFBB() {
  const BASE = "https://ifbbpro.com";
  const indexURL = `${BASE}/events/`;
  const html = await fetchHTML(indexURL);

  const $ = cheerio.load(html);

  // IFBB currently uses '.fusion-portfolio-content a' style selectors
  const linksIFBB: string[] = [];

  $("a").each((i, el) => {
    const href = $(el).attr("href");
    if (
      href &&
      (href.includes("/event/") ||
        href.includes("/events/") ||
        href.includes("/competition/"))
    ) {
      linksIFBB.push(abs(BASE, href));
    }
  });

  const unique = [...new Set(linksIFBB)];
  console.log("IFBB links found:", unique.length);

  const shows: any[] = [];

  for (const link of unique) {
    try {
      const page = await fetchHTML(link);
      const $$ = cheerio.load(page);

      const title = $$("h1").first().text().trim();
      const date = $$(".fusion-events-date, time").first().text().trim();
      const location = $$(".fusion-events-address").first().text().trim();

      shows.push({
        id: link,
        federation: "IFBB Pro League",
        name: title,
        date,
        location,
        url: link,
      });
    } catch (err) {
      console.log("IFBB page error:", link);
    }
  }

  return shows;
}

/* ----------------------------------------------------
   MAIN API ROUTE — Runs both scrapers then writes to Meili
-----------------------------------------------------*/
export async function GET() {
  try {
    const npc = await scrapeNPC();
    const ifbb = await scrapeIFBB();

    const all = [...npc, ...ifbb];

    console.log("TOTAL SHOWS COLLECTED:", all.length);

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
      total: all.length,
      message: "Shows index updated.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message },
      { status: 500 }
    );
  }
}
