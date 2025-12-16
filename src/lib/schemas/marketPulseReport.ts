/**
 * MarketPulse Report Schema - Canonical JSON Schema
 * Defines the structure for boutique-grade GCC market research reports
 */

import { z } from "zod";

// ============ FOUNDER BRIEF SCHEMA ============
export const FounderBriefSchema = z.object({
  // Project Basics
  projectBasics: z.object({
    productName: z.string(),
    conceptName: z.string().optional(),
    category: z.string(),
    productType: z.enum(["PHYSICAL", "DIGITAL", "HYBRID"]),
    businessModel: z.enum(["B2C", "B2B", "B2B2C"]),
    targetCountries: z.array(z.string()),
    nonGCCSpillover: z.array(z.string()).optional(),
  }),

  // Problem & Hypothesis
  problemHypothesis: z.object({
    problemStatement: z.string(),
    whyNow: z.string(),
    hypotheses: z.array(z.object({
      statement: z.string(),
      metric: z.string().optional(),
      targetValue: z.string().optional(),
    })),
  }),

  // Market Definition
  marketDefinition: z.object({
    targetAudienceSegments: z.array(z.string()),
    primaryUseCases: z.array(z.string()),
    substitutes: z.array(z.object({
      name: z.string(),
      type: z.enum(["PRODUCT", "SERVICE", "BEHAVIOR"]),
      description: z.string(),
    })),
    tamEstimate: z.string().optional(),
    samEstimate: z.string().optional(),
    somEstimate: z.string().optional(),
  }),

  // Customer & Segmentation Hints
  customerSegmentation: z.object({
    currentCustomers: z.string().optional(),
    icpDescription: z.string(),
    linkedinProfiles: z.array(z.string()).optional(),
    knownBehavioralSegments: z.array(z.string()).optional(),
    personaHints: z.array(z.object({
      name: z.string(),
      description: z.string(),
    })).optional(),
  }),

  // Product & Offer
  productOffer: z.object({
    features: z.array(z.string()),
    benefits: z.array(z.string()),
    differentiation: z.string(),
    pricingModel: z.string(),
    priceRange: z.object({
      min: z.number(),
      target: z.number(),
      max: z.number(),
      currency: z.string().default("SAR"),
    }),
    upsellsCrossSells: z.array(z.string()).optional(),
    regulatoryStatus: z.object({
      sfda: z.boolean().optional(),
      halal: z.boolean().optional(),
      other: z.array(z.string()).optional(),
    }).optional(),
  }),

  // Go-to-Market Context
  gtmContext: z.object({
    existingChannels: z.array(z.string()).optional(),
    cacEstimate: z.number().optional(),
    ltvEstimate: z.number().optional(),
    salesCycle: z.string().optional(),
    partnerships: z.array(z.object({
      type: z.string(),
      name: z.string(),
      status: z.enum(["ACTIVE", "IN_CONVERSATION", "POTENTIAL"]),
    })).optional(),
  }),

  // Constraints & Goals
  constraintsGoals: z.object({
    gtmBudgetBand: z.enum(["<50K_SAR", "50K-200K_SAR", "200K-500K_SAR", ">500K_SAR"]).optional(),
    launchHorizon: z.enum(["<3_MONTHS", "3-6_MONTHS", "6-12_MONTHS", ">12_MONTHS"]).optional(),
    riskAppetite: z.enum(["CONSERVATIVE", "MODERATE", "AGGRESSIVE"]).optional(),
    mustAvoidChannels: z.array(z.string()).optional(),
    keyDecisions: z.array(z.string()),
  }),
});

// ============ BAYESIAN SUMMARY SCHEMA ============
export const BayesianSummarySchema = z.object({
  demandProbability: z.number().min(0).max(1),
  psmScore: z.number().min(0).max(100),
  optimalPrice: z.number(),
  elasticity: z.enum(["HIGH", "MEDIUM", "LOW"]),
  confidenceInterval: z.tuple([z.number(), z.number()]),
  recommendation: z.enum(["GREENLIGHT", "TEST_FURTHER", "REVISE_STRATEGY"]),
  recommendationReasoning: z.string(),
  
  demandCurve: z.array(z.object({
    price: z.number(),
    demand: z.number(),
    label: z.enum(["TOO_CHEAP", "BARGAIN", "OPTIMAL", "EXPENSIVE", "TOO_EXPENSIVE"]).optional(),
  })),
  
  segmentPriors: z.array(z.object({
    segment: z.string(),
    demand: z.number(),
    wtp: z.number(),
    size: z.number(),
  })),
  
  sensitivityDrivers: z.array(z.object({
    variable: z.string(),
    impact: z.enum(["HIGH", "MEDIUM", "LOW"]),
    direction: z.enum(["POSITIVE", "NEGATIVE"]),
    explanation: z.string(),
  })),
  
  keyInsights: z.array(z.string()).min(2).max(5),
});

