import { TestResults } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Layers, DollarSign, Sparkles } from "lucide-react";

interface Props {
  test: TestResults;
}

const ProductStrategyTab = ({ test }: Props) => {
  const maxDiffResults = (test.maxDiffResults || {}) as any;
  const kanoResults = (test.kanoResults || {}) as any;
  const vanWestendorp = (test.vanWestendorp || {}) as any;
  const brandAnalysis = (test.brandAnalysis || {}) as any;
  
  const featureStrategy = brandAnalysis.featureStrategy || {};
  const pricingStrategy = brandAnalysis.pricingStrategy || {};
  
  const featureRanking = maxDiffResults.featureRanking || [];
  const featureAnalysis = featureStrategy.featureAnalysis || [];
  const featureMatrix = featureStrategy.featureMatrix || {};
  const recommendedTiers = pricingStrategy?.priceArchitecture?.recommendedTiers || [];
  const vwThresholds = pricingStrategy?.vanWestendorp?.priceThresholds || {};

  // Combine feature data sources
  const hasFeatureData = featureRanking.length > 0 || featureAnalysis.length > 0;
  const hasPricingData = recommendedTiers.length > 0 || vanWestendorp.optimalPricePoint;

  if (!hasFeatureData && !hasPricingData) {
    return (
      <div className="metric-card text-center py-8">
        <p className="text-muted-foreground">No product strategy data available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feature Strategy Section */}
      {hasFeatureData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Feature Strategy & Roadmap
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* MVP Recommendation */}
            {featureStrategy.mvpRecommendation && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold">MVP Recommendation</h4>
                </div>
                <p className="text-sm text-muted-foreground">{featureStrategy.mvpRecommendation}</p>
              </div>
            )}

            {/* Feature Matrix */}
            {Object.keys(featureMatrix).length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {['mustBuild', 'shouldBuild', 'couldBuild', 'shouldSkip'].map((category) => {
                  const features = featureMatrix[category] || [];
                  if (features.length === 0) return null;
                  
                  const colors: Record<string, string> = {
                    mustBuild: 'bg-green/10 border-green/30',
                    shouldBuild: 'bg-blue/10 border-blue/30',
                    couldBuild: 'bg-orange/10 border-orange/30',
                    shouldSkip: 'bg-destructive/10 border-destructive/30'
                  };
                  
                  const labels: Record<string, string> = {
                    mustBuild: 'Must Build',
                    shouldBuild: 'Should Build',
                    couldBuild: 'Could Build',
                    shouldSkip: 'Should Skip'
                  };
                  
                  return (
                    <div key={category} className={`p-4 rounded-lg border ${colors[category]}`}>
                      <h4 className="font-semibold text-sm mb-2">{labels[category]}</h4>
                      <ul className="text-xs space-y-1">
                        {features.slice(0, 5).map((feat: string, i: number) => (
                          <li key={i} className="text-muted-foreground">• {feat}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Feature Importance Chart */}
            {featureRanking.length > 0 && (
              <div>
                <h4 className="font-semibold mb-4">Feature Importance (MaxDiff Analysis)</h4>
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
                {maxDiffResults.insight && (
                  <p className="text-sm text-muted-foreground mt-2">{maxDiffResults.insight}</p>
                )}
              </div>
            )}

            {/* Detailed Feature Analysis */}
            {featureAnalysis.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold">Detailed Feature Analysis</h4>
                {featureAnalysis.slice(0, 6).map((feature: any, idx: number) => (
                  <Card key={idx} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
                        <div>
                          <h5 className="font-semibold text-sm">{feature.feature}</h5>
                          {feature.kanoCategory?.type && (
                            <Badge className="mt-1" variant="secondary">{feature.kanoCategory.type}</Badge>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Utility Score</p>
                          <div className="flex items-center gap-2">
                            <Progress value={feature.utilityScore || 0} className="h-2 flex-1" />
                            <span className="text-sm font-semibold">{feature.utilityScore || 0}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Strategic Importance</p>
                          <div className="flex items-center gap-2">
                            <Progress value={feature.strategicImportance?.score || 0} className="h-2 flex-1" />
                            <span className="text-sm font-semibold">{feature.strategicImportance?.score || 0}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Cost to Deliver</p>
                          <Badge variant={feature.costToDeliver?.level === 'HIGH' ? 'destructive' : 'secondary'}>
                            {feature.costToDeliver?.level || 'N/A'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Competitive Status</p>
                          <Badge variant="outline">{feature.competitiveParity?.status || 'N/A'}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Kano Categories (Legacy) */}
            {(kanoResults.mustHave?.length > 0 || kanoResults.performance?.length > 0) && featureAnalysis.length === 0 && (
              <div className="grid md:grid-cols-2 gap-4">
                {kanoResults.mustHave?.length > 0 && (
                  <div className="p-4 bg-green/5 rounded-lg border border-green/20">
                    <h4 className="font-semibold text-green mb-3">Must-Have Features</h4>
                    {kanoResults.mustHave.map((item: any, i: number) => (
                      <div key={i} className="p-3 bg-background rounded-lg mb-2">
                        <p className="font-medium text-sm">{item.feature}</p>
                        <p className="text-xs text-muted-foreground">{item.reasoning}</p>
                      </div>
                    ))}
                  </div>
                )}
                {kanoResults.performance?.length > 0 && (
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <h4 className="font-semibold text-primary mb-3">Performance Features</h4>
                    {kanoResults.performance.map((item: any, i: number) => (
                      <div key={i} className="p-3 bg-background rounded-lg mb-2">
                        <p className="font-medium text-sm">{item.feature}</p>
                        <p className="text-xs text-muted-foreground">{item.reasoning}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pricing Strategy Section */}
      {hasPricingData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing Strategy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Price Architecture / Tiers */}
            {recommendedTiers.length > 0 && (
              <div>
                <h4 className="font-semibold mb-4">Recommended Price Tiers</h4>
                <div className="grid sm:grid-cols-3 gap-4">
                  {recommendedTiers.map((tier: any, idx: number) => (
                    <Card key={idx} className={idx === 1 ? 'ring-2 ring-primary' : ''}>
                      <CardContent className="p-6">
                        <div className="text-center mb-4">
                          <h3 className="font-bold text-lg">{tier.name}</h3>
                          <div className="text-3xl font-bold gradient-text my-2">{tier.price} SAR</div>
                          <p className="text-sm text-muted-foreground">{tier.positioning}</p>
                        </div>
                        {tier.features?.length > 0 && (
                          <div className="space-y-2 mb-4">
                            <p className="text-xs font-semibold">Features:</p>
                            <ul className="text-xs space-y-1">
                              {tier.features.slice(0, 4).map((feat: string, i: number) => (
                                <li key={i}>✓ {feat}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="pt-4 border-t space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Margin:</span>
                            <span className="font-semibold">{tier.margin || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Volume:</span>
                            <span className="font-semibold">{tier.volumeExpectation || 'N/A'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Van Westendorp */}
            <div>
              <h4 className="font-semibold mb-4">Van Westendorp Price Sensitivity</h4>
              <div className="grid grid-cols-5 gap-2">
                {['tooCheap', 'bargain', 'optimal', 'expensive', 'tooExpensive'].map((threshold) => {
                  const vwData = vwThresholds[threshold] || {};
                  const legacyValue = threshold === 'optimal' ? vanWestendorp.optimalPricePoint :
                                     threshold === 'expensive' ? vanWestendorp.expensive :
                                     vanWestendorp[threshold];
                  const price = vwData.price || legacyValue || 'N/A';
                  
                  const labels: Record<string, string> = {
                    tooCheap: 'Too Cheap',
                    bargain: 'Bargain',
                    optimal: 'Optimal',
                    expensive: 'Expensive',
                    tooExpensive: 'Too Expensive'
                  };
                  
                  return (
                    <div 
                      key={threshold} 
                      className={`p-3 text-center rounded-lg ${
                        threshold === 'optimal' ? 'bg-primary/10 border-2 border-primary' : 'bg-muted/50'
                      }`}
                    >
                      <p className="text-xs text-muted-foreground mb-1">{labels[threshold]}</p>
                      <p className="text-lg font-bold">{price}</p>
                      {vwData.reasoning && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{vwData.reasoning}</p>
                      )}
                    </div>
                  );
                })}
              </div>
              {vanWestendorp.acceptableRange && (
                <div className="mt-4 p-4 rounded-lg bg-muted/50">
                  <p className="font-medium">
                    Acceptable Range: {vanWestendorp.acceptableRange[0]} - {vanWestendorp.acceptableRange[1]} SAR
                  </p>
                  {vanWestendorp.reasoning && (
                    <p className="text-sm text-muted-foreground mt-1">{vanWestendorp.reasoning}</p>
                  )}
                </div>
              )}
            </div>

            {/* Psychological Pricing */}
            {pricingStrategy.psychologicalPricing && (
              <div className="grid md:grid-cols-2 gap-4">
                {pricingStrategy.psychologicalPricing.anchoringStrategy && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Anchoring Strategy</h4>
                    <p className="text-sm text-muted-foreground">
                      {pricingStrategy.psychologicalPricing.anchoringStrategy.technique}
                    </p>
                  </div>
                )}
                {pricingStrategy.psychologicalPricing.promotionalStrategy && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Promotional Strategy</h4>
                    <p className="text-sm text-muted-foreground">
                      {pricingStrategy.psychologicalPricing.promotionalStrategy.whenToDiscount}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductStrategyTab;
