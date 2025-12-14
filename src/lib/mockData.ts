// Mock data for Bayesian market validation

export interface DemandCurvePoint {
  price: number;
  demand: number;
  psmScore: number;
}

export interface RegionalData {
  demand: number;
  optimalPrice: number;
  insight: string;
}

export interface FeatureRanking {
  rank: number;
  feature: string;
  utility: number;
  gap: string;
}

export interface KanoItem {
  feature: string;
  demandWithout: number;
  impact: number;
  reasoning: string;
}

export interface Competitor {
  name: string;
  status: number;
  trust: number;
  upgrade: number;
  overall: number;
  gap: number;
}

export interface Persona {
  name: string;
  segment: string;
  size: number;
  demographics: {
    age: string;
    income: string;
    location: string;
  };
  psychographics: {
    quote: string;
    values: string[];
  };
  bayesianProfile: {
    demandProbability: number;
    optimalPrice: number;
    featurePreferences: Record<string, number>;
    identityDrivers: Record<string, number>;
  };
  recommendations: {
    messaging: string;
    channels: string[];
    creativeAngle: string;
  };
}

export interface TestResults {
  id: string;
  name: string;
  status: 'DRAFT' | 'CONFIGURING' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  productName: string;
  productDescription: string;
  category: string;
  targetMarket: string[];
  priceMin: number;
  priceTarget: number;
  priceMax: number;
  features: string[];
  bayesianResults: {
    demandProbability: number;
    psmScore: number;
    optimalPrice: number;
    confidenceInterval: [number, number];
    demandCurve: DemandCurvePoint[];
    regionalBreakdown: Record<string, RegionalData>;
    featureWeights: Record<string, number>;
  };
  maxDiffResults: {
    mostImportant: {
      feature: string;
      utilityScore: number;
      significance: string;
    };
    featureRanking: FeatureRanking[];
    insight: string;
  };
  kanoResults: {
    mustHave: KanoItem[];
    performance: KanoItem[];
    delighters: KanoItem[];
    indifferent: KanoItem[];
  };
  vanWestendorp: {
    tooExpensive: number;
    expensive: number;
    bargain: number;
    tooCheap: number;
    optimalPricePoint: number;
    acceptableRange: [number, number];
    reasoning: string;
  };
  brandAnalysis: {
    yourPosition: {
      status: number;
      trust: number;
      upgrade: number;
      overall: number;
    };
    competitors: Competitor[];
    positioning: string;
    vulnerabilities: string[];
    opportunities: string[];
  };
  personas: Persona[];
}

