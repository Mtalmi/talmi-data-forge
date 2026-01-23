import { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';

interface PermissionGateProps {
  /** Whether the user has permission to see the content */
  allowed: boolean;
  /** Content to render when user has permission */
  children: ReactNode;
  /** Optional custom skeleton to show while loading */
  skeleton?: ReactNode;
  /** Width of the default skeleton button */
  skeletonWidth?: string;
  /** Height of the default skeleton button */
  skeletonHeight?: string;
}

/**
 * PermissionGate - Role-based conditional rendering with loading state
 * 
 * Shows a skeleton loader while the user's role is being determined,
 * then either renders the children (if allowed) or nothing (if not allowed).
 * 
 * Usage:
 * ```tsx
 * <PermissionGate allowed={canApproveDevis}>
 *   <Button onClick={handleApprove}>Valider le Devis</Button>
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  allowed,
  children,
  skeleton,
  skeletonWidth = 'w-24',
  skeletonHeight = 'h-9',
}: PermissionGateProps) {
  const { loading } = useAuth();

  // While auth/role is loading, show skeleton
  if (loading) {
    return skeleton || (
      <Skeleton className={`${skeletonWidth} ${skeletonHeight} rounded-md`} />
    );
  }

  // Once loaded, only render if allowed
  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}

/**
 * PermissionGateGroup - Wrapper for multiple permission-gated action buttons
 * 
 * Shows skeleton loaders for a group of buttons while loading,
 * then renders only the allowed children.
 */
interface PermissionGateGroupProps {
  children: ReactNode;
  /** Number of skeleton buttons to show while loading */
  skeletonCount?: number;
  className?: string;
}

export function PermissionGateGroup({
  children,
  skeletonCount = 2,
  className = 'flex gap-2',
}: PermissionGateGroupProps) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className={className}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Skeleton key={i} className="w-24 h-9 rounded-md" />
        ))}
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}
