import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  Brain, 
  ArrowRight, 
  Check, 
  BarChart3, 
  Target, 
  Users, 
  FileText,
  Sparkles,
  Shield,
  Zap,
  TrendingUp,
  PieChart,
  LineChart
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const Index = () => {
  const features = [
    {
      icon: BarChart3,
      title: "Bayesian Demand Analysis",
      description: "Calculate demand probability with 90% confidence intervals using Bayesian inference"
    },
    {
      icon: Target,
      title: "PSM Scoring (0-100)",
      description: "Predictive Signal Match quantifies how strongly your product signals meet market expectations"
    },
    {
      icon: LineChart,
      title: "Van Westendorp Pricing",
      description: "Find your optimal price point and acceptable price range using proven methodology"
    },
    {
      icon: PieChart,
      title: "MaxDiff Feature Analysis",
      description: "Rank feature importance using Bayesian-anchored utility scores"
    },
    {
      icon: Users,
      title: "Persona Generation",
      description: "4 detailed personas with demographics, psychographics, and channel strategies"
    },
    {
      icon: FileText,
      title: "Investor Reports",
      description: "Export 35-page validation reports, pitch deck slides, and financial models"
    }
  ];

  const steps = [
    { number: "01", title: "Describe Your Product", description: "Enter product details, category, target market, and price range" },
    { number: "02", title: "Configure Analysis", description: "Set regional weights and identity signals (status, trust, upgrade)" },
    { number: "03", title: "Get Results", description: "Receive Bayesian analysis, personas, and investor-ready reports in 30 seconds" }
  ];

  const pricingTiers = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Try it out",
      credits: "1 analysis",
      features: [
        "Basic Bayesian metrics",
        "Demand probability & PSM",
        "1 chart (demand curve)",
        "2-page PDF summary"
      ],
      cta: "Start Free",
      popular: false
    },
    {
      name: "Pro",
      price: "$299",
      period: "/month",
      description: "For serious founders",
      credits: "10 analyses",
      features: [
        "Full Bayesian analysis",
        "All marketing analyses",
        "4 persona profiles",
        "35-page validation report",
        "Pitch deck slides",
        "Excel financial model",
        "Priority support"
      ],
      cta: "Get Pro",
      popular: true
    },
    {
      name: "Enterprise",
      price: "$999",
      period: "/month",
      description: "For teams & agencies",
      credits: "Unlimited",
      features: [
        "Everything in Pro",
        "Custom priors (your data)",
        "API access",
        "White-label reports",
        "Team collaboration",
        "Dedicated success manager"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Bayesian Market Science Platform
              </span>
            </motion.div>

            <motion.h1 
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
            >
              Validate your product with{" "}
              <span className="gradient-text">mathematical confidence</span>
            </motion.h1>

            <motion.p 
              variants={fadeInUp}
              className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
            >
              Replace expensive market research ($5K-$15K, 2-4 weeks) with Bayesian-anchored 
              analysis ($299, 5 minutes) that investors actually trust.
            </motion.p>

            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button variant="hero" size="xl" asChild>
                <Link to="/auth?mode=signup">
                  Start Free Analysis
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <a href="#how-it-works">See How It Works</a>
              </Button>
            </motion.div>

            <motion.div 
              variants={fadeInUp}
              className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green" />
                Results in 30 seconds
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green" />
                GCC/MENA focused
              </span>
            </motion.div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-16 max-w-5xl mx-auto"
          >
            <div className="relative rounded-2xl border bg-card shadow-xl overflow-hidden">
              {/* Mock Dashboard Preview */}
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <div className="w-3 h-3 rounded-full bg-orange" />
                  <div className="w-3 h-3 rounded-full bg-green" />
                </div>
                
                <div className="grid sm:grid-cols-3 gap-4 mb-6">
                  <div className="metric-card">
                    <p className="text-sm text-muted-foreground mb-1">Demand Probability</p>
                    <p className="text-3xl font-bold gradient-text">67%</p>
                    <p className="text-xs text-muted-foreground mt-1">CI: 58-76%</p>
                  </div>
                  <div className="metric-card">
                    <p className="text-sm text-muted-foreground mb-1">PSM Score</p>
                    <p className="text-3xl font-bold text-primary">78/100</p>
                    <p className="text-xs text-green mt-1">Very Strong</p>
                  </div>
                  <div className="metric-card">
                    <p className="text-sm text-muted-foreground mb-1">Optimal Price</p>
                    <p className="text-3xl font-bold text-foreground">320 SAR</p>
                    <p className="text-xs text-muted-foreground mt-1">+7% vs target</p>
                  </div>
                </div>

                <div className="h-48 bg-muted/50 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Interactive demand curve visualization</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Complete market validation in one platform
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to validate your product idea and create investor-grade materials
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="metric-card group"
              >
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-4 group-hover:shadow-glow transition-shadow">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              From idea to validation in 5 minutes
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our wizard guides you through the process. No market research expertise required.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="relative"
                >
                  <div className="text-6xl font-bold gradient-text opacity-20 mb-4">
                    {step.number}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                  
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 right-0 w-full h-px bg-border translate-x-1/2" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">Mathematically defensible</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <span className="text-sm font-medium">30-second analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">GCC/MENA market data</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span className="text-sm font-medium">Investor-ready reports</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free, upgrade when you need more. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-2xl border p-6 ${
                  tier.popular 
                    ? "border-primary shadow-glow bg-card" 
                    : "bg-card hover:border-primary/50 transition-colors"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="gradient-bg text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-semibold text-lg">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground">{tier.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground">{tier.period}</span>
                  <p className="text-sm text-muted-foreground mt-1">{tier.credits}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={tier.popular ? "gradient" : "outline"} 
                  className="w-full"
                  asChild
                >
                  <Link to="/auth?mode=signup">{tier.cta}</Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to validate your idea?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join founders who use Bayesian market science to make data-driven product decisions.
            </p>
            <Button variant="hero" size="xl" asChild>
              <Link to="/auth?mode=signup">
                Start Your Free Analysis
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
