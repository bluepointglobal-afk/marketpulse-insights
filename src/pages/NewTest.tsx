import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { 
  Brain, 
  ArrowLeft, 
  ArrowRight, 
  Check,
  Plus,
  X,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { categories, regions } from "@/lib/mockData";
import { useTests } from "@/hooks/useTests";
import { useToast } from "@/hooks/use-toast";

type WizardStep = 1 | 2 | 3 | 4;

interface FormData {
  productName: string;
  productDescription: string;
  category: string;
  targetMarkets: string[];
  priceMin: number;
  priceTarget: number;
  priceMax: number;
  features: string[];
  regionWeights: Record<string, number>;
  identitySignals: {
    status: number;
    trust: number;
    upgrade: number;
  };
}

const NewTest = () => {
  const navigate = useNavigate();
  const { createTest } = useTests();
  const { toast } = useToast();
  const [step, setStep] = useState<WizardStep>(1);
  const [newFeature, setNewFeature] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    productName: "",
    productDescription: "",
    category: "",
    targetMarkets: [],
    priceMin: 200,
    priceTarget: 300,
    priceMax: 500,
    features: [],
    regionWeights: {},
    identitySignals: {
      status: 30,
      trust: 50,
      upgrade: 20
    }
  });

  const steps = [
    { number: 1, title: "Product Info" },
    { number: 2, title: "Pricing & Features" },
    { number: 3, title: "Market Config" },
    { number: 4, title: "Review" }
  ];

  const validateStep = (currentStep: WizardStep): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.productName.trim() || formData.productName.length < 3) {
        newErrors.productName = "Product name must be at least 3 characters";
      }
      if (!formData.productDescription.trim() || formData.productDescription.length < 50) {
        newErrors.productDescription = "Description must be at least 50 characters";
      }
      if (!formData.category) {
        newErrors.category = "Please select a category";
      }
      if (formData.targetMarkets.length === 0) {
        newErrors.targetMarkets = "Please select at least one market";
      }
    }

    if (currentStep === 2) {
      if (formData.priceMin >= formData.priceTarget) {
        newErrors.priceMin = "Minimum price must be less than target";
      }
      if (formData.priceTarget >= formData.priceMax) {
        newErrors.priceTarget = "Target price must be less than maximum";
      }
      if (formData.features.length < 3) {
        newErrors.features = "Please add at least 3 features";
      }
      if (formData.features.length > 5) {
        newErrors.features = "Maximum 5 features allowed";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 4) {
        setStep((step + 1) as WizardStep);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as WizardStep);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const test = await createTest({
        productName: formData.productName,
        productDescription: formData.productDescription,
        category: formData.category,
        targetMarket: formData.targetMarkets,
        priceMin: formData.priceMin,
        priceTarget: formData.priceTarget,
        priceMax: formData.priceMax,
        features: formData.features
      });
      
      // Navigate to generating page with test ID and form data
      navigate(`/dashboard/test/generating/${test.id}`, { 
        state: { formData } 
      });
    } catch (error) {
      console.error("Error creating test:", error);
      toast({
        title: "Error",
        description: "Failed to create test. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  const toggleMarket = (market: string) => {
    setFormData(prev => ({
      ...prev,
      targetMarkets: prev.targetMarkets.includes(market)
        ? prev.targetMarkets.filter(m => m !== market)
        : [...prev.targetMarkets, market]
    }));
    
    // Initialize weights when market is added
    if (!formData.targetMarkets.includes(market)) {
      const newMarkets = [...formData.targetMarkets, market];
      const equalWeight = Math.floor(100 / newMarkets.length);
      const newWeights: Record<string, number> = {};
      newMarkets.forEach((m, i) => {
        newWeights[m] = i === newMarkets.length - 1 
          ? 100 - (equalWeight * (newMarkets.length - 1))
          : equalWeight;
      });
      setFormData(prev => ({ ...prev, regionWeights: newWeights }));
    }
  };

  const addFeature = () => {
    if (newFeature.trim() && formData.features.length < 5) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateRegionWeight = (region: string, value: number) => {
    const otherRegions = formData.targetMarkets.filter(r => r !== region);
    const remaining = 100 - value;
    const perOther = Math.floor(remaining / otherRegions.length);
    
    const newWeights: Record<string, number> = { [region]: value };
    otherRegions.forEach((r, i) => {
      newWeights[r] = i === otherRegions.length - 1
        ? remaining - (perOther * (otherRegions.length - 1))
        : perOther;
    });
    
    setFormData(prev => ({ ...prev, regionWeights: newWeights }));
  };

  const updateIdentitySignal = (signal: keyof typeof formData.identitySignals, value: number) => {
    const signals = ['status', 'trust', 'upgrade'] as const;
    const otherSignals = signals.filter(s => s !== signal);
    const remaining = 100 - value;
    const perOther = Math.floor(remaining / otherSignals.length);
    
    const newSignals = { [signal]: value } as typeof formData.identitySignals;
    otherSignals.forEach((s, i) => {
      newSignals[s] = i === otherSignals.length - 1
        ? remaining - (perOther * (otherSignals.length - 1))
        : perOther;
    });
    
    setFormData(prev => ({ ...prev, identitySignals: newSignals }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold gradient-text">MarketPulse</span>
            </Link>

            <Button variant="ghost" asChild>
              <Link to="/dashboard">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center">
                <div className={`flex items-center gap-2 ${step >= s.number ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step > s.number 
                      ? 'gradient-bg text-primary-foreground'
                      : step === s.number 
                      ? 'border-2 border-primary text-primary' 
                      : 'border-2 border-muted-foreground/30 text-muted-foreground'
                  }`}>
                    {step > s.number ? <Check className="w-4 h-4" /> : s.number}
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{s.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 sm:w-12 h-px mx-2 ${step > s.number ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Product Info */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold mb-2">Product Information</h2>
                  <p className="text-muted-foreground">Tell us about your product</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Product Name *</Label>
                    <Input
                      id="productName"
                      placeholder="e.g., Turmeric Curcumin Supplement"
                      value={formData.productName}
                      onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                      className={errors.productName ? "border-destructive" : ""}
                    />
                    {errors.productName && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.productName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Product Description * (min 50 chars)</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what your product does and why it matters to customers..."
                      rows={4}
                      value={formData.productDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, productDescription: e.target.value }))}
                      className={errors.productDescription ? "border-destructive" : ""}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{errors.productDescription && <span className="text-destructive">{errors.productDescription}</span>}</span>
                      <span>{formData.productDescription.length}/500</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            formData.category === cat.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <span className="text-lg mr-2">{cat.icon}</span>
                          <span className="text-sm font-medium">{cat.label.replace(cat.icon + ' ', '')}</span>
                        </button>
                      ))}
                    </div>
                    {errors.category && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.category}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Target Market * (select all that apply)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {regions.map((region) => (
                        <button
                          key={region.value}
                          type="button"
                          onClick={() => toggleMarket(region.value)}
                          className={`p-3 rounded-lg border text-left transition-all flex items-center gap-2 ${
                            formData.targetMarkets.includes(region.value)
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <span className="text-lg">{region.flag}</span>
                          <span className="text-sm font-medium">{region.label.replace(region.flag + ' ', '')}</span>
                          {formData.targetMarkets.includes(region.value) && (
                            <Check className="w-4 h-4 text-primary ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                    {errors.targetMarkets && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.targetMarkets}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Pricing & Features */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold mb-2">Pricing & Features</h2>
                  <p className="text-muted-foreground">Set your price range and key features</p>
                </div>

                <div className="space-y-6">
                  <div className="p-4 rounded-xl border bg-card">
                    <Label className="text-base font-semibold mb-4 block">Pricing Strategy (SAR)</Label>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Minimum</Label>
                        <Input
                          type="number"
                          value={formData.priceMin}
                          onChange={(e) => setFormData(prev => ({ ...prev, priceMin: Number(e.target.value) }))}
                          className={errors.priceMin ? "border-destructive" : ""}
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Target</Label>
                        <Input
                          type="number"
                          value={formData.priceTarget}
                          onChange={(e) => setFormData(prev => ({ ...prev, priceTarget: Number(e.target.value) }))}
                          className={errors.priceTarget ? "border-destructive" : ""}
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Maximum</Label>
                        <Input
                          type="number"
                          value={formData.priceMax}
                          onChange={(e) => setFormData(prev => ({ ...prev, priceMax: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      ℹ️ We'll test demand across this price range to find your optimal price point
                    </p>
                    
                    {(errors.priceMin || errors.priceTarget) && (
                      <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.priceMin || errors.priceTarget}
                      </p>
                    )}
                  </div>

                  <div className="p-4 rounded-xl border bg-card">
                    <Label className="text-base font-semibold mb-4 block">Key Features (3-5 features) *</Label>
                    
                    <div className="space-y-2 mb-4">
                      {formData.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                          <span className="flex-1 text-sm">{feature}</span>
                          <button
                            type="button"
                            onClick={() => removeFeature(index)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {formData.features.length < 5 && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g., 95% curcumin content"
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                        />
                        <Button type="button" onClick={addFeature} variant="outline">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    <p className="text-sm text-muted-foreground mt-3">
                      These features will be tested for importance in your MaxDiff analysis
                    </p>

                    {errors.features && (
                      <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.features}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Market Configuration */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold mb-2">Market Configuration</h2>
                  <p className="text-muted-foreground">Fine-tune your analysis parameters</p>
                </div>

                <div className="space-y-6">
                  <div className="p-4 rounded-xl border bg-card">
                    <Label className="text-base font-semibold mb-4 block">Regional Focus</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Adjust how much to weight each market in the analysis
                    </p>

                    <div className="space-y-4">
                      {formData.targetMarkets.map((market) => {
                        const region = regions.find(r => r.value === market);
                        const weight = formData.regionWeights[market] || 0;
                        return (
                          <div key={market}>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm font-medium">{region?.flag} {region?.label.replace(region.flag + ' ', '')}</span>
                              <span className="text-sm font-medium gradient-text">{weight}%</span>
                            </div>
                            <Slider
                              value={[weight]}
                              onValueChange={([value]) => updateRegionWeight(market, value)}
                              max={100}
                              step={5}
                              className="w-full"
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 p-2 rounded-lg bg-muted text-center">
                      <span className="text-sm font-medium">
                        Total: {Object.values(formData.regionWeights).reduce((a, b) => a + b, 0)}%
                        {Object.values(formData.regionWeights).reduce((a, b) => a + b, 0) === 100 && (
                          <Check className="w-4 h-4 text-green inline ml-2" />
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border bg-card">
                    <Label className="text-base font-semibold mb-4 block">Identity Signals</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      What drives purchase decisions for your product?
                    </p>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Status Signal (premium, prestige)</span>
                          <span className="text-sm font-medium">{formData.identitySignals.status}%</span>
                        </div>
                        <Slider
                          value={[formData.identitySignals.status]}
                          onValueChange={([value]) => updateIdentitySignal('status', value)}
                          max={100}
                          step={5}
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Trust Signal (reviews, certifications)</span>
                          <span className="text-sm font-medium">{formData.identitySignals.trust}%</span>
                        </div>
                        <Slider
                          value={[formData.identitySignals.trust]}
                          onValueChange={([value]) => updateIdentitySignal('trust', value)}
                          max={100}
                          step={5}
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Upgrade Signal (better than current)</span>
                          <span className="text-sm font-medium">{formData.identitySignals.upgrade}%</span>
                        </div>
                        <Slider
                          value={[formData.identitySignals.upgrade]}
                          onValueChange={([value]) => updateIdentitySignal('upgrade', value)}
                          max={100}
                          step={5}
                        />
                      </div>
                    </div>

                    <div className="mt-4 p-2 rounded-lg bg-muted text-center">
                      <span className="text-sm font-medium">
                        Total: {formData.identitySignals.status + formData.identitySignals.trust + formData.identitySignals.upgrade}%
                        {(formData.identitySignals.status + formData.identitySignals.trust + formData.identitySignals.upgrade) === 100 && (
                          <Check className="w-4 h-4 text-green inline ml-2" />
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold mb-2">Review & Launch</h2>
                  <p className="text-muted-foreground">Confirm your analysis configuration</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl border bg-card">
                    <h3 className="font-semibold mb-3">Product Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">Product</span>
                        <span className="font-medium">{formData.productName}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">Category</span>
                        <span className="font-medium">
                          {categories.find(c => c.value === formData.category)?.label || formData.category}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">Markets</span>
                        <span className="font-medium">
                          {formData.targetMarkets.map(m => {
                            const r = regions.find(r => r.value === m);
                            return `${r?.flag} ${formData.regionWeights[m]}%`;
                          }).join(', ')}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">Price Range</span>
                        <span className="font-medium">
                          {formData.priceMin} - {formData.priceTarget} - {formData.priceMax} SAR
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">Features</span>
                        <span className="font-medium">{formData.features.length} listed</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border bg-card">
                    <h3 className="font-semibold mb-3">What happens next</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs text-primary-foreground font-medium">1</span>
                        </div>
                        <span>Bayesian analysis runs (30 seconds)</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs text-primary-foreground font-medium">2</span>
                        </div>
                        <span>Marketing insights generated (MaxDiff, Kano, Van Westendorp)</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs text-primary-foreground font-medium">3</span>
                        </div>
                        <span>Investor-ready reports created</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Credits: You have 1 credit available</p>
                        <p className="text-sm text-muted-foreground">This analysis will use 1 credit</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {step < 4 ? (
              <Button variant="gradient" onClick={handleNext}>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button variant="hero" onClick={handleSubmit}>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Analysis
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewTest;
