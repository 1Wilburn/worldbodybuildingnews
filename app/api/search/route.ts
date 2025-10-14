import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();

    const MEILI_HOST = process.env.MEILI_HOST;
    const MEILI_SEARCH_KEY = process.env.MEILI_SEARCH_KEY;

    if (!q) {
      return NextResponse.json({ ok: true, items: [], total: 0, message: 'Empty query' });
    }

    if (!MEILI_HOST || !MEILI_SEARCH_KEY) {
      return NextResponse.json({
        ok: true,
        items: [],
        total: 0,
        message: 'Meilisearch not configured yet; placeholder result.',
        echo: q,
      });
    }

    // TODO: wire to Meilisearch here next
    return NextResponse.json({ ok: true, items: [], total: 0, message: 'Meilisearch stub', q });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'search error' }, { status: 500 });
  }
}
