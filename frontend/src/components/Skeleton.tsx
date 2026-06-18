'use client';

/**
 * Skeleton loading components for DevSync
 * Used to show loading states while data is being fetched
 */

export function SkeletonCard() {
  return (
    <div className="bg-card rounded-xl border border-outline p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="h-6 w-48 bg-surface-tertiary rounded"></div>
        <div className="h-6 w-16 bg-surface-tertiary rounded"></div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 w-full bg-surface-tertiary rounded"></div>
        <div className="h-4 w-3/4 bg-surface-tertiary rounded"></div>
      </div>
      <div className="flex gap-2">
        <div className="h-6 w-16 bg-surface-tertiary rounded-full"></div>
        <div className="h-6 w-20 bg-surface-tertiary rounded-full"></div>
        <div className="h-6 w-14 bg-surface-tertiary rounded-full"></div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-xl border border-outline p-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-surface-tertiary rounded-xl"></div>
            <div className="flex-1 space-y-2">
              <div className="h-5 w-40 bg-surface-tertiary rounded"></div>
              <div className="h-4 w-24 bg-surface-tertiary rounded"></div>
            </div>
            <div className="h-8 w-8 bg-surface-tertiary rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card rounded-xl border border-outline p-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-20 bg-surface-tertiary rounded"></div>
              <div className="h-8 w-12 bg-surface-tertiary rounded"></div>
            </div>
            <div className="w-12 h-12 bg-surface-tertiary rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-card rounded-xl border border-outline overflow-hidden animate-pulse">
      {/* Header */}
      <div className="border-b border-outline p-4">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-4 bg-surface-tertiary rounded flex-1"></div>
          ))}
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-outline p-4 last:border-0">
          <div className="flex gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="h-4 bg-surface-tertiary rounded flex-1"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="bg-card rounded-xl border border-outline p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 bg-surface-tertiary rounded-full"></div>
        <div className="space-y-2">
          <div className="h-6 w-40 bg-surface-tertiary rounded"></div>
          <div className="h-4 w-32 bg-surface-tertiary rounded"></div>
          <div className="h-4 w-24 bg-surface-tertiary rounded"></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 w-full bg-surface-tertiary rounded"></div>
        <div className="h-4 w-full bg-surface-tertiary rounded"></div>
        <div className="h-4 w-2/3 bg-surface-tertiary rounded"></div>
      </div>
    </div>
  );
}

export function SkeletonChart() {
  // Pre-computed heights for consistent rendering (avoids Math.random in render)
  const barHeights = [45, 78, 32, 65, 89, 55, 72];
  
  return (
    <div className="bg-card rounded-xl border border-outline p-6 animate-pulse">
      <div className="h-6 w-32 bg-surface-tertiary rounded mb-4"></div>
      <div className="h-64 bg-surface-tertiary rounded flex items-end justify-around p-4 gap-2">
        {barHeights.map((height, i) => (
          <div
            key={i}
            className="bg-surface-active rounded-t"
            style={{
              width: '12%',
              height: `${height}%`,
            }}
          ></div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div className="bg-card rounded-xl border border-outline p-6 animate-pulse space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <div className="h-4 w-24 bg-surface-tertiary rounded mb-2"></div>
          <div className="h-10 w-full bg-surface-tertiary rounded"></div>
        </div>
      ))}
      <div className="h-12 w-full bg-surface-tertiary rounded mt-6"></div>
    </div>
  );
}

// Page-level skeleton
export function PageSkeleton({ type = 'cards' }: { type?: 'cards' | 'list' | 'form' | 'profile' }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav skeleton */}
      <div className="bg-card border-b border-outline h-16 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="h-6 w-32 bg-surface-tertiary rounded"></div>
          <div className="flex gap-4">
            <div className="h-8 w-24 bg-surface-tertiary rounded"></div>
            <div className="h-8 w-24 bg-surface-tertiary rounded"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-8 w-48 bg-surface-tertiary rounded mb-2 animate-pulse"></div>
          <div className="h-4 w-64 bg-surface-tertiary rounded animate-pulse"></div>
        </div>

        {type === 'cards' && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {type === 'list' && <SkeletonList count={5} />}
        {type === 'form' && <SkeletonForm />}
        {type === 'profile' && <SkeletonProfile />}
      </div>
    </div>
  );
}

const SkeletonComponents = {
  Card: SkeletonCard,
  List: SkeletonList,
  Stats: SkeletonStats,
  Table: SkeletonTable,
  Profile: SkeletonProfile,
  Chart: SkeletonChart,
  Form: SkeletonForm,
  Page: PageSkeleton,
};

export default SkeletonComponents;
