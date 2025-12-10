import { parse, parseISO, format } from "date-fns";

/**
 * Normalizes unknown date formats into YYYY-MM-DD format.
 * Accepts things like:
 * - "June 4, 2024"
 * - "4 June 2024"
 * - "2024-06-04"
 * - "06/04/24"
 * - "Saturday, June 4th"
 */
export function normalizeDate(input: string | null): string {
  if (!input) return "";

  const text = input.trim();

  // Try strict ISO first
  try {
    const iso = parseISO(text);
    if (!isNaN(iso.getTime())) return format(iso, "yyyy-MM-dd");
  } catch {}

  // Try parsing with date-fns
  const knownFormats = [
    "MMMM d, yyyy",
    "d MMMM yyyy",
    "MM/dd/yyyy",
    "MM/dd/yy",
    "MMM d, yyyy",
    "d MMM yyyy",
  ];

  for (const fmt of knownFormats) {
    try {
      const parsed = parse(text, fmt, new Date());
      if (!isNaN(parsed.getTime())) return format(parsed, "yyyy-MM-dd");
    } catch {}
  }

  // If all else fails → return original
  return text;
}
