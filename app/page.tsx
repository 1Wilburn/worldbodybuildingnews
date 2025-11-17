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
        backgroundColor: "#f4f5f7",
        color: "#111827",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* -------- Top Nav / Masthead -------- */}
      <header
        style={{
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          {/* Logo / Brand */}
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
                fontSize: "22px",
                fontWeight: 800,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: "#111827",
              }}
            >
              World
            </span>
            <span
              style={{
                fontSize: "22px",
                fontWeight: 800,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: "#dc2626",
              }}
            >
              Bodybuilding
            </span>
            <span
              style={{
                fontSize: "22px",
                fontWeight: 800,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: "#111827",
              }}
            >
              News
            </span>
          </div>

          {/* Simple top nav */}
          <nav
            style={{
              display: "flex",
              gap: "16px",
              fontSize: "13px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            <button
              onClick={() => (window.location.href = "/")}
              style={{
                background: "transparent",
                border: "none",
                color: "#374151",
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
                color: "#374151",
                cursor: "pointer",
              }}
            >
              Search
            </button>
            <button
              onClick={() => {
                const calendarSection = document.getElementById("shows-calendar");
                if (calendarSection) {
                  calendarSection.scrollIntoView({ behavior: "smooth" });
                }
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#374151",
                cursor: "pointer",
              }}
            >
              Shows Calendar
            </button>
          </nav>
        </div>
      </header>

      {/* -------- Page Body -------- */}
      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "20px 16px 40px",
        }}
      >
        {/* Hero: Search bar + small subheadline */}
        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "10px",
            border: "1px solid #e5e7eb",
            padding: "18px 16px 20px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: "14px",
              alignItems: "center",
            }}
          >
            <div style={{ flex: "1 1 260px", minWidth: 0 }}>
              <p
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#9ca3af",
                  marginBottom: "4px",
                }}
              >
                Aggregated Bodybuilding Coverage
              </p>
              <h1
                style={{
                  fontSize: "24px",
                  lineHeight: 1.25,
                  fontWeight: 800,
                  color: "#111827",
                  marginBottom: "6px",
                }}
              >
                Search shows, athletes, results, and news across the bodybuilding world.
              </h1>
              <p
                style={{
                  fontSize: "13px",
                  color: "#4b5563",
                  maxWidth: "520px",
                }}
              >
                One search bar to scan IFBB, NPC, news sites, YouTube, Reddit and more.
                Find scorecards, show coverage, contest prep info, and training content
                in seconds.
              </p>
            </div>

            {/* Search bar */}
            <div
              style={{
                flex: "0 0 380px",
                minWidth: "280px",
                maxWidth: "100%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  width: "100%",
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
                    padding: "10px 12px",
                    borderRadius: "999px",
                    border: "1px solid #d1d5db",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
                <button
                  onClick={goToSearch}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "999px",
                    border: "none",
                    backgroundColor: "#dc2626",
                    color: "#ffffff",
                    fontWeight: 600,
                    fontSize: "13px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Search
                </button>
              </div>

              {/* Trending tags */}
              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  fontSize: "11px",
                  alignItems: "center",
                }}
              >
                <span style={{ color: "#9ca3af" }}>Trending:</span>
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
                      border: "1px solid #e5e7eb",
                      padding: "4px 8px",
                      background: "#f9fafb",
                      color: "#374151",
                      cursor: "pointer",
                    }}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Main content: Headlines + Sidebar (Calendar + Quick Filters) */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2.1fr) minmax(0, 1fr)",
            gap: "20px",
          }}
        >
          {/* -------- Headlines Column -------- */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: "10px",
              }}
            >
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  borderLeft: "4px solid #dc2626",
                  paddingLeft: "10px",
                  color: "#111827",
                }}
              >
                Latest bodybuilding headlines
              </h2>
              <span
                style={{
                  fontSize: "11px",
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Auto-refreshed via feeds
              </span>
            </div>

            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                padding: "10px 14px 6px",
              }}
            >
              {headlineLoading && (
                <p style={{ color: "#6b7280", fontSize: "14px" }}>Loading…</p>
              )}
              {headlineError && (
                <p style={{ color: "#b91c1c", fontSize: "14px" }}>
                  {headlineError}
                </p>
              )}

              {!headlineLoading && !headlineError && headlineHits.length === 0 && (
                <p style={{ color: "#6b7280", fontSize: "14px" }}>
                  No headlines yet — try searching directly, or wait for the next ingest
                  run.
                </p>
              )}

              <div>
                {headlineHits.slice(0, 14).map((hit, index) => (
                  <article
                    key={hit.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr)",
                      padding: "10px 0",
                      borderTop: index === 0 ? "none" : "1px solid #e5e7eb",
                    }}
                  >
                    <div>
                      <a
                        href={hit.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: "15px",
                          fontWeight: 600,
                          color: "#111827",
                          textDecoration: "none",
                        }}
                      >
                        {hit._formatted?.title || hit.title}
                      </a>
                      <p
                        style={{
                          marginTop: "4px",
                          fontSize: "13px",
                          color: "#4b5563",
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
                          color: "#9ca3af",
                        }}
                      >
                        <span>{hit.source}</span>
                        {hit.publishedAt && (
                          <span>{formatDateLabel(hit.publishedAt)}</span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          {/* -------- Sidebar: Calendar + Quick Filters -------- */}
          <aside style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Shows Calendar */}
            <div
              id="shows-calendar"
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                padding: "12px 12px 14px",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#9ca3af",
                  marginBottom: "4px",
                }}
              >
                Global Shows Calendar
              </p>
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  marginBottom: "4px",
                  color: "#111827",
                }}
              >
                NPC & IFBB schedule (sample)
              </h3>
              <p
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "10px",
                }}
              >
                Click a date to see sample shows. Later, this will be wired to live
                federation calendars and scorecards.
              </p>

              {/* Month controls */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                  fontSize: "13px",
                }}
              >
                <button
                  onClick={() => changeMonth(-1)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#6b7280",
                    cursor: "pointer",
                    fontSize: "16px",
                  }}
                  aria-label="Previous month"
                >
                  ‹
                </button>
                <span style={{ fontWeight: 600, color: "#111827" }}>
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
                    color: "#6b7280",
                    cursor: "pointer",
                    fontSize: "16px",
                  }}
                  aria-label="Next month"
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
                  color: "#9ca3af",
                  marginBottom: "4px",
                }}
              >
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div
                    key={d}
                    style={{ textAlign: "center", paddingBottom: "2px" }}
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

                  let bg = "#ffffff";
                  let border = "1px solid #e5e7eb";
                  let fontWeight = 400;
                  if (isSelected) {
                    bg = "#fee2e2";
                    border = "1px solid #dc2626";
                    fontWeight = 600;
                  } else if (hasShow) {
                    bg = "#e0f2fe";
                    border = "1px solid #0ea5e9";
                    fontWeight = 600;
                  } else if (isToday) {
                    bg = "#e5e7eb";
                    fontWeight = 600;
                  }

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      style={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        borderRadius: "6px",
                        border,
                        background: bg,
                        color: "#111827",
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
              <div
                style={{
                  marginTop: "10px",
                  maxHeight: "150px",
                  overflowY: "auto",
                }}
              >
                {!selectedDate && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                    }}
                  >
                    Click a date to see sample shows. Future version will fetch live IFBB
                    / NPC / other federation shows and scorecards.
                  </p>
                )}

                {selectedDate && selectedDayShows.length === 0 && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
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
                      border: "1px solid #e5e7eb",
                      background: "#f9fafb",
                      marginBottom: "6px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        marginBottom: "2px",
                        color: "#111827",
                      }}
                    >
                      {show.name}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#6b7280",
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
                          color: "#2563eb",
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

            {/* Quick filters card */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                padding: "12px 12px 14px",
              }}
            >
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  marginBottom: "4px",
                  color: "#111827",
                }}
              >
                Quick searches
              </h3>
              <p
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "8px",
                }}
              >
                Jump straight into common queries.
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
                  "IFBB Pro show results",
                  "Classic Physique news",
                  "NPC national qualifiers",
                  "Wellness division results",
                  "Natty federations WNBF",
                  "Push pull legs split",
                  "Contest prep diet science",
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
                      border: "1px solid #e5e7eb",
                      background: "#f9fafb",
                      padding: "6px 10px",
                      color: "#111827",
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </section>

        {/* Footer */}
        <footer
          style={{
            marginTop: "28px",
            paddingTop: "14px",
            borderTop: "1px solid #e5e7eb",
            fontSize: "11px",
            color: "#9ca3af",
            textAlign: "center",
          }}
        >
          WorldBodybuildingNews • Aggregating IFBB, NPC & global bodybuilding media into
          one searchable hub. Data refreshed via scheduled ingests.
        </footer>
      </main>
    </div>
  );
}
