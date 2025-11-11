import { NextResponse } from "next/server";
import { MeiliSearch, type Index } from "meilisearch";
import crypto from "node:crypto";

/* ----------------------- CONFIG ----------------------- */
const INDEX_NAME = "bodybuilding";
const MAX_PER_FEED = 40;

const FEEDS = [
  "https://generationiron.com/feed/",
  "https://barbend.com/feed/",
  "https://www.muscleandfitness.com/feed/",
  "https://www.bodybuilding.com/rss/articles.xml",
  "https://www.reddit.com/r/bodybuilding/.rss",

  "https://npcnewsonline.com/feed/",
  "https://mrolympia.com/rss.xml",
  "https://ifbbpro.com/feed/",
  "https://ifbbmuscle.com/feed/",
  "https://www.rxmuscle.com/component/k2?format=feed",

  "https://breakingmuscle.com/feed/",
  "https://www.t-nation.com/feed/",
  "https://www.strengthlog.com/feed/",
  "https://www.menshealth.com/fitness/rss/",
  "https://www.womenshealthmag.com/fitness/rss/",
  "https://athleanx.com/feed",

  "https://examine.com/feed/",
  "https://supplementclarity.com/feed/",
  "https://www.healthline.com/rss",
  "https://www.precisionnutrition.com/feed",

  // YouTube Feeds
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC1n6m34V0tmC8YpWQK0YvBw", // Nick Strength & Power
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCwR8tn9qxO0bH1lBFzYfcwA", // MPMD
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC2O3WUlARlJ97H2p8S3e8Jw", // Fouad Abiad
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCs2y1cJGOxN0Hf1hY8jA23Q", // Bodybuilding.com
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCRB8C7v4VfJd_LGZr4IFk6A" // Jay Cutler TV
];

/* ----------------------- CLIENT ----------------------- */
const client = new MeiliSearch({
  host: process.env.MEILI_HOST || "",
  apiKey: process.env.MEILI_API_KEY || process.env.MEILI_PUBLIC_KEY || "",
});

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

/* ----------------------- RSS PARSER ----------------------- */
type Doc = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
  summary?: string;
};

function parseRSS(xml: string, source: string): Doc[] {
  let items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  if (items.length) {
    return items.slice(0, MAX_PER_FEED).map(raw => {
      const title = strip(textBetween(raw, "title"));
      const url = strip(textBetween(raw, "link"));
      const desc = textBetween(raw, "description") || textBetween(raw, "content:encoded");
      const pub = strip(textBetween(raw, "pubDate"));
      return { id: hashId(url || title), title, url, source, publishedAt: pub, summary: strip(desc || "") };
    }).filter(d => d.url);
  }

  items = xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  if (items.length) {
    return items.slice(0, MAX_PER_FEED).map(raw => {
      const title = strip(textBetween(raw, "title"));
      const linkTag = raw.match(/<link[^>]+href="([^"]+)"/i);
      const url = linkTag ? linkTag[1] : strip(textBetween(raw, "id"));
      const summ = textBetween(raw, "summary") || textBetween(raw, "content");
      const pub = strip(textBetween(raw, "updated")) || strip(textBetween(raw, "published"));
      return { id: hashId(url || title), title, url, source, publishedAt: pub, summary: strip(summ || "") };
    }).filter(d => d.url);
  }
  return [];
}

/* ----------------------- FETCH + INDEX ----------------------- */
async function fetchFeed(url: string): Promise<Doc[]> {
  const res = await fetch(url, { headers: { "user-agent": "WBN-Ingest/1.0" }, cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${url}`);
  return parseRSS(await res.text(), new URL(url).hostname);
}

export async function GET(req: Request) {
  if (!process.env.INGEST_SECRET)
    return NextResponse.json({ error: "INGEST_SECRET missing" }, { status: 500 });

  if (new URL(req.url).searchParams.get("token") !== process.env.INGEST_SECRET)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let index: Index<any>;
  try {
    index = await client.getIndex(INDEX_NAME);
  } catch {
    await client.createIndex(INDEX_NAME, { primaryKey: "id" });
    index = client.index(INDEX_NAME) as Index<any>;
  }

  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const docs = results.filter(r => r.status === "fulfilled").flatMap(r => (r as any).value);

  const seen = new Set<string>();
  const unique = docs.filter(d => !seen.has(d.id) && seen.add(d.id));

  const task = await index.addDocuments(unique);

  return NextResponse.json({ ok: true, indexed: unique.length, taskUid: task.taskUid });
}
