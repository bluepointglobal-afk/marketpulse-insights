import { TestResults } from "@/lib/mockData";

interface Props { test: TestResults; }

const PricingTab = ({ test }: Props) => {
  const vanWestendorp = (test.vanWestendorp || {}) as any;
  
  const tooCheap = vanWestendorp.tooCheap || "N/A";
  const bargain = vanWestendorp.bargain || "N/A";
  const optimalPricePoint = vanWestendorp.optimalPricePoint || "N/A";
  const tooExpensive = vanWestendorp.tooExpensive || "N/A";
  const acceptableRange = vanWestendorp.acceptableRange || [0, 0];
  const reasoning = vanWestendorp.reasoning || "Price sensitivity analysis pending.";

  if (!test.vanWestendorp || Object.keys(test.vanWestendorp).length === 0) {
    return (
      <div className="metric-card text-center py-8">
        <p className="text-muted-foreground">No pricing analysis data available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="metric-card">
        <h3 className="font-semibold mb-4">Van Westendorp Price Sensitivity</h3>
        <div className="grid sm:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 rounded-lg bg-destructive/10">
            <p className="text-2xl font-bold text-destructive">{tooCheap}</p>
            <p className="text-sm text-muted-foreground">Too Cheap</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-green/10">
            <p className="text-2xl font-bold text-green">{bargain}</p>
            <p className="text-sm text-muted-foreground">Bargain</p>
          </div>
          <div className="text-center p-4 rounded-lg gradient-bg">
            <p className="text-2xl font-bold text-primary-foreground">{optimalPricePoint}</p>
            <p className="text-sm text-primary-foreground/80">Optimal ⭐</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-orange/10">
            <p className="text-2xl font-bold text-orange">{tooExpensive}</p>
            <p className="text-sm text-muted-foreground">Too Expensive</p>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-muted">
          <p className="font-medium">Acceptable Range: {acceptableRange[0]} - {acceptableRange[1]} SAR</p>
          <p className="text-sm text-muted-foreground mt-1">{reasoning}</p>
        </div>
      </div>
    </div>
  );
};

export default PricingTab;
