// app/api/ingest/route.ts
// Runs on: Next.js App Router (Edge-friendly syntax w/ fetch)
// Schedule idea (Vercel Cron): 0 */6 * * *  → every 6 hours
// Trigger URL: https://<your-domain>/api/ingest?token=YOUR_INGEST_SECRET

import { NextResponse } from "next/server";
import { MeiliSearch, Index } from "meilisearch";
import crypto from "node:crypto";

/* ----------------------------- 1) CONFIG ----------------------------- */

const INDEX_NAME = "bodybuilding";
const MAX_PER_FEED = 40; // safety cap per source per run

// HOW FEEDS WORK
// - Plain RSS/Atom URLs are fetched directly
// - YouTube channels:
//     * Use "yt:@handle" (we'll resolve handle → channel_id → RSS)
//     * Or "yt:UCxxxxxxxx" if you know the channel id
// - Reddit subs:
//     * Use "reddit:r/<subname>" (converted to https://www.reddit.com/r/<sub>/.rss)
//
// IMPORTANT: Do not remove your existing feeds; I’ve appended/additionally included.
const FEEDS = [
  // — Major Bodybuilding News Outlets —
  "https://generationiron.com/feed/",
  "https://barbend.com/feed/",
  "https://www.muscleandfitness.com/feed/",
  "https://www.bodybuilding.com/rss/articles.xml",
  "https://www.reddit.com/r/bodybuilding/.rss",

  // — IFBB / NPC / Olympia —
  "https://npcnewsonline.com/feed/",
  "https://mrolympia.com/rss.xml",
  "https://ifbbpro.com/feed/",
  "https://ifbbmuscle.com/feed/",
  "https://www.rxmuscle.com/component/k2?format=feed",

  // — Fitness & Training —
  "https://breakingmuscle.com/feed/",
  "https://www.t-nation.com/feed/",
  "https://www.strengthlog.com/feed/",
  "https://www.menshealth.com/fitness/rss/",
  "https://www.womenshealthmag.com/fitness/rss/",
  "https://athleanx.com/feed",

  // — Nutrition, Science & Recovery —
  "https://examine.com/feed/",
  "https://supplementclarity.com/feed/",
  "https://www.healthline.com/rss",
  "https://www.precisionnutrition.com/feed",

  // — YouTube Channels —
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC1n6m34V0tmC8YpWQK0YvBw", // Nick Strength & Power
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCwR8tn9qxO0bH1lBFzYfcwA", // More Plates More Dates
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC2O3WUlARlJ97H2p8S3e8Jw", // Fouad Abiad
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCs2y1cJGOxN0Hf1hY8jA23Q", // Bodybuilding dot com
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCRB8C7v4VfJd_LGZr4IFk6A" // Jay Cutler TV
];

/* ----------------------- 2) MEILISEARCH CLIENT ----------------------- */

const client = new MeiliSearch({
  host: process.env.MEILI_HOST || "",
  apiKey: process.env.MEILI_API_KEY || process.env.MEILI_PUBLIC_KEY || "",
});

/* --------------------- 3) LIGHTWEIGHT RSS PARSER --------------------- */

type Doc = {
  id: string;
  title: string;
  url: string;
  source: string;         // e.g., domain or yt handle/subreddit
  publishedAt?: string;
  summary?: string;
};

function textBetween(xml: string, tag: string) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? m[1].trim() : "";
}

function strip(html: string) {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function hashId(input: string) {
  return crypto.createHash("sha1").update(input).digest("hex");
}

function parseRSS(xml: string, source: string): Doc[] {
  // Try RSS <item>
  let items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  if (items.length) {
    return items
      .slice(0, MAX_PER_FEED)
      .map((raw) => {
        const title = strip(textBetween(raw, "title"));
        const link = strip(textBetween(raw, "link"));
        const desc =
          textBetween(raw, "description") || textBetween(raw, "content:encoded");
        const pub = strip(textBetween(raw, "pubDate"));
        const url = link || "";
        return {
          id: hashId(url || title),
          title: title || url || "(untitled)",
          url,
          source,
          publishedAt: pub || undefined,
          summary: strip(desc || ""),
        };
      })
      .filter((d) => d.url);
  }

  // Try Atom <entry>
  items = xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  if (items.length) {
    return items
      .slice(0, MAX_PER_FEED)
      .map((raw) => {
        const title = strip(textBetween(raw, "title"));
        // <link href="..."> (Atom)
        const linkTag = raw.match(/<link[^>]+href="([^"]+)"/i);
        const url = linkTag ? linkTag[1] : strip(textBetween(raw, "id"));
        const summ = textBetween(raw, "summary") || textBetween(raw, "content");
        const pub =
          strip(textBetween(raw, "updated")) ||
          strip(textBetween(raw, "published"));
        return {
          id: hashId(url || title),
          title: title || url || "(untitled)",
          url,
          source,
          publishedAt: pub || undefined,
          summary: strip(summ || ""),
        };
      })
      .filter((d) => d.url);
  }

  return [];
}

