import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";

interface LeadScore {
  companySize: number;
  industry: number;
  painPoints: number;
  budget: number;
  timeline: number;
  total: number;
  qualification: string;
}

export default function LeadScoringForm() {
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    companySize: "medium",
    industry: "concrete",
    painPoints: [] as string[],
    budget: "100k-500k",
    timeline: "3-6-months",
  });

  const [leadScore, setLeadScore] = useState<LeadScore | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const industries = [
    { value: "concrete", label: "Concrete Production", score: 100 },
    { value: "construction", label: "Construction", score: 85 },
    { value: "manufacturing", label: "Manufacturing", score: 80 },
    { value: "logistics", label: "Logistics & Supply Chain", score: 75 },
    { value: "other", label: "Other", score: 50 },
  ];

  const companySizes = [
    { value: "small", label: "1-50 employees", score: 60 },
    { value: "medium", label: "51-500 employees", score: 85 },
    { value: "large", label: "500+ employees", score: 100 },
  ];

  const painPointsOptions = [
    { id: "quality", label: "Quality Control Issues", score: 25 },
    { id: "downtime", label: "Equipment Downtime", score: 25 },
    { id: "supply", label: "Supply Chain Inefficiency", score: 20 },
    { id: "compliance", label: "Compliance & Certification", score: 15 },
    { id: "costs", label: "Rising Operational Costs", score: 15 },
  ];

  const budgetRanges = [
    { value: "50k-100k", label: "$50K - $100K/year", score: 40 },
    { value: "100k-500k", label: "$100K - $500K/year", score: 80 },
    { value: "500k-1m", label: "$500K - $1M/year", score: 100 },
    { value: "1m-plus", label: "$1M+/year", score: 120 },
  ];

  const timelines = [
    { value: "immediate", label: "Immediate (0-3 months)", score: 100 },
    { value: "3-6-months", label: "3-6 months", score: 85 },
    { value: "6-12-months", label: "6-12 months", score: 60 },
    { value: "future", label: "Future (12+ months)", score: 30 },
  ];

  const calculateScore = () => {
    let score: LeadScore = {
      companySize: 0,
      industry: 0,
      painPoints: 0,
      budget: 0,
      timeline: 0,
      total: 0,
      qualification: "",
    };

    // Company size
    const sizeOption = companySizes.find((s) => s.value === formData.companySize);
    score.companySize = sizeOption?.score || 0;

    // Industry
    const industryOption = industries.find((i) => i.value === formData.industry);
    score.industry = industryOption?.score || 0;

    // Pain points
    formData.painPoints.forEach((painPoint) => {
      const option = painPointsOptions.find((p) => p.id === painPoint);
      score.painPoints += option?.score || 0;
    });

    // Budget
    const budgetOption = budgetRanges.find((b) => b.value === formData.budget);
    score.budget = budgetOption?.score || 0;

    // Timeline
    const timelineOption = timelines.find((t) => t.value === formData.timeline);
    score.timeline = timelineOption?.score || 0;

    // Calculate total
    score.total = Math.round(
      (score.companySize +
        score.industry +
        score.painPoints +
        score.budget +
        score.timeline) /
        5
    );

    // Qualification
    if (score.total >= 85) {
      score.qualification = "🔥 HOT LEAD";
    } else if (score.total >= 70) {
      score.qualification = "⭐ WARM LEAD";
    } else if (score.total >= 50) {
      score.qualification = "❄️ COOL LEAD";
    } else {
      score.qualification = "❌ NOT QUALIFIED";
    }

    setLeadScore(score);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    calculateScore();
    setSubmitted(true);
  };

  const togglePainPoint = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      painPoints: prev.painPoints.includes(id)
        ? prev.painPoints.filter((p) => p !== id)
        : [...prev.painPoints, id],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Lead Qualification Engine
        </h2>
        <p className="text-muted-foreground">
          Intelligent prospect scoring to identify high-value opportunities
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Prospect Information</CardTitle>
            <CardDescription>Tell us about your company</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-semibold mb-2">Company Name</label>
                <input
                  type="text"
                  placeholder="Your company name"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, companyName: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold mb-2">Email</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground"
                  required
                />
              </div>

              {/* Company Size */}
              <div>
                <label className="block text-sm font-semibold mb-2">Company Size</label>
                <select
                  value={formData.companySize}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, companySize: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                >
                  {companySizes.map((size) => (
                    <option key={size.value} value={size.value}>
                      {size.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-semibold mb-2">Industry</label>
                <select
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, industry: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                >
                  {industries.map((ind) => (
                    <option key={ind.value} value={ind.value}>
                      {ind.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pain Points */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  What challenges do you face? (Select all that apply)
                </label>
                <div className="space-y-2">
                  {painPointsOptions.map((option) => (
                    <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.painPoints.includes(option.id)}
                        onChange={() => togglePainPoint(option.id)}
                        className="w-4 h-4 rounded border-border"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-semibold mb-2">Annual Budget</label>
                <select
                  value={formData.budget}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, budget: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                >
                  {budgetRanges.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Timeline */}
              <div>
                <label className="block text-sm font-semibold mb-2">Implementation Timeline</label>
                <select
                  value={formData.timeline}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, timeline: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                >
                  {timelines.map((timeline) => (
                    <option key={timeline.value} value={timeline.value}>
                      {timeline.label}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                type="submit"
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Calculate Lead Score
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {submitted && leadScore && (
            <>
              {/* Score Card */}
              <Card
                className={`bg-card border-border ${
                  leadScore.total >= 85
                    ? "border-green-500/50"
                    : leadScore.total >= 70
                      ? "border-yellow-500/50"
                      : "border-red-500/50"
                }`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {leadScore.total >= 85 ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-yellow-500" />
                    )}
                    Lead Score Result
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-accent mb-2">
                      {leadScore.total}
                    </div>
                    <div className="text-2xl font-bold mb-4">
                      {leadScore.qualification}
                    </div>
                    <div className="w-full bg-background rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          leadScore.total >= 85
                            ? "bg-green-500"
                            : leadScore.total >= 70
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(leadScore.total, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Score Breakdown */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Score Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Company Size</span>
                    <span className="font-semibold text-accent">{leadScore.companySize}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Industry Fit</span>
                    <span className="font-semibold text-accent">{leadScore.industry}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pain Points</span>
                    <span className="font-semibold text-accent">{leadScore.painPoints}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Budget</span>
                    <span className="font-semibold text-accent">{leadScore.budget}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Timeline</span>
                    <span className="font-semibold text-accent">{leadScore.timeline}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendation */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Recommendation</CardTitle>
                </CardHeader>
                <CardContent>
                  {leadScore.total >= 85 ? (
                    <p className="text-sm text-green-500">
                      ✅ <strong>Priority Lead:</strong> This prospect shows strong fit and
                      immediate sales potential. Recommend immediate outreach with personalized demo.
                    </p>
                  ) : leadScore.total >= 70 ? (
                    <p className="text-sm text-yellow-500">
                      ⭐ <strong>Qualified Lead:</strong> Good fit with moderate opportunity.
                      Schedule follow-up consultation within 48 hours.
                    </p>
                  ) : (
                    <p className="text-sm text-red-500">
                      ❌ <strong>Nurture Lead:</strong> Add to nurture campaign. Revisit in 3-6
                      months or when circumstances change.
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {!submitted && (
            <Card className="bg-card border-border">
              <CardContent className="pt-6 text-center text-muted-foreground">
                <p>Fill out the form and click "Calculate Lead Score" to see results</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
