import { TestResults } from "@/lib/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props { test: TestResults; }

const FeaturesTab = ({ test }: Props) => {
  const maxDiffResults = (test.maxDiffResults || {}) as any;
  const kanoResults = (test.kanoResults || {}) as any;
  
  const featureRanking = maxDiffResults.featureRanking || [];
  const mustHave = kanoResults.mustHave || [];
  const performance = kanoResults.performance || [];
  const insight = maxDiffResults.insight || "Feature importance analysis based on Bayesian weights.";

  if (featureRanking.length === 0 && mustHave.length === 0 && performance.length === 0) {
    return (
      <div className="metric-card text-center py-8">
        <p className="text-muted-foreground">No feature analysis data available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {featureRanking.length > 0 && (
        <div className="metric-card">
          <h3 className="font-semibold mb-4">MaxDiff: Feature Importance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureRanking} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" />
                <YAxis dataKey="feature" type="category" width={150} className="text-xs" />
                <Tooltip />
                <Bar dataKey="utility" fill="hsl(270, 91%, 55%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-muted-foreground mt-4">{insight}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {mustHave.length > 0 && (
          <div className="metric-card">
            <h4 className="font-semibold text-green mb-3">Must-Have Features</h4>
            {mustHave.map((item: any, i: number) => (
              <div key={i} className="p-3 rounded-lg bg-green/5 border border-green/20 mb-2">
                <p className="font-medium">{item.feature}</p>
                <p className="text-sm text-muted-foreground">{item.reasoning}</p>
              </div>
            ))}
          </div>
        )}
        {performance.length > 0 && (
          <div className="metric-card">
            <h4 className="font-semibold text-primary mb-3">Performance Features</h4>
            {performance.map((item: any, i: number) => (
              <div key={i} className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-2">
                <p className="font-medium">{item.feature}</p>
                <p className="text-sm text-muted-foreground">{item.reasoning}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturesTab;