// ============ PERSONA SCHEMA ============
export const PersonaSchema = z.object({
  name: z.string(),
  tagline: z.string(),
  segment: z.string(),
  size: z.number().min(0).max(1),
  priority: z.enum(["PRIMARY", "SECONDARY", "TERTIARY"]),
  
  demographics: z.object({
    age: z.string(),
    income: z.string(),
    location: z.string(),
    occupation: z.string(),
    familyStatus: z.string(),
    education: z.string(),
  }),
  
  psychographics: z.object({
    quote: z.string(),
    values: z.array(z.object({
      value: z.string(),
      rank: z.number(),
      explanation: z.string(),
    })),
    dayInLife: z.string(),
    mediaConsumption: z.array(z.string()),
    socialCircle: z.string(),
  }),
  
  jobsToBeDone: z.object({
    coreJob: z.string(),
    triggerMoment: z.string(),
    currentAlternative: z.string(),
    successCriteria: z.string(),
    obstacles: z.array(z.object({
      obstacle: z.string(),
      severity: z.enum(["HIGH", "MEDIUM", "LOW"]),
      description: z.string(),
    })),
  }),
  
  bayesianProfile: z.object({
    demandProbability: z.number(),
    optimalPrice: z.number(),
    willingnessToPayRange: z.tuple([z.number(), z.number()]),
    priceElasticity: z.enum(["HIGH", "MEDIUM", "LOW"]),
    purchaseFrequency: z.string(),
    featurePreferences: z.record(z.number()),
    identityDrivers: z.object({
      status: z.number(),
      trust: z.number(),
      upgrade: z.number(),
    }),
  }),
  
  marketingStrategy: z.object({
    coreMessage: z.string(),
    proofPoints: z.array(z.string()),
    channelStrategy: z.array(z.object({
      channel: z.string(),
      budgetPercent: z.number(),
      cac: z.number(),
      rationale: z.string(),
      tactics: z.array(z.string()),
    })),
    contentFormats: z.array(z.string()),
    objectionHandling: z.array(z.object({
      objection: z.string(),
      response: z.string(),
    })),
  }),
  
  lifetimeValue: z.object({
    year1Revenue: z.number(),
    threeYearLTV: z.number(),
    cac: z.number(),
    ltvCacRatio: z.number(),
    crossSellOpportunities: z.array(z.string()),
    retentionRiskFactors: z.array(z.string()),
  }),
});

// ============ COMPETITION SCHEMA ============
export const CompetitorSchema = z.object({
  name: z.string(),
  products: z.array(z.string()),
  positioning: z.enum(["PREMIUM", "MID_MARKET", "VALUE", "NICHE"]),
  priceRange: z.object({
    min: z.number(),
    max: z.number(),
    currency: z.string().default("SAR"),
  }),
  distribution: z.array(z.string()),
  marketShare: z.string().optional(),
  strengths: z.array(z.object({
    strength: z.string(),
    evidence: z.string(),
  })),
  weaknesses: z.array(z.object({
    weakness: z.string(),
    evidence: z.string(),
  })),
  recentMoves: z.array(z.object({
    date: z.string(),
    move: z.string(),
    impact: z.string(),
  })),
  brandScores: z.object({
    status: z.number(),
    trust: z.number(),
    upgrade: z.number(),
    overall: z.number(),
    justification: z.string(),
  }),
  threatLevel: z.enum(["HIGH", "MEDIUM", "LOW"]),
  threatReasoning: z.string(),
});

