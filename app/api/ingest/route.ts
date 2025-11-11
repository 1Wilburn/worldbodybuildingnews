import { NextResponse } from "next/server";
import { MeiliSearch } from "meilisearch";
import crypto from "node:crypto";

/* ----------------------- CONFIG ----------------------- */
const INDEX_NAME = "bodybuilding";
const MAX_PER_FEED = 40;

const FEEDS = [
  // Major Bodybuilding News
  "https://generationiron.com/feed/",
  "https://barbend.com/feed/",
  "https://www.muscleandfitness.com/feed/",
  "https://www.bodybuilding.com/rss/articles.xml",
  "https://www.reddit.com/r/bodybuilding/.rss",

  // IFBB / NPC / Olympia
  "https://npcnewsonline.com/feed/",
  "https://mrolympia.com/rss.xml",
  "https://ifbbpro.com/feed/",
  "https://ifbbmuscle.com/feed/",
  "https://www.rxmuscle.com/component/k2?format=feed",

  // Fitness & Training
  "https://breakingmuscle.com/feed/",
  "https://www.t-nation.com/feed/",
  "https://www.strengthlog.com/feed/",
  "https://www.menshealth.com/fitness/rss/",
  "https://www.womenshealthmag.com/fitness/rss/",
  "https://athleanx.com/feed",

  // Nutrition / Science
  "https://examine.com/feed/",
  "https://supplementclarity.com/feed/",
  "https://www.healthline.com/rss",
  "https://www.precisionnutrition.com/feed",

  // YouTube Channels
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC1n6m34V0tmC8YpWQK0YvBw", // Nick Strength & Power
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCwR8tn9qxO0bH1lBFzYfcwA", // More Plates More Dates
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC2O3WUlARlJ97H2p8S3e8Jw", // Fouad Abiad
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCs2y1cJGOxN0Hf1hY8jA23Q", // Bodybuilding.com
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCRB8C7v4VfJd_LGZr4IFk6A"  // Jay Cutler TV
];

/* ----------------------- CLIENT ----------------------- */
const client = new MeiliSearch({
  host: process.env.MEILI_HOST || "",
  apiKey: process.env.MEILI_API_KEY || process.env.MEILI_PUBLIC_KEY || "",
});

/* ----------------------- TYPES ----------------------- */
type Doc = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
  summary?: string;
};

/* ----------------------- HELPERS ----------------------- */
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

/* ----------------------- PARSER ----------------------- */
function parseRSS(xml: string, source: string): Doc[] {
  // RSS <item>
  let items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  if (items.length) {
    return items
      .slice(0, MAX_PER_FEED)
      .map((raw) => {
        const title = strip(textBetween(raw, "title"));
        const url = strip(textBetween(raw, "link"));
        const desc = textBetween(raw, "description") || textBetween(raw, "content:encoded");
        const pub = strip(textBetween(raw, "pubDate"));
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

  // Atom <entry>
  items = xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  if (items.length) {
    return items
      .slice(0, MAX_PER_FEED)
      .map((raw) => {
        const title = strip(textBetween(raw, "title"));
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
      })
      .filter((d) => d.url);
  }

  return [];
}

/* ----------------------- FETCH ----------------------- */
async function fetchFeed(url: string): Promise<Doc[]> {
  const res = await fetch(url, { headers: { "user-agent": "WBN-Ingest/1.0" }, cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${url}`);
  const xml = await res.text();
  return parseRSS(xml, new URL(url).hostname);
}

/* ----------------------- ROUTE ----------------------- */
export async function GET(req: Request) {
  // Auth
  const token = new URL(req.url).searchParams.get("token");
  if (!process.env.INGEST_SECRET) {
    return NextResponse.json({ error: "INGEST_SECRET missing" }, { status: 500 });
  }
  if (token !== process.env.INGEST_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Ensure index exists (with primaryKey)
  let index;
  try {
    index = await client.getIndex(INDEX_NAME);
  } catch {
    index = await client.createIndex(INDEX_NAME, { primaryKey: "id" });
  }

  // Fetch all feeds
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const docs = results
    .filter((r): r is PromiseFulfilledResult<Doc[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);

  // Deduplicate by id
  const seen = new Set<string>();
  const unique = docs.filter((d) => {
    if (seen.has(d.id)) return false;
    seen.add(d.id);
    return true;
  });

  // Index
  const task = await index.addDocuments(unique);

  return NextResponse.json({
    ok: true,
    sources: FEEDS.length,
    indexed: unique.length,
    taskUid: (task as any).taskUid ?? (task as any).uid,
  });
}
