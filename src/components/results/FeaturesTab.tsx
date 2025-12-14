import { TestResults } from "@/lib/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props { test: TestResults; }

const FeaturesTab = ({ test }: Props) => {
  const { maxDiffResults, kanoResults } = test;

  return (
    <div className="space-y-6">
      <div className="metric-card">
        <h3 className="font-semibold mb-4">MaxDiff: Feature Importance</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={maxDiffResults.featureRanking} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" />
              <YAxis dataKey="feature" type="category" width={150} className="text-xs" />
              <Tooltip />
              <Bar dataKey="utility" fill="hsl(270, 91%, 55%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-muted-foreground mt-4">{maxDiffResults.insight}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="metric-card">
          <h4 className="font-semibold text-green mb-3">Must-Have Features</h4>
          {kanoResults.mustHave.map((item, i) => (
            <div key={i} className="p-3 rounded-lg bg-green/5 border border-green/20 mb-2">
              <p className="font-medium">{item.feature}</p>
              <p className="text-sm text-muted-foreground">{item.reasoning}</p>
            </div>
          ))}
        </div>
        <div className="metric-card">
          <h4 className="font-semibold text-primary mb-3">Performance Features</h4>
          {kanoResults.performance.map((item, i) => (
            <div key={i} className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-2">
              <p className="font-medium">{item.feature}</p>
              <p className="text-sm text-muted-foreground">{item.reasoning}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesTab;
