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
  source: string;
  title: string;
  location: string;
  date: string;
  url: string;
};

// Format for display in calendar
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

  // EMAIL SIGNUP
  const [email, setEmail] = useState("");
  const [emailMessage, setEmailMessage] = useState<string | null>(null);

  // CALENDAR
  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // REAL SHOW DATA (from MeiliSearch)
  const [shows, setShows] = useState<ShowEvent[]>([]);
  const [showsLoading, setShowsLoading] = useState(false);

  // Fetch real shows from MeiliSearch
  useEffect(() => {
    async function loadShows() {
      try {
        setShowsLoading(true);

        const res = await fetch("/api/search?q=*", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            index: "shows",
            limit: 2000,
          }),
        });

        const json = await res.json();
        if (json.hits) {
          setShows(json.hits);
        }
      } catch (err) {
        console.log("Show load error:", err);
      } finally {
        setShowsLoading(false);
      }
    }

    loadShows();
  }, []);

  const selectedDayShows = selectedDate
    ? shows.filter((s) => s.date === selectedDate)
    : [];

  // HEADLINES FETCH
  useEffect(() => {
    async function loadHeadlines() {
      try {
        setHeadlineLoading(true);
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

  // SEARCH BAR
  function goToSearch() {
    if (!searchInput.trim()) return;
    const q = encodeURIComponent(searchInput.trim());
    window.location.href = `/search?q=${q}`;
  }

  // CALENDAR MONTH CHANGE
  function changeMonth(delta: number) {
    const base = new Date(calendarYear, calendarMonth, 1);
    base.setMonth(base.getMonth() + delta);
    setCalendarMonth(base.getMonth());
    setCalendarYear(base.getFullYear());
    setSelectedDate(null);
  }

  // Build the calendar grid
  function buildCalendarDays() {
    const firstOfMonth = new Date(calendarYear, calendarMonth, 1);
    const firstWeekday = firstOfMonth.getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    const cells: { label: number; dateStr: string }[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(calendarYear, calendarMonth, i);
      const dateStr = d.toISOString().slice(0, 10);
      cells.push({ label: i, dateStr });
    }

    return { firstWeekday, cells };
  }

  const { firstWeekday, cells } = buildCalendarDays();

  // EMAIL FORM
  function handleEmailSubmit(e: any) {
    e.preventDefault();
    if (!email.trim()) {
      setEmailMessage("Please enter a valid email.");
      return;
    }
    setEmailMessage("Thanks! You'll be notified about new shows and scorecards.");
    setEmail("");
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f5f7", color: "#111827" }}>
      {/* ---------------- NAV + HERO stays unchanged ---------------- */}

      {/* ---------------- HEADLINES BLOCK - unchanged ---------------- */}

      {/* ---------------- CALENDAR (now LIVE DATA) ---------------- */}
      <aside style={{ marginTop: "20px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700 }}>Global Shows Calendar</h2>
        <p style={{ fontSize: "12px", color: "#6b7280" }}>
          {showsLoading ? "Loading live shows…" : `Loaded ${shows.length} shows`}
        </p>

        {/* Month Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            margin: "10px 0",
            fontSize: "14px",
          }}
        >
          <button onClick={() => changeMonth(-1)}>‹</button>
          <strong>
            {new Date(calendarYear, calendarMonth, 1).toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </strong>
          <button onClick={() => changeMonth(1)}>›</button>
        </div>

        {/* Calendar Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "4px",
          }}
        >
          {/* Empty cells */}
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={`e-${i}`} />
          ))}

          {cells.map(({ label, dateStr }) => {
            const hasShow = shows.some((s) => s.date === dateStr);
            const isSelected = selectedDate === dateStr;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                style={{
                  padding: "8px",
                  background: isSelected
                    ? "#fee2e2"
                    : hasShow
                    ? "#e0f2fe"
                    : "#ffffff",
                  border: hasShow ? "1px solid #0ea5e9" : "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontWeight: hasShow ? 700 : 400,
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* SHOW LIST BELOW CALENDAR */}
        <div style={{ marginTop: "12px" }}>
          {selectedDate && (
            <>
              <h3 style={{ fontSize: "14px", fontWeight: 700 }}>
                Shows on {formatDateLabel(selectedDate)}
              </h3>

              {selectedDayShows.length === 0 && (
                <p style={{ fontSize: "12px", color: "#6b7280" }}>
                  No shows scheduled for this date.
                </p>
              )}

              {selectedDayShows.map((show) => (
                <div
                  key={show.id}
                  style={{
                    padding: "8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    marginTop: "8px",
                    background: "#ffffff",
                  }}
                >
                  <strong>{show.title}</strong>
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
                    {show.source.toUpperCase()} — {show.location}
                  </div>
                  <a
                    href={show.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: "12px", color: "#2563eb" }}
                  >
                    View show page →
                  </a>
                </div>
              ))}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