export const generateMockResults = (input: {
  productName: string;
  productDescription: string;
  category: string;
  targetMarket: string[];
  priceMin: number;
  priceTarget: number;
  priceMax: number;
  features: string[];
}): TestResults => {
  const { productName, productDescription, category, targetMarket, priceMin, priceTarget, priceMax, features } = input;
  
  // Generate realistic demand curve
  const demandCurve: DemandCurvePoint[] = [];
  const priceRange = priceMax - priceMin;
  const steps = 7;
  
  for (let i = 0; i <= steps; i++) {
    const price = priceMin + (priceRange * i / steps);
    const demand = Math.max(0.2, 0.85 - (i * 0.09) + (Math.random() * 0.05 - 0.025));
    const psmScore = Math.round(78 - Math.abs(price - priceTarget) * 0.1 + (Math.random() * 10 - 5));
    demandCurve.push({ price: Math.round(price), demand: Math.round(demand * 100) / 100, psmScore });
  }

  const optimalPrice = Math.round(priceTarget * 1.07);
  const demandProbability = 0.67;
  const psmScore = 78;

  // Generate feature weights
  const featureWeights: Record<string, number> = {};
  const totalWeight = 1;
  let remaining = totalWeight;
  features.forEach((f, i) => {
    if (i === features.length - 1) {
      featureWeights[f] = Math.round(remaining * 100) / 100;
    } else {
      const weight = remaining * (0.25 + Math.random() * 0.15);
      featureWeights[f] = Math.round(weight * 100) / 100;
      remaining -= weight;
    }
  });

  // Regional breakdown
  const regionalBreakdown: Record<string, RegionalData> = {};
  targetMarket.forEach((region, i) => {
    regionalBreakdown[region] = {
      demand: Math.round((demandProbability + (i === 0 ? 0.04 : -0.05)) * 100) / 100,
      optimalPrice: Math.round(optimalPrice * (i === 0 ? 1.06 : 0.91)),
      insight: i === 0 ? "Higher willingness to pay premium" : "Price-sensitive, prefers value"
    };
  });

  // MaxDiff results
  const featureRanking: FeatureRanking[] = features.map((f, i) => ({
    rank: i + 1,
    feature: f,
    utility: Math.round(30 - i * 4 + Math.random() * 2),
    gap: i === features.length - 1 ? "baseline" : `+${Math.round(2 + Math.random() * 3)} vs #${i + 2}`
  }));

  // Kano results
  const kanoResults = {
    mustHave: features.slice(0, 2).map(f => ({
      feature: f,
      demandWithout: Math.round((demandProbability - 0.3 - Math.random() * 0.1) * 100) / 100,
      impact: -Math.round(25 + Math.random() * 15),
      reasoning: "Critical feature - without it, demand collapses significantly"
    })),
    performance: features.slice(2, 3).map(f => ({
      feature: f,
      demandWithout: Math.round((demandProbability - 0.12) * 100) / 100,
      impact: -13,
      reasoning: "More is better - linear impact on demand"
    })),
    delighters: features.slice(3, 4).map(f => ({
      feature: f,
      demandWithout: Math.round((demandProbability - 0.04) * 100) / 100,
      impact: -4,
      reasoning: "Nice-to-have, doesn't hurt if missing"
    })),
    indifferent: features.slice(4).map(f => ({
      feature: f,
      demandWithout: Math.round((demandProbability - 0.01) * 100) / 100,
      impact: -1,
      reasoning: "Not a primary decision driver"
    }))
  };

  // Van Westendorp
  const vanWestendorp = {
    tooExpensive: Math.round(priceMax * 0.9),
    expensive: Math.round(priceTarget * 1.17),
    bargain: Math.round(priceTarget * 0.83),
    tooCheap: Math.round(priceMin * 0.9),
    optimalPricePoint: optimalPrice,
    acceptableRange: [Math.round(priceTarget * 0.93), Math.round(priceTarget * 1.2)] as [number, number],
    reasoning: `Sweet spot at ${optimalPrice} SAR maximizes both demand (${Math.round(demandProbability * 100)}%) and confidence (PSM ${psmScore})`
  };

  // Brand analysis
  const brandAnalysis = {
    yourPosition: {
      status: 62,
      trust: 78,
      upgrade: 54,
      overall: 67
    },
    competitors: [
      { name: "Nature's Bounty", status: 35, trust: 52, upgrade: 30, overall: 41, gap: -26 },
      { name: "GNC", status: 58, trust: 61, upgrade: 48, overall: 57, gap: -10 },
      { name: "Solgar", status: 72, trust: 68, upgrade: 52, overall: 66, gap: 1 }
    ],
    positioning: "Premium-but-accessible tier. Compete with Solgar on trust and value.",
    vulnerabilities: [
      "Status signal weaker than Solgar (62 vs 72) - need premium cues",
      "Trust advantage fragile - competitors can copy certifications"
    ],
    opportunities: [
      "Trust signal (78) is strongest asset - emphasize heavily",
      "Large gap vs mass market (Nature's Bounty) - clear differentiation",
      "DTC model = 40% cost advantage over retail"
    ]
  };

  // Personas
  const personas: Persona[] = [
    {
      name: "The Wellness Executive",
      segment: "high_trust_seeker",
      size: 0.32,
      demographics: {
        age: "35-48",
        income: "25K+ SAR/month",
        location: "Riyadh, Jeddah"
      },
      psychographics: {
        quote: "I don't have time to be sick. Show me it's legitimate.",
        values: ["Performance", "Quality", "Trust"]
      },
      bayesianProfile: {
        demandProbability: 0.71,
        optimalPrice: 380,
        featurePreferences: {
          [features[0]]: 0.35,
          [features[1]]: 0.30,
          [features[2]]: 0.22
        },
        identityDrivers: {
          trust: 0.65,
          status: 0.20,
          upgrade: 0.15
        }
      },
      recommendations: {
        messaging: "Lead with certifications and science",
        channels: ["LinkedIn", "Doctor partnerships", "Premium gyms"],
        creativeAngle: "Premium wellness investment"
      }
    },
    {
      name: "The Health-Conscious Parent",
      segment: "family_protector",
      size: 0.28,
      demographics: {
        age: "30-42",
        income: "15-25K SAR/month",
        location: "Suburban KSA/UAE"
      },
      psychographics: {
        quote: "If it's good enough for my kids, it needs to be the best.",
        values: ["Safety", "Natural", "Family health"]
      },
      bayesianProfile: {
        demandProbability: 0.65,
        optimalPrice: 290,
        featurePreferences: {
          [features[2] || features[0]]: 0.40,
          [features[0]]: 0.30,
          [features[3] || features[1]]: 0.20
        },
        identityDrivers: {
          trust: 0.55,
          upgrade: 0.30,
          status: 0.15
        }
      },
      recommendations: {
        messaging: "Safe, natural, family-approved",
        channels: ["Instagram", "Mom blogs", "Family health influencers"],
        creativeAngle: "Protecting what matters most"
      }
    },
    {
      name: "The Fitness Enthusiast",
      segment: "performance_seeker",
      size: 0.25,
      demographics: {
        age: "25-38",
        income: "12-20K SAR/month",
        location: "Urban centers"
      },
      psychographics: {
        quote: "I track everything. Show me the data.",
        values: ["Results", "Optimization", "Science"]
      },
      bayesianProfile: {
        demandProbability: 0.69,
        optimalPrice: 320,
        featurePreferences: {
          [features[1] || features[0]]: 0.38,
          [features[0]]: 0.32,
          [features[2] || features[1]]: 0.20
        },
        identityDrivers: {
          upgrade: 0.45,
          trust: 0.35,
          status: 0.20
        }
      },
      recommendations: {
        messaging: "Scientifically optimized performance",
        channels: ["YouTube fitness", "Gym partnerships", "Sports events"],
        creativeAngle: "Your competitive edge"
      }
    },
    {
      name: "The Budget Optimizer",
      segment: "value_seeker",
      size: 0.15,
      demographics: {
        age: "28-45",
        income: "8-15K SAR/month",
        location: "Mixed urban/suburban"
      },
      psychographics: {
        quote: "Quality doesn't have to break the bank.",
        values: ["Value", "Smart spending", "Research"]
      },
      bayesianProfile: {
        demandProbability: 0.58,
        optimalPrice: 250,
        featurePreferences: {
          [features[0]]: 0.35,
          [features[2] || features[1]]: 0.30,
          [features[1] || features[0]]: 0.25
        },
        identityDrivers: {
          upgrade: 0.50,
          trust: 0.35,
          status: 0.15
        }
      },
      recommendations: {
        messaging: "Premium quality, smart pricing",
        channels: ["Comparison sites", "Deal forums", "WhatsApp groups"],
        creativeAngle: "Smart choice, not compromise"
      }
    }
  ];

  return {
    id: `test_${Date.now()}`,
    name: productName,
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
    productName,
    productDescription,
    category,
    targetMarket,
    priceMin,
    priceTarget,
    priceMax,
    features,
    bayesianResults: {
      demandProbability,
      psmScore,
      optimalPrice,
      confidenceInterval: [0.58, 0.76],
      demandCurve,
      regionalBreakdown,
      featureWeights
    },
    maxDiffResults: {
      mostImportant: {
        feature: features[0],
        utilityScore: featureRanking[0].utility,
        significance: `Drives ${featureRanking[0].utility}% of purchase intent`
      },
      featureRanking,
      insight: `Top 3 features account for ${featureRanking.slice(0, 3).reduce((a, b) => a + b.utility, 0)}% of total utility.`
    },
    kanoResults,
    vanWestendorp,
    brandAnalysis,
    personas
  };
};

