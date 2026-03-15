import CustomerSuccessStories from "@/components/CustomerSuccessStories";
import MainLayout from "@/components/layout/MainLayout";
import { Award } from "lucide-react";

export default function SuccessStories() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #D4A843, #C49A3C)' }}>
            <Award className="h-5 w-5" style={{ color: '#0B1120' }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Success Stories</h1>
            <p className="text-sm text-muted-foreground">Découvrez comment notre plateforme génère un ROI mesurable</p>
          </div>
        </div>
        <CustomerSuccessStories />
      </div>
    </MainLayout>
  );
}
