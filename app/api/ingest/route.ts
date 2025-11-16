import { NextResponse } from "next/server";
import { MeiliSearch } from "meilisearch";
import crypto from "node:crypto";

/* ----------------------- 1) CONFIG ----------------------- */
const INDEX_NAME = "bodybuilding";
const MAX_PER_FEED = 40;

const FEEDS: string[] = [

  /* ──────────────────────────── BODYBUILDING NEWS & MEDIA ──────────────────────────── */
  "https://generationiron.com/feed/",
  "https://barbend.com/feed/",
  "https://www.muscleandfitness.com/feed/",
  "https://www.bodybuilding.com/rss/articles.xml",
  "https://www.rxmuscle.com/component/k2?format=feed",
  "https://www.evolutionofbodybuilding.net/feed/",
  "https://fitnessvolt.com/feed/",
  "https://www.ironmanmagazine.com/feed/",
  "https://www.musculardevelopment.com/feed/",
  "https://www.criticalbench.com/feed/",
  "https://www.tigerfitness.com/blogs/news.atom",
  "https://www.fbsupplementsreview.com/feed/",
  "https://www.strongerbyscience.com/feed/",
  "https://startingstrength.com/feed/",

  /* New additions */
  "https://www.stack3d.com/feed",
  "https://www.fitnessexpost.com/feed/",
  "https://www.bodybuildingmealplan.com/feed/",
  "https://www.elitefitness.com/articles/feed/",
  "https://www.bodybuildingreview.net/feed/",
  "https://www.powerliftingtechnique.com/feed/",
  "https://girlswhopowerlift.com/feed/",

  /* Reddit */
  "https://www.reddit.com/r/bodybuilding/.rss",
  "https://www.reddit.com/r/naturalbodybuilding/.rss",
  "https://www.reddit.com/r/fitness/.rss",

  /* ──────────────────────────── FITNESS & TRAINING ──────────────────────────── */
  "https://breakingmuscle.com/feed/",
  "https://www.t-nation.com/feed/",
  "https://www.strengthlog.com/feed/",
  "https://athleanx.com/feed",
  "https://jocthetrainer.com/feed/",
  "https://physiqonomics.com/feed/",
  "https://www.strongfirst.com/feed/",
  "https://www.powerlifting.sport/feed/",

  /* Extra fitness sources */
  "https://www.bodyweighttrainingarena.com/feed/",
  "https://www.liftvault.com/feed/",
  "https://www.simplyshredded.com/feed/",

  /* ──────────────────────────── NUTRITION, SUPPLEMENTS & HEALTH ──────────────────────────── */
  "https://examine.com/feed/",
  "https://supplementclarity.com/feed/",
  "https://www.healthline.com/rss",
  "https://www.precisionnutrition.com/feed",
  "https://www.nutritionadvance.com/feed/",
  "https://legionathletics.com/blog/feed/",
  "https://renaissanceperiodization.com/feed",

  /* New nutrition sources */
  "https://supplementreviews.com/feed/",
  "https://www.anabolicmen.com/feed/",
  "https://www.healthspanmd.com/feed/",

  /* ──────────────────────────── YOUTUBE BODYBUILDING CHANNELS ──────────────────────────── */
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC1n6m34V0tmC8YpWQK0YvBw", // Nick Strength & Power
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCwR8tn9qxO0bH1lBFzYfcwA", // More Plates More Dates
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC2O3WUlARlJ97H2p8S3e8Jw", // Fouad Abiad
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCs2y1cJGOxN0Hf1hY8jA23Q", // Bodybuilding.com
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCRB8C7v4VfJd_LGZr4IFk6A", // Jay Cutler TV
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCLqH_eAE8XV9cKkZDxm0M1g", // Samson Dauda
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCf0I2aWlY8qlLAm5XB9mV0Q", // Milos Sarcev
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCp6vF7tHVq2OA4RKu0Iomqg", // Chris Bumstead
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCGxvVQkA-ZEYo2S_moWWJ0A", // Urs Kalecinski
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCZZkqJd3uJWFVYzWxZmf0Ug", // Derek Lunsford
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCtiJ_75gkbxSdjUjv05zF7Q", // Hadi Choopan
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCYWdz9dZYkTfGZNVVRhkE0Q", // Hunter Labrada
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCSzUxI4VqWj5gI29s-8Zv-g", // Flex Lewis
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC-fR6qQ0mVqS4YPjR6B_0dg", // Kai Greene

  /* New channels */
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCQL-1aQ3e8Qor2yZzS5HcyQ", // Nick Walker
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCdK0yQ8r4ps2Q9VHtV6nQZA", // Regan Grimes
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCcJtTghV_csFJpQk6WvVlyg", // Big Ramy
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCi7iZYxzQxYv3grnHVY0bNQ", // Bodybuilding University
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCsi4f95q-wK0Hn3o9gBWTKg", // Old School Labs

  /* ──────────────────────────── News ──────────────────────────── */
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC7XQkZZgwyUr_FvbzUKGwIQ", // MuscleDiscord (correct ID)
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCxNeUwuud7sustA35dxmOkg", // Beyond The Stage TV
  
  /* ──────────────────────────── INSTAGRAM via RSSHub ──────────────────────────── */
  "https://rsshub.app/instagram/user/samson_dauda",
  "https://rsshub.app/instagram/user/cbum",
  "https://rsshub.app/instagram/user/hadi_choopan",
  "https://rsshub.app/instagram/user/urskalecinski",
  "https://rsshub.app/instagram/user/big_ramy",
  "https://rsshub.app/instagram/user/andrewjacked",
  "https://rsshub.app/instagram/user/william_bonac",

  /* NEW IG */
  "https://rsshub.app/instagram/user/nick_walker39",
  "https://rsshub.app/instagram/user/regangrimes",
  "https://rsshub.app/instagram/user/jojodadbully",

  /* ──────────────────────────── TIKTOK via RSSHub ──────────────────────────── */
  "https://rsshub.app/tiktok/user/@samsondauda",
  "https://rsshub.app/tiktok/user/@officialcbum",
  "https://rsshub.app/tiktok/user/@andrejdeiu",
  "https://rsshub.app/tiktok/user/@big_ramy",

  /* NEW TikTok */
  "https://rsshub.app/tiktok/user/@nick_walker39",
  "https://rsshub.app/tiktok/user/@regangrimes",

  /* ──────────────────────────── FEDERATIONS ──────────────────────────── */
  "https://ifbb.com/feed/",
  "https://ifbbpro.com/feed/",
  "https://npcnewsonline.com/feed/",
  "https://www.theproleague.com/feed/",
  "https://www.wabba-international.com/feed/",
  "https://www.ukdfba.co.uk/feed/",
  "https://www.imba-natural.com/feed/",
  "https://www.inbf.net/feed/",
  "https://www.wnbf.net/feed/",
  "https://www.pnbaelite.com/feed/",
  "https://www.abpu.co.uk/feed/",
  "https://www.nabba.co.uk/feed/",
  "https://www.naturalbodybuilding.com/feed/",
  "https://www.gbo-online.com/feed/",
  "https://www.musclemania.com/feed/",

  /* New federations */
  "https://www.npcworldwide.com/feed/",
  "https://www.icnworldwide.com/feed/",
  "https://www.unkbff.com/feed/",

];

