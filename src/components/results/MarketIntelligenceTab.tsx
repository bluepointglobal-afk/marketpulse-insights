import { useState } from "react";
import { TestResults } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building2, TrendingUp, Shield, Target, Lightbulb, AlertTriangle } from "lucide-react";

interface Props {
  test: TestResults;
}

const MarketIntelligenceTab = ({ test }: Props) => {
  const brandAnalysis = (test.brandAnalysis || {}) as any;
  const [expandedCompetitor, setExpandedCompetitor] = useState<number | null>(null);
  
  const competitors = brandAnalysis.competitors || [];
  const competitiveDynamics = brandAnalysis.competitiveDynamics || {};
  const blueOceanStrategy = brandAnalysis.blueOceanStrategy || {};
  const positioningStatement = brandAnalysis.positioningStatement || {};
  const vulnerabilitiesAndOpportunities = brandAnalysis.vulnerabilitiesAndOpportunities || {};
  
  // Fallback to old structure
  const vulnerabilities = vulnerabilitiesAndOpportunities.vulnerabilities || brandAnalysis.vulnerabilities || [];
  const opportunities = vulnerabilitiesAndOpportunities.opportunities || brandAnalysis.opportunities || [];

  if (competitors.length === 0 && !brandAnalysis.positioning) {
    return (
      <div className="metric-card text-center py-8">
        <p className="text-muted-foreground">No market intelligence data available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Competitive Landscape Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            Competitive Landscape
          </h2>
          {competitiveDynamics.positioningSummary && (
            <p className="text-muted-foreground mt-2 max-w-3xl">
              {competitiveDynamics.positioningSummary}
            </p>
          )}
        </div>
      </div>

      {/* Competitor Cards */}
      {competitors.length > 0 && (
        <div className="space-y-4">
          {competitors.map((comp: any, idx: number) => (
            <Card 
              key={idx} 
              className="hover:shadow-lg transition-all cursor-pointer"
              onClick={() => setExpandedCompetitor(expandedCompetitor === idx ? null : idx)}
            >
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Column 1: Company Info */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold">{comp.name}</h3>
                      <Badge 
                        variant={comp.threatLevel === 'HIGH' ? 'destructive' : comp.threatLevel === 'MEDIUM' ? 'default' : 'secondary'}
                      >
                        {comp.threatLevel || 'N/A'} Threat
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{comp.positioning}</p>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-semibold">Price:</span> {comp.priceRange || 'N/A'}</p>
                      <p><span className="font-semibold">Distribution:</span> {comp.distribution || 'N/A'}</p>
                      <p><span className="font-semibold">Market Share:</span> {comp.marketShare || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Column 2: Products */}
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Key Products</h4>
                    <ul className="text-sm space-y-1">
                      {(comp.products || []).slice(0, 3).map((prod: string, i: number) => (
                        <li key={i} className="text-muted-foreground">• {prod}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 3: SWOT */}
                  <div>
                    <h4 className="font-semibold mb-2 text-sm text-green">Strengths</h4>
                    <ul className="text-sm space-y-1 mb-3">
                      {(comp.strengths || []).slice(0, 2).map((s: string, i: number) => (
                        <li key={i} className="text-muted-foreground">✓ {s}</li>
                      ))}
                    </ul>
                    <h4 className="font-semibold mb-2 text-sm text-destructive">Weaknesses</h4>
                    <ul className="text-sm space-y-1">
                      {(comp.weaknesses || []).slice(0, 2).map((w: string, i: number) => (
                        <li key={i} className="text-muted-foreground">✗ {w}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 4: Scores */}
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Brand Scores</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Status</span>
                          <span className="font-semibold">{comp.brandScores?.status || comp.status || 'N/A'}/100</span>
                        </div>
                        <Progress value={comp.brandScores?.status || comp.status || 0} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Trust</span>
                          <span className="font-semibold">{comp.brandScores?.trust || comp.trust || 'N/A'}/100</span>
                        </div>
                        <Progress value={comp.brandScores?.trust || comp.trust || 0} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Overall</span>
                          <span className="font-semibold">{comp.brandScores?.overall || comp.overall || 'N/A'}/100</span>
                        </div>
                        <Progress value={comp.brandScores?.overall || comp.overall || 0} className="h-2" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Moves - Expanded */}
                {comp.recentMoves && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm">
                      <span className="font-semibold">Recent Activity:</span> {comp.recentMoves}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Porter's Five Forces */}
      {Object.keys(competitiveDynamics).length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Competitive Dynamics Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {Object.entries(competitiveDynamics).map(([key, value]: [string, any]) => (
                key !== 'positioningSummary' && typeof value === 'string' && (
                  <div key={key} className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold capitalize mb-2">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <p className="text-sm text-muted-foreground">{value}</p>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blue Ocean Strategy */}
      {(blueOceanStrategy.eliminate?.length > 0 || blueOceanStrategy.create?.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Blue Ocean Strategy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="text-sm font-semibold text-destructive mb-2">Eliminate</p>
                <ul className="text-sm space-y-1">
                  {(blueOceanStrategy.eliminate || []).map((item: string, i: number) => (
                    <li key={i} className="text-muted-foreground">• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 bg-orange/10 rounded-lg border border-orange/20">
                <p className="text-sm font-semibold text-orange mb-2">Reduce</p>
                <ul className="text-sm space-y-1">
                  {(blueOceanStrategy.reduce || []).map((item: string, i: number) => (
                    <li key={i} className="text-muted-foreground">• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 bg-blue/10 rounded-lg border border-blue/20">
                <p className="text-sm font-semibold text-blue mb-2">Raise</p>
                <ul className="text-sm space-y-1">
                  {(blueOceanStrategy.raise || []).map((item: string, i: number) => (
                    <li key={i} className="text-muted-foreground">• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 bg-green/10 rounded-lg border border-green/20">
                <p className="text-sm font-semibold text-green mb-2">Create</p>
                <ul className="text-sm space-y-1">
                  {(blueOceanStrategy.create || []).map((item: string, i: number) => (
                    <li key={i} className="text-muted-foreground">• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Positioning & Vulnerabilities */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Positioning Statement */}
        {(positioningStatement.yourStatement || brandAnalysis.positioning) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Strategic Positioning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 mb-4">
                <p className="text-sm italic">
                  "{positioningStatement.yourStatement || brandAnalysis.positioning}"
                </p>
              </div>
              {vulnerabilities.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-orange" />
                    Brand Risks
                  </h4>
                  <div className="space-y-3">
                    {vulnerabilities.slice(0, 3).map((vuln: any, i: number) => (
                      <div key={i} className="text-sm">
                        <p className="font-semibold text-destructive">{vuln.risk || vuln}</p>
                        {vuln.mitigation && (
                          <p className="text-muted-foreground mt-1">Mitigation: {vuln.mitigation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Opportunities */}
        {opportunities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Market Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {opportunities.slice(0, 5).map((opp: any, i: number) => (
                  <div key={i} className="p-3 bg-green/5 rounded-lg border border-green/20">
                    <p className="text-sm font-medium">{opp.opportunity || opp}</p>
                    {opp.actionRequired && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Action: {opp.actionRequired}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MarketIntelligenceTab;
