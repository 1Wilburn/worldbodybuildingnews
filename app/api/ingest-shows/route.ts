import { NextResponse } from "next/server";

/* ---------------------------
   CONFIG
--------------------------- */
const MEILI_HOST = process.env.MEILI_HOST!;
const MEILI_MASTER_KEY = process.env.MEILI_MASTER_KEY!;
const SHOWS_INDEX = "shows";

/* ---------------------------
   HELPERS
--------------------------- */

// Normalize dates into YYYY-MM-DD
function formatDate(d: string | undefined): string | null {
  if (!d) return null;
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

// Clean text extracted from website markup
function clean(str: string | null | undefined) {
  if (!str) return null;
  return str.replace(/(\r|\n|\t)/g, " ").replace(/\s+/g, " ").trim();
}

/* ---------------------------
   PARSE IFBB PRO EVENTS
   Source: https://ifbbpro.com/events/
--------------------------- */
async function scrapeIFBB() {
  const res = await fetch("https://ifbbpro.com/events/", {
    headers: { "User-Agent": "Mozilla/5.0" },
    cache: "no-store",
  });

  const html = await res.text();

  const regex =
    /<div class="event-item">[\s\S]*?<h3>(.*?)<\/h3>[\s\S]*?<span class="event-date">(.*?)<\/span>[\s\S]*?<span class="event-loc">(.*?)<\/span>[\s\S]*?<a href="(.*?)"/g;

  const results: any[] = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    const [, title, date, location, url] = match;

    results.push({
      id: `ifbb-${url}`,
      federation: "IFBB Pro League",
      name: clean(title),
      date: formatDate(date),
      location: clean(location),
      url: url.startsWith("http") ? url : `https://ifbbpro.com${url}`,
    });
  }

  return results;
}

/* ---------------------------
   PARSE NPC ONLINE EVENTS
   Source: https://npcnewsonline.com/contests/
--------------------------- */
async function scrapeNPC() {
  const res = await fetch("https://npcnewsonline.com/contests/", {
    headers: { "User-Agent": "Mozilla/5.0" },
    cache: "no-store",
  });

  const html = await res.text();

  const regex =
    /<div class="contest-item">[\s\S]*?<h3>(.*?)<\/h3>[\s\S]*?<span class="contest-date">(.*?)<\/span>[\s\S]*?<span class="contest-loc">(.*?)<\/span>[\s\S]*?<a href="(.*?)"/g;

  const results: any[] = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    const [, title, date, location, url] = match;

    results.push({
      id: `npc-${url}`,
      federation: "NPC",
      name: clean(title),
      date: formatDate(date),
      location: clean(location),
      url: url.startsWith("http") ? url : `https://npcnewsonline.com${url}`,
    });
  }

  return results;
}

/* ---------------------------
   WRITE TO MEILISEARCH
--------------------------- */
async function pushToMeili(documents: any[]) {
  await fetch(`${MEILI_HOST}/indexes/${SHOWS_INDEX}/documents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MEILI_MASTER_KEY}`,
    },
    body: JSON.stringify(documents),
  });
}

/* ---------------------------
   MAIN ROUTE HANDLER
--------------------------- */
export async function GET() {
  try {
    const [ifbb, npc] = await Promise.all([
      scrapeIFBB(),
      scrapeNPC(),
    ]);

    const docs = [...ifbb, ...npc].filter((d) => d.date != null);

    await pushToMeili(docs);

    return NextResponse.json({
      ok: true,
      total: docs.length,
      message: "Shows index successfully updated.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
