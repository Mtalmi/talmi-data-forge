import LeadScoringForm from "@/components/LeadScoringForm";
import MainLayout from "@/components/layout/MainLayout";
import { Target } from "lucide-react";

export default function LeadScoring() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #D4A843, #C49A3C)' }}>
            <Target className="h-5 w-5" style={{ color: '#0B1120' }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Lead Scoring</h1>
            <p className="text-sm text-muted-foreground">Qualifiez vos prospects avec le scoring intelligent</p>
          </div>
        </div>
        <LeadScoringForm />
      </div>
    </MainLayout>
  );
}
