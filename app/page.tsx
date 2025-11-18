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

  // Email signup
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );

  // Calendar State
  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Placeholder data — will be replaced with real scraped + indexed contest data
  const [shows] = useState<ShowEvent[]>([
    {
      id: "sample-1",
      name: "Sample IFBB Pro Show",
      federation: "IFBB Pro League",
      location: "Orlando, FL",
      date: "2025-11-22",
      url: "https://ifbbpro.com",
    },
    {
      id: "sample-2",
      name: "NPC Regional Classic",
      federation: "NPC",
      location: "New York, NY",
      date: "2025-11-29",
      url: "https://npcnewsonline.com",
    },
  ]);

  const selectedDayShows = selectedDate
    ? shows.filter((s) => s.date === selectedDate)
    : [];

  // Load homepage headlines
  useEffect(() => {
    async function loadHeadlines() {
      try {
        setHeadlineLoading(true);

        const res = await fetch("/api/search?q=bodybuilding");
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
    window.location.href = `/search?q=${encodeURIComponent(searchInput)}`;
  }

  function changeMonth(delta: number) {
    const b = new Date(calendarYear, calendarMonth, 1);
    b.setMonth(b.getMonth() + delta);
    setCalendarMonth(b.getMonth());
    setCalendarYear(b.getFullYear());
    setSelectedDate(null);
  }

  function buildCalendarDays() {
    const firstOfMonth = new Date(calendarYear, calendarMonth, 1);
    const firstWeekday = firstOfMonth.getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    const cells = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(calendarYear, calendarMonth, i);
      const dateStr = d.toISOString().slice(0, 10);
      cells.push({ label: i, dateStr });
    }

    return { firstWeekday, cells };
  }

  const { firstWeekday, cells } = buildCalendarDays();

  async function submitEmail() {
    if (!email.trim()) return;

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setEmail("");
        setEmailStatus("success");
      } else {
        setEmailStatus("error");
      }
    } catch {
      setEmailStatus("error");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f4f5f7",
        color: "#111827",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* ---------- TOP NAV ---------- */}
      <header
        style={{
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "14px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            onClick={() => (window.location.href = "/")}
            style={{ cursor: "pointer", display: "flex", gap: 4 }}
          >
            <span style={{ fontSize: 22, fontWeight: 800 }}>World</span>
            <span
              style={{ fontSize: 22, fontWeight: 800, color: "#dc2626" }}
            >
              Bodybuilding
            </span>
            <span style={{ fontSize: 22, fontWeight: 800 }}>News</span>
          </div>

          <nav style={{ display: "flex", gap: 16 }}>
            <button style={navBtn} onClick={() => (window.location.href = "/")}>
              Home
            </button>

            <button
              style={navBtn}
              onClick={() => (window.location.href = "/search")}
            >
              Search
            </button>

            <button
              style={navBtn}
              onClick={() =>
                document
                  .getElementById("shows-calendar")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Shows Calendar
            </button>
          </nav>
        </div>
      </header>

      {/* ---------- MAIN ---------- */}
      <main
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "20px 16px",
        }}
      >
        {/* ---------- HERO SEARCH ---------- */}
        <section
          style={{
            background: "#ffffff",
            padding: "18px 16px",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            marginBottom: 20,
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
            Search shows, athletes, scorecards & news.
          </h1>

          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 10,
            }}
          >
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Try 'Prague Pro scorecard', 'Urs', 'Samson Dauda'"
              onKeyDown={(e) => e.key === "Enter" && goToSearch()}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 999,
                border: "1px solid #d1d5db",
              }}
            />
            <button
              onClick={goToSearch}
              style={{
                padding: "10px 18px",
                borderRadius: 999,
                background: "#dc2626",
                color: "#fff",
                border: "none",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Search
            </button>
          </div>
        </section>

        {/* ---------- EMAIL SIGNUP ---------- */}
        <section
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: "16px",
            marginBottom: 20,
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
            Get bodybuilding show alerts
          </h3>
          <p style={{ fontSize: 13, color: "#4b5563", marginBottom: 12 }}>
            Enter your email to receive updates on upcoming shows and scorecards from
            recently judged contests.
          </p>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                fontSize: 14,
              }}
            />

            <button
              onClick={submitEmail}
              style={{
                padding: "9px 16px",
                backgroundColor: "#2563eb",
                borderRadius: 8,
                color: "#fff",
                border: "none",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Subscribe
            </button>
          </div>

          {emailStatus === "success" && (
            <p style={{ marginTop: 8, color: "green", fontSize: 13 }}>
              You're subscribed!
            </p>
          )}

          {emailStatus === "error" && (
            <p style={{ marginTop: 8, color: "red", fontSize: 13 }}>
              Something went wrong. Try again.
            </p>
          )}
        </section>

        {/* ---------- GRID LAYOUT ---------- */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)",
            gap: 20,
          }}
        >
          {/* ---------- FV-1 HEADLINES GRID ---------- */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  borderLeft: "4px solid #dc2626",
                  paddingLeft: 10,
                }}
              >
                Latest Bodybuilding Headlines
              </h2>
              <span
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                }}
              >
                Updated automatically
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 16,
              }}
            >
              {headlineLoading && (
                <p style={{ color: "#6b7280" }}>Loading…</p>
              )}

              {headlineError && (
                <p style={{ color: "red" }}>{headlineError}</p>
              )}

              {headlineHits.slice(0, 20).map((hit) => (
                <article
                  key={hit.id}
                  style={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: 14,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <a
                      href={hit.url}
                      target="_blank"
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        textDecoration: "none",
                        color: "#111827",
                      }}
                    >
                      {hit._formatted?.title || hit.title}
                    </a>

                    {hit.summary && (
                      <p
                        style={{
                          fontSize: 13,
                          color: "#4b5563",
                          marginTop: 6,
                        }}
                      >
                        {hit._formatted?.summary || hit.summary}
                      </p>
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 11,
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#6b7280",
                    }}
                  >
                    <span>{hit.source}</span>
                    <span>{hit.publishedAt && formatDateLabel(hit.publishedAt)}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* ---------- RIGHT SIDEBAR (CALENDAR + QUICK LINKS) ---------- */}
          <aside style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* ----- Shows Calendar ----- */}
            <div
              id="shows-calendar"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: 14,
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>Shows Calendar</h3>

              {/* Month */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 8,
                }}
              >
                <button style={monthBtn} onClick={() => changeMonth(-1)}>
                  ‹
                </button>

                <span>{new Date(calendarYear, calendarMonth, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>

                <button style={monthBtn} onClick={() => changeMonth(1)}>
                  ›
                </button>
              </div>

              {/* Calendar Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  marginTop: 6,
                  fontSize: 12,
                }}
              >
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((w) => (
                  <div key={w} style={{ textAlign: "center", color: "#6b7280" }}>
                    {w}
                  </div>
                ))}

                {Array.from({ length: firstWeekday }).map((_, i) => (
                  <div key={`e-${i}`} />
                ))}

                {cells.map(({ label, dateStr }) => {
                  const isSelected = selectedDate === dateStr;
                  const hasShow = shows.some((s) => s.date === dateStr);

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      style={{
                        aspectRatio: "1 / 1",
                        borderRadius: 6,
                        margin: 2,
                        border: "1px solid #e5e7eb",
                        background: isSelected
                          ? "#fee2e2"
                          : hasShow
                          ? "#e0f2fe"
                          : "#fff",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div style={{ marginTop: 10 }}>
                {!selectedDate ? (
                  <p style={{ fontSize: 12, color: "#6b7280" }}>
                    Select a date to view scheduled contests.
                  </p>
                ) : selectedDayShows.length === 0 ? (
                  <p style={{ fontSize: 12, color: "#6b7280" }}>
                    No shows found on {formatDateLabel(selectedDate)}.
                  </p>
                ) : (
                  selectedDayShows.map((show) => (
                    <div
                      key={show.id}
                      style={{
                        background: "#f9fafb",
                        padding: 8,
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                        marginBottom: 6,
                      }}
                    >
                      <strong>{show.name}</strong>
                      <br />
                      <span style={{ fontSize: 12 }}>
                        {show.federation} • {show.location}
                      </span>
                      <br />
                      {show.url && (
                        <a href={show.url} style={{ color: "#2563eb", fontSize: 12 }}>
                          View show
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Filters */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                padding: 14,
              }}
            >
              <h4 style={{ fontWeight: 700, marginBottom: 8 }}>Quick Searches</h4>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  "Olympia scorecards",
                  "IFBB Pro results",
                  "NPC national qualifiers",
                  "Classic Physique updates",
                ].map((tag) => (
                  <button
                    key={tag}
                    onClick={() =>
                      (window.location.href = `/search?q=${encodeURIComponent(tag)}`)
                    }
                    style={{
                      textAlign: "left",
                      borderRadius: 999,
                      padding: "6px 10px",
                      border: "1px solid #e5e7eb",
                      background: "#f9fafb",
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </section>

        {/* ---------- FOOTER ---------- */}
        <footer
          style={{
            marginTop: 30,
            paddingTop: 14,
            borderTop: "1px solid #e5e7eb",
            textAlign: "center",
            fontSize: 12,
            color: "#6b7280",
          }}
        >
          © WorldBodybuildingNews — Aggregating IFBB, NPC, natural federations & global
          bodybuilding media.
        </footer>
      </main>
    </div>
  );
}

/* ------------------ Reusable Style Objects ------------------ */
const navBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#374151",
  cursor: "pointer",
  fontSize: 13,
  textTransform: "uppercase",
};

const monthBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  fontSize: 16,
  cursor: "pointer",
  color: "#6b7280",
};
