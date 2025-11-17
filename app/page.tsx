"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Hit = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
  summary?: string;
  _formatted?: {
    title?: string;
    summary?: string;
  };
};

async function fetchSection(query: string, limit: number): Promise<Hit[]> {
  if (!query.trim()) return [];
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  const json = await res.json();
  const hits: Hit[] = json.hits || [];
  return hits.slice(0, limit);
}

export default function HomePage() {
  const [latest, setLatest] = useState<Hit[]>([]);
  const [proShows, setProShows] = useState<Hit[]>([]);
  const [training, setTraining] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [latestHits, proShowHits, trainingHits] = await Promise.all([
        fetchSection("bodybuilding news", 8),
        fetchSection("ifbb pro show npc contest", 6),
        fetchSection("bodybuilding training workout nutrition", 6),
      ]);
      setLatest(latestHits);
      setProShows(proShowHits);
      setTraining(trainingHits);
      setLoading(false);
    })();
  }, []);

  const hero = latest[0];
  const latestRest = latest.slice(1);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#05060a",
        color: "#f5f5f5",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Top Nav */}
      <header
        style={{
          borderBottom: "1px solid #222533",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 20,
          background:
            "linear-gradient(to bottom, rgba(5,6,10,0.96), rgba(5,6,10,0.9))",
          backdropFilter: "blur(10px)",
        }}
      >
        <Link
          href="/"
          style={{
            textDecoration: "none",
            color: "#f5f5f5",
            display: "flex",
            alignItems: "baseline",
            gap: "6px",
          }}
        >
          <span
            style={{
              fontSize: "20px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            WORLD
          </span>
          <span
            style={{
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#ff3838",
            }}
          >
            BODYBUILDING
          </span>
          <span
            style={{
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            NEWS
          </span>
        </Link>

        <nav
          style={{
            display: "flex",
            gap: "18px",
            fontSize: "14px",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
        >
          <Link
            href="/"
            style={{ color: "#f5f5f5", textDecoration: "none", opacity: 0.9 }}
          >
            Home
          </Link>
          <Link
            href="/search"
            style={{ color: "#f5f5f5", textDecoration: "none", opacity: 0.9 }}
          >
            Search
          </Link>
          <Link
            href="/calendar"
            style={{ color: "#f5f5f5", textDecoration: "none", opacity: 0.9 }}
          >
            Calendar
          </Link>
        </nav>
      </header>

      {/* Main layout */}
      <main style={{ padding: "24px" }}>
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "24px",
          }}
        >
          {/* Left: Hero + Latest */}
          <section>
            {/* Hero story */}
            {hero && (
              <article
                style={{
                  borderRadius: "16px",
                  padding: "20px",
                  background:
                    "radial-gradient(circle at top, #181a23, #05060a 70%)",
                  border: "1px solid #262a3a",
                  marginBottom: "28px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "#ff3838",
                    marginBottom: "8px",
                  }}
                >
                  Featured
                </div>
                <a
                  href={hero.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <h1
                    style={{
                      fontSize: "26px",
                      lineHeight: 1.2,
                      marginBottom: "10px",
                      fontWeight: 800,
                    }}
                  >
                    {hero._formatted?.title || hero.title}
                  </h1>
                </a>
                <p
                  style={{
                    fontSize: "15px",
                    color: "#c3c6d5",
                    marginBottom: "10px",
                  }}
                >
                  {hero._formatted?.summary || hero.summary}
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#8b90a5",
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "6px",
                  }}
                >
                  <span>{hero.source}</span>
                  {hero.publishedAt && (
                    <span>{new Date(hero.publishedAt).toLocaleString()}</span>
                  )}
                </p>
              </article>
            )}

            {/* Latest headlines */}
            <section>
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  borderBottom: "1px solid #25293a",
                  paddingBottom: "8px",
                  marginBottom: "10px",
                }}
              >
                Latest Headlines
              </h2>

              {loading && !hero && (
                <p style={{ color: "#9ba0b8", marginTop: "10px" }}>
                  Loading latest news…
                </p>
              )}

              {latestRest.map((item) => (
                <article
                  key={item.id}
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid #151722",
                  }}
                >
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      textDecoration: "none",
                      color: "#f5f5f5",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: 600,
                        marginBottom: "4px",
                      }}
                    >
                      {item._formatted?.title || item.title}
                    </h3>
                  </a>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#9ba0b8",
                      marginBottom: "4px",
                    }}
                  >
                    {item._formatted?.summary || item.summary}
                  </p>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#6f7591",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{item.source}</span>
                    {item.publishedAt && (
                      <span>
                        {new Date(item.publishedAt).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </article>
              ))}

              {!loading && latest.length === 0 && (
                <p style={{ color: "#9ba0b8", marginTop: "10px" }}>
                  No latest articles indexed yet. Cron ingest will fill this
                  automatically over time.
                </p>
              )}
            </section>
          </section>

          {/* Right: Pro shows + Training/Nutrition */}
          <aside
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            {/* Pro Show News */}
            <section
              style={{
                borderRadius: "16px",
                padding: "18px",
                backgroundColor: "#0b0d15",
                border: "1px solid #262a3a",
              }}
            >
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  color: "#ffb347",
                  marginBottom: "8px",
                }}
              >
                Pro Show News
              </h2>
              <p
                style={{
                  fontSize: "12px",
                  color: "#8b90a5",
                  marginBottom: "10px",
                }}
              >
                IFBB / NPC show announcements, previews and recaps.
              </p>

              {proShows.map((item) => (
                <article
                  key={item.id}
                  style={{
                    padding: "8px 0",
                    borderBottom: "1px solid #151722",
                  }}
                >
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      textDecoration: "none",
                      color: "#f5f5f5",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        marginBottom: "3px",
                      }}
                    >
                      {item._formatted?.title || item.title}
                    </h3>
                  </a>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#9ba0b8",
                    }}
                  >
                    {item.source}
                  </p>
                </article>
              ))}

              {!loading && proShows.length === 0 && (
                <p style={{ fontSize: "12px", color: "#9ba0b8" }}>
                  No pro show articles yet — they’ll populate as feeds ingest.
                </p>
              )}
            </section>

            {/* Training & Nutrition */}
            <section
              style={{
                borderRadius: "16px",
                padding: "18px",
                backgroundColor: "#0b0d15",
                border: "1px solid #262a3a",
              }}
            >
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  color: "#4fd1c5",
                  marginBottom: "8px",
                }}
              >
                Training & Nutrition
              </h2>
              <p
                style={{
                  fontSize: "12px",
                  color: "#8b90a5",
                  marginBottom: "10px",
                }}
              >
                Evidence-based training, nutrition, and prep content.
              </p>

              {training.map((item) => (
                <article
                  key={item.id}
                  style={{
                    padding: "8px 0",
                    borderBottom: "1px solid #151722",
                  }}
                >
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      textDecoration: "none",
                      color: "#f5f5f5",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        marginBottom: "3px",
                      }}
                    >
                      {item._formatted?.title || item.title}
                    </h3>
                  </a>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#9ba0b8",
                    }}
                  >
                    {item.source}
                  </p>
                </article>
              ))}

              {!loading && training.length === 0 && (
                <p style={{ fontSize: "12px", color: "#9ba0b8" }}>
                  No training/nutrition articles yet — they’ll appear as feeds
                  are indexed.
                </p>
              )}
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
