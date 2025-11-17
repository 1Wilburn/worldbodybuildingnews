"use client";

import { useState, useEffect } from "react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function doSearch(q: string) {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const json = await res.json();

    setResults(json.hits || []);
    setLoading(false);
  }

  return (
    <div style={{ padding: "30px", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "32px", fontWeight: "bold" }}>
        🔎 Bodybuilding Search Engine
      </h1>

      <input
        type="text"
        placeholder="Search shows, athletes, news, YouTube videos, Reddit posts..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          doSearch(e.target.value);
        }}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "6px",
          border: "1px solid #aaa",
          marginTop: "20px",
          fontSize: "18px",
        }}
      />

      {loading && (
        <p style={{ marginTop: "20px", color: "#888" }}>Searching...</p>
      )}

      <div style={{ marginTop: "30px" }}>
        {results.map((r) => (
          <div
            key={r.id}
            style={{
              marginBottom: "25px",
              paddingBottom: "25px",
              borderBottom: "1px solid #ddd",
            }}
          >
            <a
              href={r.url}
              target="_blank"
              style={{
                fontSize: "20px",
                color: "#2b5cff",
                fontWeight: "600",
              }}
            >
              {r._formatted?.title || r.title}
            </a>

            <p style={{ color: "#666", fontSize: "15px", marginTop: "6px" }}>
              {r._formatted?.summary || r.summary}
            </p>

            <p
              style={{
                color: "#999",
                fontSize: "13px",
                marginTop: "6px",
                fontStyle: "italic",
              }}
            >
              Source: {r.source}
            </p>
          </div>
        ))}

        {results.length === 0 && query.trim() !== "" && !loading && (
          <p style={{ color: "#999", marginTop: "20px" }}>
            No results found.
          </p>
        )}
      </div>
    </div>
  );
}
