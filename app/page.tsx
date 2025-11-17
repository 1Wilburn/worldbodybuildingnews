"use client";

import { useEffect, useState } from "react";

type SearchHit = {
  id: string;
  title: string;
  url: string;
  source: string;
  summary?: string;
  publishedAt?: string;
  _formatted?: {
    title?: string;
    summary?: string;
  };
};

type ShowEvent = {
  id: string;
  name: string;
  federation: string;
  location: string;
  date: string; // YYYY-MM-DD
  url?: string;
};

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function HomePage() {
  const [headlineHits, setHeadlineHits] = useState<SearchHit[]>([]);
  const [headlineLoading, setHeadlineLoading] = useState(false);
  const [headlineError, setHeadlineError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");

  // --- Calendar state ---
  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth()); // 0-11
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Placeholder show data — later we can swap this for real scraped / API data
  const [shows] = useState<ShowEvent[]>([
    {
      id: "sample-1",
      name: "Sample IFBB Pro Show",
      federation: "IFBB Pro League",
      location: "Orlando, FL, USA",
      date: "2025-11-22",
      url: "https://ifbbpro.com",
    },
    {
      id: "sample-2",
      name: "Sample NPC Regional Classic",
      federation: "NPC",
      location: "New York, NY, USA",
      date: "2025-11-29",
      url: "https://npcnewsonline.com",
    },
  ]);

  const selectedDayShows = selectedDate
    ? shows.filter((s) => s.date === selectedDate)
    : [];

  // --- Load some default “headlines” from your Meili index via /api/search ---
  useEffect(() => {
    async function loadHeadlines() {
      try {
        setHeadlineLoading(true);
        setHeadlineError(null);

        // You can tweak this default query to bias toward “shows”, “Olympia” etc.
        const res = await fetch("/api/search?q=bodybuilding show");
        const json = await res.json();
        setHeadlineHits(json.hits || []);
      } catch (err: any) {
        setHeadlineError(err?.message || "Failed to load headlines");
      } finally {
        setHeadlineLoading(false);
      }
    }

    loadHeadlines();
  }, []);

  function goToSearch() {
    if (!searchInput.trim()) return;
    const q = encodeURIComponent(searchInput.trim());
    window.location.href = `/search?q=${q}`;
  }

  function changeMonth(delta: number) {
    const base = new Date(calendarYear, calendarMonth, 1);
    base.setMonth(base.getMonth() + delta);
    setCalendarMonth(base.getMonth());
    setCalendarYear(base.getFullYear());
    setSelectedDate(null);
  }

  // Build calendar grid for current month/year
  function buildCalendarDays() {
    const firstOfMonth = new Date(calendarYear, calendarMonth, 1);
    const firstWeekday = firstOfMonth.getDay(); // 0 = Sun
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    const cells: { label: number; dateStr: string }[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(calendarYear, calendarMonth, i);
      const dateStr = d.toISOString().slice(0, 10); // YYYY-MM-DD
      cells.push({ label: i, dateStr });
    }

    return { firstWeekday, cells };
  }

  const { firstWeekday, cells } = buildCalendarDays();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#05060a",
        color: "#f5f5f5",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* -------- Top Nav -------- */}
      <header
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background:
            "linear-gradient(to right, rgba(255,0,60,0.22), rgba(0,0,0,0.8))",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "6px",
              cursor: "pointer",
            }}
            onClick={() => (window.location.href = "/")}
          >
            <span
              style={{
                fontSize: "24px",
                fontWeight: 800,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              World
            </span>
            <span
              style={{
                fontSize: "24px",
                fontWeight: 800,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: "#ff184e",
              }}
            >
              Bodybuilding
            </span>
            <span
              style={{
                fontSize: "24px",
                fontWeight: 800,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              News
            </span>
          </div>

          <nav
            style={{
              display: "flex",
              gap: "14px",
              fontSize: "14px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            <button
              onClick={() => (window.location.href = "/")}
              style={{
                background: "transparent",
                border: "none",
                color: "#f5f5f5",
                cursor: "pointer",
              }}
            >
              Home
            </button>
            <button
              onClick={() => (window.location.href = "/search")}
              style={{
                background: "transparent",
                border: "none",
                color: "#f5f5f5",
                cursor: "pointer",
              }}
            >
              Search
            </button>
            <button
              onClick={() => {
                const calendarSection = document.getElementById("shows-calendar");
                if (calendarSection) calendarSection.scrollIntoView({ behavior: "smooth" });
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#f5f5f5",
                cursor: "pointer",
              }}
            >
              Shows Calendar
            </button>
          </nav>
        </div>
      </header>

      {/* -------- Hero + Main Layout -------- */}
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        {/* Hero row */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.2fr)",
            gap: "24px",
            alignItems: "stretch",
          }}
        >
          {/* Search hero */}
          <div
            style={{
              borderRadius: "16px",
              padding: "24px",
              background:
                "radial-gradient(circle at top left, #ff184e33, transparent 50%), #0b0d12",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "0 18px 40px rgba(0,0,0,0.6)",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                letterSpacing: "0.17em",
                textTransform: "uppercase",
                color: "#ff6b9e",
                marginBottom: "6px",
              }}
            >
              AI-POWERED AGGREGATOR
            </p>
            <h1
              style={{
                fontSize: "30px",
                lineHeight: 1.2,
                fontWeight: 800,
                marginBottom: "10px",
              }}
            >
              One search bar for the{" "}
              <span style={{ color: "#ff184e" }}>entire bodybuilding world</span>.
            </h1>
            <p
              style={{
                color: "#c0c4d0",
                fontSize: "15px",
                maxWidth: "540px",
              }}
            >
              Scan IFBB, NPC, news sites, YouTube, Reddit, and more with a single query.
              Find show results, scorecards, training content, and gossip in seconds.
            </p>

            <div
              style={{
                marginTop: "18px",
                display: "flex",
                gap: "10px",
              }}
            >
              <input
                type="text"
                placeholder="Try 'Prague Pro scorecard', 'Samson Dauda', 'Classic Physique 2025'..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") goToSearch();
                }}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(4,6,12,0.9)",
                  color: "#f5f5f5",
                  fontSize: "15px",
                  outline: "none",
                }}
              />
              <button
                onClick={goToSearch}
                style={{
                  padding: "12px 18px",
                  borderRadius: "999px",
                  border: "none",
                  background:
                    "linear-gradient(135deg, #ff184e, #ff7b3b)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "14px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Search
              </button>
            </div>

            <div
              style={{
                marginTop: "14px",
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                fontSize: "12px",
              }}
            >
              <span style={{ color: "#888" }}>Trending:</span>
              {[
                "Mr. Olympia scorecards",
                "Wellness results",
                "NPC regional shows",
                "Classic Physique lineup",
              ].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSearchInput(tag);
                    const q = encodeURIComponent(tag);
                    window.location.href = `/search?q=${q}`;
                  }}
                  style={{
                    borderRadius: "999px",
                    border: "1px solid rgba(255,255,255,0.14)",
                    padding: "4px 10px",
                    background: "transparent",
                    color: "#d0d3dd",
                    cursor: "pointer",
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Right: quick calendar teaser card */}
          <div
            id="shows-calendar"
            style={{
              borderRadius: "16px",
              padding: "18px 18px 20px",
              background:
                "radial-gradient(circle at top right, #1e90ff33, transparent 55%), #05060a",
              border: "1px solid rgba(255,255,255,0.06)",
              minHeight: "100%",
            }}
          >
            <p
              style={{
                fontSize: "13px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#7dd3fc",
                marginBottom: "6px",
              }}
            >
              GLOBAL SHOWS CALENDAR
            </p>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 700,
                marginBottom: "6px",
              }}
            >
              NPC & IFBB shows at a glance
            </h2>
            <p
              style={{
                color: "#b8bfcd",
                fontSize: "13px",
                marginBottom: "12px",
              }}
            >
              Click a date to see sample shows. Later, we’ll wire this to live federation
              data and scorecards.
            </p>

            {/* Mini month controls */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
                fontSize: "13px",
              }}
            >
              <button
                onClick={() => changeMonth(-1)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#9ca3af",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                ‹
              </button>
              <span style={{ fontWeight: 600 }}>
                {new Date(calendarYear, calendarMonth, 1).toLocaleDateString(
                  undefined,
                  { month: "long", year: "numeric" }
                )}
              </span>
              <button
                onClick={() => changeMonth(1)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#9ca3af",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                ›
              </button>
            </div>

            {/* Weekday labels */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                fontSize: "11px",
                textTransform: "uppercase",
                color: "#6b7280",
                marginBottom: "4px",
              }}
            >
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div
                  key={d}
                  style={{ textAlign: "center", paddingBottom: "4px" }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "3px",
                fontSize: "12px",
              }}
            >
              {/* Empty cells before first day */}
              {Array.from({ length: firstWeekday }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {cells.map(({ label, dateStr }) => {
                const isToday =
                  dateStr === today.toISOString().slice(0, 10);
                const isSelected = dateStr === selectedDate;
                const hasShow = shows.some((s) => s.date === dateStr);

                let bg = "transparent";
                let border = "1px solid rgba(148,163,184,0.14)";
                if (isSelected) {
                  bg = "rgba(248,113,113,0.18)";
                  border = "1px solid rgba(248,113,113,0.9)";
                } else if (hasShow) {
                  bg = "rgba(56,189,248,0.15)";
                  border = "1px solid rgba(56,189,248,0.9)";
                } else if (isToday) {
                  bg = "rgba(148,163,184,0.25)";
                }

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    style={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      borderRadius: "8px",
                      border,
                      background: bg,
                      color: "#e5e7eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Shows under calendar */}
            <div style={{ marginTop: "12px", maxHeight: "160px", overflowY: "auto" }}>
              {!selectedDate && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#9ca3af",
                  }}
                >
                  Click any date to see sample shows. This will later fetch real IFBB /
                  NPC calendars and scorecards.
                </p>
              )}

              {selectedDate && selectedDayShows.length === 0 && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#9ca3af",
                  }}
                >
                  No shows found for {formatDateLabel(selectedDate)} (in this sample
                  data).
                </p>
              )}

              {selectedDayShows.map((show) => (
                <div
                  key={show.id}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(148,163,184,0.25)",
                    background: "rgba(15,23,42,0.8)",
                    marginBottom: "6px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      marginBottom: "2px",
                    }}
                  >
                    {show.name}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#9ca3af",
                      marginBottom: "2px",
                    }}
                  >
                    {show.federation} · {show.location}
                  </div>
                  {show.url && (
                    <a
                      href={show.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: "11px",
                        color: "#38bdf8",
                        textDecoration: "underline",
                      }}
                    >
                      View show details
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* -------- Headlines Section -------- */}
        <section style={{ marginTop: "30px", display: "grid", gridTemplateColumns: "minmax(0, 2.1fr) minmax(0, 1fr)", gap: "24px" }}>
          {/* Latest headlines list */}
          <div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 700,
                marginBottom: "10px",
                borderLeft: "3px solid #ff184e",
                paddingLeft: "10px",
              }}
            >
              Latest bodybuilding headlines
            </h2>

            {headlineLoading && (
              <p style={{ color: "#9ca3af", fontSize: "14px" }}>Loading…</p>
            )}
            {headlineError && (
              <p style={{ color: "#f97373", fontSize: "14px" }}>
                {headlineError}
              </p>
            )}

            {!headlineLoading && !headlineError && headlineHits.length === 0 && (
              <p style={{ color: "#9ca3af", fontSize: "14px" }}>
                No headlines yet — try searching directly, or wait for the next ingest
                run.
              </p>
            )}

            <div>
              {headlineHits.slice(0, 12).map((hit) => (
                <article
                  key={hit.id}
                  style={{
                    padding: "14px 0",
                    borderBottom: "1px solid rgba(148,163,184,0.3)",
                  }}
                >
                  <a
                    href={hit.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#e5e7eb",
                      textDecoration: "none",
                    }}
                  >
                    {hit._formatted?.title || hit.title}
                  </a>

                  <p
                    style={{
                      marginTop: "4px",
                      fontSize: "13px",
                      color: "#9ca3af",
                    }}
                  >
                    {hit._formatted?.summary || hit.summary}
                  </p>

                  <div
                    style={{
                      marginTop: "4px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "11px",
                      color: "#6b7280",
                    }}
                  >
                    <span>{hit.source}</span>
                    {hit.publishedAt && (
                      <span>{formatDateLabel(hit.publishedAt)}</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Sidebar with quick filters */}
          <aside
            style={{
              borderRadius: "16px",
              padding: "16px 16px 18px",
              background: "rgba(15,23,42,0.9)",
              border: "1px solid rgba(148,163,184,0.3)",
              height: "fit-content",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              Quick filters
            </h3>
            <p style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "10px" }}>
              Jump straight into common searches.
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                fontSize: "13px",
              }}
            >
              {[
                "Olympia 2025 scorecards",
                "Pro show results",
                "Classic Physique news",
                "NPC national qualifiers",
                "Wellness division",
                "Natty federations WNBF",
                "Training split push pull legs",
                "Diet contest prep science",
              ].map((label) => (
                <button
                  key={label}
                  onClick={() => {
                    const q = encodeURIComponent(label);
                    window.location.href = `/search?q=${q}`;
                  }}
                  style={{
                    textAlign: "left",
                    borderRadius: "999px",
                    border: "1px solid rgba(148,163,184,0.4)",
                    background: "transparent",
                    padding: "6px 10px",
                    color: "#e5e7eb",
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </aside>
        </section>

        {/* Footer */}
        <footer
          style={{
            marginTop: "30px",
            padding: "16px 0 10px",
            fontSize: "11px",
            color: "#6b7280",
            borderTop: "1px solid rgba(31,41,55,1)",
            textAlign: "center",
          }}
        >
          WorldBodybuildingNews • Aggregating IFBB, NPC & bodybuilding media into one
          search. Data refreshed via scheduled ingests.
        </footer>
      </main>
    </div>
  );
}
