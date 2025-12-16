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
  AlertCircle,
  Target,
  Lightbulb,
  Users,
  Package,
  Rocket,
  Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { categories, regions } from "@/lib/mockData";
import { useTests } from "@/hooks/useTests";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface Hypothesis {
  statement: string;
  metric?: string;
  targetValue?: string;
}

interface Substitute {
  name: string;
  type: "PRODUCT" | "SERVICE" | "BEHAVIOR";
  description: string;
}

interface Partnership {
  type: string;
  name: string;
  status: "ACTIVE" | "IN_CONVERSATION" | "POTENTIAL";
}

interface FormData {
  // Step 1: Project Basics
  productName: string;
  productDescription: string;
  category: string;
  productType: "PHYSICAL" | "DIGITAL" | "HYBRID";
  businessModel: "B2C" | "B2B" | "B2B2C";
  targetMarkets: string[];
  nonGCCSpillover: string[];
  
  // Step 2: Problem & Hypothesis
  problemStatement: string;
  whyNow: string;
  hypotheses: Hypothesis[];
  
  // Step 3: Market Definition
  targetAudienceSegments: string[];
  primaryUseCases: string[];
  substitutes: Substitute[];
  tamEstimate: string;
  samEstimate: string;
  somEstimate: string;
  
  // Step 4: Customer & Segmentation
  currentCustomers: string;
  icpDescription: string;
  linkedinProfiles: string[];
  knownBehavioralSegments: string[];
  
  // Step 5: Product & Offer
  features: string[];
  benefits: string[];
  differentiation: string;
  pricingModel: string;
  priceMin: number;
  priceTarget: number;
  priceMax: number;
  upsellsCrossSells: string[];
  regulatorySfda: boolean;
  regulatoryHalal: boolean;
  regulatoryOther: string[];
  
  // Step 6: GTM Context
  existingChannels: string[];
  cacEstimate: string;
  ltvEstimate: string;
  salesCycle: string;
  partnerships: Partnership[];
  
  // Step 7: Constraints & Goals
  gtmBudgetBand: string;
  launchHorizon: string;
  riskAppetite: string;
  mustAvoidChannels: string[];
  keyDecisions: string[];
  
  // Legacy fields for compatibility
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
  const [newItem, setNewItem] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    // Step 1
    productName: "",
    productDescription: "",
    category: "",
    productType: "PHYSICAL",
    businessModel: "B2C",
    targetMarkets: [],
    nonGCCSpillover: [],
    
    // Step 2
    problemStatement: "",
    whyNow: "",
    hypotheses: [],
    
    // Step 3
    targetAudienceSegments: [],
    primaryUseCases: [],
    substitutes: [],
    tamEstimate: "",
    samEstimate: "",
    somEstimate: "",
    
    // Step 4
    currentCustomers: "",
    icpDescription: "",
    linkedinProfiles: [],
    knownBehavioralSegments: [],
    
    // Step 5
    features: [],
    benefits: [],
    differentiation: "",
    pricingModel: "ONE_TIME",
    priceMin: 200,
    priceTarget: 300,
    priceMax: 500,
    upsellsCrossSells: [],
    regulatorySfda: false,
    regulatoryHalal: false,
    regulatoryOther: [],
    
    // Step 6
    existingChannels: [],
    cacEstimate: "",
    ltvEstimate: "",
    salesCycle: "",
    partnerships: [],
    
    // Step 7
    gtmBudgetBand: "",
    launchHorizon: "",
    riskAppetite: "MODERATE",
    mustAvoidChannels: [],
    keyDecisions: [],
    
