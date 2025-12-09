import { v4 as uuid } from "uuid";

export function normalizeShows(rawShows: any[]) {
  return rawShows
    .filter(s => s?.name)
    .map(s => ({
      id: uuid(),
      name: s.name,
      federation: s.federation || "Unknown",
      date: normalizeDate(s.date),
      location: s.location || "",
      url: s.url || "",
    }));
}

function normalizeDate(input: string | null) {
  if (!input) return "";

  const d = new Date(input);
  if (isNaN(d.getTime())) return "";

  return d.toISOString().slice(0, 10);
}
