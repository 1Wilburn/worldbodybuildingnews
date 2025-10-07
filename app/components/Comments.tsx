'use client';
import { useEffect, useMemo, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render?: (selector: string, options?: any) => void;
    };
  }
}
export {};

type Comment = {
  id: string;
  parent_id: string | null;
  target_type: 'news' | 'show' | 'video';
  target_id: string;
  content: string;
  guest_name: string | null;
  user_id: string | null;
  is_deleted: boolean;
  is_pinned: boolean;
  upvotes: number;
  created_at: string;
};
      render?: (selector: string, options?: any) => void;
    };
  }
}
export {};

type Comment = {
  id: string;
  parent_id: string | null;
  target_type: 'news' | 'show' | 'video';
  target_id: string;
  content: string;
  guest_name: string | null;
  user_id: string | null;
  is_deleted: boolean;
  is_pinned: boolean;
  upvotes: number;
  created_at: string;
};
  targetId,
}: {
  targetType: 'news' | 'show' | 'video';
  targetId: string;
}) {
  const [items, setItems] = useState<Comment[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [guestName, setGuestName] = useState('');
  const [replies, setReplies] = useState<Record<string, Comment[]>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [cfToken, setCfToken] = useState('');

  useEffect(() => {
    // Safely render Cloudflare Turnstile if available
    window?.turnstile?.render?.('#wbn-cf', {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      callback: (t: string) => setCfToken(t),
    } as any);
  }, []);

  async function load(p = 1) {
    setLoading(true); // <-- lowercase true
    const url = new URL('/api/comments', window.location.origin);
    url.searchParams.set('targetType', targetType);
    url.searchParams.set('targetId', targetId);
    url.searchParams.set('page', String(p));
    const r = await fetch(url as any);
    const j = await r.json();
    setItems(j.items || []);
    setTotal(j.total || 0);
    setPage(j.page || 1);
    setLoading(false); // <-- lowercase false
  }

  useEffect(() => {
    load(1);
  }, [targetType, targetId]);

  async function post(parent_id?: string) {
    const r = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: text.trim(),
        targetType,
        targetId,
        parentId: parent_id || null,
        guestName,
        cfToken,
      }),
    });
    const j = await r.json();
    if (j.error) {
      alert(j.error);
      return;
    }
    setText('');
    setGuestName('');
    load(1);
  }

  async function toggleReplies(parentId: string) {
    const isOpen = open[parentId];
    setOpen({ ...open, [parentId]: !isOpen });
    if (isOpen || replies[parentId]) return;
    const url = new URL('/api/comments/replies', window.location.origin);
    url.searchParams.set('parentId', parentId);
    const r = await fetch(url as any);
    const j = await r.json();
    setReplies({ ...replies, [parentId]: j.items || [] });
  }

  async function vote(id: string, v: 1 | -1) {
    const r = await fetch('/api/comments/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId: id, value: v }),
    });
    const j = await r.json();
    setItems(items.map((c) => (c.id === id ? { ...c, upvotes: j.score } : c)));
  }

  const pages = useMemo(() => Math.max(1, Math.ceil(total / 20)), [total]);

  return (
    <section className="max-w-3xl mx-auto my-10">
      <h3 className="text-2xl font-semibold mb-4">Comments</h3>

      <div className="rounded-xl border bg-white p-4 mb-6">
        <input
          className="w-full border rounded px-3 py-2 mb-2"
          placeholder="Your name (optional)"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
        />
        <textarea
          className="w-full border rounded px-3 py-2"
          rows={3}
          placeholder="Share your thoughts…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div id="wbn-cf" className="my-2" />
        <button onClick={() => post()} className="mt-2 px-4 py-2 rounded bg-neutral-900 text-white">
          Post
        </button>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <ul className="space-y-4">
          {items.map((c) => (
            <li key={c.id} className="rounded-xl border bg-white p-4">
              <div className="text-sm text-neutral-600">
                <strong className="text-neutral-900">{c.guest_name || 'Member'}</strong>
                <span className="ml-2">{new Date(c.created_at).toLocaleString()}</span>
              </div>
              <div className="mt-2">{c.is_deleted ? <em>[removed]</em> : c.content}</div>
              <div className="mt-3 flex gap-3">
                <button onClick={() => toggleReplies(c.id)} className="underline">
                  View replies
                </button>
                <button onClick={() => vote(c.id, 1)} className="border rounded px-2">
                  ▲ {c.upvotes || 0}
                </button>
                <button onClick={() => vote(c.id, -1)} className="border rounded px-2">
                  ▼
                </button>
              </div>

              {open[c.id] && (replies[c.id]?.length || 0) > 0 && (
                <ul className="mt-3 border-t pt-3 space-y-2">
                  {replies[c.id].map((r) => (
                    <li key={r.id} className="border rounded p-2 bg-white">
                      <div className="text-xs text-neutral-600">
                        <strong className="text-neutral-900">{r.guest_name || 'Member'}</strong>
                        <span className="ml-2">{new Date(r.created_at).toLocaleString()}</span>
                      </div>
                      <div>{r.is_deleted ? <em>[removed]</em> : r.content}</div>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <div className="flex gap-2 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => load(page - 1)}
            className="px-3 py-1.5 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <div>
            {page} / {pages}
          </div>
          <button
            disabled={page >= pages}
            onClick={() => load(page + 1)}
            className="px-3 py-1.5 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