export const CompetitionBlockSchema = z.object({
  competitors: z.array(CompetitorSchema).min(5).max(7),
  
  portersFiveForces: z.object({
    newEntrantsThreat: z.object({
      level: z.enum(["HIGH", "MEDIUM", "LOW"]),
      analysis: z.string(),
    }),
    supplierPower: z.object({
      level: z.enum(["HIGH", "MEDIUM", "LOW"]),
      analysis: z.string(),
    }),
    buyerPower: z.object({
      level: z.enum(["HIGH", "MEDIUM", "LOW"]),
      analysis: z.string(),
    }),
    substituteThreat: z.object({
      level: z.enum(["HIGH", "MEDIUM", "LOW"]),
      analysis: z.string(),
    }),
    competitiveRivalry: z.object({
      level: z.enum(["HIGH", "MEDIUM", "LOW"]),
      analysis: z.string(),
    }),
  }),
  
  blueOceanStrategy: z.object({
    eliminate: z.array(z.object({ factor: z.string(), rationale: z.string() })),
    reduce: z.array(z.object({ factor: z.string(), rationale: z.string() })),
    raise: z.array(z.object({ factor: z.string(), rationale: z.string() })),
    create: z.array(z.object({ factor: z.string(), rationale: z.string() })),
  }),
  
  positioningStatement: z.string(),
  
  yourPosition: z.object({
    status: z.number(),
    trust: z.number(),
    upgrade: z.number(),
    overall: z.number(),
  }),
  
  vulnerabilities: z.array(z.object({
    vulnerability: z.string(),
    risk: z.enum(["HIGH", "MEDIUM", "LOW"]),
    likelihood: z.number(),
    impact: z.string(),
    mitigation: z.string(),
  })),
  
  opportunities: z.array(z.object({
    opportunity: z.string(),
    sizing: z.string(),
    requirements: z.string(),
    timeline: z.string(),
  })),
});

// ============ MARKET BLOCK SCHEMA ============
export const MarketBlockSchema = z.object({
  marketSize: z.object({
    tam: z.object({ value: z.string(), source: z.string(), methodology: z.string() }),
    sam: z.object({ value: z.string(), source: z.string(), methodology: z.string() }),
    som: z.object({ value: z.string(), source: z.string(), methodology: z.string() }),
  }),
  
  growth: z.object({
    historicalCagr: z.string(),
    projectedCagr: z.string(),
    drivers: z.array(z.object({
      driver: z.string(),
      impact: z.enum(["HIGH", "MEDIUM", "LOW"]),
      timeline: z.string(),
    })),
  }),
  
  barriers: z.array(z.object({
    barrier: z.string(),
    severity: z.enum(["HIGH", "MEDIUM", "LOW"]),
    mitigation: z.string(),
  })),
  
  substitutes: z.array(z.object({
    substitute: z.string(),
    type: z.string(),
    threatLevel: z.enum(["HIGH", "MEDIUM", "LOW"]),
    differentiation: z.string(),
  })),
  
  regionalBreakdown: z.record(z.object({
    demand: z.number(),
    optimalPrice: z.number(),
    marketSize: z.string(),
    insight: z.string(),
    culturalFactors: z.array(z.string()),
    regulatoryFactors: z.array(z.string()),
  })),
  
  trends: z.array(z.object({
    trend: z.string(),
    impact: z.string(),
    timeline: z.string(),
    actionRequired: z.string(),
  })),
});

