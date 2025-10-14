// app/api/search/route.ts
import { NextResponse } from 'next/server';

const host = process.env.MEILI_HOST; // e.g. https://meili-xxxx.selhosting.com
const apiKey = process.env.MEILI_API_KEY; // your “Search” or “Master” key

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();

  // Empty query → empty result (not an error)
  if (!q) return NextResponse.json({ hits: [], query: q });

  // Meili not configured yet
  if (!host || !apiKey) {
    return NextResponse.json(
      { error: 'Search not configured (set MEILI_HOST and MEILI_API_KEY in Vercel)' },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${host}/indexes/bodybuilding/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ q, limit: 10 }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Search failed' }, { status: 500 });
  }
}
