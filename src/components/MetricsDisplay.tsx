import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Zap, Users, TrendingUp, Lock, Cpu } from "lucide-react";

export default function MetricsDisplay() {
  const metrics = [
    {
      icon: <Cpu className="w-8 h-8 text-accent" />,
      value: "32",
      label: "AI Agents",
      description: "Intelligent automation modules",
    },
    {
      icon: <Zap className="w-8 h-8 text-accent" />,
      value: "99.99%",
      label: "Uptime SLA",
      description: "Enterprise-grade reliability",
    },
    {
      icon: <Lock className="w-8 h-8 text-accent" />,
      value: "AES-256",
      label: "Encryption",
      description: "Military-grade security",
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-accent" />,
      value: "< 2s",
      label: "Load Time",
      description: "Lightning-fast performance",
    },
    {
      icon: <Shield className="w-8 h-8 text-accent" />,
      value: "SOC 2",
      label: "Certified",
      description: "ISO 27001 compliant",
    },
    {
      icon: <Users className="w-8 h-8 text-accent" />,
      value: "5M+",
      label: "Customers",
      description: "Global user base",
    },
  ];

  const businessMetrics = [
    {
      value: "$40.92M",
      label: "Annual Revenue",
      icon: "💰",
    },
    {
      value: "$3.41M",
      label: "Monthly Revenue",
      icon: "📈",
    },
    {
      value: "70%+",
      label: "Market Share",
      icon: "🎯",
    },
    {
      value: "58",
      label: "Total Agents",
      icon: "🤖",
    },
  ];

  return (
    <div className="space-y-12">
      {/* System Metrics Grid */}
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Enterprise-Grade Performance
          </h3>
          <p className="text-muted-foreground">
            Built for scale, security, and reliability
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {metrics.map((metric, i) => (
            <Card key={i} className="bg-card border-border hover:border-accent/50 transition">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>{metric.icon}</div>
                </div>
                <div className="text-3xl font-bold text-accent mb-1">
                  {metric.value}
                </div>
                <div className="font-semibold text-sm mb-1">{metric.label}</div>
                <div className="text-xs text-muted-foreground">
                  {metric.description}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Business Metrics */}
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Business Impact
          </h3>
          <p className="text-muted-foreground">
            Proven ROI and market leadership
          </p>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {businessMetrics.map((metric, i) => (
            <Card key={i} className="bg-card border-border hover:border-accent/50 transition">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl mb-2">{metric.icon}</div>
                <div className="text-2xl font-bold text-accent mb-1">
                  {metric.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {metric.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Certifications */}
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Compliance & Certifications
          </h3>
          <p className="text-muted-foreground">
            Meet the highest industry standards
          </p>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { badge: "🔒", name: "SOC 2 Type II", desc: "Security & compliance" },
            { badge: "🛡️", name: "ISO 27001", desc: "Information security" },
            { badge: "✅", name: "GDPR", desc: "Data protection" },
            { badge: "🌍", name: "HIPAA", desc: "Healthcare compliant" },
          ].map((cert, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl mb-2">{cert.badge}</div>
                <div className="font-semibold text-sm mb-1">{cert.name}</div>
                <div className="text-xs text-muted-foreground">{cert.desc}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
