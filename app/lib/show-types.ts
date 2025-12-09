export type ShowDocument = {
  id: string;               // URL of show page = unique ID
  url: string;

  // Core identifiers
  title: string;            // "NPC Midwest Classic"
  federation: string;       // "NPC", "IFBB Pro", "WNBF", etc.

  // Normalized date (critical)
  date: string;             // YYYY-MM-DD (sortable, filterable)

  // Raw scraped values
  dateRaw?: string;
  locationRaw?: string;

  // Broken down location (optional but useful)
  city?: string;
  state?: string;
  country?: string;

  // Extra metadata (optional for later)
  showType?: string;        // "Regional", "National Qualifier", "Pro", "Amateur"
  categories?: string[];    // "Men's Physique", "Wellness", etc.
};