// ============ PRODUCT STRATEGY SCHEMA ============
export const ProductBlockSchema = z.object({
  featureStrategy: z.object({
    mvpRecommendation: z.object({
      features: z.array(z.string()),
      rationale: z.string(),
      timeToMarket: z.string(),
      investmentRequired: z.string(),
    }),
    
    featureMatrix: z.object({
      mustBuild: z.array(z.object({ feature: z.string(), rationale: z.string() })),
      shouldBuild: z.array(z.object({ feature: z.string(), rationale: z.string() })),
      couldBuild: z.array(z.object({ feature: z.string(), rationale: z.string() })),
      skip: z.array(z.object({ feature: z.string(), rationale: z.string() })),
    }),
    
    featureAnalysis: z.array(z.object({
      feature: z.string(),
      utilityScore: z.number(),
      kanoCategory: z.enum(["MUST_HAVE", "PERFORMANCE", "DELIGHTER", "INDIFFERENT"]),
      kanoReasoning: z.string(),
      competitiveParity: z.object({
        status: z.enum(["AHEAD", "PARITY", "BEHIND"]),
        details: z.string(),
      }),
      costToDeliver: z.object({
        level: z.enum(["HIGH", "MEDIUM", "LOW"]),
        specifics: z.string(),
      }),
      marginImpact: z.string(),
      marketingAngle: z.string(),
      strategicImportance: z.object({
        score: z.number(),
        reasoning: z.string(),
      }),
    })),
    
    personaFeatureHeatmap: z.record(z.record(z.number())),
    
    roadmap: z.array(z.object({
      phase: z.string(),
      timeline: z.string(),
      features: z.array(z.string()),
      rationale: z.string(),
      expectedImpact: z.string(),
    })),
  }),
  
  pricingStrategy: z.object({
    tiers: z.array(z.object({
      name: z.string(),
      price: z.number(),
      features: z.array(z.string()),
      margin: z.number(),
      positioning: z.string(),
      targetPersona: z.string(),
      volumeExpectation: z.string(),
      rationale: z.string(),
    })),
    
    vanWestendorp: z.object({
      tooCheap: z.object({ price: z.number(), reasoning: z.string() }),
      bargain: z.object({ price: z.number(), reasoning: z.string() }),
      optimal: z.object({ price: z.number(), reasoning: z.string() }),
      expensive: z.object({ price: z.number(), reasoning: z.string() }),
      tooExpensive: z.object({ price: z.number(), reasoning: z.string() }),
      acceptableRange: z.tuple([z.number(), z.number()]),
      explanation: z.string(),
    }),
    
    personaPriceSensitivity: z.array(z.object({
      persona: z.string(),
      fairValue: z.number(),
      safeDeviationBands: z.tuple([z.number(), z.number()]),
      cliffPoints: z.object({ low: z.number(), high: z.number() }),
      elasticityCalculation: z.string(),
    })),
    
    regionalPricing: z.object({
      ksaPrice: z.number(),
      ksaRationale: z.string(),
      uaePrice: z.number(),
      uaeRationale: z.string(),
      unifiedRecommendation: z.boolean(),
      unifiedReasoning: z.string(),
    }),
    
    psychologicalPricing: z.object({
      anchoringStrategy: z.string(),
      charmPricing: z.object({
        recommended: z.boolean(),
        rationale: z.string(),
      }),
      bundling: z.array(z.object({
        bundle: z.string(),
        discount: z.number(),
        rationale: z.string(),
      })),
      promotional: z.object({
        when: z.string(),
        how: z.string(),
        howMuch: z.number(),
        reasoning: z.string(),
      }),
    }),
  }),
  
  brandStrategy: z.object({
    positioningStatement: z.string(),
    toneOfVoice: z.string(),
    messagingHierarchy: z.array(z.object({
      level: z.enum(["PRIMARY", "SECONDARY", "TERTIARY"]),
      message: z.string(),
      audience: z.string(),
    })),
    swotTows: z.object({
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
      opportunities: z.array(z.string()),
      threats: z.array(z.string()),
      soStrategies: z.array(z.string()),
      woStrategies: z.array(z.string()),
      stStrategies: z.array(z.string()),
      wtStrategies: z.array(z.string()),
    }),
  }),
});

