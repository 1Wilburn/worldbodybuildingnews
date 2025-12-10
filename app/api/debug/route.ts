import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET() {
  const url = "https://npcnewsonline.com/contests/";

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    }
  });

  const html = await res.text();

  // Return only first 2000 chars so Vercel doesn't crash
  return NextResponse.json({
    snippet: html.substring(0, 2000)
  });
}
