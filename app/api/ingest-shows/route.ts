// app/api/ingest-shows/route.ts
import { NextResponse } from "next/server";

const host = process.env.MEILI_HOST;      // e.g. https://edge.meilisearch.com
const apiKey = process.env.MEILI_API_KEY; // master/admin key OR a key with write access

type ShowDoc = {
  id: string;
  name: string;
  federation: string;
  location: string;
  date: string; // YYYY-MM-DD
  url: string;
};

/**
 * Very small helper to safely fetch HTML as text
 */
async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      // NPC & IFBB don’t require special headers, but we add a UA just in case
      headers: {
        "User-Agent":
          "worldbodybuildingnews-bot/0.1 (+https://worldbodybuildingnews.vercel.app)",
      },
      // Don’t cache in Vercel layer; we want fresh each ingest run
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Failed to fetch HTML", url, res.status);
      return null;
    }
    return await res.text();
  } catch (err) {
    console.error("Error fetching HTML", url, err);
    return null;
  }
}

/**
 * Extremely lightweight helper to extract a date from text like "Nov 21, 2025" or "November 21 2025"
 * and return it as YYYY-MM-DD. If we can’t parse, we fall back to today.
 */
function extractDate(text: string): string {
  // Very rough: try to find a month name + day + year
  const dateRegex =
    /(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:,)?\s+(\d{4})/i;

  const match = text.match(dateRegex);
  if (match) {
    const [_, monthName, dayStr, yearStr] = match;
    const date = new Date(`${monthName} ${dayStr}, ${yearStr}`);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
  }

  // fallback: today
  const fallback = new Date();
  return fallback.toISOString().slice(0, 10);
}

/**
 * Parse IFBBPro events page into rough ShowDoc[]
 * Example list page: https://ifbbpro.com/events/
 */
function parseIfbbEvents(html: string): ShowDoc[] {
  const shows: ShowDoc[] = [];
  const baseUrl = "https://ifbbpro.com";

  // IFBB uses cards with "fusion-portfolio-content" in many themes.
  // We’ll roughly split on that and pick out title + date text.
  const chunks = html.split("fusion-portfolio-content");

  for (const chunk of chunks) {
    // Title: look for <h2 ...>SOME TITLE</h2> or <h3 ...>
    const titleMatch =
      chunk.match(/<h[23][^>]*>([^<]+)<\/h[23]>/i) ||
      chunk.match(/class="event-title"[^>]*>([^<]+)<\/a>/i);

    if (!titleMatch) continue;
    const rawTitle = titleMatch[1].trim();
    if (!rawTitle) continue;

    // Link: first href inside this chunk that looks like an event detail page
    const hrefMatch = chunk.match(/href="([^"]+)"/i);
    const hrefRaw = hrefMatch ? hrefMatch[1] : "";
    const url =
      hrefRaw.startsWith("http") ? hrefRaw : `${baseUrl}${hrefRaw}`;

    // Date: look for a "Nov 21, 2025" style string
    const date = extractDate(chunk);

    // Location: grab some text after the date; this is very fuzzy
    // but often the city appears close by
    let location = "";
    const locationRegex = /(?:Venue|Location|City)[^:]*:\s*([^<]+)/i;
    const locMatch = chunk.match(locationRegex);
    if (locMatch) {
      location = locMatch[1].trim();
    }

    const id = `ifbb-${url}`;

    shows.push({
      id,
      name: rawTitle,
      federation: "IFBB Pro League",
      location,
      date,
      url,
    });
  }

  return shows;
}

/**
 * Parse NPC News Online schedule into rough ShowDoc[]
 * Example list page: https://npcnewsonline.com/schedule/
 */
function parseNpcSchedule(html: string): ShowDoc[] {
  const shows: ShowDoc[] = [];
  const baseUrl = "https://npcnewsonline.com";

  // NPC’s schedule often has blocks with "ecs-event" / "tribe-events-list-event-title" / etc.
  // We’ll split on "tribe-events-list-event-title" and try to pull name/date/link.
  const chunks = html.split("tribe-events-list-event-title");

  for (const chunk of chunks) {
    const titleMatch =
      chunk.match(/>([^<]+)<\/a>/i) || chunk.match(/<h2[^>]*>([^<]+)<\/h2>/i);
    if (!titleMatch) continue;
    const rawTitle = titleMatch[1].trim();
    if (!rawTitle) continue;

    const hrefMatch = chunk.match(/href="([^"]+)"/i);
    const hrefRaw = hrefMatch ? hrefMatch[1] : "";
    const url =
      hrefRaw.startsWith("http") ? hrefRaw : `${baseUrl}${hrefRaw}`;

    const date = extractDate(chunk);

    // Location: NPC event list frequently shows a city on same card; rough search:
    let location = "";
    const locationRegex =
      /(?:Venue|Location|City)[^:]*:\s*([^<]+)/i;
    const locMatch = chunk.match(locationRegex);
    if (locMatch) {
      location = locMatch[1].trim();
    }

    const id = `npc-${url}`;

    shows.push({
      id,
      name: rawTitle,
      federation: "NPC",
      location,
      date,
      url,
    });
  }

  return shows;
}

/**
 * MAIN: GET /api/ingest-shows
 * Scrapes IFBB Pro events + NPC schedule and writes to Meili "shows" index
 */
export async function GET() {
  if (!host || !apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "MeiliSearch not configured. Please set MEILI_HOST and MEILI_API_KEY in Vercel.",
      },
      { status: 500 }
    );
  }

  const shows: ShowDoc[] = [];

  // 1) IFBB Pro events
  const ifbbHtml = await fetchHtml("https://ifbbpro.com/events/");
  if (ifbbHtml) {
    shows.push(...parseIfbbEvents(ifbbHtml));
  }

  // 2) NPC News schedule
  const npcHtml = await fetchHtml("https://npcnewsonline.com/schedule/");
  if (npcHtml) {
    shows.push(...parseNpcSchedule(npcHtml));
  }

  // Filter out obviously broken ones (missing name or url or date)
  const filtered = shows.filter(
    (s) => s.name && s.url && s.date && s.id
  );

  // If nothing parsed, we still return ok: true but with total 0
  if (filtered.length === 0) {
    return NextResponse.json({
      ok: true,
      total: 0,
      message:
        "Ingest ran but no shows were parsed. HTML structure may have changed.",
    });
  }

  // Send to Meili "shows" index
  try {
    const meiliRes = await fetch(`${host}/indexes/shows/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(filtered),
    });

    if (!meiliRes.ok) {
      const text = await meiliRes.text();
      console.error("Error writing shows to Meili:", text);
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to write shows to MeiliSearch",
          details: text,
        },
        { status: 500 }
      );
    }

    const task = await meiliRes.json();
    return NextResponse.json({
      ok: true,
      total: filtered.length,
      task,
      message: "Shows index successfully updated.",
    });
  } catch (err: any) {
    console.error("Exception writing shows to Meili:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message