// ============ GO-TO-MARKET SCHEMA ============
export const GoToMarketBlockSchema = z.object({
  channelMix: z.object({
    budgetAssumption: z.number(),
    currency: z.string().default("SAR"),
    prioritizationRationale: z.string(),
    channels: z.array(z.object({
      channel: z.string(),
      budgetPercent: z.number(),
      budgetAmount: z.number(),
      rationale: z.string(),
      targetPersona: z.string(),
      expectedReach: z.string(),
      expectedImpressions: z.string(),
      expectedCAC: z.number(),
      conversionRate: z.number(),
      learningSpeed: z.enum(["FAST", "MEDIUM", "SLOW"]),
      kpis: z.array(z.string()),
      tactics: z.array(z.object({
        tactic: z.string(),
        description: z.string(),
        budget: z.number(),
        expectedOutcome: z.string(),
      })),
    })),
  }),
  
  launchRoadmap: z.object({
    preLaunch: z.object({
      timeline: z.string(),
      objective: z.string(),
      tactics: z.array(z.object({
        tactic: z.string(),
        description: z.string(),
        budget: z.number(),
        owner: z.string(),
        timeline: z.string(),
        expectedOutcome: z.string(),
      })),
      budgetTotal: z.number(),
      successMetrics: z.array(z.string()),
    }),
    launch: z.object({
      timeline: z.string(),
      objective: z.string(),
      tactics: z.array(z.object({
        tactic: z.string(),
        description: z.string(),
        budget: z.number(),
        owner: z.string(),
        timeline: z.string(),
        expectedOutcome: z.string(),
      })),
      budgetTotal: z.number(),
      successMetrics: z.array(z.string()),
    }),
    scale: z.object({
      timeline: z.string(),
      objective: z.string(),
      tactics: z.array(z.object({
        tactic: z.string(),
        description: z.string(),
        budget: z.number(),
        owner: z.string(),
        timeline: z.string(),
        expectedOutcome: z.string(),
      })),
      budgetTotal: z.number(),
      successMetrics: z.array(z.string()),
    }),
  }),
  
  acquisitionFunnel: z.object({
    stages: z.array(z.object({
      stage: z.enum(["AWARENESS", "CONSIDERATION", "DECISION", "PURCHASE", "RETENTION"]),
      mechanism: z.string(),
      expectedVolume: z.number(),
      conversionRate: z.number(),
      dropoffReasons: z.array(z.string()),
    })),
    optimizationPriorities: z.array(z.object({
      fix: z.string(),
      expectedImpact: z.string(),
      priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
    })),
  }),
  
  partnerships: z.object({
    distribution: z.array(z.object({
      partnerType: z.string(),
      specificTargets: z.array(z.string()),
      valueProposition: z.string(),
      economics: z.string(),
      requirements: z.string(),
      timeline: z.string(),
    })),
    strategic: z.array(z.object({
      partnerType: z.string(),
      specificTargets: z.array(z.string()),
      valueProposition: z.string(),
      economics: z.string(),
      requirements: z.string(),
      timeline: z.string(),
    })),
  }),
});

// ============ INVESTMENT THESIS SCHEMA ============
export const InvestmentBlockSchema = z.object({
  recommendation: z.enum(["PROCEED", "PROCEED_WITH_CAUTION", "RECONSIDER"]),
  confidenceLevel: z.enum(["HIGH", "MEDIUM", "LOW"]),
  reasoning: z.string(),
  
  scenarios: z.object({
    bull: z.object({
      label: z.string(),
      probability: z.number(),
      narrative: z.string(),
      assumptions: z.array(z.object({ assumption: z.string(), details: z.string() })),
      year1: z.object({
        customers: z.number(),
        revenue: z.number(),
        grossMargin: z.number(),
        cac: z.number(),
        ltv: z.number(),
        cashFlowStatus: z.string(),
      }),
      year3: z.object({
        customers: z.number(),
        revenue: z.number(),
        ebitdaMargin: z.number(),
        fundingNeeds: z.string(),
      }),
      valuation: z.object({
        method: z.string(),
        estimate: z.string(),
      }),
    }),
    base: z.object({
      label: z.string(),
      probability: z.number(),
      narrative: z.string(),
      assumptions: z.array(z.object({ assumption: z.string(), details: z.string() })),
      year1: z.object({
        customers: z.number(),
        revenue: z.number(),
        grossMargin: z.number(),
        cac: z.number(),
        ltv: z.number(),
        cashFlowStatus: z.string(),
      }),
      year3: z.object({
        customers: z.number(),
        revenue: z.number(),
        ebitdaMargin: z.number(),
        fundingNeeds: z.string(),
      }),
      valuation: z.object({
        method: z.string(),
        estimate: z.string(),
      }),
    }),
    bear: z.object({
      label: z.string(),
      probability: z.number(),
      narrative: z.string(),
      assumptions: z.array(z.object({ assumption: z.string(), details: z.string() })),
      year1: z.object({
        customers: z.number(),
        revenue: z.number(),
        grossMargin: z.number(),
        cac: z.number(),
        ltv: z.number(),
        cashFlowStatus: z.string(),
      }),
      year3: z.object({
        customers: z.number(),
        revenue: z.number(),
        ebitdaMargin: z.number(),
        fundingNeeds: z.string(),
      }),
      valuation: z.object({
        method: z.string(),
        estimate: z.string(),
      }),
    }),
  }),
  
  keySuccessFactors: z.array(z.object({
    factor: z.string(),
    criticality: z.enum(["HIGH", "MEDIUM", "LOW"]),
    currentStatus: z.string(),
    actionRequired: z.string(),
    metric: z.string(),
    owner: z.string(),
  })),
  
  dealBreakers: z.array(z.object({
    condition: z.string(),
    explanation: z.string(),
  })),
  
  financialProjections: z.object({
    customerAcquisition: z.object({
      month3: z.number(),
      month6: z.number(),
      month12: z.number(),
      year3: z.number(),
    }),
    revenue: z.object({
      month3: z.number(),
      month6: z.number(),
      month12: z.number(),
      year3: z.number(),
    }),
    unitEconomics: z.object({
      cac: z.number(),
      ltv: z.number(),
      ltvCacRatio: z.number(),
      paybackPeriodMonths: z.number(),
    }),
    cashFlow: z.object({
      monthlyBurnRate: z.number(),
      monthToCashFlowPositive: z.number(),
      totalFundingRequired: z.number(),
    }),
  }),
});

