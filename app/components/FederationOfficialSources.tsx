// hard reset 2025-10-07 16:15
function norm(u?: string) {
  if (!u) return null;
  const s: string = u.trim();
  if (s.startsWith('http')) return s;
  if (s.startsWith('@')) return 'https://instagram.com/' + s.slice(1);
  return s; // do NOT auto-prepend https:// here; these may be relative paths in CMS
}

export default function FederationOfficialSources({
  federation,
}: {
  federation: {
    name: string;
    official_url?: string;
    rules_url?: string;
    calendar_url?: string;
    registration_url?: string;
    instagram?: string;
    x_twitter?: string;
    youtube?: string;
    country?: string;
  };
}) {
  const rows: { label: string; href?: string }[] = [];

  if (federation.official_url) rows.push({ label: 'Official Website', href: federation.official_url });
  if (federation.rules_url) rows.push({ label: 'Rules & Divisions', href: federation.rules_url });
  if (federation.calendar_url) rows.push({ label: 'Competition Calendar', href: federation.calendar_url });
  if (federation.registration_url) rows.push({ label: 'Athlete Registration', href: federation.registration_url });

  const ig = norm(federation.instagram);
  const tw = norm(federation.x_twitter);
  const yt = norm(federation.youtube);

  if (ig) rows.push({ label: 'Instagram', href: ig });
  if (tw) rows.push({ label: 'X (Twitter)', href: tw });
  if (yt) rows.push({ label: 'YouTube', href: yt });

  return (
    <aside className="rounded-xl border bg-white p-4">
      <h3 className="text-lg font-semibold mb-3">Official Sources</h3>

      {rows.length ? (
        <ul className="space-y-2">
          {rows.map((r, i) => (
            <li key={i}>
              {r.href ? (
                <a href={r.href} className="text-blue-700 underline break-all" target="_blank" rel="noopener noreferrer">
                  {r.label}
                </a>
              ) : (
                <span>{r.label}</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-neutral-600 text-sm">No official links on file yet.</p>
      )}

      {federation.country && (
        <div className="mt-4 text-sm text-neutral-700">
          <span className="font-medium">Primary Region: </span>
          {federation.country}
        </div>
      )}
    </aside>
  );
}
// hard reset 2025-10-07 16:15
function norm(u?: string) {
  if (!u) return null;
  const s: string = u.trim();
  if (s.startsWith('http')) return s;
  if (s.startsWith('@')) return 'https://instagram.com/' + s.slice(1);
  return s; // do NOT auto-prepend https:// here; these may be relative paths in CMS
}

export default function FederationOfficialSources({
  federation,
}: {
  federation: {
    name: string;
    official_url?: string;
    rules_url?: string;
    calendar_url?: string;
    registration_url?: string;
    instagram?: string;
    x_twitter?: string;
    youtube?: string;
    country?: string;
  };
}) {
  const rows: { label: string; href?: string }[] = [];

  if (federation.official_url) rows.push({ label: 'Official Website', href: federation.official_url });
  if (federation.rules_url) rows.push({ label: 'Rules & Divisions', href: federation.rules_url });
  if (federation.calendar_url) rows.push({ label: 'Competition Calendar', href: federation.calendar_url });
  if (federation.registration_url) rows.push({ label: 'Athlete Registration', href: federation.registration_url });

  const ig = norm(federation.instagram);
  const tw = norm(federation.x_twitter);
  const yt = norm(federation.youtube);

  if (ig) rows.push({ label: 'Instagram', href: ig });
  if (tw) rows.push({ label: 'X (Twitter)', href: tw });
  if (yt) rows.push({ label: 'YouTube', href: yt });

  return (
    <aside className="rounded-xl border bg-white p-4">
      <h3 className="text-lg font-semibold mb-3">Official Sources</h3>

      {rows.length ? (
        <ul className="space-y-2">
          {rows.map((r, i) => (
            <li key={i}>
              {r.href ? (
                <a href={r.href} className="text-blue-700 underline break-all" target="_blank" rel="noopener noreferrer">
                  {r.label}
                </a>
              ) : (
                <span>{r.label}</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-neutral-600 text-sm">No official links on file yet.</p>
      )}

      {federation.country && (
        <div className="mt-4 text-sm text-neutral-700">
          <span className="font-medium">Primary Region: </span>
          {federation.country}
        </div>
      )}
    </aside>
  );
}
// hard reset 2025-10-07 16:15
function norm(u?: string) {
  if (!u) return null;
  const s: string = u.trim();
  if (s.startsWith('http')) return s;
  if (s.startsWith('@')) return 'https://instagram.com/' + s.slice(1);
  return s; // do NOT auto-prepend https:// here; these may be relative paths in CMS
}

export default function FederationOfficialSources({
  federation,
}: {
  federation: {
    name: string;
    official_url?: string;
    rules_url?: string;
    calendar_url?: string;
    registration_url?: string;
    instagram?: string;
    x_twitter?: string;
    youtube?: string;
    country?: string;
  };
}) {
  const rows: { label: string; href?: string }[] = [];

  if (federation.official_url) rows.push({ label: 'Official Website', href: federation.official_url });
  if (federation.rules_url) rows.push({ label: 'Rules & Divisions', href: federation.rules_url });
  if (federation.calendar_url) rows.push({ label: 'Competition Calendar', href: federation.calendar_url });
  if (federation.registration_url) rows.push({ label: 'Athlete Registration', href: federation.registration_url });

  const ig = norm(federation.instagram);
  const tw = norm(federation.x_twitter);
  const yt = norm(federation.youtube);

  if (ig) rows.push({ label: 'Instagram', href: ig });
  if (tw) rows.push({ label: 'X (Twitter)', href: tw });
  if (yt) rows.push({ label: 'YouTube', href: yt });

  return (
    <aside className="rounded-xl border bg-white p-4">
      <h3 className="text-lg font-semibold mb-3">Official Sources</h3>

      {rows.length ? (
        <ul className="space-y-2">
          {rows.map((r, i) => (
            <li key={i}>
              {r.href ? (
                <a href={r.href} className="text-blue-700 underline break-all" target="_blank" rel="noopener noreferrer">
                  {r.label}
                </a>
              ) : (
                <span>{r.label}</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-neutral-600 text-sm">No official links on file yet.</p>
      )}

      {federation.country && (
        <div className="mt-4 text-sm text-neutral-700">
          <span className="font-medium">Primary Region: </span>
          {federation.country}
        </div>
      )}
    </aside>
  );
}
// hard reset 2025-10-07 16:15
function norm(u?: string) {
  if (!u) return null;
  const s: string = u.trim();
  if (s.startsWith('http')) return s;
  if (s.startsWith('@')) return 'https://instagram.com/' + s.slice(1);
  return s; // do NOT auto-prepend https:// here; these may be relative paths in CMS
}

export default function FederationOfficialSources({
  federation,
}: {
  federation: {
    name: string;
    official_url?: string;
    rules_url?: string;
    calendar_url?: string;
    registration_url?: string;
    instagram?: string;
    x_twitter?: string;
    youtube?: string;
    country?: string;
  };
}) {
  const rows: { label: string; href?: string }[] = [];

  if (federation.official_url) rows.push({ label: 'Official Website', href: federation.official_url });
  if (federation.rules_url) rows.push({ label: 'Rules & Divisions', href: federation.rules_url });
  if (federation.calendar_url) rows.push({ label: 'Competition Calendar', href: federation.calendar_url });
  if (federation.registration_url) rows.push({ label: 'Athlete Registration', href: federation.registration_url });

  const ig = norm(federation.instagram);
  const tw = norm(federation.x_twitter);
  const yt = norm(federation.youtube);

  if (ig) rows.push({ label: 'Instagram', href: ig });
  if (tw) rows.push({ label: 'X (Twitter)', href: tw });
  if (yt) rows.push({ label: 'YouTube', href: yt });

  return (
    <aside className="rounded-xl border bg-white p-4">
      <h3 className="text-lg font-semibold mb-3">Official Sources</h3>

      {rows.length ? (
        <ul className="space-y-2">
          {rows.map((r, i) => (
            <li key={i}>
              {r.href ? (
                <a href={r.href} className="text-blue-700 underline break-all" target="_blank" rel="noopener noreferrer">
                  {r.label}
                </a>
              ) : (
                <span>{r.label}</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-neutral-600 text-sm">No official links on file yet.</p>
      )}

      {federation.country && (
        <div className="mt-4 text-sm text-neutral-700">
          <span className="font-medium">Primary Region: </span>
          {federation.country}
        </div>
      )}
    </aside>
  );
}
