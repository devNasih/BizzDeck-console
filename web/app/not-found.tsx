import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center bg-bd-tealDeep px-6 text-center text-white">
      <p className="overline text-bd-mint">404</p>
      <h1 className="mt-3 font-display text-5xl font-black tracking-tight">Page not found</h1>
      <p className="mt-3 text-white/65">The page you’re looking for has moved or doesn’t exist.</p>
      <Link href="/" className="btn-mint mt-7 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold">
        Back to home
      </Link>
    </main>
  );
}