// ============ RISK BLOCK SCHEMA ============
export const RiskBlockSchema = z.object({
  marketRisks: z.array(z.object({
    risk: z.string(),
    description: z.string(),
    likelihood: z.enum(["HIGH", "MEDIUM", "LOW"]),
    likelihoodPercent: z.number(),
    financialImpact: z.number(),
    strategicImpact: z.string(),
    earlyWarningSignals: z.array(z.string()),
    mitigationActions: z.array(z.string()),
    owner: z.string(),
  })),
  
  competitiveRisks: z.object({
    copycat: z.object({
      likelihood: z.enum(["HIGH", "MEDIUM", "LOW"]),
      timeframe: z.string(),
      impact: z.string(),
      defensibilityBarriers: z.array(z.string()),
      responseStrategy: z.string(),
    }),
    priceWar: z.object({
      likelihood: z.enum(["HIGH", "MEDIUM", "LOW"]),
      timeframe: z.string(),
      impact: z.string(),
      defensibilityBarriers: z.array(z.string()),
      responseStrategy: z.string(),
    }),
  }),
  
  executionRisks: z.array(z.object({
    assumption: z.string(),
    downside: z.string(),
    breakpoint: z.string(),
    contingencies: z.array(z.string()),
  })),
});

// ============ METADATA SCHEMA ============
export const ReportMetadataSchema = z.object({
  generatedAt: z.string(),
  model: z.string(),
  citationsCount: z.number(),
  researchConfidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  perplexitySearchQueries: z.array(z.string()).optional(),
  dataFreshness: z.string().optional(),
});

// ============ MASTER REPORT SCHEMA ============
export const MarketPulseReportSchema = z.object({
  testId: z.string(),
  founderBrief: FounderBriefSchema,
  bayesianSummary: BayesianSummarySchema,
  personas: z.array(PersonaSchema).min(3).max(5),
  competition: CompetitionBlockSchema,
  market: MarketBlockSchema,
  productStrategy: ProductBlockSchema,
  goToMarket: GoToMarketBlockSchema,
  investmentThesis: InvestmentBlockSchema,
  risks: RiskBlockSchema,
  metadata: ReportMetadataSchema,
});

// Type exports
export type FounderBrief = z.infer<typeof FounderBriefSchema>;
export type BayesianSummary = z.infer<typeof BayesianSummarySchema>;
export type Persona = z.infer<typeof PersonaSchema>;
export type Competitor = z.infer<typeof CompetitorSchema>;
export type CompetitionBlock = z.infer<typeof CompetitionBlockSchema>;
export type MarketBlock = z.infer<typeof MarketBlockSchema>;
export type ProductBlock = z.infer<typeof ProductBlockSchema>;
export type GoToMarketBlock = z.infer<typeof GoToMarketBlockSchema>;
export type InvestmentBlock = z.infer<typeof InvestmentBlockSchema>;
export type RiskBlock = z.infer<typeof RiskBlockSchema>;
export type ReportMetadata = z.infer<typeof ReportMetadataSchema>;
export type MarketPulseReport = z.infer<typeof MarketPulseReportSchema>;

// Validation helper
export function validateReport(data: unknown): { valid: boolean; error?: string; data?: MarketPulseReport } {
  const result = MarketPulseReportSchema.safeParse(data);
  if (result.success) {
    return { valid: true, data: result.data };
  }
  return { valid: false, error: result.error.message };
}
