// trigger deploy
type Federation = {
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

function norm(u?: string) {
  if (!u) return null;
  const s: string = u.trim();
  if (s.startsWith('http')) return s;
  if (s.startsWith('@')) return 'https://instagram.com/' + s.slice(1);
  return 'https://' + s;
}

export default function FederationOfficialSources(
  { fed }: { fed: Federation }
) {
  const official = norm(federation.official_url);
  const rules = norm(federation.rules_url);
  const calendar = norm(federation.calendar_url);
  const registration = norm(federation.registration_url);
  const instagram = norm(federation.instagram);

  return (
    <aside className="text-sm text-neutral-700">
      <h3 className="font-semibold mb-2">Official Sources</h3>
      <ul className="space-y-1">
        {official && (
          <li>
            <a href={official} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
              Official Website
            </a>
          </li>
        )}
        {rules && (
          <li>
            <a href={rules} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
              Rules
            </a>
          </li>
        )}
        {calendar && (
          <li>
            <a href={calendar} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
              Calendar
            </a>
          </li>
        )}
        {registration && (
          <li>
            <a href={registration} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
              Registration
            </a>
          </li>
        )}
        {instagram && (
          <li>
            <a href={instagram} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
              Instagram
            </a>
          </li>
        )}
      </ul>
    </aside>
  );
}// trigger deploy
type Federation = {
  name: string;
  official_url?: string;
  rules_url?: string;
  calendar_url?: string;
  registration_url?: string;
  instagram?: string;
};

function norm(u?: string) {
  if (!u) return null;
  const s: string = u.trim();
  if (s.startsWith('http')) return s;
  if (s.startsWith('@')) return 'https://instagram.com/' + s.slice(1);
  return 'https://' + s;
}

export default function FederationOfficialSources({ federation }: { federation: Federation }) {
  const official = norm(federation.official_url);
  const rules = norm(federation.rules_url);
  const calendar = norm(federation.calendar_url);
  const registration = norm(federation.registration_url);
  const instagram = norm(federation.instagram);

  return (
    <aside className="text-sm text-neutral-700">
      <h3 className="font-semibold mb-2">Official Sources</h3>
      <ul className="space-y-1">
        {official && (
          <li>
            <a href={official} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
              Official Website
            </a>
          </li>
        )}
        {rules && (
          <li>
            <a href={rules} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
              Rules
            </a>
          </li>
        )}
        {calendar && (
          <li>
            <a href={calendar} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
              Calendar
            </a>
          </li>
        )}
        {registration && (
          <li>
            <a href={registration} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
              Registration
            </a>
          </li>
        )}
        {instagram && (
          <li>
            <a href={instagram} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
              Instagram
            </a>
          </li>
        )}
      </ul>
    </aside>
  );
}// trigger deploy
type Federation = {
  name: string;
  official_url?: string;
  rules_url?: string;
  calendar_url?: string;
  registration_url?: string;
  instagram?: string;
};

function norm(u?: string) {
  if (!u) return null;
  const s: string = u.trim();
  if (s.startsWith('http')) return s;
  if (s.startsWith('@')) return 'https://instagram.com/' + s.slice(1);
  return 'https://' + s;
}

export default function FederationOfficialSources({ federation }: { federation: Federation }) {
  const official = norm(federation.official_url);
  const rules = norm(federation.rules_url);
  const calendar = norm(federation.calendar_url);
  const registration = norm(federation.registration_url);
  const instagram = norm(federation.instagram);

  return (
    <aside className="text-sm text-neutral-700">
      <h3 className="font-semibold mb-2">Official Sources</h3>
      <ul className="space-y-1">
        {official && (
          <li>
            <a href={official} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
              Official Website
            </a>
          </li>
        )}
        {rules && (
          <li>
            <a href={rules} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
              Rules
            </a>
          </li>
        )}
        {calendar && (
          <li>
            <a href={calendar} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
              Calendar
            </a>
          </li>
        )}
        {registration && (
          <li>
            <a href={registration} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
              Registration
            </a>
          </li>
        )}
        {instagram && (
          <li>
            <a href={instagram} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
              Instagram
            </a>
          </li>
        )}
      </ul>
    </aside>
  );
}// trigger deploy
type Federation = {
  name: string;
  official_url?: string;
  rules_url?: string;
  calendar_url?: string;
  registration_url?: string;
  instagram?: string;
};

function norm(u?: string) {
  if (!u) return null;
  const s: string = u.trim();
  if (s.startsWith('http')) return s;
  if (s.startsWith('@')) return 'https://instagram.com/' + s.slice(1);
  return 'https://' + s;
}

export default function FederationOfficialSources({ federation }: { federation: Federation }) {
  const official = norm(federation.official_url);
  const rules = norm(federation.rules_url);
  const calendar = norm(federation.calendar_url);
  const registration = norm(federation.registration_url);
  const instagram = norm(federation.instagram);

  return (
    <aside className="text-sm text-neutral-700">
      <h3 className="font-semibold mb-2">Official Sources</h3>
      <ul className="space-y-1">
        {official && (
          <li>
            <a href={official} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
              Official Website
            </a>
          </li>
        )}
        {rules && (
          <li>
            <a href={rules} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
              Rules
            </a>
          </li>
        )}
        {calendar && (
          <li>
            <a href={calendar} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
              Calendar
            </a>
          </li>
        )}
        {registration && (
          <li>
            <a href={registration} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
              Registration
            </a>
          </li>
        )}
        {instagram && (
          <li>
            <a href={instagram} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
              Instagram
            </a>
          </li>
        )}
      </ul>
    </aside>
  );
}// trigger deploy
type Federation = {
  name: string;
  official_url?: string;
  rules_url?: string;
  calendar_url?: string;
  registration_url?: string;
  instagram?: string;
};

function norm(u?: string) {
  if (!u) return null;
  const s: string = u.trim();
  if (s.startsWith('http')) return s;
  if (s.startsWith('@')) return 'https://instagram.com/' + s.slice(1);
  return 'https://' + s;
}

export default function FederationOfficialSources({ federation }: { federation: Federation }) {
  const official = norm(federation.official_url);
  const rules = norm(federation.rules_url);
  const calendar = norm(federation.calendar_url);
  const registration = norm(federation.registration_url);
  const instagram = norm(federation.instagram);

  return (
    <aside className="text-sm text-neutral-700">
      <h3 className="font-semibold mb-2">Official Sources</h3>
      <ul className="space-y-1">
        {official && (
          <li>
            <a href={official} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
              Official Website
            </a>
          </li>
        )}
        {rules && (
          <li>
            <a href={rules} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
              Rules
            </a>
          </li>
        )}
        {calendar && (
          <li>
            <a href={calendar} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
              Calendar
            </a>
          </li>
        )}
        {registration && (
          <li>
            <a href={registration} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
              Registration
            </a>
          </li>
        )}
        {instagram && (
          <li>
            <a href={instagram} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
              Instagram
            </a>
          </li>
        )}
      </ul>
    </aside>
  );
}

fix: properly declare Federation type and rebuild component
