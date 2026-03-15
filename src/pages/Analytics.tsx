import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import MainLayout from "@/components/layout/MainLayout";
import { BarChart3 } from "lucide-react";

export default function Analytics() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #D4A843, #C49A3C)' }}>
            <BarChart3 className="h-5 w-5" style={{ color: '#0B1120' }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-sm text-muted-foreground">Métriques système et suivi de performance en temps réel</p>
          </div>
        </div>
        <AnalyticsDashboard />
      </div>
    </MainLayout>
  );
}
