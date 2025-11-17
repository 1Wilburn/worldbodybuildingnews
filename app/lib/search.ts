export async function search(q: string) {
  if (!q || !q.trim()) return [];

  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
    method: "GET",
  });

  if (!res.ok) return [];

  const data = await res.json();
  return data.hits || [];
}
