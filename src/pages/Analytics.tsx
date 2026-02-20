import AnalyticsDashboard from "@/components/AnalyticsDashboard";

export default function Analytics() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Real-time system metrics and performance tracking</p>
        </div>
        <AnalyticsDashboard />
      </div>
    </div>
  );
}
