import MainLayout from '@/components/layout/MainLayout';

interface AccessDeniedProps {
  module: string;
  reason?: string;
}

export function AccessDenied({ module, reason }: AccessDeniedProps) {
  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="text-6xl">🚫</div>
          <h2 className="text-xl font-bold text-destructive">Accès Interdit</h2>
          <p className="text-muted-foreground max-w-md">
            {reason || `Vous n'avez pas les permissions nécessaires pour accéder au module ${module}.`}
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
