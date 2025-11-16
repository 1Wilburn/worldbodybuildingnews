"use client";

import { useState } from "react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    setLoading(true);

    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    setResults(data.hits || []);
    setLoading(false);
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Global Bodybuilding Search</h1>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search athletes, shows, news…"
        style={{ width: "300px", padding: "8px", marginRight: "12px" }}
      />
      <button onClick={handleSearch}>Search</button>

      {loading && <p>Searching…</p>}

      {!loading && results.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h2>Results ({results.length})</h2>

          {results.map((item: any) => (
            <div key={item.id} style={{ marginBottom: "12px" }}>
              <a
                href={item.url}
                target="_blank"
                style={{ fontWeight: "bold", fontSize: "18px" }}
              >
                {item.title}
              </a>

              <div style={{ fontSize: "14px", opacity: 0.7 }}>
                {item.source} · {item.feedType}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && query.length > 0 && (
        <p>No results found.</p>
      )}
    </div>
  );
}
