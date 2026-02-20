import CustomerSuccessStories from "@/components/CustomerSuccessStories";

export default function SuccessStories() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Customer Success Stories</h1>
          <p className="text-muted-foreground">See how our platform delivers measurable ROI</p>
        </div>
        <CustomerSuccessStories />
      </div>
    </div>
  );
}
