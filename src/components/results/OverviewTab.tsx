import { TestResults } from "@/lib/mockData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Check, TrendingUp, Target, Shield } from "lucide-react";

interface Props {
  test: TestResults;
}

const OverviewTab = ({ test }: Props) => {
  const { bayesianResults } = test;
  const demandPercent = Math.round(bayesianResults.demandProbability * 100);

  return (
    <div className="space-y-6">
      {/* Launch Recommendation */}
      <div className="p-6 rounded-2xl gradient-bg text-primary-foreground">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold">LAUNCH RECOMMENDATION: PROCEED</h3>
            <p className="text-primary-foreground/80">Confidence: HIGH (PSM Score: {bayesianResults.psmScore}/100)</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="metric-card text-center">
          <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-4xl font-bold gradient-text">{demandPercent}%</p>
          <p className="text-sm text-muted-foreground">Demand Probability</p>
          <p className="text-xs text-muted-foreground mt-1">
            CI: {Math.round(bayesianResults.confidenceInterval[0] * 100)}-{Math.round(bayesianResults.confidenceInterval[1] * 100)}%
          </p>
        </div>
        <div className="metric-card text-center">
          <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-4xl font-bold text-primary">{bayesianResults.psmScore}/100</p>
          <p className="text-sm text-muted-foreground">PSM Score</p>
          <p className="text-xs text-green mt-1">Very Strong</p>
        </div>
        <div className="metric-card text-center">
          <Target className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-4xl font-bold">{bayesianResults.optimalPrice} SAR</p>
          <p className="text-sm text-muted-foreground">Optimal Price</p>
          <p className="text-xs text-muted-foreground mt-1">+7% vs target</p>
        </div>
      </div>

      {/* Demand Curve */}
      <div className="metric-card">
        <h3 className="font-semibold mb-4">Demand Curve</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={bayesianResults.demandCurve}>
              <defs>
                <linearGradient id="demandGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(270, 91%, 55%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(270, 91%, 55%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="price" tickFormatter={(v) => `${v}`} className="text-xs" />
              <YAxis tickFormatter={(v) => `${Math.round(v * 100)}%`} className="text-xs" />
              <Tooltip formatter={(v: number) => `${Math.round(v * 100)}%`} labelFormatter={(l) => `${l} SAR`} />
              <Area type="monotone" dataKey="demand" stroke="hsl(270, 91%, 55%)" fill="url(#demandGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Regional Breakdown */}
      <div className="metric-card">
        <h3 className="font-semibold mb-4">Regional Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Region</th>
                <th className="text-left py-2">Demand</th>
                <th className="text-left py-2">Optimal Price</th>
                <th className="text-left py-2">Key Insight</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(bayesianResults.regionalBreakdown).map(([region, data]) => (
                <tr key={region} className="border-b last:border-0">
                  <td className="py-3 font-medium">{region}</td>
                  <td className="py-3">{Math.round(data.demand * 100)}%</td>
                  <td className="py-3">{data.optimalPrice} SAR</td>
                  <td className="py-3 text-muted-foreground">{data.insight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
