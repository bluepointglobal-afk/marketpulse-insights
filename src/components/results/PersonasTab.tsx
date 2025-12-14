import { useState } from "react";
import { TestResults } from "@/lib/mockData";

interface Props { test: TestResults; }

const PersonasTab = ({ test }: Props) => {
  const [activePersona, setActivePersona] = useState(0);
  const persona = test.personas[activePersona];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {test.personas.map((p, i) => (
          <button key={i} onClick={() => setActivePersona(i)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activePersona === i ? 'gradient-bg text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
            {p.name}
          </button>
        ))}
      </div>
      <div className="metric-card">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center text-2xl">👤</div>
          <div>
            <h3 className="text-xl font-bold">{persona.name}</h3>
            <p className="text-muted-foreground">Market Size: {Math.round(persona.size * 100)}%</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2">Demographics</h4>
            <p className="text-sm text-muted-foreground">Age: {persona.demographics.age}</p>
            <p className="text-sm text-muted-foreground">Income: {persona.demographics.income}</p>
            <p className="text-sm text-muted-foreground">Location: {persona.demographics.location}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Bayesian Profile</h4>
            <p className="text-sm text-muted-foreground">Demand: {Math.round(persona.bayesianProfile.demandProbability * 100)}%</p>
            <p className="text-sm text-muted-foreground">Optimal Price: {persona.bayesianProfile.optimalPrice} SAR</p>
          </div>
        </div>
        <div className="mt-6 p-4 rounded-lg bg-muted">
          <p className="italic">"{persona.psychographics.quote}"</p>
        </div>
      </div>
    </div>
  );
};

export default PersonasTab;
