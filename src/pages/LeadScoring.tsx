import LeadScoringForm from "@/components/LeadScoringForm";

export default function LeadScoring() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Lead Scoring</h1>
          <p className="text-muted-foreground">Qualify prospects with our intelligent scoring system</p>
        </div>
        <LeadScoringForm />
      </div>
    </div>
  );
}
