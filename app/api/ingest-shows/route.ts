import { NextResponse } from "next/server";
import { MeiliSearch } from "meilisearch";
import { normalizeDate } from "@/app/lib/normalize-date";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const secret = url.searchParams.get("secret");
  if (secret !== process.env.INGEST_SECRET) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const apiUrl = "https://npcnewsonline.com/wp-json/wp/v2/contest?per_page=100";

    const res = await fetch(apiUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const contests = await res.json();

    const shows = contests.map((c: any) => ({
      title: c.title?.rendered || "",
      location: c.meta?.location || "",
      date: normalizeDate(c.meta?.date || ""),
      sourceUrl: c.link,
    }));

    const client = new MeiliSearch({
      host: process.env.MEILI_HOST!,
      apiKey: process.env.MEILI_WRITE_SHOWS_KEY!,
    });

    const index = client.index("shows");
    const task = await index.addDocuments(shows);

    return NextResponse.json({
      success: true,
      count: shows.length,
      task,
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
