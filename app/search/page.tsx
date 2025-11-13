// app/search/page.tsx
"use client";
import { useState } from "react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function runSearch(e: any) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);

    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    setResults(data.hits || []);
    setLoading(false);
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Global Bodybuilding Search</h1>

      <form onSubmit={runSearch}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search shows, winners, athletes…"
          style={{ padding: "10px", width: "80%" }}
        />
        <button style={{ padding: "10px" }}>Search</button>
      </form>

      {loading && <p>Searching…</p>}

      {!loading && results.length === 0 && <p>No results.</p>}

      <div style={{ marginTop: "20px" }}>
        {results.map((item) => (
          <div key={item.id} style={{ marginBottom: "20px" }}>
            <h3>{item.title}</h3>
            <p>{item.summary}</p>
            <a
              href={item.url}
              target="_blank"
              style={{ color: "blue", textDecoration: "underline" }}
            >
              Read full article
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
