"use client";

import { useState } from "react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setResults(null);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);

      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "20px", maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: "32px", fontWeight: "bold" }}>
        Global Bodybuilding Search
      </h1>

      <p style={{ marginBottom: 20 }}>
        Find shows, athletes, federations, and news across the bodybuilding world.
      </p>

      <form onSubmit={handleSearch} style={{ marginBottom: 30 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search shows, winners, athletes…"
          style={{
            padding: "10px",
            width: "70%",
            fontSize: "16px",
            border: "1px solid #888",
            borderRadius: 6,
          }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 18px",
            marginLeft: 10,
            fontSize: "16px",
            borderRadius: 6,
            background: "black",
            color: "white",
          }}
        >
          Search
        </button>
      </form>

      {loading && <p>Searching…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* RESULTS */}
      {results && (
        <div style={{ marginTop: 20 }}>
          {/* Articles */}
          <h2>Articles</h2>
          {results.articles?.length ? (
            results.articles.map((item: any) => (
              <div key={item.id} style={{ marginBottom: 15 }}>
                <a
                  href={item.url}
                  target="_blank"
                  style={{ fontSize: 18, fontWeight: "bold" }}
                >
                  {item.title}
                </a>
                <p style={{ margin: "5px 0" }}>{item.summary}</p>
                <small>{item.source}</small>
              </div>
            ))
          ) : (
            <p>No results.</p>
          )}

          {/* People */}
          <h2>People</h2>
          {results.people?.length ? (
            results.people.map((p: any) => (
              <p key={p.id}>{p.name}</p>
            ))
          ) : (
            <p>No results.</p>
          )}

          {/* Shows */}
          <h2>Shows</h2>
          {results.shows?.length ? (
            results.shows.map((s: any) => (
              <p key={s.id}>{s.name}</p>
            ))
          ) : (
            <p>No results.</p>
          )}

          {/* Videos */}
          <h2>Videos</h2>
          {results.videos?.length ? (
            results.videos.map((v: any) => (
              <p key={v.id}>{v.title}</p>
            ))
          ) : (
            <p>No results.</p>
          )}
        </div>
      )}
    </div>
  );
}
