import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, DollarSign, Clock, Target } from "lucide-react";

interface CaseStudy {
  id: number;
  company: string;
  industry: string;
  logo: string;
  challenge: string;
  solution: string;
  results: {
    metric: string;
    value: string;
    icon: React.ReactNode;
  }[];
  roi: {
    annualSavings: string;
    roiPercentage: string;
    paybackPeriod: string;
  };
  quote: string;
  author: string;
  role: string;
  testimonialImage: string;
}

export default function CustomerSuccessStories() {
  const caseStudies: CaseStudy[] = [
    {
      id: 1,
      company: "Talmi Beton",
      industry: "Concrete Production",
      logo: "🏭",
      challenge:
        "Quality inconsistencies causing 15% defect rate, unexpected equipment failures halting production 3-4 times monthly, and inefficient supply chain management.",
      solution:
        "Implemented TBOS with Predictive Quality Agent, Predictive Maintenance Agent, and Supply Chain Optimizer. Integrated with existing SAP system for real-time data flow.",
      results: [
        {
          metric: "Defect Rate Reduction",
          value: "80%",
          icon: <Target className="w-6 h-6 text-green-500" />,
        },
        {
          metric: "Downtime Reduction",
          value: "70%",
          icon: <Clock className="w-6 h-6 text-green-500" />,
        },
        {
          metric: "Supply Chain Efficiency",
          value: "35%",
          icon: <TrendingUp className="w-6 h-6 text-green-500" />,
        },
        {
          metric: "Production Increase",
          value: "30%",
          icon: <TrendingUp className="w-6 h-6 text-green-500" />,
        },
      ],
      roi: {
        annualSavings: "$450,000",
        roiPercentage: "320%",
        paybackPeriod: "2.1 months",
      },
      quote:
        "TBOS transformed how we operate. We went from reactive management to predictive optimization. It's a game-changer for the industry. Our customers are happier, and we're significantly more profitable.",
      author: "Mohamed Talmi",
      role: "CEO, Talmi Beton",
      testimonialImage:
        "https://private-us-east-1.manuscdn.com/sessionFile/t57y8nhVxvx48v2Utww9ba/sandbox/J8A6WhMbW1FSjO9aqkM3Mj-img-1_1771287916000_na1fn_dGJvcy10ZXN0aW1vbmlhbC0x.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80",
    },
    {
      id: 2,
      company: "Gulf Concrete Industries",
      industry: "Concrete Manufacturing",
      logo: "🏢",
      challenge:
        "High maintenance costs ($200K+ annually), 12% equipment downtime, compliance violations in 2 out of 4 plants, and manual quality checks taking 40+ hours/week.",
      solution:
        "Deployed TBOS across 4 plants with Predictive Maintenance, Compliance & Certification Agent, and Real-Time Quality Monitoring. Connected to IoT sensors and ERP system.",
      results: [
        {
          metric: "Maintenance Cost Reduction",
          value: "$185,000",
          icon: <DollarSign className="w-6 h-6 text-green-500" />,
        },
        {
          metric: "Downtime Reduction",
          value: "68%",
          icon: <Clock className="w-6 h-6 text-green-500" />,
        },
        {
          metric: "Compliance Score",
          value: "99.8%",
          icon: <Target className="w-6 h-6 text-green-500" />,
        },
        {
          metric: "QA Time Saved",
          value: "38 hrs/week",
          icon: <Clock className="w-6 h-6 text-green-500" />,
        },
      ],
      roi: {
        annualSavings: "$520,000",
        roiPercentage: "380%",
        paybackPeriod: "1.8 months",
      },
      quote:
        "The predictive maintenance feature alone has saved us hundreds of thousands in downtime costs. But the real value is in the compliance automation - we've eliminated violations entirely.",
      author: "Fatima Al-Mansouri",
      role: "Plant Manager, Gulf Concrete Industries",
      testimonialImage:
        "https://private-us-east-1.manuscdn.com/sessionFile/t57y8nhVxvx48v2Utww9ba/sandbox/J8A6WhMbW1FSjO9aqkM3Mj-img-2_1771287906000_na1fn_dGJvcy10ZXN0aW1vbmlhbC0y.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80",
    },
    {
      id: 3,
      company: "Middle East Concrete Group",
      industry: "Concrete Distribution",
      logo: "🚚",
      challenge:
        "Supply chain delays causing 25% late deliveries, inventory management inefficiencies costing $150K+ annually, and poor demand forecasting.",
      solution:
        "Implemented TBOS Supply Chain Optimizer with AI-powered demand forecasting, inventory optimization, and logistics automation. Integrated with 15+ supplier systems.",
      results: [
        {
          metric: "On-Time Delivery",
          value: "98%",
          icon: <Target className="w-6 h-6 text-green-500" />,
        },
        {
          metric: "Inventory Costs",
          value: "-42%",
          icon: <DollarSign className="w-6 h-6 text-green-500" />,
        },
        {
          metric: "Demand Forecast Accuracy",
          value: "94%",
          icon: <TrendingUp className="w-6 h-6 text-green-500" />,
        },
        {
          metric: "Logistics Efficiency",
          value: "33%",
          icon: <TrendingUp className="w-6 h-6 text-green-500" />,
        },
      ],
      roi: {
        annualSavings: "$380,000",
        roiPercentage: "285%",
        paybackPeriod: "2.4 months",
      },
      quote:
        "Best investment we've made. TBOS pays for itself in the first month through efficiency gains. Our customers see 98% on-time delivery now - that's a competitive advantage we can't overstate.",
      author: "Hassan Al-Rashid",
      role: "CFO, Middle East Concrete Group",
      testimonialImage:
        "https://private-us-east-1.manuscdn.com/sessionFile/t57y8nhVxvx48v2Utww9ba/sandbox/J8A6WhMbW1FSjO9aqkM3Mj-img-3_1771287922000_na1fn_dGJvcy10ZXN0aW1vbmlhbC0z.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80",
    },
    {
      id: 4,
      company: "Concrete Solutions Ltd",
      industry: "Ready-Mix Concrete",
      logo: "🏗️",
      challenge:
        "Quality issues affecting customer satisfaction (NPS: 32), high customer churn (18% annually), and inability to differentiate from competitors.",
      solution:
        "Deployed TBOS Predictive Quality Agent with real-time quality dashboards for customers. Enabled proactive quality management and customer transparency.",
      results: [
        {
          metric: "Customer Satisfaction",
          value: "+68%",
          icon: <TrendingUp className="w-6 h-6 text-green-500" />,
        },
        {
          metric: "Customer Churn",
          value: "-85%",
          icon: <Target className="w-6 h-6 text-green-500" />,
        },
        {
          metric: "NPS Score",
          value: "72",
          icon: <TrendingUp className="w-6 h-6 text-green-500" />,
        },
        {
          metric: "Repeat Orders",
          value: "+45%",
          icon: <TrendingUp className="w-6 h-6 text-green-500" />,
        },
      ],
      roi: {
        annualSavings: "$275,000",
        roiPercentage: "220%",
        paybackPeriod: "3.2 months",
      },
      quote:
        "TBOS helped us reduce quality issues by 80%. Our customers are happier, and we've become the preferred supplier in our region. The competitive advantage is real.",
      author: "Ahmed Hassan",
      role: "Operations Manager, Concrete Solutions Ltd",
      testimonialImage:
        "https://private-us-east-1.manuscdn.com/sessionFile/t57y8nhVxvx48v2Utww9ba/sandbox/J8A6WhMbW1FSjO9aqkM3Mj-img-4_1771287908000_na1fn_dGJvcy10ZXN0aW1vbmlhbC00.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentCase = caseStudies[currentIndex];

  const nextCase = () => {
    setCurrentIndex((prev) => (prev + 1) % caseStudies.length);
  };

  const prevCase = () => {
    setCurrentIndex((prev) => (prev - 1 + caseStudies.length) % caseStudies.length);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Customer Success Stories
        </h2>
        <p className="text-muted-foreground">
          Real results from concrete producers using TBOS
        </p>
      </div>

      {/* Main Case Study */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left - Challenge & Solution */}
        <Card className="bg-card border-border md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">{currentCase.logo}</div>
              <div>
                <CardTitle className="text-2xl">{currentCase.company}</CardTitle>
                <CardDescription>{currentCase.industry}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Challenge */}
            <div>
              <h4 className="font-semibold text-lg mb-2 text-red-500">Challenge</h4>
              <p className="text-muted-foreground">{currentCase.challenge}</p>
            </div>

            {/* Solution */}
            <div>
              <h4 className="font-semibold text-lg mb-2 text-accent">Solution</h4>
              <p className="text-muted-foreground">{currentCase.solution}</p>
            </div>

            {/* Results Grid */}
            <div>
              <h4 className="font-semibold text-lg mb-4 text-green-500">Results</h4>
              <div className="grid md:grid-cols-2 gap-4">
                {currentCase.results.map((result, i) => (
                  <div key={i} className="bg-background rounded-lg p-4 border border-border">
                    <div className="flex items-start gap-3 mb-2">
                      {result.icon}
                      <div>
                        <div className="text-2xl font-bold text-accent">{result.value}</div>
                        <div className="text-sm text-muted-foreground">{result.metric}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right - ROI & Quote */}
        <div className="space-y-4">
          {/* ROI Card */}
          <Card className="bg-gradient-to-br from-accent/20 to-accent/5 border-accent/50">
            <CardHeader>
              <CardTitle className="text-accent">Annual ROI</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Annual Savings</div>
                <div className="text-3xl font-bold text-accent">
                  {currentCase.roi.annualSavings}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">ROI</div>
                <div className="text-3xl font-bold text-green-500">
                  {currentCase.roi.roiPercentage}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Payback Period</div>
                <div className="text-3xl font-bold text-accent">
                  {currentCase.roi.paybackPeriod}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Testimonial */}
          <Card className="bg-card border-border">
            <CardContent className="pt-6 space-y-4">
              <blockquote className="text-sm italic border-l-4 border-accent pl-4">
                "{currentCase.quote}"
              </blockquote>
              <div className="flex items-center gap-3">
                <img
                  src={currentCase.testimonialImage}
                  alt={currentCase.author}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold text-sm">{currentCase.author}</div>
                  <div className="text-xs text-muted-foreground">{currentCase.role}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevCase}
          className="p-2 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground transition"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="flex gap-2">
          {caseStudies.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-3 h-3 rounded-full transition ${
                i === currentIndex ? "bg-accent" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <button
          onClick={nextCase}
          className="p-2 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground transition"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Summary Stats */}
      <Card className="bg-gradient-to-r from-accent/10 to-accent/5 border-accent/30">
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-accent mb-1">$1.625M</div>
              <div className="text-sm text-muted-foreground">Total Annual Savings</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-500 mb-1">301%</div>
              <div className="text-sm text-muted-foreground">Average ROI</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent mb-1">2.4 mo</div>
              <div className="text-sm text-muted-foreground">Avg Payback Period</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent mb-1">4.8/5</div>
              <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