// Sample completed test for demo
export const sampleTest: TestResults = generateMockResults({
  productName: "Turmeric Curcumin Supplement",
  productDescription: "Premium 95% curcumin extract with BioPerine for enhanced absorption. Third-party tested, vegan capsules, non-GMO.",
  category: "HEALTH_SUPPLEMENTS",
  targetMarket: ["KSA", "UAE"],
  priceMin: 200,
  priceTarget: 300,
  priceMax: 500,
  features: [
    "95% curcumin content",
    "BioPerine for absorption",
    "Third-party tested",
    "Vegan capsules",
    "Non-GMO"
  ]
});

export const categories = [
  { value: "HEALTH_SUPPLEMENTS", label: "💊 Health Supplements", icon: "💊" },
  { value: "BEVERAGES", label: "🥤 Beverages", icon: "🥤" },
  { value: "SNACKS_FOOD", label: "🍿 Snacks & Food", icon: "🍿" },
  { value: "BEAUTY_COSMETICS", label: "💄 Beauty & Cosmetics", icon: "💄" },
  { value: "TECH_GADGETS", label: "📱 Tech & Gadgets", icon: "📱" },
  { value: "FASHION_APPAREL", label: "👗 Fashion & Apparel", icon: "👗" }
];

export const regions = [
  { value: "KSA", label: "🇸🇦 Saudi Arabia (KSA)", flag: "🇸🇦" },
  { value: "UAE", label: "🇦🇪 United Arab Emirates (UAE)", flag: "🇦🇪" },
  { value: "QAT", label: "🇶🇦 Qatar", flag: "🇶🇦" },
  { value: "MENA", label: "🌍 Other MENA", flag: "🌍" }
];

export const loadingMessages = [
  "Running Bayesian inference...",
  "Calculating demand probabilities...",
  "Analyzing 2,000+ regional data points...",
  "Generating MaxDiff feature rankings...",
  "Building Kano model categories...",
  "Computing Van Westendorp price sensitivity...",
  "Creating persona segments...",
  "Building your validation report..."
];
