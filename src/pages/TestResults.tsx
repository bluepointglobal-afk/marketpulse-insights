import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  ArrowLeft, 
  Download, 
  Share2,
  TrendingUp,
  Target,
  Building2,
  Users,
  FileText,
  Layers,
  Rocket,
  PiggyBank,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { useTests } from "@/hooks/useTests";
import { useToast } from "@/hooks/use-toast";
import type { TestResults as TestResultsType } from "@/lib/mockData";
import OverviewTab from "@/components/results/OverviewTab";
import MarketIntelligenceTab from "@/components/results/MarketIntelligenceTab";
import CustomerInsightsTab from "@/components/results/CustomerInsightsTab";
import ProductStrategyTab from "@/components/results/ProductStrategyTab";
import GoToMarketTab from "@/components/results/GoToMarketTab";
import InvestmentThesisTab from "@/components/results/InvestmentThesisTab";
import ReportsTab from "@/components/results/ReportsTab";

const TestResults = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { getTest, regenerateMarketing } = useTests();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [test, setTest] = useState<TestResultsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    const fetchTest = async () => {
      if (!testId) {
        navigate("/dashboard");
        return;
      }
      try {
        const testData = await getTest(testId);
        if (!testData || testData.status !== "COMPLETED") {
          navigate("/dashboard");
          return;
        }
        setTest(testData);
      } catch (error) {
        console.error("Error fetching test:", error);
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [testId]);

  const handleRegenerateMarketing = async () => {
    if (!testId) return;
    setRegenerating(true);
    try {
      await regenerateMarketing(testId);
      toast({ title: "Marketing regenerated", description: "Refreshing results..." });
      const updated = await getTest(testId);
      if (updated) setTest(updated);
    } catch (error) {
      toast({
        title: "Regeneration failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setRegenerating(false);
    }
  };

  const tabs = [
    { value: "overview", label: "Overview", icon: TrendingUp },
    { value: "market", label: "Market Intelligence", icon: Building2 },
    { value: "customers", label: "Customer Insights", icon: Users },
    { value: "product", label: "Product Strategy", icon: Layers },
    { value: "gtm", label: "Go-to-Market", icon: Rocket },
    { value: "investment", label: "Investment Thesis", icon: PiggyBank },
    { value: "reports", label: "Reports", icon: FileText },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!test) return null;

  const bayesianResults = (test.bayesianResults || {}) as any;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/dashboard"><ArrowLeft className="w-4 h-4" /></Link>
              </Button>
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                  <Brain className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold gradient-text hidden sm:block">MarketPulse</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRegenerateMarketing} disabled={regenerating}>
                <RefreshCw className={`w-4 h-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
                {regenerating ? 'Regenerating...' : 'Refresh'}
              </Button>
              <Button variant="outline" size="sm"><Share2 className="w-4 h-4 mr-2" />Share</Button>
              <Button variant="gradient" size="sm" onClick={() => setActiveTab('reports')}>
                <Download className="w-4 h-4 mr-2" />Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Test Header */}
      <div className="border-b bg-gradient-to-r from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">{test.productName}</h1>
              <p className="text-muted-foreground text-sm">
                Generated: {new Date(test.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold gradient-text">{Math.round((bayesianResults.demandProbability || 0) * 100)}%</p>
                <p className="text-xs text-muted-foreground">Demand</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{bayesianResults.psmScore || 0}</p>
                <p className="text-xs text-muted-foreground">PSM</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold">{bayesianResults.optimalPrice || 0}</p>
                <p className="text-xs text-muted-foreground">SAR</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 rounded-xl overflow-x-auto flex-wrap">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 px-3 py-2 data-[state=active]:gradient-bg data-[state=active]:text-primary-foreground rounded-lg text-sm"
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden md:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="mt-6">
            <TabsContent value="overview" className="m-0"><OverviewTab test={test} /></TabsContent>
            <TabsContent value="market" className="m-0"><MarketIntelligenceTab test={test} /></TabsContent>
            <TabsContent value="customers" className="m-0"><CustomerInsightsTab test={test} /></TabsContent>
            <TabsContent value="product" className="m-0"><ProductStrategyTab test={test} /></TabsContent>
            <TabsContent value="gtm" className="m-0"><GoToMarketTab test={test} /></TabsContent>
            <TabsContent value="investment" className="m-0"><InvestmentThesisTab test={test} /></TabsContent>
            <TabsContent value="reports" className="m-0"><ReportsTab test={test} /></TabsContent>
          </motion.div>
        </Tabs>
      </div>
    </div>
  );
};

export default TestResults;
