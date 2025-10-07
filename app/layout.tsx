export const metadata = { title: 'World Bodybuilding News', description: 'Your 24/7 Feed for Everything Bodybuilding' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><head><script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script></head><body className="min-h-screen">
    <header className="bg-white border-b"><nav className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
      <a href="/" className="font-bold">WBN</a><a href="/search">Search</a><a href="/admin/comments">Admin</a><a href="https://shop.worldbodybuildingnews.com" target="_blank">Shop</a>
    </nav></header><main className="max-w-6xl mx-auto px-4 py-6">{children}</main></body></html>);}
