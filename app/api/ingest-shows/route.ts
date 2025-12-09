import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const MEILI_HOST = process.env.MEILI_HOST!;
const MEILI_WRITE_SHOWS = process.env.MEILI_WRITE_SHOWS!; // the new WRITE key

async function fetchHTML(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch: " + url);
  return await res.text();
}

/* --------------------------------------------------
   HELPERS
-------------------------------------------------- */

function normalizeDate(raw: string): string | null {
  if (!raw) return null;

  // Try native Date parsing
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }

  // Manual formats (NPC sometimes uses “January 20, 2025”)
  const cleaned = raw.replace(/\s+/g, " ").trim();
  const parsed = Date.parse(cleaned);

  if (!isNaN(parsed)) {
    return new Date(parsed).toISOString().slice(0, 10);
  }

  return null;
}

function cleanText(t: string | undefined): string {
  if (!t) return "";
  return t.replace(/\s+/g, " ").trim();
}

/* --------------------------------------------------
   PARSE NPC EVENT PAGE
-------------------------------------------------- */

function parseNPCShowPage(html: string, url: string) {
  const $ = cheerio.load(html);

  const title = cleanText($("h1.entry-title").text()) ||
                cleanText($("h1").first().text());

  const dateText =
    cleanText($("time").first().text()) ||
    cleanText($(".tribe-event-date-start").text());

  const location =
    cleanText($(".tribe-events-venue-details").text()) ||
    cleanText($(".tribe-events-venue").text());

  const normalized = normalizeDate(dateText);

  if (!title || !normalized) {
    console.log("NPC SKIPPED (Missing data):", url);
    return null;
  }

  return {
    id: url,
    federation: "NPC",
    title,
    location,
    date: normalized,
    url,
  };
}

/* --------------------------------------------------
   PARSE IFBB PRO EVENT PAGE
-------------------------------------------------- */

function parseIFBBShowPage(html: string, url: string) {
  const $ = cheerio.load(html);

  const title =
    cleanText($("h1.fusion-page-title").text()) ||
    cleanText($("h1").first().text());

  const dateText =
    cleanText($(".fusion-events-meta-info").text()) ||
    cleanText($(".fusion-events-date").text()) ||
    cleanText($("time").text());

  const location =
    cleanText($(".fusion-events-address").text()) ||
    cleanText($(".tribe-events-venue").text());

  const normalized = normalizeDate(dateText);

  if (!title || !normalized) {
    console.log("IFBB SKIPPED (Missing data):", url);
    return null;
  }

  return {
    id: url,
    federation: "IFBB Pro League",
    title,
    location,
    date: normalized,
    url,
  };
}

/* --------------------------------------------------
   SCRAPE NPC SCHEDULE
-------------------------------------------------- */

async function scrapeNPC() {
  const base = "https://npcnewsonline.com/schedule/";
  const indexHTML = await fetchHTML(base);
  const $ = cheerio.load(indexHTML);

  const links = new Set<string>();

  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    if (href.includes("/event/") || href.includes("/contest/")) {
      if (href.startsWith("http")) links.add(href);
      else links.add("https://npcnewsonline.com" + href);
    }
  });

  const shows = [];
  for (const link of links) {
    try {
      const html = await fetchHTML(link);
      const show = parseNPCShowPage(html, link);
      if (show) shows.push(show);
    } catch (e) {
      console.log("NPC ERROR:", link);
    }
  }

  return shows;
}

/* --------------------------------------------------
   SCRAPE IFBB PRO SCHEDULE
-------------------------------------------------- */

async function scrapeIFBB() {
  const base = "https://ifbbpro.com/events/";
  const indexHTML = await fetchHTML(base);
  const $ = cheerio.load(indexHTML);

  const links = new Set<string>();

  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    if (href.includes("/event/") || href.includes("/competition/")) {
      if (href.startsWith("http")) links.add(href);
      else links.add("https://ifbbpro.com" + href);
    }
  });

  const shows = [];
  for (const link of links) {
    try {
      const html = await fetchHTML(link);
      const show = parseIFBBShowPage(html, link);
      if (show) shows.push(show);
    } catch (e) {
      console.log("IFBB ERROR:", link);
    }
  }

  return shows;
}

/* --------------------------------------------------
   MAIN API HANDLER
-------------------------------------------------- */

export async function GET() {
  try {
    const npc = await scrapeNPC();
    const ifbb = await scrapeIFBB();

    const all = [...npc, ...ifbb];

    // Remove duplicates by URL
    const unique = Array.from(
      new Map(all.map((s) => [s.id, s])).values()
    );

    // Push into Meilisearch
    await fetch(`${MEILI_HOST}/indexes/shows/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MEILI_WRITE_SHOWS}`,
      },
      body: JSON.stringify(unique),
    });

    return NextResponse.json({
      ok: true,
      inserted: unique.length,
      message: "Shows index updated successfully.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message },
      { status: 500 }
    );
  }
}
