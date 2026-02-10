import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

// Base shimmer skeleton
export function Skeleton({ className, style, ...props }: SkeletonProps) {
  return (
    <div 
      className={cn(
        "rounded-md relative overflow-hidden",
        "bg-gradient-to-r from-muted/40 via-muted/60 to-muted/40",
        "after:absolute after:inset-0 after:translate-x-[-100%]",
        "after:bg-gradient-to-r after:from-transparent after:via-foreground/[0.04] after:to-transparent",
        "after:animate-[shimmer_2.5s_ease-in-out_infinite]",
        className
      )}
      style={style}
      {...props}
    />
  );
}

// Premium gold shimmer for high-value areas
export function SkeletonPremium({ className }: SkeletonProps) {
  return (
    <div 
      className={cn(
        "skeleton-premium rounded-md",
        className
      )} 
    />
  );
}

// Text line skeleton
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full"
          )} 
        />
      ))}
    </div>
  );
}

// Avatar skeleton
export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  };
  return <Skeleton className={cn("rounded-full", sizes[size])} />;
}

// Button skeleton
export function SkeletonButton({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-10 w-24 rounded-lg", className)} />;
}

// Card skeleton
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <SkeletonAvatar size="md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <SkeletonText lines={2} />
      </CardContent>
    </Card>
  );
}

// KPI card skeleton
export function SkeletonKPI({ className }: SkeletonProps) {
  return (
    <div className={cn("kpi-card p-4 rounded-xl border border-border/30 bg-card/50", className)}>
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-28 mb-2 rounded-md" />
      <Skeleton className="h-3 w-20 rounded-full" />
    </div>
  );
}

// Table skeleton
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton key={colIdx} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Chart skeleton
export function SkeletonChart({ height = 200 }: { height?: number }) {
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {[40, 65, 45, 80, 55, 70, 60, 75, 50, 85, 65, 70].map((h, i) => (
        <Skeleton 
          key={i} 
          className="flex-1 rounded-t-sm" 
          style={{ height: `${h}%` }} 
        />
      ))}
    </div>
  );
}

// Dashboard grid skeleton
export function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-3">
          <SkeletonButton />
          <SkeletonButton />
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonKPI key={i} />
        ))}
      </div>

      {/* Content area */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <Skeleton className="h-5 w-40 mb-4" />
          <SkeletonChart />
        </Card>
        <Card className="p-4">
          <Skeleton className="h-5 w-40 mb-4" />
          <SkeletonTable rows={4} cols={3} />
        </Card>
      </div>
    </div>
  );
}

// List item skeleton
export function SkeletonListItem({ className }: SkeletonProps) {
  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-lg", className)}>
      <SkeletonAvatar size="sm" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

// Form skeleton
export function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <SkeletonButton className="flex-1" />
        <SkeletonButton />
      </div>
    </div>
  );
}

// Bento grid skeleton (CEO Dashboard style)
export function SkeletonBentoGrid() {
  return (
    <div className="bento-grid">
      <div className="bento-wide">
        <SkeletonPremium className="h-32" />
      </div>
      <div className="bento-standard">
        <SkeletonPremium className="h-40" />
      </div>
      <div className="bento-standard">
        <SkeletonPremium className="h-40" />
      </div>
      <div className="bento-wide">
        <SkeletonPremium className="h-48" />
      </div>
      <div className="bento-standard">
        <SkeletonPremium className="h-32" />
      </div>
      <div className="bento-standard">
        <SkeletonPremium className="h-32" />
      </div>
    </div>
  );
}
