import Link from 'next/link';

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6 py-6 lg:px-12">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-3xl text-pine-900">RouteTwin</h1>
          <p className="text-pine-600 text-sm">Elevation-first trail matching for runners.</p>
        </div>
        <nav className="flex gap-4 text-sm">
          <Link className="text-pine-700 hover:text-pine-900" href="/">Upload</Link>
          <Link className="text-pine-700 hover:text-pine-900" href="/match-routes">Match Routes</Link>
          <Link className="text-pine-700 hover:text-pine-900" href="/match-segments">Match Segments</Link>
        </nav>
      </header>
      <main className="mt-8">{children}</main>
    </div>
  );
}
