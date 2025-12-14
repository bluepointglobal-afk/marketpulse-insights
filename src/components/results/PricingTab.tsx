import { TestResults } from "@/lib/mockData";

interface Props { test: TestResults; }

const PricingTab = ({ test }: Props) => {
  const { vanWestendorp } = test;

  return (
    <div className="space-y-6">
      <div className="metric-card">
        <h3 className="font-semibold mb-4">Van Westendorp Price Sensitivity</h3>
        <div className="grid sm:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 rounded-lg bg-destructive/10">
            <p className="text-2xl font-bold text-destructive">{vanWestendorp.tooCheap}</p>
            <p className="text-sm text-muted-foreground">Too Cheap</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-green/10">
            <p className="text-2xl font-bold text-green">{vanWestendorp.bargain}</p>
            <p className="text-sm text-muted-foreground">Bargain</p>
          </div>
          <div className="text-center p-4 rounded-lg gradient-bg">
            <p className="text-2xl font-bold text-primary-foreground">{vanWestendorp.optimalPricePoint}</p>
            <p className="text-sm text-primary-foreground/80">Optimal ⭐</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-orange/10">
            <p className="text-2xl font-bold text-orange">{vanWestendorp.tooExpensive}</p>
            <p className="text-sm text-muted-foreground">Too Expensive</p>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-muted">
          <p className="font-medium">Acceptable Range: {vanWestendorp.acceptableRange[0]} - {vanWestendorp.acceptableRange[1]} SAR</p>
          <p className="text-sm text-muted-foreground mt-1">{vanWestendorp.reasoning}</p>
        </div>
      </div>
    </div>
  );
};

export default PricingTab;
