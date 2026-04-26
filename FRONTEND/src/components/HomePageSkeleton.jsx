import React from 'react';
import Skeleton from './Skeleton';

export default function HomePageSkeleton() {
  return (
    <div className="animate-page-enter w-full">
      {/* Station Header Skeleton */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-8 w-32 rounded-lg" />
      </header>

      {/* STATUS BAR Skeleton */}
      <Skeleton className="h-[120px] sm:h-[100px] w-full mb-6 rounded-2xl" />

      {/* METRIC CARDS Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>

      {/* Controls Skeleton */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div>
          <Skeleton className="h-3 w-20 mb-1.5" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
        <div>
          <Skeleton className="h-3 w-20 mb-1.5" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-28 rounded-lg mt-auto" />
        <Skeleton className="h-10 w-32 rounded-lg mt-auto" />
        <Skeleton className="h-4 w-48 ml-auto hidden sm:block mt-auto" />
      </div>

      {/* TAB NAVIGATION Skeleton */}
      <div className="mb-6">
        <div className="flex border-b border-border-default gap-6">
          <Skeleton className="h-10 w-24 rounded-none border-b-2 border-transparent" />
          <Skeleton className="h-10 w-36 rounded-none border-b-2 border-transparent" />
          <Skeleton className="h-10 w-32 rounded-none border-b-2 border-transparent" />
        </div>
      </div>

      {/* TAB CONTENT Skeleton (Chart) */}
      <Skeleton className="h-[400px] w-full rounded-2xl mb-6" />
      <Skeleton className="h-[300px] w-full rounded-2xl" />
    </div>
  );
}
