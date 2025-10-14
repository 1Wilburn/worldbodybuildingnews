// app/search/page.tsx
import GlobalSearch from '../components/GlobalSearch';

export const metadata = {
  title: 'Search | World Bodybuilding News',
  description: 'Search bodybuilding shows, athletes, and federations worldwide.',
};

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-4 text-center">
          Global Bodybuilding Search
        </h1>
        <p className="text-center text-neutral-600 mb-8">
          Find shows, athletes, federations, and news across the bodybuilding world.
        </p>
        <GlobalSearch />
      </section>
    </main>
  );
}
