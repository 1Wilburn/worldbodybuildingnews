import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const MEILI_HOST = process.env.MEILI_HOST!;
const MEILI_MASTER_KEY = process.env.MEILI_MASTER_KEY!;

async function fetchHTML(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  return await res.text();
}

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
    id: url,
    source: "npcnewsonline",
    title,
    date: dateText,
    location,
    url,
  };
}

function parseIFBBShowPage(html: string, url: string) {
  const $ = cheerio.load(html);

  const title = $("h1").first().text().trim();
  const dateText = $(".fusion-events-date, time").first().text().trim();
  const location = $(".fusion-events-address, .tribe-events-venue")
    .first()
    .text()
    .trim()
    .replace(/\s+/g, " ");

  return {
    id: url,
    source: "ifbbpro",
    title,
    date: dateText,
    location,
    url,
  };
}

async function scrapeNPC() {
  const base = "https://npcnewsonline.com/schedule/";
  const indexHTML = await fetchHTML(base);

  const $ = cheerio.load(indexHTML);

  const links: string[] = [];
  $("a").each((i: number, el: cheerio.Element) => {
    const href = $(el).attr("href");
    ...
});

  const uniqueLinks = [...new Set(links)];

  const shows = [];
  for (const link of uniqueLinks) {
    try {
      const html = await fetchHTML(link);
      shows.push(parseNPCShowPage(html, link));
    } catch (e) {
      console.log("NPC scrape error for:", link);
    }
  }

  return shows;
}

async function scrapeIFBB() {
  const base = "https://ifbbpro.com/events/";
  const indexHTML = await fetchHTML(base);

  const $ = cheerio.load(indexHTML);

  const links = [];
  $("a").each((i, el) => {
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
      shows.push(parseIFBBShowPage(html, link));
    } catch (e) {
      console.log("IFBB scrape error for:", link);
    }
  }

  return shows;
}

export async function GET() {
  try {
    const npc = await scrapeNPC();
    const ifbb = await scrapeIFBB();

    const allShows = [...npc, ...ifbb];

    await fetch(`${MEILI_HOST}/indexes/shows/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MEILI_MASTER_KEY}`,
      },
      body: JSON.stringify(allShows),
    });

    return NextResponse.json({
      ok: true,
      total: allShows.length,
      message: "Shows index updated.",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message,
      },
      { status: 500 }
    );
  }
}