/* ----------------------- 2) MEILISEARCH CLIENT ----------------------- */
const client = new MeiliSearch({
  host: process.env.MEILI_HOST || "",
  apiKey: process.env.MEILI_API_KEY || process.env.MEILI_PUBLIC_KEY || "",
});

/* ----------------------- 3) TYPES & HELPERS ----------------------- */
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

/* ----------------------- 4) LIGHT RSS/ATOM PARSER ----------------------- */
function parseRSS(xml: string, source: string): Doc[] {
  // RSS
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

  // Atom
  items = xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  if (items.length) {
    return items
      .slice(0, MAX_PER_FEED)
      .map((raw) => {
        const title = strip(textBetween(raw, "title"));
        const linkTag = raw.match(/<link[^>]+href="([^"]+)"/i);
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

/* ----------------------- 5) FETCH + INDEX HELPERS ----------------------- */
async function fetchFeed(url: string): Promise<Doc[]> {
  const res = await fetch(url, {
    headers: { "user-agent": "WBN-Ingest/1.0" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${url}`);
  const xml = await res.text();
  return parseRSS(xml, new URL(url).hostname);
}

/* ----------------------- 6) ROUTE ----------------------- */
/** GET /api/ingest?token=INGEST_SECRET */
export async function GET(req: Request) {
  // env guards
  if (!process.env.MEILI_HOST)
    return NextResponse.json(
      { error: "MEILI_HOST missing in env" },
      { status: 500 }
    );
  if (!process.env.MEILI_API_KEY && !process.env.MEILI_PUBLIC_KEY)
    return NextResponse.json(
      { error: "MEILI_API_KEY or MEILI_PUBLIC_KEY missing in env" },
      { status: 500 }
    );

  // auth
  // AUTH — allow both query parameter OR header token
const urlToken = new URL(req.url).searchParams.get("token");
const headerToken = req.headers.get("x-ingest-token");

const providedToken = urlToken || headerToken;

if (!providedToken || providedToken !== process.env.INGEST_SECRET) {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

  // get an Index handle (creates index automatically on first write)
  const index = client.index<Doc>(INDEX_NAME);

  // fetch all feeds (in parallel)
  const results = await Promise.allSettled(FEEDS.map((u) => fetchFeed(u)));
  const docs = results
    .filter((r): r is PromiseFulfilledResult<Doc[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);

  // de-dupe
  const seen = new Set<string>();
  const unique = docs.filter((d) => {
    if (seen.has(d.id)) return false;
    seen.add(d.id);
    return true;
  });

  // index
  const task = await index.addDocuments(unique);

  return NextResponse.json({
    ok: true,
    sources: FEEDS.length,
    indexed: unique.length,
    taskUid: (task as any).taskUid ?? (task as any).uid,
  });
}
