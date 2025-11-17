import { NextResponse } from "next/server";
import { MeiliSearch } from "meilisearch";
import crypto from "node:crypto";

/* ----------------------- 1) CONFIG ----------------------- */
const INDEX_NAME = "bodybuilding";
const MAX_PER_FEED = 40;

const FEEDS: string[] = [
  /* BODYBUILDING NEWS & MEDIA */
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
  "https://www.stack3d.com/feed",
  "https://www.fitnessexpost.com/feed/",
  "https://www.bodybuildingmealplan.com/feed/",
  "https://www.elitefitness.com/articles/feed/",
  "https://www.bodybuildingreview.net/feed/",
  "https://www.powerliftingtechnique.com/feed/",
  "https://girlswhopowerlift.com/feed/",

  /* Reddit */
  "https://www.reddit.com/r/fitness/.rss",
  "https://www.reddit.com/r/bodybuilding/.rss",
  "https://www.reddit.com/r/bodybuildingadvice/.rss",
  "https://www.reddit.com/r/naturalbodybuilding/.rss",
  "https://www.reddit.com/r/strength_training/.rss",
  "https://www.reddit.com/r/fitness/.rss",
  "https://www.reddit.com/r/powerlifting/.rss",
  "https://www.reddit.com/r/weightlifting/.rss",
  "https://www.reddit.com/r/bodybuildingforum/.rss",
  "https://www.reddit.com/r/classicbodybuilding/.rss",
  "https://www.reddit.com/r/planetfitnessmembers/.rss",
  "https://www.reddit.com/r/jeffnippard/.rss",
  "https://www.reddit.com/r/weightliftingquestion/.rss",
  "https://www.reddit.com/r/weighttraining/.rss",
  "https://www.reddit.com/r/workout/.rss",

  /* FITNESS & TRAINING */
  "https://breakingmuscle.com/feed/",
  "https://www.t-nation.com/feed/",
  "https://www.strengthlog.com/feed/",
  "https://athleanx.com/feed",
  "https://jocthetrainer.com/feed/",
  "https://physiqonomics.com/feed/",
  "https://www.strongfirst.com/feed/",
  "https://www.powerlifting.sport/feed/",
  "https://www.bodyweighttrainingarena.com/feed/",
  "https://www.liftvault.com/feed/",
  "https://www.simplyshredded.com/feed/",

  /* NUTRITION, SUPPLEMENTS & HEALTH */
  "https://examine.com/feed/",
  "https://supplementclarity.com/feed/",
  "https://www.healthline.com/rss",
  "https://www.precisionnutrition.com/feed",
  "https://www.nutritionadvance.com/feed/",
  "https://legionathletics.com/blog/feed/",
  "https://renaissanceperiodization.com/feed",
  "https://supplementreviews.com/feed/",
  "https://www.anabolicmen.com/feed/",
  "https://www.healthspanmd.com/feed/",

  /* YOUTUBE CHANNELS */
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC1n6m34V0tmC8YpWQK0YvBw",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCwR8tn9qxO0bH1lBFzYfcwA",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC2O3WUlARlJ97H2p8S3e8Jw",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCs2y1cJGOxN0Hf1hY8jA23Q",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCRB8C7v4VfJd_LGZr4IFk6A",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCLqH_eAE8XV9cKkZDxm0M1g",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCf0I2aWlY8qlLAm5XB9mV0Q",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCp6vF7tHVq2OA4RKu0Iomqg",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCGxvVQkA-ZEYo2S_moWWJ0A",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCZZkqJd3uJWFVYzWxZmf0Ug",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCtiJ_75gkbxSdjUjv05zF7Q",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCYWdz9dZYkTfGZNVVRhkE0Q",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCSzUxI4VqWj5gI29s-8Zv-g",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC-fR6qQ0mVqS4YPjR6B_0dg",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCQL-1aQ3e8Qor2yZzS5HcyQ",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCdK0yQ8r4ps2Q9VHtV6nQZA",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCcJtTghV_csFJpQk6WvVlyg",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCi7iZYxzQxYv3grnHVY0bNQ",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC-2JUs_G21BrJ0EFqFFLrFQ",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC8tTGHpgK5YV9g5z0q7Z0bw",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCqkxvB4vOB6x97_GMPQwzJw",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCk7XH-Sdd90b4p9vWlC8bZw",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCJmr4O7zUFLx4lIZdKT7qag",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCLZ0FODa0kC4qO7I5LbhZ3w",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCc0Y3i8S3Pq83ezBz7GSeGQ",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCdh3GK6W7wopgB8o6EqYTJw",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCi_1eG9ZjZC1HQD0t8JvjQA",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCy1P5LjWwzOZcRHdSPVUbFQ",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC_xnFIcErX7qwCqvaHP3Wyg",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC5Yzv0wL2pEPc9DXU-FN74A",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCe7YZC4QG8WJswE0YvFf7Wg",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCxNeUwuud7sustA35dxmOkg",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCW0y3z4dH2Q4GMW4j-WlS1Q",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCJXhxrVPJcQpGdjK70M9Jxg",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC2zX7f7P6B4ezgm5S4tbk-A",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC2LVNpjYrXEKQqxh0aOR_1A",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCWCA9s_0L5WzJwgVdsH9zSw",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCP7ru6JEjJdfL7ZqTEfFwbw",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCpWGHXGhYdP_vJdYoux0WYg",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCxFjK5JGgX7h1C9m1nFJnHw",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCZWvZK0oHIYxXOMqvV5hNKA",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC97k3hlbE-1rVN8y56zyEEA",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC68TLK0mAEzUyHx5k-SmMZw",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCLqH-U2TXzj1h7lyYQZLNQQ",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCg_tz2iw7p8-SmMZw",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCMj0iPlfMyag2UEG0XDuHOA",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UChXRi2xTPa8-SmMZw",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCKpYY0xYeGNN-uOHmQIE7Pg",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCyVfO0ntJGDZbW1qxuQZ-jw",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCXqsQne0YfZ7x2GRB2wSAlA",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCzV8pwjTXe4jQ_coWqLf1Sg",
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC6LDI6qbhOePPrK0xJd-VcQ",

  /* INSTAGRAM */
  "https://rsshub.app/instagram/user/samson_dauda",
  "https://rsshub.app/instagram/user/cbum",
  "https://rsshub.app/instagram/user/hadi_choopan",
  "https://rsshub.app/instagram/user/urskalecinski",
  "https://rsshub.app/instagram/user/big_ramy",
  "https://rsshub.app/instagram/user/andrewjacked",
  "https://rsshub.app/instagram/user/william_bonac",
  "https://rsshub.app/instagram/user/nick_walker39",
  "https://rsshub.app/instagram/user/regangrimes",
  "https://rsshub.app/instagram/user/jojodadbully",
  "https://rsshub.app/instagram/user/ramondino_pro",
  "https://rsshub.app/instagram/user/keone_prodigy",
  "https://rsshub.app/instagram/user/charlesgriffin_ifbbpro",
  "https://rsshub.app/instagram/user/justinrodriguezpro",
  "https://rsshub.app/instagram/user/akim_williams_ifbb",
  "https://rsshub.app/instagram/user/joey_swole",
  "https://rsshub.app/instagram/user/brett_wilkin",
  "https://rsshub.app/instagram/user/clarett_ifbbpro",
  "https://rsshub.app/instagram/user/martynfordofficial",
  "https://rsshub.app/instagram/user/michy_ifbbpro",
  "https://rsshub.app/instagram/user/jaycolorado_ifbbpro",
  "https://rsshub.app/instagram/user/jon_delarosa",
  "https://rsshub.app/instagram/user/benpak",
  "https://rsshub.app/instagram/user/sadikhadzovic",
  "https://rsshub.app/instagram/user/antigramaglia_ifbbpro",
  "https://rsshub.app/instagram/user/roellywinklaar",
  "https://rsshub.app/instagram/user/shawn_rhoden",
  "https://rsshub.app/instagram/user/jacksonpeck_ifbb",
  "https://rsshub.app/instagram/user/patrickmoore_ifbbpro",
  "https://rsshub.app/instagram/user/joeyswoll",
  "https://rsshub.app/instagram/user/joelinibro_ifbb",
  "https://rsshub.app/instagram/user/valentinpetrovpro",

  /* TIKTOK */
  "https://rsshub.app/tiktok/user/@samsondauda",
  "https://rsshub.app/tiktok/user/@officialcbum",
  "https://rsshub.app/tiktok/user/@andrejdeiu",
  "https://rsshub.app/tiktok/user/@big_ramy",
  "https://rsshub.app/tiktok/user/@ramondino_pro",
  "https://rsshub.app/tiktok/user/@keoneprodigy",
  "https://rsshub.app/tiktok/user/@charlesgriffinifbb",
  "https://rsshub.app/tiktok/user/@brett_wilkin",
  "https://rsshub.app/tiktok/user/@joeyswole",
  "https://rsshub.app/tiktok/user/@michy_ifbbpro",
  "https://rsshub.app/tiktok/user/@patrickmooreifbb",
  "https://rsshub.app/tiktok/user/@roellywinklaar",
  "https://rsshub.app/tiktok/user/@martynfordofficial",
  "https://rsshub.app/tiktok/user/@sadikhadzovic",
  "https://rsshub.app/tiktok/user/@nick_walker39",
  "https://rsshub.app/tiktok/user/@regangrimes",

  /* FEDERATIONS */
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
  "https://www.npcworldwide.com/feed/",
  "https://www.icnworldwide.com/feed/",
  "https://www.unkbff.com/feed/",
];

