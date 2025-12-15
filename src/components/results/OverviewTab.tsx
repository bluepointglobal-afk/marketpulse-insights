import { TestResults } from "@/lib/mockData";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Check, TrendingUp, Target, Shield, Sparkles, Users, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  test: TestResults;
}

const OverviewTab = ({ test }: Props) => {
  const bayesianResults = (test.bayesianResults || {}) as any;
  const brandAnalysis = (test.brandAnalysis || {}) as any;
  const personas = test.personas || [];
  const investmentThesis = brandAnalysis.investment_thesis || {};
  
  const demandProbability = bayesianResults.demandProbability || 0;
  const psmScore = bayesianResults.psmScore || 0;
  const optimalPrice = bayesianResults.optimalPrice || 0;
  const confidenceInterval = bayesianResults.confidenceInterval || [0, 0];
  const demandCurve = bayesianResults.demandCurve || [];
  const regionalBreakdown = bayesianResults.regionalBreakdown || {};
  
  const demandPercent = Math.round(demandProbability * 100);
  const recommendation = investmentThesis?.recommendation?.recommendation || 
    (psmScore > 70 ? "PROCEED" : psmScore > 50 ? "PROCEED WITH CAUTION" : "REVISE STRATEGY");
  const confidenceLevel = investmentThesis?.recommendation?.confidenceLevel || 
    (psmScore > 75 ? "HIGH" : psmScore > 50 ? "MEDIUM" : "LOW");

  if (!test.bayesianResults || Object.keys(test.bayesianResults).length === 0) {
    return (
      <div className="metric-card text-center py-8">
        <p className="text-muted-foreground">No analysis data available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Summary Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <CardTitle className="text-xl">Executive Summary</CardTitle>
            </div>
            <Badge 
              variant={recommendation === "PROCEED" ? "default" : recommendation === "REVISE STRATEGY" ? "destructive" : "secondary"}
              className="text-sm px-3 py-1"
            >
              {recommendation}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-6 mt-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                <DollarSign className="w-4 h-4" />
                Market Opportunity
              </div>
              <p className="text-lg font-bold">
                {investmentThesis?.scenarios?.baseCase?.year1?.revenue || `${Math.round(optimalPrice * 1000).toLocaleString()} SAR`}
              </p>
              <p className="text-xs text-muted-foreground">
                {investmentThesis?.scenarios?.baseCase?.year1?.customers || "1,000+"} customers Year 1
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                <Target className="w-4 h-4" />
                Key Success Factors
              </div>
              <ul className="text-sm space-y-1">
                {(investmentThesis?.keySuccessFactors?.factors?.slice(0, 2) || [
                  { factor: "Strong demand validation" },
                  { factor: "Competitive pricing" }
                ]).map((f: any, i: number) => (
                  <li key={i} className="text-muted-foreground">• {f.factor || f}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                <Users className="w-4 h-4" />
                Primary Target
              </div>
              <p className="font-semibold">{personas[0]?.name || "Core Customer"}</p>
              <p className="text-xs text-muted-foreground">
                {(personas[0] as any)?.segmentSize || Math.round(((personas[0] as any)?.size || 0.32) * 100)}% of market
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Launch Recommendation */}
      <div className="p-6 rounded-2xl gradient-bg text-primary-foreground">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold">LAUNCH RECOMMENDATION: {recommendation}</h3>
            <p className="text-primary-foreground/80">
              Confidence: {confidenceLevel} (PSM Score: {psmScore}/100)
            </p>
          </div>
        </div>
        {investmentThesis?.recommendation?.reasoning && (
          <p className="mt-3 text-sm text-primary-foreground/90 pl-13">
            {investmentThesis.recommendation.reasoning}
          </p>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="hover-lift">
          <CardContent className="pt-6 text-center">
            <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-4xl font-bold gradient-text">{demandPercent}%</p>
            <p className="text-sm text-muted-foreground">Demand Probability</p>
            <p className="text-xs text-muted-foreground mt-1">
              CI: {Math.round(confidenceInterval[0] * 100)}-{Math.round(confidenceInterval[1] * 100)}%
            </p>
          </CardContent>
        </Card>
        <Card className="hover-lift">
          <CardContent className="pt-6 text-center">
            <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-4xl font-bold text-primary">{psmScore}/100</p>
            <p className="text-sm text-muted-foreground">PSM Score</p>
            <Badge variant="secondary" className="mt-1">
              {psmScore > 75 ? "Very Strong" : psmScore > 50 ? "Good" : "Needs Work"}
            </Badge>
          </CardContent>
        </Card>
        <Card className="hover-lift">
          <CardContent className="pt-6 text-center">
            <Target className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-4xl font-bold">{optimalPrice} SAR</p>
            <p className="text-sm text-muted-foreground">Optimal Price</p>
            <p className="text-xs text-green mt-1">Validated by Bayesian Analysis</p>
          </CardContent>
        </Card>
      </div>

      {/* Demand Curve */}
      {demandCurve.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Demand Curve Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={demandCurve}>
                  <defs>
                    <linearGradient id="demandGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(270, 91%, 55%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(270, 91%, 55%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="price" tickFormatter={(v) => `${v}`} className="text-xs" />
                  <YAxis tickFormatter={(v) => `${Math.round(v * 100)}%`} className="text-xs" />
                  <Tooltip 
                    formatter={(v: number) => [`${Math.round(v * 100)}%`, 'Demand']} 
                    labelFormatter={(l) => `${l} SAR`}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Area type="monotone" dataKey="demand" stroke="hsl(270, 91%, 55%)" fill="url(#demandGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regional Breakdown */}
      {Object.keys(regionalBreakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Regional Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-4 font-semibold">Region</th>
                    <th className="text-left py-3 px-4 font-semibold">Demand</th>
                    <th className="text-left py-3 px-4 font-semibold">Optimal Price</th>
                    <th className="text-left py-3 px-4 font-semibold">Key Insight</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(regionalBreakdown).map(([region, data]: [string, any]) => (
                    <tr key={region} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium">{region}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{Math.round((data.demand || 0) * 100)}%</Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold">{data.optimalPrice || "N/A"} SAR</td>
                      <td className="py-3 px-4 text-muted-foreground">{data.insight || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OverviewTab;
