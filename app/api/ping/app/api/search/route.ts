import { NextResponse } from 'next/server';
import { MeiliSearch } from 'meilisearch';

const client = new MeiliSearch({
  host: process.env.MEILI_HOST!,
  apiKey: process.env.MEILI_PUBLIC_KEY!,
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();

  if (!q) {
    return NextResponse.json({ hits: [], query: q, estimatedTotalHits: 0 });
  }

  try {
    const index = client.index('articles');
    const results = await index.search(q, { limit: 10 });
    return NextResponse.json(results);
  } catch (err) {
    console.error('Meilisearch error:', err);
    return NextResponse.json({ error: 'search_failed' }, { status: 500 });
  }
}
