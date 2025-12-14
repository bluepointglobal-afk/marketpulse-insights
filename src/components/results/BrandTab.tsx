import { TestResults } from "@/lib/mockData";
import { AlertTriangle, Check, Lightbulb } from "lucide-react";

interface Props { test: TestResults; }

const BrandTab = ({ test }: Props) => {
  const { brandAnalysis } = test;

  return (
    <div className="space-y-6">
      <div className="metric-card">
        <h3 className="font-semibold mb-4">Competitive Positioning</h3>
        <table className="w-full text-sm">
          <thead><tr className="border-b"><th className="text-left py-2">Brand</th><th>Status</th><th>Trust</th><th>Overall</th></tr></thead>
          <tbody>
            <tr className="border-b bg-primary/5"><td className="py-3 font-medium">You ⭐</td><td className="text-center">{brandAnalysis.yourPosition.status}</td><td className="text-center">{brandAnalysis.yourPosition.trust}</td><td className="text-center font-bold">{brandAnalysis.yourPosition.overall}</td></tr>
            {brandAnalysis.competitors.map((c) => (
              <tr key={c.name} className="border-b"><td className="py-3">{c.name}</td><td className="text-center">{c.status}</td><td className="text-center">{c.trust}</td><td className="text-center">{c.overall}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4 text-orange" /><h4 className="font-semibold">Vulnerabilities</h4></div>
          {brandAnalysis.vulnerabilities.map((v, i) => <p key={i} className="text-sm text-muted-foreground mb-2">• {v}</p>)}
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-3"><Lightbulb className="w-4 h-4 text-green" /><h4 className="font-semibold">Opportunities</h4></div>
          {brandAnalysis.opportunities.map((o, i) => <p key={i} className="text-sm text-muted-foreground mb-2">• {o}</p>)}
        </div>
      </div>
    </div>
  );
};

export default BrandTab;
