import { TestResults } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Rocket, Target, Users, Megaphone, TrendingUp } from "lucide-react";

interface Props {
  test: TestResults;
}

const GoToMarketTab = ({ test }: Props) => {
  const brandAnalysis = (test.brandAnalysis || {}) as any;
  const goToMarket = brandAnalysis.goToMarket || {};
  const personas = test.personas || [];
  
  const ninetyDayRoadmap = goToMarket.ninetyDayRoadmap || {};
  const channelMix = goToMarket.channelMix || {};
  const funnelDesign = goToMarket.funnelDesign || {};

  const hasGtmData = Object.keys(ninetyDayRoadmap).length > 0 || 
                     channelMix.channelRecommendations?.length > 0 ||
                     funnelDesign.stages?.length > 0;

  if (!hasGtmData) {
    return (
      <div className="metric-card text-center py-8">
        <p className="text-muted-foreground">No go-to-market strategy data available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 90-Day Roadmap */}
      {Object.keys(ninetyDayRoadmap).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5" />
              90-Day Launch Roadmap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {['preLaunch', 'launch', 'scale'].map((phase, phaseIdx) => {
                const phaseData = ninetyDayRoadmap[phase];
                if (!phaseData) return null;
                
                const phaseLabels: Record<string, string> = {
                  preLaunch: 'Pre-Launch',
                  launch: 'Launch',
                  scale: 'Scale'
                };
                
                const phaseColors: Record<string, string> = {
                  preLaunch: 'border-blue',
                  launch: 'border-primary',
                  scale: 'border-green'
                };
                
                return (
                  <div key={phase} className={`border-l-4 ${phaseColors[phase]} pl-6`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold">{phaseLabels[phase]}</h3>
                      <Badge variant="outline">{phaseData.days || `Days ${phaseIdx * 30 + 1}-${(phaseIdx + 1) * 30}`}</Badge>
                    </div>
                    {phaseData.objective && (
                      <p className="text-sm text-muted-foreground mb-4">{phaseData.objective}</p>
                    )}
                    <div className="space-y-3">
                      {(phaseData.tactics || []).map((tactic: any, idx: number) => (
                        <div key={idx} className="p-4 bg-muted/50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-semibold text-sm flex-1">{tactic.tactic}</p>
                            {tactic.budget && (
                              <Badge variant="secondary">{tactic.budget}</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                            {tactic.owner && (
                              <div>
                                <span className="font-medium">Owner:</span> {tactic.owner}
                              </div>
                            )}
                            {tactic.timeline && (
                              <div>
                                <span className="font-medium">Timeline:</span> {tactic.timeline}
                              </div>
                            )}
                            {tactic.expectedOutcome && (
                              <div>
                                <span className="font-medium">Expected:</span> {tactic.expectedOutcome}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Channel Mix */}
      {channelMix.channelRecommendations?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5" />
              Marketing Channel Mix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {channelMix.channelRecommendations.map((channel: any, idx: number) => (
                <Card key={idx} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold">{channel.channel}</h4>
                      <Badge>{channel.budgetAllocation}</Badge>
                    </div>
                    {channel.rationale && (
                      <p className="text-sm text-muted-foreground mb-3">{channel.rationale}</p>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      {channel.expectedCAC && (
                        <div>
                          <p className="text-muted-foreground">Expected CAC</p>
                          <p className="font-semibold">{channel.expectedCAC}</p>
                        </div>
                      )}
                      {channel.conversionRate && (
                        <div>
                          <p className="text-muted-foreground">Conversion Rate</p>
                          <p className="font-semibold">{channel.conversionRate}</p>
                        </div>
                      )}
                    </div>
                    {channel.tactics?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1">Key Tactics:</p>
                        <ul className="text-xs space-y-1 text-muted-foreground">
                          {channel.tactics.slice(0, 3).map((tactic: string, i: number) => (
                            <li key={i}>• {tactic}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acquisition Funnel */}
      {funnelDesign.stages?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Customer Acquisition Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {funnelDesign.stages.map((stage: any, idx: number) => (
                <div key={idx} className="relative">
                  <div className="flex items-center gap-4">
                    <div className="w-24 text-right">
                      <p className="font-semibold text-sm">{stage.stage}</p>
                    </div>
                    <div className="flex-1 bg-muted/50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm">{stage.mechanism}</p>
                        {stage.expectedVolume && (
                          <Badge variant="outline">{stage.expectedVolume}</Badge>
                        )}
                      </div>
                      {stage.conversionToNext && (
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={parseFloat(stage.conversionToNext.replace('%', '')) || 0} 
                            className="h-2 flex-1" 
                          />
                          <span className="text-xs font-semibold">{stage.conversionToNext} convert</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {idx < funnelDesign.stages.length - 1 && (
                    <div className="ml-12 pl-12 h-4 border-l-2 border-dashed border-muted-foreground/30" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Primary Persona Targeting (Fallback if no GTM data) */}
      {personas.length > 0 && !channelMix.channelRecommendations?.length && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Target Audience Strategy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {personas.slice(0, 2).map((persona: any, idx: number) => (
                <div key={idx} className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">{persona.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {persona.tagline || persona.segment}
                  </p>
                  {persona.recommendations && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold">Messaging:</p>
                      <p className="text-xs text-muted-foreground">{persona.recommendations.messaging}</p>
                      {persona.recommendations.channels?.length > 0 && (
                        <>
                          <p className="text-xs font-semibold mt-2">Channels:</p>
                          <div className="flex flex-wrap gap-1">
                            {persona.recommendations.channels.map((ch: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">{ch}</Badge>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GoToMarketTab;
