import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { v4 as uuidv4 } from "uuid";
import { parse, parseISO, format } from "date-fns";

/* ENV VARS */
const MEILI_HOST = process.env.MEILI_HOST!;
const MEILI_SHOWS_KEY = process.env.MEILI_SHOWS_KEY!;

/* Fetch helper */
async function fetchHTML(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  return await res.text();
}

/* ---------------------- DATE NORMALIZER ---------------------- */
function normalizeDate(raw: string): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/\s+/g, " ").trim();

  // If range: “March 4–6, 2025” → take first date
  const rangeMatch = cleaned.match(/(.+?)[–-]\s*\d{1,2},?\s*\d{4}/);
  const firstPart = rangeMatch ? rangeMatch[1] : cleaned;

  const possibleFormats = [
    "MMMM d, yyyy",
    "MMM d, yyyy",
    "MMMM d yyyy",
    "MMM d yyyy",
    "MM/dd/yyyy",
    "yyyy-MM-dd",
  ];

  for (let fmt of possibleFormats) {
    try {
      const parsed = parse(firstPart, fmt, new Date());
      if (!isNaN(parsed.getTime())) {
        return format(parsed, "yyyy-MM-dd");
      }
    } catch {}
  }

  // try ISO
  try {
    const iso = parseISO(cleaned);
    if (!isNaN(iso.getTime())) return format(iso, "yyyy-MM-dd");
  } catch {}

  return null;
}

/* ---------------- NPC PAGE PARSER ---------------- */
function parseNPCShowPage(html: string, url: string) {
  const $ = cheerio.load(html);

  const title = $("h1").first().text().trim();
  const dateText = $("time").first().text().trim();
  const location = $(".tribe-events-venue")
    .first()
    .text()
    .trim()
    .replace(/\s+/g, " ");

  return {
    id: uuidv4(),
    federation: "NPC",
    title,
    location,
    date: normalizeDate(dateText),
    sourceUrl: url,
  };
}

/* ---------------- IFBB PAGE PARSER ---------------- */
function parseIFBBShowPage(html: string, url: string) {
  const $ = cheerio.load(html);

  const title = $("h1").first().text().trim();
  const dateText =
    $(".fusion-events-date, time").first().text().trim() || null;

  const location = $(".fusion-events-address, .tribe-events-venue")
    .first()
    .text()
    .trim()
    .replace(/\s+/g, " ");

  return {
    id: uuidv4(),
    federation: "IFBB Pro League",
    title,
    location,
    date: normalizeDate(dateText),
    sourceUrl: url,
  };
}

/* ---------------- SCRAPE NPC ---------------- */
async function scrapeNPC() {
  const base = "https://npcnewsonline.com/schedule/";
  const html = await fetchHTML(base);
  const $ = cheerio.load(html);

  const links: string[] = [];
  $("a").each((i, el) => {
    const href = $(el).attr("href");
    if (href && href.includes("/schedule_event/")) {
      links.push(href);
    }
  });

  const unique = [...new Set(links)];

  const shows = [];
  for (const link of unique) {
    try {
      const page = await fetchHTML(link);
      shows.push(parseNPCShowPage(page, link));
    } catch (e) {
      console.log("NPC scrape error:", link);
    }
  }
  return shows;
}

/* ---------------- SCRAPE IFBB ---------------- */
async function scrapeIFBB() {
  const base = "https://ifbbpro.com/events/";
  const html = await fetchHTML(base);
  const $ = cheerio.load(html);

  const links: string[] = [];
  $("a").each((i, el) => {
    const href = $(el).attr("href");
    if (href && href.includes("/competition/")) {
      links.push(href);
    }
  });

  const unique = [...new Set(links)];

  const shows = [];
  for (const link of unique) {
    try {
      const page = await fetchHTML(link);
      shows.push(parseIFBBShowPage(page, link));
    } catch (e) {
      console.log("IFBB scrape error:", link);
    }
  }
  return shows;
}

/* ---------------- API HANDLER ---------------- */
export async function GET() {
  try {
    const npc = await scrapeNPC();
    const ifbb = await scrapeIFBB();

    const allShows = [...npc, ...ifbb];

    await fetch(`${MEILI_HOST}/indexes/shows/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MEILI_SHOWS_KEY}`,
      },
      body: JSON.stringify(allShows),
    });

    return NextResponse.json({
      ok: true,
      inserted: allShows.length,
      message: "Shows index updated successfully.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
