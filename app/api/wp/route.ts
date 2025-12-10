import { NextResponse } from "next/server";

export async function GET() {
  const url = "https://npcnewsonline.com/wp-json/wp/v2/";

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  const json = await res.json();

  return NextResponse.json(json);
}
