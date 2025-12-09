export async function scrapeIFBBProShows(): Promise<any[]> {
  const url = "https://ifbbpro.com/events/";
  const res = await fetch(url, { cache: "no-store" });

  const html = await res.text();

  const events: any[] = [];

  const regex = /<article[\s\S]*?<\/article>/g;
  const entries = html.match(regex) || [];

  for (const article of entries) {
    const title = article.match(/<h2[^>]*>(.*?)<\/h2>/)?.[1]?.trim() || null;
    const link = article.match(/href="([^"]+)"/)?.[1] || null;
    const date = article.match(/class="event-date">([^<]+)</)?.[1] || null;
    const location = article.match(/class="event-city">([^<]+)</)?.[1] || null;

    if (!title) continue;

    events.push({
      federation: "IFBB Pro League",
      name: title,
      url: link,
      date,
      location,
    });
  }

  return events;
}
