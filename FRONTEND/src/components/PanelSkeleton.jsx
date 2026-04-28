import React from 'react';
import Skeleton from './Skeleton';

export default function PanelSkeleton() {
  return (
    <div className="animate-page-enter">
      {/* Header Skeleton */}
      <div className="mb-8">
        <Skeleton className="h-10 w-64 mb-3" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Alert Skeleton (optional but good for layout structure) */}
      <Skeleton className="h-12 w-full mb-6 rounded-lg" />

      {/* Cards/Preview Skeleton */}
      <div className="bg-surface-card border border-border-default rounded-xl p-6 mb-6">
        <Skeleton className="h-6 w-48 mb-5" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>

      {/* Form Skeleton */}
      <div className="bg-surface-card border border-border-default rounded-xl p-6 mb-6">
        <div className="mb-5 pb-4 border-b border-border-default">
          <Skeleton className="h-6 w-56" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-10 w-48 rounded-lg" />
      </div>
    </div>
  );
}
