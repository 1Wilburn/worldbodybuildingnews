// app/page.tsx

export default function Home() {
  return (
    <main className="p-10">
      <h1 className="text-4xl font-bold mb-6">World Bodybuilding News</h1>
      <p className="text-lg">
        Welcome to the global bodybuilding search engine.  
        Click below to search articles, athletes, shows, videos, and federations.
      </p>

      <a
        href="/search"
        className="inline-block mt-6 px-6 py-3 bg-black text-white rounded-lg text-lg font-semibold"
      >
        Go to Search
      </a>
    </main>
  );
}
