import { useState } from "react";
import { TestResults } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Quote, Target, MessageSquare, TrendingUp, DollarSign } from "lucide-react";

interface Props {
  test: TestResults;
}

const CustomerInsightsTab = ({ test }: Props) => {
  const [selectedPersona, setSelectedPersona] = useState(0);
  const personas = test.personas || [];

  if (personas.length === 0) {
    return (
      <div className="metric-card text-center py-8">
        <p className="text-muted-foreground">No customer insights data available yet.</p>
      </div>
    );
  }

  const persona = personas[selectedPersona] as any;
  const demographics = persona.demographics || {};
  const bayesianProfile = persona.bayesianProfile || {};
  const psychographics = persona.psychographics || {};
  const marketingStrategy = persona.marketingStrategy || {};
  const lifetimeValue = persona.lifetimeValue || {};

  return (
    <div className="space-y-6">
      {/* Persona Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {personas.map((p: any, idx: number) => (
          <Card 
            key={idx}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedPersona === idx ? 'ring-2 ring-primary border-primary' : ''
            }`}
            onClick={() => setSelectedPersona(idx)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Badge variant={p.priority === 'PRIMARY' ? 'default' : 'secondary'} className="text-xs">
                  {p.priority || (idx === 0 ? 'PRIMARY' : 'SECONDARY')}
                </Badge>
                <span className="text-sm font-semibold">
                  {p.segmentSize || Math.round((p.size || 0) * 100)}%
                </span>
              </div>
              <h3 className="font-bold text-sm line-clamp-1">{p.name || `Persona ${idx + 1}`}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {p.tagline || p.segment || 'Target customer segment'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Persona View */}
      <div className="space-y-6">
        {/* Hero Section */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center">
                    <Users className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{persona.name}</h2>
                    <p className="text-muted-foreground">{persona.tagline || persona.segment}</p>
                  </div>
                </div>
                {psychographics.quote && (
                  <blockquote className="border-l-4 border-primary pl-4 italic text-lg text-muted-foreground mt-4">
                    <Quote className="w-5 h-5 inline mr-2 text-primary" />
                    "{psychographics.quote}"
                  </blockquote>
                )}
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-background rounded-lg border">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Demand Probability</h4>
                  <div className="text-3xl font-bold gradient-text">
                    {bayesianProfile.demandProbability || Math.round((persona.size || 0.65) * 100)}%
                  </div>
                </div>
                <div className="p-4 bg-background rounded-lg border">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Optimal Price</h4>
                  <div className="text-2xl font-bold">
                    {bayesianProfile.optimalPrice || 'N/A'} SAR
                  </div>
                </div>
                {lifetimeValue.ltvCacRatio && (
                  <div className="p-4 bg-green/5 rounded-lg border border-green/20">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">LTV:CAC Ratio</h4>
                    <div className="text-2xl font-bold text-green">
                      {lifetimeValue.ltvCacRatio}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demographics & Psychographics */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Demographics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="font-semibold">Age</dt>
                  <dd className="text-muted-foreground">{demographics.age || 'N/A'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-semibold">Income</dt>
                  <dd className="text-muted-foreground">{demographics.income || 'N/A'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-semibold">Occupation</dt>
                  <dd className="text-muted-foreground">{demographics.occupation || 'N/A'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-semibold">Location</dt>
                  <dd className="text-muted-foreground">{demographics.location || 'N/A'}</dd>
                </div>
                {demographics.familyStatus && (
                  <div className="flex justify-between">
                    <dt className="font-semibold">Family Status</dt>
                    <dd className="text-muted-foreground">{demographics.familyStatus}</dd>
                  </div>
                )}
                {demographics.education && (
                  <div className="flex justify-between">
                    <dt className="font-semibold">Education</dt>
                    <dd className="text-muted-foreground">{demographics.education}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Jobs to Be Done
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {psychographics.coreJob && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">Core Job</h4>
                  <p className="text-sm text-muted-foreground">{psychographics.coreJob}</p>
                </div>
              )}
              {psychographics.triggerMoment && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">Trigger Moment</h4>
                  <p className="text-sm text-muted-foreground">{psychographics.triggerMoment}</p>
                </div>
              )}
              {psychographics.successCriteria && (
                <div>
                  <h4 className="font-semibold text-sm mb-1">Success Criteria</h4>
                  <p className="text-sm text-muted-foreground">{psychographics.successCriteria}</p>
                </div>
              )}
              {psychographics.values && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Values</h4>
                  <div className="flex flex-wrap gap-2">
                    {psychographics.values.map((v: string, i: number) => (
                      <Badge key={i} variant="outline">{v}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Current Behavior & Obstacles */}
        {(psychographics.currentAlternative || psychographics.obstacles?.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Current Behavior & Obstacles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {psychographics.currentAlternative && (
                  <div>
                    <h4 className="font-semibold mb-2">Current Alternative</h4>
                    <p className="text-sm text-muted-foreground">{psychographics.currentAlternative}</p>
                  </div>
                )}
                {psychographics.obstacles?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Obstacles to Purchase</h4>
                    <ul className="text-sm space-y-2">
                      {psychographics.obstacles.map((obs: string, i: number) => (
                        <li key={i} className="text-muted-foreground flex items-start gap-2">
                          <span className="text-orange">⚠️</span> {obs}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Marketing Strategy */}
        {(marketingStrategy.coreMessage || marketingStrategy.channels?.length > 0 || persona.recommendations) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Marketing Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Core Message */}
              {(marketingStrategy.coreMessage || persona.recommendations?.messaging) && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h4 className="font-semibold mb-2">Core Message</h4>
                  <p className="text-sm">{marketingStrategy.coreMessage || persona.recommendations?.messaging}</p>
                </div>
              )}

              {/* Proof Points */}
              {marketingStrategy.proofPoints?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Proof Points</h4>
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {marketingStrategy.proofPoints.map((point: string, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-green">✓</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Channels */}
              {(marketingStrategy.channels?.length > 0 || persona.recommendations?.channels?.length > 0) && (
                <div>
                  <h4 className="font-semibold mb-3">Channel Strategy</h4>
                  <div className="space-y-3">
                    {(marketingStrategy.channels || persona.recommendations?.channels?.map((c: string) => ({ channel: c })) || []).map((channel: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{channel.channel || channel}</p>
                          {channel.rationale && (
                            <p className="text-xs text-muted-foreground">{channel.rationale}</p>
                          )}
                        </div>
                        {(channel.budgetAllocation || channel.expectedCAC) && (
                          <div className="text-right">
                            {channel.budgetAllocation && (
                              <p className="text-sm font-semibold">{channel.budgetAllocation}</p>
                            )}
                            {channel.expectedCAC && (
                              <p className="text-xs text-muted-foreground">CAC: {channel.expectedCAC}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Customer Economics */}
        {(lifetimeValue.firstYearRevenue || lifetimeValue.acquisitionCost) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Customer Economics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Year 1 Revenue</p>
                  <p className="text-xl font-bold">{lifetimeValue.firstYearRevenue || 'N/A'}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">3-Year LTV</p>
                  <p className="text-xl font-bold">{lifetimeValue.threeYearRevenue || 'N/A'}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">CAC</p>
                  <p className="text-xl font-bold">{lifetimeValue.acquisitionCost || 'N/A'}</p>
                </div>
                <div className="text-center p-4 bg-green/5 rounded-lg border border-green/20">
                  <p className="text-sm text-muted-foreground mb-1">LTV:CAC</p>
                  <p className="text-xl font-bold text-green">{lifetimeValue.ltvCacRatio || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CustomerInsightsTab;