/* ---------------------- 4) FEED NORMALIZATION ------------------------ */

// Turn "yt:@handle" → RSS URL by resolving the channel_id
async function resolveYouTubeHandleToFeed(handle: string): Promise<string | null> {
  try {
    const h = handle.replace(/^@/, "");
    const res = await fetch(`https://www.youtube.com/@${h}`, {
      headers: { "user-agent": "WBN-Ingest/1.0" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Channel id appears in several places. These regexes cover common cases.
    const m =
      html.match(/"channelId":"(UC[^"]+)"/) ||
      html.match(/content="UC[^"]+" itemprop="channelId"/) ||
      html.match(/data-channel-external-id="(UC[^"]+)"/);

    const channelId =
      (m && (m[1] || (m[0].match(/UC[^"]+/) || [null])[0])) || null;

    return channelId
      ? `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
      : null;
  } catch {
    return null;
  }
}

// Convert special notations to real RSS URLs
async function normalizeFeedURL(spec: string): Promise<{ url: string | null; label: string }> {
  // YouTube by channel id
  if (spec.startsWith("yt:UC")) {
    const id = spec.slice(3);
    return {
      url: `https://www.youtube.com/feeds/videos.xml?channel_id=${id}`,
      label: `youtube:${id}`,
    };
  }
  // YouTube by handle
  if (spec.startsWith("yt:@")) {
    const handle = spec.slice(3);
    const rss = await resolveYouTubeHandleToFeed(handle);
    return { url: rss, label: `youtube:@${handle}` };
  }
  // Reddit sub shorthand
  if (spec.startsWith("reddit:r/")) {
    const sub = spec.slice("reddit:r/".length);
    return {
      url: `https://www.reddit.com/r/${sub}/.rss`,
      label: `reddit:${sub}`,
    };
  }
  // Plain RSS URL
  try {
    const u = new URL(spec);
    return { url: u.toString(), label: u.hostname };
  } catch {
    return { url: null, label: spec };
  }
}

/* --------------------------- 5) FETCH HELPERS ------------------------ */

async function fetchFeed(rssUrl: string, label: string): Promise<Doc[]> {
  const res = await fetch(rssUrl, {
    headers: { "user-agent": "WBN-Ingest/1.0" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${rssUrl}`);
  const xml = await res.text();
  return parseRSS(xml, label);
}

/* ------------------------------ 6) ROUTE ----------------------------- */

export async function GET(req: Request) {
  // Auth guard
  const token = new URL(req.url).searchParams.get("token");
  if (!token || token !== process.env.INGEST_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Env guard
  if (!process.env.MEILI_HOST) {
    return NextResponse.json(
      { error: "MEILI_HOST missing in env" },
      { status: 500 }
    );
  }
  if (!process.env.MEILI_API_KEY && !process.env.MEILI_PUBLIC_KEY) {
    return NextResponse.json(
      { error: "MEILI_API_KEY or MEILI_PUBLIC_KEY missing in env" },
      { status: 500 }
    );
  }

  // Ensure index exists
  const index = await client
    .getIndex(INDEX_NAME)
    .catch(async () => client.createIndex(INDEX_NAME, { primaryKey: "id" }));

  // Normalize feeds (resolve @handles, reddit shorthand, etc.)
  const normalized: { url: string; label: string }[] = [];
  for (const spec of FEEDS) {
    const { url, label } = await normalizeFeedURL(spec);
    if (url) normalized.push({ url, label });
  }

  // Fetch in small batches
  const perSourceCount: Record<string, number> = {};
  let allDocs: Doc[] = [];
  let fetched = 0;

  // batches of 5 sources at a time
  for (let i = 0; i < normalized.length; i += 5) {
    const slice = normalized.slice(i, i + 5);
    const results = await Promise.allSettled(
      slice.map(async ({ url, label }) => {
        const docs = await fetchFeed(url, label);
        perSourceCount[label] = (perSourceCount[label] || 0) + docs.length;
        return docs;
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled") {
        fetched += r.value.length;
        allDocs = allDocs.concat(r.value);
      }
    }
  }

  // Deduplicate by URL hash
  const seen = new Set<string>();
  const unique = allDocs.filter((d) => {
    if (seen.has(d.id)) return false;
    seen.add(d.id);
    return true;
  });

  // Index
  const task = await (index as Index<any>).addDocuments(unique);

  return NextResponse.json({
    ok: true,
    sourcesConfigured: FEEDS.length,
    sourcesResolved: normalized.length,
    fetched,
    indexed: unique.length,
    perSource: perSourceCount,
    taskUid: (task as any).taskUid ?? (task as any).uid,
  });
        }  "https://supplementclarity.com/feed/",
  "https://www.healthline.com/rss",
  "https://www.precisionnutrition.com/feed",

  // — YouTube Channels (RSS video feeds) —
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC1n6m34V0tmC8YpWQK0YvBw", // Nick Strength & Power
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCwR8tn9qxO0bH1lBFzYfcwA", // More Plates More Dates
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC2O3WUlARlJ97H2p8S3e8Jw", // Fouad Abiad
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCs2y1cJGOxN0Hf1hY8jA23Q", // Bodybuilding.com
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCRB8C7v4VfJd_LGZr4IFk6A", // Jay Cutler TV
];

// ───────────────────────────────────────────────────────────
// 2) MEILISEARCH CLIENT
// ───────────────────────────────────────────────────────────
const client = new MeiliSearch({
  host: process.env.MEILI_HOST || "",
  apiKey: process.env.MEILI_API_KEY || process.env.MEILI_PUBLIC_KEY || "",
});

// ───────────────────────────────────────────────────────────
// 3) LIGHTWEIGHT RSS/ATOM PARSER
// ───────────────────────────────────────────────────────────
type Doc = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
  summary?: string;
};

function textBetween(xml: string, tag: string) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? m[1].trim() : "";
}
function strip(html: string) {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}
function hashId(input: string) {
  return crypto.createHash("sha1").update(input).digest("hex");
}

function parseRSS(xml: string, source: string): Doc[] {
  // Try RSS <item>
  let items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  if (items.length) {
    return items
      .slice(0, MAX_PER_FEED)
      .map((raw) => {
        const title = strip(textBetween(raw, "title"));
        const link = strip(textBetween(raw, "link"));
        const desc =
          textBetween(raw, "description") ||
          textBetween(raw, "content:encoded");
        const pub = strip(textBetween(raw, "pubDate"));
        const url = link || "";
        return {
          id: hashId(url || title),
          title: title || url || "(untitled)",
          url,
          source,
          publishedAt: pub || undefined,
          summary: strip(desc || ""),
        };
      })
      .filter((d) => d.url);
  }

  // Try Atom <entry>
  items = xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  if (items.length) {
    return items
      .slice(0, MAX_PER_FEED)
      .map((raw) => {
        const title = strip(textBetween(raw, "title"));
        const linkTag = raw.match(/<link[^>]+href="([^"]+)"/i); // <link href="...">
        const url = linkTag ? linkTag[1] : strip(textBetween(raw, "id"));
        const summ =
          textBetween(raw, "summary") || textBetween(raw, "content");
        const pub =
          strip(textBetween(raw, "updated")) ||
          strip(textBetween(raw, "published"));
        return {
          id: hashId(url || title),
          title: title || url || "(untitled)",
          url,
          source,
          publishedAt: pub || undefined,
          summary: strip(summ || ""),
        };
      })
      .filter((d) => d.url);
  }

  return [];
}

// ───────────────────────────────────────────────────────────
// 4) FETCH + INDEX HELPERS
// ───────────────────────────────────────────────────────────
async function fetchFeed(url: string): Promise<Doc[]> {
  const res = await fetch(url, {
    headers: { "user-agent": "WBN-Ingest/1.0" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${url}`);
  const xml = await res.text();
  return parseRSS(xml, new URL(url).hostname);
}

// ───────────────────────────────────────────────────────────
// 5) ROUTE  (call: /api/  "https://examine.com/feed/",
  "https://supplementclarity.com/feed/",
  "https://www.healthline.com/rss",
  "https://www.precisionnutrition.com/feed",

  // — YouTube Channels (RSS video feeds) —
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC1n6m34V0tmC8YpWQK0YvBw", // Nick Strength & Power
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCwR8tn9qxO0bH1lBFzYfcwA", // More Plates More Dates
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC2O3WUlARlJ97H2p8S3e8Jw", // Fouad Abiad
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCs2y1cJGOxN0Hf1hY8jA23Q", // Bodybuilding.com
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCRB8C7v4VfJd_LGZr4IFk6A", // Jay Cutler TV
];

// ───────────────────────────────────────────────────────────
// 2) MEILISEARCH CLIENT
// ───────────────────────────────────────────────────────────
const client = new MeiliSearch({
  host: process.env.MEILI_HOST || "",
  apiKey: process.env.MEILI_API_KEY || process.env.MEILI_PUBLIC_KEY || "",
});

// ───────────────────────────────────────────────────────────
// 3) TINY RSS/ATOM PARSER (no extra deps)
// Handles common RSS (<item>) and Atom (<entry>)
// ───────────────────────────────────────────────────────────
type Doc = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
  summary?: string;
};

function textBetween(xml: string, tag: string) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? m[1].trim() : "";
}
function strip(html: string) {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}
function hashId(input: string) {
  return crypto.createHash("sha1").update(input).digest("hex");
}

function parseRSS(xml: string, source: string): Doc[] {
  // Try RSS <item>
  let items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  if (items.length) {
    return items.slice(0, MAX_PER_FEED).map((raw) => {
      const title = strip(textBetween(raw, "title"));
      const link = strip(textBetween(raw, "link"));
      const desc = textBetween(raw, "description") || textBetween(raw, "content:encoded");
      const pub = strip(textBetween(raw, "pubDate"));
      const url = link || "";
      return {
        id: hashId(url || title),
        title: title || url || "(untitled)",
        url,
        source,
        publishedAt: pub || undefined,
        summary: strip(desc || ""),
      };
    }).filter(d => d.url);
  }

  // Try Atom <entry>
  items = xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  if (items.length) {
    return items.slice(0, MAX_PER_FEED).map((raw) => {
      const title = strip(textBetween(raw, "title"));
      // <link href="...">
      const linkTag = raw.match(/<link[^>]+href="([^"]+)"/i);
      const url = linkTag ? linkTag[1] : strip(textBetween(raw, "id"));
      const summ = textBetween(raw, "summary") || textBetween(raw, "content");
      const pub = strip(textBetween(raw, "updated")) || strip(textBetween(raw, "published"));
      return {
        id: hashId(url || title),
        title: title || url || "(untitled)",
        url,
        source,
        publishedAt: pub || undefined,
        summary: strip(summ || ""),
      };
    }).filter(d => d.url);
  }

  return [];
}

// ───────────────────────────────────────────────────────────
// 4) FETCH + INDEX
// ───────────────────────────────────────────────────────────
async function fetchFeed(url: string): Promise<Doc[]> {
  const res = await fetch(url, { headers: { "user-agent": "WBN-Ingest/1.0" }, cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${url}`);
  const xml = await res.text();
  return parseRSS(xml, new URL(url).hostname);
}

// ───────────────────────────────────────────────────────────
// 5) ROUTE
// Protect with ?token=INGEST_SECRET
// ───────────────────────────────────────────────────────────
export async function GET(req: Request) {
  // Guard rails
  if (!process.env.MEILI_HOST)
    return NextResponse.json({ error: "MEILI_HOST missing in env" }, { status: 500 });
  if (!process.env.MEILI_API_KEY && !process.env.MEILI_PUBLIC_KEY)
    return NextResponse.json({ error: "MEILI_API_KEY or MEILI_PUBLIC_KEY missing in env" }, { status: 500 });

  const token = new URL(req.url).searchParams.get("token");
  if (!token || token !== process.env.INGEST_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Ensure index exists
  const index = await client.getIndex(INDEX_NAME).catch(async () => {
    return client.createIndex(INDEX_NAME, { primaryKey: "id" });
  });

  // Pull feeds (a few in parallel at a time)
  const chunks: string[][] = [];
  for (let i = 0; i < FEEDS.length; i += 5) chunks.push(FEEDS.slice(i, i + 5));

  let allDocs: Doc[] = [];
  let fetched = 0;

  for (const batch of chunks) {
    const results = await Promise.allSettled(batch.map((u) => fetchFeed(u)));
    for (const r of results) {
      if (r.status === "fulfilled") {
        fetched += r.value.length;
        allDocs = allDocs.concat(r.value);
      }
    }
  }

  // Deduplicate by id
  const seen = new Set<string>();
  const unique = allDocs.filter((d) => {
    if (seen.has(d.id)) return false;
    seen.add(d.id);
    return true;
  });
// Ensure TypeScript knows this is a real Index
const index: Index<any> = client.index("bodybuilding");

// Add the unique documents
const task = await index.addDocuments(unique);

// Optionally wait until it's done:
// await client.waitForTask(task.taskUid);

  return NextResponse.json({
    ok: true,
    sources: FEEDS.length,
    fetched,
    indexed: unique.length,
    taskUid: (task as any).taskUid ?? (task as any).uid,
  });
}