    // Legacy
    regionWeights: {},
    identitySignals: { status: 30, trust: 50, upgrade: 20 }
  });

  const steps = [
    { number: 1, title: "Project Basics", icon: Target },
    { number: 2, title: "Problem & Hypothesis", icon: Lightbulb },
    { number: 3, title: "Market Definition", icon: Target },
    { number: 4, title: "Customer Hints", icon: Users },
    { number: 5, title: "Product & Offer", icon: Package },
    { number: 6, title: "GTM Context", icon: Rocket },
    { number: 7, title: "Goals & Review", icon: Shield }
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
      if (!formData.problemStatement.trim() || formData.problemStatement.length < 30) {
        newErrors.problemStatement = "Problem statement must be at least 30 characters";
      }
      if (!formData.whyNow.trim()) {
        newErrors.whyNow = "Please explain why now is the right time";
      }
    }

    if (currentStep === 5) {
      if (formData.priceMin >= formData.priceTarget) {
        newErrors.priceMin = "Minimum price must be less than target";
      }
      if (formData.priceTarget >= formData.priceMax) {
        newErrors.priceTarget = "Target price must be less than maximum";
      }
      if (formData.features.length < 3) {
        newErrors.features = "Please add at least 3 features";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 7) {
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
      // Build founder brief JSON
      const founderBrief = {
        projectBasics: {
          productName: formData.productName,
          category: formData.category,
          productType: formData.productType,
          businessModel: formData.businessModel,
          targetCountries: formData.targetMarkets,
          nonGCCSpillover: formData.nonGCCSpillover,
        },
        problemHypothesis: {
          problemStatement: formData.problemStatement,
          whyNow: formData.whyNow,
          hypotheses: formData.hypotheses,
        },
        marketDefinition: {
          targetAudienceSegments: formData.targetAudienceSegments,
          primaryUseCases: formData.primaryUseCases,
          substitutes: formData.substitutes,
          tamEstimate: formData.tamEstimate,
          samEstimate: formData.samEstimate,
          somEstimate: formData.somEstimate,
        },
        customerSegmentation: {
          currentCustomers: formData.currentCustomers,
          icpDescription: formData.icpDescription,
          linkedinProfiles: formData.linkedinProfiles,
          knownBehavioralSegments: formData.knownBehavioralSegments,
        },
        productOffer: {
          features: formData.features,
          benefits: formData.benefits,
          differentiation: formData.differentiation,
          pricingModel: formData.pricingModel,
          priceRange: {
            min: formData.priceMin,
            target: formData.priceTarget,
            max: formData.priceMax,
            currency: "SAR"
          },
          upsellsCrossSells: formData.upsellsCrossSells,
          regulatoryStatus: {
            sfda: formData.regulatorySfda,
            halal: formData.regulatoryHalal,
            other: formData.regulatoryOther,
          }
        },
        gtmContext: {
          existingChannels: formData.existingChannels,
          cacEstimate: formData.cacEstimate ? Number(formData.cacEstimate) : undefined,
          ltvEstimate: formData.ltvEstimate ? Number(formData.ltvEstimate) : undefined,
          salesCycle: formData.salesCycle,
          partnerships: formData.partnerships,
        },
        constraintsGoals: {
          gtmBudgetBand: formData.gtmBudgetBand,
          launchHorizon: formData.launchHorizon,
          riskAppetite: formData.riskAppetite,
          mustAvoidChannels: formData.mustAvoidChannels,
          keyDecisions: formData.keyDecisions,
        }
      };

      const test = await createTest({
        productName: formData.productName,
        productDescription: formData.productDescription,
        category: formData.category,
        targetMarket: formData.targetMarkets,
        priceMin: formData.priceMin,
        priceTarget: formData.priceTarget,
        priceMax: formData.priceMax,
        features: formData.features,
        founderBrief: founderBrief,
      });
      
      navigate(`/dashboard/test/generating/${test.id}`, { 
        state: { formData, founderBrief } 
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

  const addToArray = (field: keyof FormData, value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), value.trim()]
      }));
      setNewItem("");
    }
  };

  const removeFromArray = (field: keyof FormData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const addHypothesis = () => {
    setFormData(prev => ({
      ...prev,
      hypotheses: [...prev.hypotheses, { statement: "", metric: "", targetValue: "" }]
    }));
  };

  const updateHypothesis = (index: number, field: keyof Hypothesis, value: string) => {
    setFormData(prev => ({
      ...prev,
      hypotheses: prev.hypotheses.map((h, i) => 
        i === index ? { ...h, [field]: value } : h
      )
    }));
  };

  const removeHypothesis = (index: number) => {
    setFormData(prev => ({
      ...prev,
      hypotheses: prev.hypotheses.filter((_, i) => i !== index)
    }));
  };

  const addSubstitute = () => {
    setFormData(prev => ({
      ...prev,
      substitutes: [...prev.substitutes, { name: "", type: "PRODUCT", description: "" }]
    }));
  };

  const updateSubstitute = (index: number, field: keyof Substitute, value: string) => {
    setFormData(prev => ({
      ...prev,
      substitutes: prev.substitutes.map((s, i) => 
        i === index ? { ...s, [field]: value } : s
      )
    }));
  };

  const removeSubstitute = (index: number) => {
    setFormData(prev => ({
      ...prev,
      substitutes: prev.substitutes.filter((_, i) => i !== index)
    }));
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
      <div className="border-b bg-muted/30 overflow-x-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-start gap-1 min-w-max">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center">
                <div className={`flex items-center gap-1.5 ${step >= s.number ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    step > s.number 
                      ? 'gradient-bg text-primary-foreground'
                      : step === s.number 
                      ? 'border-2 border-primary text-primary' 
                      : 'border-2 border-muted-foreground/30 text-muted-foreground'
                  }`}>
                    {step > s.number ? <Check className="w-3 h-3" /> : s.number}
                  </div>
                  <span className="hidden lg:block text-xs font-medium whitespace-nowrap">{s.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-6 h-px mx-1 ${step > s.number ? 'bg-primary' : 'bg-border'}`} />
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
            {/* Step 1: Project Basics */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold mb-2">Project Basics</h2>
                  <p className="text-muted-foreground">Tell us about your product and target markets</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Product / Concept Name *</Label>
                    <Input
                      id="productName"
                      placeholder="e.g., NMN Anti-Aging Supplement"
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
                      placeholder="Describe what your product does, key benefits, and why it matters to customers..."
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Product Type</Label>
                      <Select 
                        value={formData.productType} 
                        onValueChange={(v: "PHYSICAL" | "DIGITAL" | "HYBRID") => setFormData(prev => ({ ...prev, productType: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PHYSICAL">Physical Product</SelectItem>
                          <SelectItem value="DIGITAL">Digital Product</SelectItem>
                          <SelectItem value="HYBRID">Hybrid (Both)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Business Model</Label>
                      <Select 
                        value={formData.businessModel} 
                        onValueChange={(v: "B2C" | "B2B" | "B2B2C") => setFormData(prev => ({ ...prev, businessModel: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="B2C">B2C (Direct to Consumer)</SelectItem>
                          <SelectItem value="B2B">B2B (Business)</SelectItem>
                          <SelectItem value="B2B2C">B2B2C (Both)</SelectItem>
                        </SelectContent>
                      </Select>
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
                    <Label>Target GCC Markets * (select all that apply)</Label>
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

            {/* Step 2: Problem & Hypothesis */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold mb-2">Problem & Hypothesis</h2>
                  <p className="text-muted-foreground">Define the problem you're solving and what you want to validate</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="problem">Problem Statement *</Label>
                    <Textarea
                      id="problem"
                      placeholder="What specific problem does your product solve? Be concrete and specific about the pain point..."
                      rows={3}
                      value={formData.problemStatement}
                      onChange={(e) => setFormData(prev => ({ ...prev, problemStatement: e.target.value }))}
                      className={errors.problemStatement ? "border-destructive" : ""}
                    />
                    <p className="text-xs text-muted-foreground">
                      Example: "GCC executives aged 35-50 struggle to find clinically-backed longevity supplements, leading them to either import expensive options or use unverified local alternatives."
                    </p>
                    {errors.problemStatement && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.problemStatement}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whyNow">Why Now? *</Label>
                    <Textarea
                      id="whyNow"
                      placeholder="What market conditions, trends, or timing factors make this the right moment?"
                      rows={2}
                      value={formData.whyNow}
                      onChange={(e) => setFormData(prev => ({ ...prev, whyNow: e.target.value }))}
                      className={errors.whyNow ? "border-destructive" : ""}
                    />
                    <p className="text-xs text-muted-foreground">
                      Example: "Rising health consciousness post-COVID, increased disposable income in KSA Vision 2030, and regulatory clarity from SFDA."
                    </p>
                    {errors.whyNow && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.whyNow}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Hypotheses to Validate</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addHypothesis}>
                        <Plus className="w-3 h-3 mr-1" />
                        Add Hypothesis
                      </Button>
                    </div>
                    
                    {formData.hypotheses.map((hyp, index) => (
                      <div key={index} className="p-3 rounded-lg border bg-card space-y-2">
                        <div className="flex items-start gap-2">
                          <Input
                            placeholder="e.g., Executives in KSA will pay 300-350 SAR/month for premium NMN"
                            value={hyp.statement}
                            onChange={(e) => updateHypothesis(index, 'statement', e.target.value)}
                            className="flex-1"
                          />
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeHypothesis(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Metric (e.g., conversion rate)"
                            value={hyp.metric || ""}
                            onChange={(e) => updateHypothesis(index, 'metric', e.target.value)}
                          />
                          <Input
                            placeholder="Target (e.g., >5%)"
                            value={hyp.targetValue || ""}
                            onChange={(e) => updateHypothesis(index, 'targetValue', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                    
                    {formData.hypotheses.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg border-dashed">
                        Add hypotheses you want this analysis to test
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Market Definition */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold mb-2">Market Definition</h2>
                  <p className="text-muted-foreground">Define your target audience, use cases, and market sizing</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Target Audience Segments</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., Health-conscious executives 35-50"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('targetAudienceSegments', newItem))}
                      />
                      <Button type="button" variant="outline" onClick={() => addToArray('targetAudienceSegments', newItem)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.targetAudienceSegments.map((seg, i) => (
                        <span key={i} className="px-3 py-1 bg-primary/10 rounded-full text-sm flex items-center gap-2">
                          {seg}
                          <button type="button" onClick={() => removeFromArray('targetAudienceSegments', i)}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Primary Use Cases</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., Daily longevity supplementation"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('primaryUseCases', newItem))}
                      />
                      <Button type="button" variant="outline" onClick={() => addToArray('primaryUseCases', newItem)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.primaryUseCases.map((uc, i) => (
                        <span key={i} className="px-3 py-1 bg-secondary/50 rounded-full text-sm flex items-center gap-2">
                          {uc}
                          <button type="button" onClick={() => removeFromArray('primaryUseCases', i)}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Substitutes & Alternatives</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addSubstitute}>
                        <Plus className="w-3 h-3 mr-1" />
                        Add Substitute
                      </Button>
                    </div>
                    
                    {formData.substitutes.map((sub, index) => (
                      <div key={index} className="p-3 rounded-lg border bg-card space-y-2">
                        <div className="flex items-start gap-2">
                          <Input
                            placeholder="Name (e.g., Local vitamin shops)"
                            value={sub.name}
                            onChange={(e) => updateSubstitute(index, 'name', e.target.value)}
                            className="flex-1"
                          />
                          <Select 
                            value={sub.type} 
                            onValueChange={(v) => updateSubstitute(index, 'type', v)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PRODUCT">Product</SelectItem>
                              <SelectItem value="SERVICE">Service</SelectItem>
                              <SelectItem value="BEHAVIOR">Behavior</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeSubstitute(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Brief description..."
                          value={sub.description}
                          onChange={(e) => updateSubstitute(index, 'description', e.target.value)}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl border bg-card">
                    <Label className="text-base font-semibold mb-4 block">Market Sizing (Optional)</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      If you have estimates, we'll validate against research. If not, we'll calculate.
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">TAM (Total Market)</Label>
                        <Input
                          placeholder="e.g., $500M"
                          value={formData.tamEstimate}
                          onChange={(e) => setFormData(prev => ({ ...prev, tamEstimate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">SAM (Serviceable)</Label>
                        <Input
                          placeholder="e.g., $150M"
                          value={formData.samEstimate}
                          onChange={(e) => setFormData(prev => ({ ...prev, samEstimate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">SOM (Obtainable)</Label>
                        <Input
                          placeholder="e.g., $15M"
                          value={formData.somEstimate}
                          onChange={(e) => setFormData(prev => ({ ...prev, somEstimate: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Customer & Segmentation Hints */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold mb-2">Customer & Segmentation Hints</h2>
                  <p className="text-muted-foreground">Help us create accurate personas with your customer insights</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Customers (if any)</Label>
                    <Textarea
                      placeholder="Describe your existing customers - who are they, what do they buy, how did they find you?"
                      rows={3}
                      value={formData.currentCustomers}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentCustomers: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Ideal Customer Profile (ICP)</Label>
                    <Textarea
                      placeholder="Describe your ideal customer in detail - demographics, psychographics, behaviors..."
                      rows={3}
                      value={formData.icpDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, icpDescription: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Example: "C-suite executives in KSA, 40-55, earning 50K+ SAR/month, interested in longevity and biohacking, follows Huberman Lab, shops at Noon and Amazon"
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Known Behavioral Segments</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., Biohackers, Appearance-driven, Budget-conscious"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('knownBehavioralSegments', newItem))}
                      />
                      <Button type="button" variant="outline" onClick={() => addToArray('knownBehavioralSegments', newItem)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.knownBehavioralSegments.map((seg, i) => (
                        <span key={i} className="px-3 py-1 bg-accent/50 rounded-full text-sm flex items-center gap-2">
                          {seg}
                          <button type="button" onClick={() => removeFromArray('knownBehavioralSegments', i)}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Example LinkedIn Profiles (Optional)</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Paste LinkedIn URLs of people who represent your target customer
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://linkedin.com/in/..."
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('linkedinProfiles', newItem))}
                      />
                      <Button type="button" variant="outline" onClick={() => addToArray('linkedinProfiles', newItem)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.linkedinProfiles.map((url, i) => (
                        <span key={i} className="px-3 py-1 bg-muted rounded-full text-xs flex items-center gap-2 max-w-xs truncate">
                          {url}
                          <button type="button" onClick={() => removeFromArray('linkedinProfiles', i)}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Product & Offer */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold mb-2">Product & Offer</h2>
                  <p className="text-muted-foreground">Define your features, pricing, and differentiation</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl border bg-card">
                    <Label className="text-base font-semibold mb-4 block">Key Features (3-5 features) *</Label>
                    
                    <div className="space-y-2 mb-4">
                      {formData.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                          <span className="flex-1 text-sm">{feature}</span>
                          <button
                            type="button"
                            onClick={() => removeFromArray('features', index)}
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
                          placeholder="e.g., 99.5% pure NMN, Third-party tested"
                          value={newItem}
                          onChange={(e) => setNewItem(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('features', newItem))}
                        />
                        <Button type="button" onClick={() => addToArray('features', newItem)} variant="outline">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {errors.features && (
                      <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.features}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Key Benefits</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., Increased energy, Better sleep quality"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('benefits', newItem))}
                      />
                      <Button type="button" variant="outline" onClick={() => addToArray('benefits', newItem)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.benefits.map((ben, i) => (
                        <span key={i} className="px-3 py-1 bg-green/10 text-green rounded-full text-sm flex items-center gap-2">
                          {ben}
                          <button type="button" onClick={() => removeFromArray('benefits', i)}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Key Differentiation</Label>
                    <Textarea
                      placeholder="What makes your product unique compared to competitors?"
                      rows={2}
                      value={formData.differentiation}
                      onChange={(e) => setFormData(prev => ({ ...prev, differentiation: e.target.value }))}
                    />
                  </div>

                  <div className="p-4 rounded-xl border bg-card">
                    <Label className="text-base font-semibold mb-4 block">Pricing Strategy (SAR)</Label>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Pricing Model</Label>
                        <Select 
                          value={formData.pricingModel} 
                          onValueChange={(v) => setFormData(prev => ({ ...prev, pricingModel: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ONE_TIME">One-time Purchase</SelectItem>
                            <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                            <SelectItem value="FREEMIUM">Freemium</SelectItem>
                            <SelectItem value="TIERED">Tiered Pricing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
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
                      
                      {(errors.priceMin || errors.priceTarget) && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.priceMin || errors.priceTarget}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border bg-card">
                    <Label className="text-base font-semibold mb-4 block">Regulatory Status</Label>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.regulatorySfda}
                          onChange={(e) => setFormData(prev => ({ ...prev, regulatorySfda: e.target.checked }))}
                          className="rounded"
                        />
                        <span className="text-sm">SFDA Approved</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.regulatoryHalal}
                          onChange={(e) => setFormData(prev => ({ ...prev, regulatoryHalal: e.target.checked }))}
                          className="rounded"
                        />
                        <span className="text-sm">Halal Certified</span>
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 6: GTM Context */}
            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold mb-2">Go-to-Market Context</h2>
                  <p className="text-muted-foreground">Share your current channels, economics, and partnerships</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Existing Channels</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., Instagram, Noon marketplace, Direct sales"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('existingChannels', newItem))}
                      />
                      <Button type="button" variant="outline" onClick={() => addToArray('existingChannels', newItem)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.existingChannels.map((ch, i) => (
                        <span key={i} className="px-3 py-1 bg-primary/10 rounded-full text-sm flex items-center gap-2">
                          {ch}
                          <button type="button" onClick={() => removeFromArray('existingChannels', i)}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border bg-card">
                    <Label className="text-base font-semibold mb-4 block">Unit Economics (if known)</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs">CAC (SAR)</Label>
                        <Input
                          placeholder="e.g., 150"
                          value={formData.cacEstimate}
                          onChange={(e) => setFormData(prev => ({ ...prev, cacEstimate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">LTV (SAR)</Label>
                        <Input
                          placeholder="e.g., 1200"
                          value={formData.ltvEstimate}
                          onChange={(e) => setFormData(prev => ({ ...prev, ltvEstimate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Sales Cycle</Label>
                        <Input
                          placeholder="e.g., 2 weeks"
                          value={formData.salesCycle}
                          onChange={(e) => setFormData(prev => ({ ...prev, salesCycle: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Partnerships in Progress</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Any retailers, clinics, or partners you're already talking to
                    </p>
                    {formData.partnerships.map((p, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <Input
                          placeholder="Partner name"
                          value={p.name}
                          onChange={(e) => {
                            const updated = [...formData.partnerships];
                            updated[i].name = e.target.value;
                            setFormData(prev => ({ ...prev, partnerships: updated }));
                          }}
                          className="flex-1"
                        />
                        <Select 
                          value={p.status}
                          onValueChange={(v: "ACTIVE" | "IN_CONVERSATION" | "POTENTIAL") => {
                            const updated = [...formData.partnerships];
                            updated[i].status = v;
                            setFormData(prev => ({ ...prev, partnerships: updated }));
                          }}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="IN_CONVERSATION">In Talks</SelectItem>
                            <SelectItem value="POTENTIAL">Potential</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="ghost" size="sm" onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            partnerships: prev.partnerships.filter((_, idx) => idx !== i)
                          }));
                        }}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        partnerships: [...prev.partnerships, { type: "", name: "", status: "POTENTIAL" as const }]
                      }))}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Partnership
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 7: Goals & Review */}
            {step === 7 && (
              <motion.div
                key="step7"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold mb-2">Goals & Review</h2>
                  <p className="text-muted-foreground">Set constraints and review your research brief</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl border bg-card">
                    <Label className="text-base font-semibold mb-4 block">Constraints</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">GTM Budget Band</Label>
                        <Select 
                          value={formData.gtmBudgetBand} 
                          onValueChange={(v) => setFormData(prev => ({ ...prev, gtmBudgetBand: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select budget" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="<50K_SAR">&lt;50K SAR</SelectItem>
                            <SelectItem value="50K-200K_SAR">50K-200K SAR</SelectItem>
                            <SelectItem value="200K-500K_SAR">200K-500K SAR</SelectItem>
                            <SelectItem value=">500K_SAR">&gt;500K SAR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Launch Horizon</Label>
                        <Select 
                          value={formData.launchHorizon} 
                          onValueChange={(v) => setFormData(prev => ({ ...prev, launchHorizon: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select timeline" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="<3_MONTHS">&lt;3 Months</SelectItem>
                            <SelectItem value="3-6_MONTHS">3-6 Months</SelectItem>
                            <SelectItem value="6-12_MONTHS">6-12 Months</SelectItem>
                            <SelectItem value=">12_MONTHS">&gt;12 Months</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Key Decisions This Report Should Inform</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., Pricing decision, Market entry timing, Feature prioritization"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('keyDecisions', newItem))}
                      />
                      <Button type="button" variant="outline" onClick={() => addToArray('keyDecisions', newItem)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.keyDecisions.map((dec, i) => (
                        <span key={i} className="px-3 py-1 bg-secondary rounded-full text-sm flex items-center gap-2">
                          {dec}
                          <button type="button" onClick={() => removeFromArray('keyDecisions', i)}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border bg-card">
                    <h3 className="font-semibold mb-3">Research Brief Summary</h3>
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
                          {formData.targetMarkets.map(m => regions.find(r => r.value === m)?.flag).join(' ')}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">Price Range</span>
                        <span className="font-medium">
                          {formData.priceMin} - {formData.priceMax} SAR
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">Features</span>
                        <span className="font-medium">{formData.features.length} listed</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">Hypotheses</span>
                        <span className="font-medium">{formData.hypotheses.length} to validate</span>
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
                        <span>Market research via Perplexity AI (competitors, sizing, trends)</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs text-primary-foreground font-medium">2</span>
                        </div>
                        <span>Bayesian analysis (demand, pricing, segmentation)</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs text-primary-foreground font-medium">3</span>
                        </div>
                        <span>Investment-grade report generation (35-50 pages)</span>
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

            {step < 7 ? (
              <Button variant="gradient" onClick={handleNext}>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button variant="hero" onClick={handleSubmit} disabled={isSubmitting}>
                <Sparkles className="w-4 h-4 mr-2" />
                {isSubmitting ? "Generating..." : "Generate Analysis"}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewTest;
