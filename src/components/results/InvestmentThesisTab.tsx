import { TestResults } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target, Shield } from "lucide-react";

interface Props {
  test: TestResults;
}

const InvestmentThesisTab = ({ test }: Props) => {
  const brandAnalysis = (test.brandAnalysis || {}) as any;
  const bayesianResults = (test.bayesianResults || {}) as any;
  
  const investmentThesis = brandAnalysis.investment_thesis || {};
  const risks = brandAnalysis.risks || {};
  
  const recommendation = investmentThesis.recommendation || {};
  const scenarios = investmentThesis.scenarios || {};
  const keySuccessFactors = investmentThesis.keySuccessFactors || {};

  // Derive recommendation if not present
  const recText = recommendation.recommendation || 
    (bayesianResults.psmScore > 70 ? 'PROCEED' : 
     bayesianResults.psmScore > 50 ? 'PROCEED WITH CAUTION' : 'REVISE STRATEGY');
  
  const confidenceLevel = recommendation.confidenceLevel ||
    (bayesianResults.psmScore > 75 ? 'HIGH' : 
     bayesianResults.psmScore > 50 ? 'MEDIUM' : 'LOW');

  const recColors: Record<string, string> = {
    'PROCEED': 'border-green bg-green/5',
    'PROCEED WITH CAUTION': 'border-orange bg-orange/5',
    'REVISE STRATEGY': 'border-destructive bg-destructive/5',
    'RECONSIDER': 'border-destructive bg-destructive/5'
  };

  const hasInvestmentData = Object.keys(investmentThesis).length > 0 || 
                            Object.keys(risks).length > 0;

  return (
    <div className="space-y-6">
      {/* Investment Recommendation Hero */}
      <Card className={`border-4 ${recColors[recText] || 'border-primary bg-primary/5'}`}>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              {recText === 'PROCEED' ? (
                <CheckCircle className="w-16 h-16 text-green" />
              ) : recText === 'PROCEED WITH CAUTION' ? (
                <AlertTriangle className="w-16 h-16 text-orange" />
              ) : (
                <Shield className="w-16 h-16 text-destructive" />
              )}
            </div>
            <h2 className="text-3xl font-bold mb-2">{recText}</h2>
            <Badge className="text-lg px-4 py-2 mb-4">{confidenceLevel} Confidence</Badge>
            {recommendation.reasoning && (
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {recommendation.reasoning}
              </p>
            )}
            {!recommendation.reasoning && (
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Based on PSM score of {bayesianResults.psmScore || 0} and demand probability of{' '}
                {Math.round((bayesianResults.demandProbability || 0) * 100)}%, this product shows{' '}
                {bayesianResults.psmScore > 70 ? 'strong' : bayesianResults.psmScore > 50 ? 'moderate' : 'limited'}{' '}
                market validation.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Three Scenarios */}
      {(Object.keys(scenarios).length > 0) && (
        <div className="grid sm:grid-cols-3 gap-4">
          {['bullCase', 'baseCase', 'bearCase'].map((scenario) => {
            const data = scenarios[scenario];
            if (!data) return null;
            
            const colors: Record<string, string> = {
              bullCase: 'border-green',
              baseCase: 'border-primary',
              bearCase: 'border-destructive'
            };
            
            const labels: Record<string, string> = {
              bullCase: 'Bull Case',
              baseCase: 'Base Case',
              bearCase: 'Bear Case'
            };
            
            const icons: Record<string, React.ReactNode> = {
              bullCase: <TrendingUp className="w-5 h-5 text-green" />,
              baseCase: <Target className="w-5 h-5 text-primary" />,
              bearCase: <TrendingDown className="w-5 h-5 text-destructive" />
            };
            
            return (
              <Card key={scenario} className={`border-2 ${colors[scenario]}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    {icons[scenario]}
                    <CardTitle className="text-lg">{labels[scenario]}</CardTitle>
                  </div>
                  {data.label && (
                    <p className="text-sm text-muted-foreground">{data.label}</p>
                  )}
                </CardHeader>
                <CardContent>
                  {data.narrative && (
                    <p className="text-sm text-muted-foreground mb-4">{data.narrative}</p>
                  )}
                  
                  <div className="space-y-4">
                    {data.year1 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Year 1</h4>
                        <p className="text-lg font-bold">{data.year1.revenue}</p>
                        <p className="text-xs text-muted-foreground">
                          {data.year1.customers} customers
                          {data.year1.grossMargin && ` • ${data.year1.grossMargin} margin`}
                        </p>
                      </div>
                    )}
                    
                    {data.year3 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Year 3</h4>
                        <p className="text-lg font-bold">{data.year3.revenue}</p>
                        <p className="text-xs text-muted-foreground">
                          {data.year3.customers} customers
                          {data.year3.ebitdaMargin && ` • ${data.year3.ebitdaMargin} EBITDA`}
                        </p>
                      </div>
                    )}

                    {data.probability && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground">Probability</p>
                        <p className="font-semibold">{data.probability}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Key Success Factors */}
      {keySuccessFactors.factors?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Success Factors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {keySuccessFactors.factors.map((factor: any, idx: number) => (
                <div key={idx} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold flex-1">{factor.factor}</h4>
                    <Badge variant={factor.criticality === 'HIGH' ? 'destructive' : 'default'}>
                      {factor.criticality || 'MEDIUM'}
                    </Badge>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    {factor.currentStatus && (
                      <div>
                        <p className="text-xs text-muted-foreground">Current Status</p>
                        <p>{factor.currentStatus}</p>
                      </div>
                    )}
                    {factor.actionRequired && (
                      <div>
                        <p className="text-xs text-muted-foreground">Action Required</p>
                        <p>{factor.actionRequired}</p>
                      </div>
                    )}
                    {factor.owner && (
                      <div>
                        <p className="text-xs text-muted-foreground">Owner</p>
                        <p>{factor.owner}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Analysis */}
      {(risks.marketRisks?.length > 0 || risks.competitiveRisks?.length > 0 || risks.executionRisks?.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Risk Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Market Risks */}
              {risks.marketRisks?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Market Risks</h4>
                  <div className="space-y-3">
                    {risks.marketRisks.map((risk: any, idx: number) => (
                      <div key={idx} className="p-4 border-l-4 border-destructive bg-destructive/5 rounded-r-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-semibold flex-1">{risk.risk}</h5>
                          <div className="flex gap-2">
                            <Badge variant="destructive">{risk.likelihood}</Badge>
                            <Badge variant="outline">{risk.financialImpact}</Badge>
                          </div>
                        </div>
                        {risk.mitigation?.length > 0 && (
                          <div className="mt-2">
                            <span className="font-semibold text-sm">Mitigation:</span>
                            <ul className="list-disc list-inside text-sm text-muted-foreground ml-2">
                              {risk.mitigation.map((mit: string, i: number) => (
                                <li key={i}>{mit}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {risk.owner && (
                          <p className="text-sm text-muted-foreground mt-1">
                            <span className="font-semibold">Owner:</span> {risk.owner}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Competitive Risks */}
              {risks.competitiveRisks?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Competitive Risks</h4>
                  <div className="space-y-3">
                    {risks.competitiveRisks.map((risk: any, idx: number) => (
                      <div key={idx} className="p-4 border-l-4 border-orange bg-orange/5 rounded-r-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-semibold flex-1">{risk.risk}</h5>
                          <div className="flex gap-2">
                            <Badge>{risk.likelihood}</Badge>
                            <Badge variant="outline">{risk.financialImpact}</Badge>
                          </div>
                        </div>
                        {risk.mitigation?.length > 0 && (
                          <div className="mt-2">
                            <span className="font-semibold text-sm">Mitigation:</span>
                            <ul className="list-disc list-inside text-sm text-muted-foreground ml-2">
                              {risk.mitigation.map((mit: string, i: number) => (
                                <li key={i}>{mit}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Execution Risks */}
              {risks.executionRisks?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Execution Risks</h4>
                  <div className="space-y-3">
                    {risks.executionRisks.map((risk: any, idx: number) => (
                      <div key={idx} className="p-4 border-l-4 border-blue bg-blue/5 rounded-r-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-semibold flex-1">{risk.risk}</h5>
                          <div className="flex gap-2">
                            <Badge variant="secondary">{risk.likelihood}</Badge>
                            <Badge variant="outline">{risk.financialImpact}</Badge>
                          </div>
                        </div>
                        {risk.mitigation?.length > 0 && (
                          <div className="mt-2">
                            <span className="font-semibold text-sm">Mitigation:</span>
                            <ul className="list-disc list-inside text-sm text-muted-foreground ml-2">
                              {risk.mitigation.map((mit: string, i: number) => (
                                <li key={i}>{mit}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fallback metrics if no investment thesis data */}
      {!hasInvestmentData && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Metrics Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Demand Probability</p>
                <p className="text-3xl font-bold gradient-text">
                  {Math.round((bayesianResults.demandProbability || 0) * 100)}%
                </p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">PSM Score</p>
                <p className="text-3xl font-bold text-primary">
                  {bayesianResults.psmScore || 0}/100
                </p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Optimal Price</p>
                <p className="text-3xl font-bold">
                  {bayesianResults.optimalPrice || 0} SAR
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InvestmentThesisTab;
