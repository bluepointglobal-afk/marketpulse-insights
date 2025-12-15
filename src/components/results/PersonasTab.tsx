import { useState } from "react";
import { TestResults } from "@/lib/mockData";

interface Props { test: TestResults; }

const PersonasTab = ({ test }: Props) => {
  const [activePersona, setActivePersona] = useState(0);
  const personas = test.personas || [];
  
  if (personas.length === 0) {
    return (
      <div className="metric-card text-center py-8">
        <p className="text-muted-foreground">No persona data available yet.</p>
      </div>
    );
  }
  
  const persona = personas[activePersona] as any;
  const demographics = persona.demographics || {};
  const bayesianProfile = persona.bayesianProfile || {};
  const psychographics = persona.psychographics || {};

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {personas.map((p: any, i: number) => (
          <button key={i} onClick={() => setActivePersona(i)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activePersona === i ? 'gradient-bg text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
            {p.name || `Persona ${i + 1}`}
          </button>
        ))}
      </div>
      <div className="metric-card">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center text-2xl">👤</div>
          <div>
            <h3 className="text-xl font-bold">{persona.name || "Unknown Persona"}</h3>
            <p className="text-muted-foreground">Market Size: {Math.round((persona.size || 0) * 100)}%</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2">Demographics</h4>
            <p className="text-sm text-muted-foreground">Age: {demographics.age || "N/A"}</p>
            <p className="text-sm text-muted-foreground">Income: {demographics.income || "N/A"}</p>
            <p className="text-sm text-muted-foreground">Location: {demographics.location || "N/A"}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Bayesian Profile</h4>
            <p className="text-sm text-muted-foreground">Demand: {Math.round((bayesianProfile.demandProbability || 0) * 100)}%</p>
            <p className="text-sm text-muted-foreground">Optimal Price: {bayesianProfile.optimalPrice || "N/A"} SAR</p>
          </div>
        </div>
        {psychographics.quote && (
          <div className="mt-6 p-4 rounded-lg bg-muted">
            <p className="italic">"{psychographics.quote}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonasTab;
