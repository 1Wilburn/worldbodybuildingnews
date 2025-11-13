'use client';

import React, { useState } from 'react';

type SearchHit = {
  id: string;
  title: string;
  url?: string;
  source?: string;
  published?: string;
  summary?: string;
  type?: string;
};

type SearchResponse = {
  hits: SearchHit[];
  query: string;
  estimatedTotalHits?: number;
};

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [lastQuery, setLastQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setIsLoading(true);
    setError(null);
    setLastQuery(q);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data: SearchResponse | { error?: string } = await res.json();

      if (!res.ok) {
        throw new Error((data as any).error || 'Search failed');
      }

      setResults((data as SearchResponse).hits || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Search failed');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at 0 0, #1a1a2e 0, #050510 45%, #050505 100%)',
        color: '#f9fafb',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, system-ui, -system-ui, sans-serif',
        padding: '2rem 1.5rem 3rem',
      }}
    >
      <main
        style={{
          maxWidth: 960,
          margin: '0 auto',
        }}
      >
        {/* Logo / Brand */}
        <header style={{ marginBottom: '3rem' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: 2 }}>
            <span
              style={{
                padding: '0.25rem 0.6rem',
                borderRadius: 999,
                border: '1px solid rgba(248,250,252,0.15)',
                background: 'rgba(15,23,42,0.7)',
                backdropFilter: 'blur(10px)',
              }}
            >
              WBN
            </span>
            <span style={{ marginLeft: 8, opacity: 0.8 }}>
              World Bodybuilding News
            </span>
          </div>
        </header>

        {/* Hero + Search */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h1
            style={{
              fontSize: '2.6rem',
              lineHeight: 1.1,
              fontWeight: 800,
              marginBottom: '0.6rem',
            }}
          >
            Global Bodybuilding Search
          </h1>
          <p
            style={{
              maxWidth: 560,
              fontSize: '1rem',
              lineHeight: 1.5,
              color: '#cbd5f5',
              marginBottom: '1.5rem',
            }}
          >
            Search across news, shows, athletes, federations and videos from the
            bodybuilding world — all in one place.
          </p>

          <form
            onSubmit={handleSearch}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  position: 'relative',
                }}
              >
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search shows, winners, athletes, news…"
                  style={{
                    width: '100%',
                    padding: '0.9rem 1rem 0.9rem 2.6rem',
                    borderRadius: 999,
                    border: '1px solid rgba(148,163,184,0.4)',
                    backgroundColor: 'rgba(15,23,42,0.9)',
                    color: '#f9fafb',
                    fontSize: '0.98rem',
                    outline: 'none',
                    boxShadow:
                      '0 0 0 1px rgba(15,23,42,0.5), 0 18px 35px rgba(0,0,0,0.7)',
                  }}
                />
                {/* Search icon */}
                <span
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '1rem',
                    opacity: 0.6,
                  }}
                >
                  🔍
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  padding: '0.8rem 1.6rem',
                  borderRadius: 999,
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  background:
                    'linear-gradient(135deg, #f97316, #facc15, #fb923c)',
                  color: '#111827',
                  cursor: isLoading ? 'default' : 'pointer',
                  boxShadow:
                    '0 12px 25px rgba(248,113,113,0.45), 0 0 0 1px rgba(249,115,22,0.3)',
                  whiteSpace: 'nowrap',
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? 'Searching…' : 'Search'}
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap',
                fontSize: '0.78rem',
                color: '#9ca3af',
              }}
            >
              <span>Try: </span>
              <button
                type="button"
                onClick={() => setQuery('Samson Dauda')}
                style={chipStyle}
              >
                Samson Dauda
              </button>
              <button
                type="button"
                onClick={() => setQuery('Arnold Classic 2025 results')}
                style={chipStyle}
              >
                Arnold Classic 2025
              </button>
              <button
                type="button"
                onClick={() => setQuery('IFBB Pro League schedule')}
                style={chipStyle}
              >
                IFBB Pro schedule
              </button>
            </div>
          </form>
        </section>

        {/* Results */}
        <section>
          {error && (
            <div
              style={{
                marginBottom: '1.5rem',
                padding: '0.75rem 1rem',
                borderRadius: 12,
                border: '1px solid rgba(239,68,68,0.5)',
                backgroundColor: 'rgba(127,29,29,0.6)',
                fontSize: '0.88rem',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {lastQuery && !isLoading && !error && (
            <div
              style={{
                marginBottom: '0.75rem',
                fontSize: '0.9rem',
                color: '#9ca3af',
              }}
            >
              Showing {results.length} result
              {results.length === 1 ? '' : 's'} for{' '}
              <span style={{ color: '#e5e7eb', fontWeight: 500 }}>
                “{lastQuery}”
              </span>
            </div>
          )}

          {!isLoading && !error && lastQuery && results.length === 0 && (
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderRadius: 16,
                border: '1px dashed rgba(148,163,184,0.5)',
                backgroundColor: 'rgba(15,23,42,0.7)',
                fontSize: '0.95rem',
              }}
            >
              No results yet. Try searching for a different athlete, show, or
              news topic.
            </div>
          )}

          {results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {results.map((hit) => (
                <article
                  key={hit.id}
                  style={{
                    padding: '1rem 1.2rem',
                    borderRadius: 18,
                    border: '1px solid rgba(51,65,85,0.9)',
                    background:
                      'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(15,23,42,0.98))',
                    boxShadow: '0 14px 30px rgba(0,0,0,0.7)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.35rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: 0.08,
                        color: '#9ca3af',
                      }}
                    >
                      <span
                        style={{
                          padding: '0.15rem 0.55rem',
                          borderRadius: 999,
                          border: '1px solid rgba(248,250,252,0.1)',
                          background:
                            'linear-gradient(135deg, rgba(59,130,246,0.35), rgba(56,189,248,0.2))',
                          color: '#dbeafe',
                          fontWeight: 600,
                        }}
                      >
                        {hit.type || 'Article'}
                      </span>
                      {hit.source && (
                        <span style={{ opacity: 0.85 }}>{hit.source}</span>
                      )}
                      {hit.published && (
                        <span style={{ opacity: 0.6 }}>• {hit.published}</span>
                      )}
                    </div>
                  </div>

                  <h2
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      marginBottom: '0.25rem',
                    }}
                  >
                    {hit.url ? (
                      <a
                        href={hit.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: '#e5e7eb',
                          textDecoration: 'none',
                        }}
                      >
                        {hit.title}
                      </a>
                    ) : (
                      hit.title
                    )}
                  </h2>

                  {hit.summary && (
                    <p
                      style={{
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                        color: '#cbd5f5',
                        marginBottom: '0.5rem',
                      }}
                    >
                      {hit.summary}
                    </p>
                  )}

                  {hit.url && (
                    <a
                      href={hit.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: '0.82rem',
                        color: '#60a5fa',
                        textDecoration: 'none',
                      }}
                    >
                      Open article ↗
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const chipStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: 999,
  padding: '0.25rem 0.7rem',
  backgroundColor: 'rgba(15,23,42,0.8)',
  color: '#e5e7eb',
  cursor: 'pointer',
};
