import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4">
        <h1 className="text-8xl font-bold text-on-surface mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-purple-300 mb-4">Portfolio Not Found</h2>
        <p className="text-on-surface-secondary max-w-md mx-auto mb-8">
          The portfolio you&apos;re looking for doesn&apos;t exist or may have been removed.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity"
        >
          ← Go to Homepage
        </Link>
      </div>
    </div>
  );
}
