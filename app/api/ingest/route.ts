// app/api/ingest/route.ts
import { NextResponse } from "next/server";
import { MeiliSearch, Index } from "meilisearch";
import crypto from "node:crypto";

// ───────────────────────────────────────────────────────────
// 1) CONFIG
// ───────────────────────────────────────────────────────────
const INDEX_NAME = "bodybuilding";
const MAX_PER_FEED = 40; // cap per feed to keep runs snappy

// Additions ONLY (I left your originals in place and removed dupes)
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