/* ----------------------- 2) MEILISEARCH CLIENT ----------------------- */
const client = new MeiliSearch({
  host: process.env.MEILI_HOST || "",
  apiKey: process.env.MEILI_API_KEY || process.env.MEILI_PUBLIC_KEY || "",
});

/* ----------------------- 3) TYPES ----------------------- */
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

/* ----------------------- 4) PARSER ----------------------- */
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

  // ATOM
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

/* ----------------------- 5) FETCH ----------------------- */
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
export async function GET(req: Request) {
  // ENV CHECKS
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

  /* ---------------- AUTH BLOCK (RESTORED) ---------------- */
  const urlToken = new URL(req.url).searchParams.get("token");
  const headerToken = req.headers.get("x-ingest-token");
  const providedToken = urlToken || headerToken;

  if (!providedToken || providedToken !== process.env.INGEST_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  /* -------------------------------------------------------- */

  // Index creation (auto-created in Meili if missing)
  const index = client.index<Doc>(INDEX_NAME);

  // Fetch all feeds
  const results = await Promise.allSettled(FEEDS.map((u) => fetchFeed(u)));

  const docs = results
    .filter((r): r is PromiseFulfilledResult<Doc[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);

  // Remove duplicates
  const seen = new Set<string>();
  const unique = docs.filter((d) => {
    if (seen.has(d.id)) return false;
    seen.add(d.id);
    return true;
  });

  // Send to Meilisearch
  const task = await index.addDocuments(unique);

  return NextResponse.json({
    ok: true,
    sources: FEEDS.length,
    indexed: unique.length,
    taskUid: (task as any).taskUid ?? (task as any).uid,
  });
}
