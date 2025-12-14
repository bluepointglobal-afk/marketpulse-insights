import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  ArrowLeft, 
  Download, 
  Share2,
  TrendingUp,
  Target,
  BarChart3,
  Users,
  FileText,
  Check,
  AlertTriangle,
  Lightbulb
} from "lucide-react";
import { motion } from "framer-motion";
import { sampleTest } from "@/lib/mockData";
import OverviewTab from "@/components/results/OverviewTab";
import FeaturesTab from "@/components/results/FeaturesTab";
import PricingTab from "@/components/results/PricingTab";
import BrandTab from "@/components/results/BrandTab";
import PersonasTab from "@/components/results/PersonasTab";
import ReportsTab from "@/components/results/ReportsTab";

const TestResults = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const test = sampleTest;

  const tabs = [
    { value: "overview", label: "Overview", icon: TrendingUp },
    { value: "features", label: "Features", icon: BarChart3 },
    { value: "pricing", label: "Pricing", icon: Target },
    { value: "brand", label: "Brand", icon: Lightbulb },
    { value: "personas", label: "Personas", icon: Users },
    { value: "reports", label: "Reports", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                  <Brain className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold gradient-text hidden sm:block">MarketPulse</span>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="gradient" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Test Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">{test.productName}</h1>
              <p className="text-muted-foreground text-sm">
                Generated: {new Date(test.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold gradient-text">
                  {Math.round(test.bayesianResults.demandProbability * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">Demand</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{test.bayesianResults.psmScore}</p>
                <p className="text-xs text-muted-foreground">PSM</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold">{test.bayesianResults.optimalPrice}</p>
                <p className="text-xs text-muted-foreground">SAR</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 rounded-xl overflow-x-auto">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 px-4 py-2 data-[state=active]:gradient-bg data-[state=active]:text-primary-foreground rounded-lg"
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-6"
          >
            <TabsContent value="overview" className="m-0">
              <OverviewTab test={test} />
            </TabsContent>
            
            <TabsContent value="features" className="m-0">
              <FeaturesTab test={test} />
            </TabsContent>
            
            <TabsContent value="pricing" className="m-0">
              <PricingTab test={test} />
            </TabsContent>
            
            <TabsContent value="brand" className="m-0">
              <BrandTab test={test} />
            </TabsContent>
            
            <TabsContent value="personas" className="m-0">
              <PersonasTab test={test} />
            </TabsContent>
            
            <TabsContent value="reports" className="m-0">
              <ReportsTab test={test} />
            </TabsContent>
          </motion.div>
        </Tabs>
      </div>
    </div>
  );
};

export default TestResults;
