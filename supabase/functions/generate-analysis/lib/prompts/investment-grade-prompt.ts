/**
 * Investment-Grade Marketing Intelligence Prompt
 * McKinsey-quality analysis for GCC/MENA markets
 */

interface PromptInputs {
  productName: string;
  category: string;
  description: string;
  features: string[];
  priceMin: number;
  priceTarget: number;
  priceMax: number;
  regions: Record<string, number>;
  demandProbability: number;
  psmScore: number;
  optimalPrice: number;
  confidenceInterval: [number, number];
  demandCurve: Array<{ price: number; demand: number; psmScore: number }>;
  featureWeights: Record<string, number>;
  identitySignals: { status: number; trust: number; upgrade: number };
  regionalBreakdown: Record<string, { demand: number; optimalPrice: number; psmScore: number }>;
}

export function buildInvestmentGradePrompt(inputs: PromptInputs): string {
  const {
    productName,
    category,
    description,
    features,
    priceMin,
    priceTarget,
    priceMax,
    regions,
    demandProbability,
    psmScore,
    optimalPrice,
    confidenceInterval,
    demandCurve,
    featureWeights,
    identitySignals,
    regionalBreakdown,
  } = inputs;

  const demandCurveLines = demandCurve
    .map((p) => `  ${p.price} SAR → ${(p.demand * 100).toFixed(0)}% demand (PSM: ${p.psmScore})`)
    .join("\n");

  const featureWeightLines = Object.entries(featureWeights)
    .sort(([, a], [, b]) => b - a)
    .map(([feature, weight]) => `  ${feature}: ${(weight * 100).toFixed(1)}% of total utility`)
    .join("\n");

  const regionalLines = Object.entries(regionalBreakdown || {})
    .map(
      ([region, data]) =>
        `  ${region}: ${(data.demand * 100).toFixed(0)}% demand, ${data.optimalPrice} SAR optimal, PSM ${data.psmScore}/100`
    )
    .join("\n");

  const psmInterpretation =
    psmScore > 75
      ? "HIGH confidence - strong prior alignment"
      : psmScore > 60
        ? "MEDIUM confidence - moderate uncertainty"
        : "LOW confidence - high uncertainty, needs validation";

  return `CRITICAL SYSTEM DIRECTIVE: INVESTMENT-GRADE MARKET INTELLIGENCE GENERATION

You are a senior partner at McKinsey & Company with 20 years of experience in GCC/MENA markets, specializing in consumer brands, B2B SaaS, and market entry strategy. You have advised sovereign wealth funds on $B+ investments and helped 100+ companies launch in the region.

Your client is considering a significant investment/launch and has paid $50,000 for this analysis. The deliverable will be presented to C-suite executives, board members, and institutional investors. Shallow, generic, or hardcoded insights will result in deal failure.

---

## 🎯 ABSOLUTE REQUIREMENTS (NON-NEGOTIABLE):

### ❌ FORBIDDEN BEHAVIORS:
1. **NO generic competitors** ("Competitor A", "Competitor B", "Leading Brand") - Research and name REAL companies in this category
2. **NO template phrases** ("growing market", "digital transformation") - Every insight must be specific, quantified, and tied to THIS product
3. **NO invented statistics** - Use ONLY the Bayesian results provided
4. **NO generic personas** ("Young Professional", "Health Conscious Consumer") - Create deeply specific humans with names, ages, exact income, exact pain points
5. **NO vague recommendations** ("leverage social media") - Every recommendation must include: WHO, WHAT, WHERE, WHEN, HOW MUCH, EXPECTED OUTCOME
6. **NO contradicting the Bayesian math** - PSM score of 45 means MEDIUM confidence (not HIGH)

### ✅ REQUIRED BEHAVIORS:
1. **RESEARCH-BACKED**: For competitors, reference specific products, prices, distribution
2. **CATEGORY-SPECIFIC**: Mention specific GCC market dynamics for THIS category
3. **NUMERICALLY GROUNDED**: Every claim ties to a number (Bayesian or researched)
4. **ACTIONABLE**: Every insight has a "what to do about it" recommendation
5. **HONEST**: If confidence is low or data is missing, say so explicitly
6. **INVESTMENT-GRADE**: Language and structure matches a $50K consulting report

---

## 📊 INPUT DATA:

# PRODUCT DETAILS
Product Name: ${productName}
Category: ${category}
Description: ${description}
Features: ${features.join(", ")}
Price Range: ${priceMin}-${priceTarget}-${priceMax} SAR
Target Markets: ${Object.keys(regions).join(", ")} (weights: ${JSON.stringify(regions)})

# BAYESIAN VALIDATION RESULTS (MATHEMATICAL FACTS - TREAT AS GROUND TRUTH)

**Core Metrics:**
- Demand Probability: ${(demandProbability * 100).toFixed(1)}%
  (Interpretation: Posterior probability that target customer will purchase at optimal price)
- PSM Score: ${psmScore}/100
  (Interpretation: ${psmInterpretation})
- Optimal Price: ${optimalPrice} SAR
  (Price point that maximizes demand × confidence × margin)
- Confidence Interval: [${(confidenceInterval[0] * 100).toFixed(0)}%-${(confidenceInterval[1] * 100).toFixed(0)}%]

**Demand Curve (Price → Demand Probability):**
${demandCurveLines}

**Feature Importance (Bayesian Posterior Weights):**
${featureWeightLines}

**Identity Signals (What Drives Purchase Decision):**
- Status Signal: ${(identitySignals.status * 100).toFixed(0)}% (Does buying this elevate social standing?)
- Trust Signal: ${(identitySignals.trust * 100).toFixed(0)}% (Does this feel safe, proven, legitimate?)
- Upgrade Signal: ${(identitySignals.upgrade * 100).toFixed(0)}% (Does this represent progress/improvement?)

**Regional Performance:**
${regionalLines}

---

## 🎯 REQUIRED OUTPUT STRUCTURE:

Return ONLY valid JSON (no markdown, no backticks, no preamble) matching this exact schema:

{
  "metadata": {
    "analysisDate": "${new Date().toISOString().split("T")[0]}",
    "productName": "${productName}",
    "category": "${category}",
    "bayesianConfidence": "${psmScore}/100",
    "recommendationLevel": "PROCEED/PROCEED_WITH_CAUTION/RECONSIDER"
  },
  
  "competitiveLandscape": {
    "competitors": [
      {
        "name": "REAL COMPANY NAME (required)",
        "products": ["Specific product names"],
        "positioning": "Premium/Mid-market/Value with evidence",
        "priceRange": "Actual SAR prices (e.g., '15-45 SAR')",
        "distribution": "Specific channels (e.g., 'Carrefour, Tamimi, Souq.com')",
        "strengths": ["Specific strength with evidence"],
        "weaknesses": ["Specific weakness"],
        "recentMoves": "Recent launches or strategy shifts (2023-2025)",
        "brandScores": {
          "status": 0-100,
          "trust": 0-100,
          "upgrade": 0-100,
          "overall": "weighted average",
          "gap": "difference vs subject product's ${Math.round(demandProbability * 100)}"
        },
        "threatLevel": "HIGH/MEDIUM/LOW with reasoning"
      }
    ],
    "competitiveDynamics": {
      "threatOfNewEntrants": "Specific barriers (e.g., 'SFDA approval takes 18-24 months')",
      "supplierPower": "Specific dynamics",
      "buyerPower": "Specific evidence",
      "substitutes": "Specific alternatives",
      "rivalry": "Specific evidence"
    },
    "positioningSummary": "Based on Bayesian analysis..."
  },
  
  "personas": [
    {
      "name": "Descriptive archetype name (e.g., 'The Status-Driven Executive')",
      "tagline": "One-sentence essence",
      "segment": "status_driven/trust_driven/upgrade_driven/value_driven",
      "size": 0.0-1.0,
      "demographics": {
        "age": "Narrow range (e.g., '28-35')",
        "income": "Specific SAR/month (e.g., '22,000-32,000 SAR/month')",
        "occupation": "Specific roles",
        "location": "Specific cities + neighborhoods",
        "familyStatus": "Specific",
        "education": "Specific"
      },
      "psychographics": {
        "coreJob": "What are they TRULY hiring this product to do? (Functional + Emotional + Social)",
        "triggerMoment": "SPECIFIC event that creates need",
        "currentAlternative": "What do they use NOW?",
        "successCriteria": "How do they measure if it worked?",
        "obstacles": ["Specific barrier"],
        "quote": "First-person authentic quote",
        "values": ["Ranked values"]
      },
      "bayesianProfile": {
        "demandProbability": 0.0-1.0,
        "optimalPrice": "SAR amount",
        "topFeatures": ["Feature names"],
        "identityDrivers": {
          "primary": "status/trust/upgrade",
          "weight": 0-100
        },
        "priceElasticity": "HIGH/MEDIUM/LOW"
      },
      "marketingStrategy": {
        "coreMessage": "Value prop for THIS persona",
        "proofPoints": ["Specific facts"],
        "channels": [
          {
            "rank": 1,
            "channel": "Specific channel",
            "rationale": "Why this channel for this persona",
            "budgetAllocation": "% of budget",
            "expectedCAC": "SAR range"
          }
        ],
        "objections": [
          {
            "objection": "Specific objection",
            "response": "How to counter"
          }
        ]
      },
      "lifetimeValue": {
        "firstYearRevenue": "SAR estimate",
        "acquisitionCost": "Expected CAC",
        "ltvCacRatio": "Calculate (>3 is healthy)"
      },
      "priority": "PRIMARY/SECONDARY/TERTIARY"
    }
  ],
  
  "featureStrategy": {
    "featureAnalysis": [
      {
        "feature": "Exact feature name from input",
        "utilityScore": 0-100,
        "rank": 1,
        "kanoCategory": {
          "type": "Must-Have/Performance/Delighter/Indifferent",
          "reasoning": "Based on Bayesian impact",
          "demandWithout": 0.0-1.0,
          "impact": "percentage points"
        },
        "competitiveParity": {
          "status": "Unique/Differentiated/Parity/Below",
          "competitors": "Which competitors have this?"
        },
        "marginImpact": {
          "priceUplift": "Can we charge more? How much?"
        },
        "strategicImportance": {
          "score": 0-100,
          "reasoning": "Why this score"
        }
      }
    ],
    "featureMatrix": {
      "mustBuild": ["Features that are Must-Have AND high utility - MVP"],
      "shouldBuild": ["Performance/Delighters AND medium-high utility - phase 2"],
      "couldBuild": ["Nice-to-have but low utility - phase 3"],
      "shouldSkip": ["Indifferent AND low utility - don't build"]
    },
    "mvpRecommendation": "Based on Bayesian weights and Kano analysis...",
    "roadmap": {
      "phase1Launch": {
        "features": ["Must-have features"],
        "expectedDemand": "% of full demand preserved",
        "timeline": "Specific timeframe"
      },
      "phase2Enhancement": {
        "features": ["Performance features"],
        "expectedUplift": "Additional demand %",
        "timeline": "+6 months"
      },
      "phase3Delight": {
        "features": ["Delighter features"],
        "timeline": "+12 months"
      }
    }
  },
  
  "pricingStrategy": {
    "priceArchitecture": {
      "recommendedTiers": [
        {
          "name": "Entry SKU",
          "price": "SAR amount",
          "features": ["Specific features included"],
          "margin": "Gross margin %",
          "positioning": "Specific positioning",
          "targetPersona": "Which persona",
          "volumeExpectation": "% of sales"
        },
        {
          "name": "Core SKU (Anchor)",
          "price": "${optimalPrice} SAR",
          "features": ["All must-have + key performance"],
          "margin": "Target margin %",
          "positioning": "Main offering",
          "targetPersona": "Primary persona",
          "volumeExpectation": "% of sales"
        },
        {
          "name": "Premium SKU",
          "price": "20-40% above core",
          "features": ["Core + all delighters"],
          "margin": "Higher margin %",
          "positioning": "For status-driven buyers",
          "targetPersona": "Status-driven persona",
          "volumeExpectation": "% of sales"
        }
      ]
    },
    "vanWestendorp": {
      "tooCheap": "SAR amount (where quality concerns emerge)",
      "bargain": "SAR amount (high demand, positive PSM)",
      "optimalPricePoint": ${optimalPrice},
      "expensive": "SAR amount (demand starts falling)",
      "tooExpensive": "SAR amount (demand <40%)",
      "acceptableRange": ["min SAR", "max SAR"],
      "reasoning": "Within this range, demand remains strong and PSM high"
    },
    "regionalPricing": {
      "byRegion": [
        {
          "region": "Region name",
          "recommendedPrice": "SAR amount",
          "vsOptimal": "% difference from overall optimal",
          "rationale": "Specific reasoning",
          "priceElasticity": "Region-specific elasticity"
        }
      ],
      "unifiedVsRegional": {
        "recommendation": "UNIFIED/REGIONAL",
        "reasoning": "Why"
      }
    },
    "psychologicalPricing": {
      "anchoringStrategy": "Show premium SKU first...",
      "charmPricing": "YES/NO with reasoning",
      "bundling": {
        "recommendedBundles": [
          {
            "name": "Specific bundle",
            "components": ["What's included"],
            "unbundledPrice": "SAR if separate",
            "bundledPrice": "Discounted SAR",
            "discount": "% discount",
            "rationale": "Why this bundle"
          }
        ]
      }
    }
  },
  
  "brandAndMessaging": {
    "competitorComparison": {
      "yourPosition": {
        "status": ${Math.round(identitySignals.status * 100)},
        "trust": ${Math.round(identitySignals.trust * 100)},
        "upgrade": ${Math.round(identitySignals.upgrade * 100)},
        "overall": ${Math.round(demandProbability * 100)},
        "interpretation": "Where you sit vs competitors"
      },
      "gapAnalysis": ["Specific gaps vs competitors"]
    },
    "positioningStatement": {
      "statement": "For [target] who [need], [product] is the [category] that [benefit], unlike [competitor] which [their approach]"
    },
    "blueOceanStrategy": {
      "eliminate": ["Industry factors to eliminate"],
      "reduce": ["Factors to reduce"],
      "raise": ["Factors to raise"],
      "create": ["New factors to create"]
    },
    "messagingArchitecture": {
      "primaryBrandPromise": "ONE clear sentence",
      "keyProofPoints": [
        {
          "point": "Specific proof",
          "evidence": "How to prove it",
          "personaRelevance": "Which personas care"
        }
      ],
      "messagingByStage": {
        "awareness": { "primaryMessage": "...", "channels": "...", "goalMetric": "..." },
        "consideration": { "primaryMessage": "...", "channels": "...", "goalMetric": "..." },
        "decision": { "primaryMessage": "...", "channels": "...", "goalMetric": "..." },
        "retention": { "primaryMessage": "...", "channels": "...", "goalMetric": "..." }
      }
    },
    "vulnerabilities": [
      {
        "risk": "Specific vulnerability",
        "likelihood": "HIGH/MEDIUM/LOW",
        "impact": "Demand loss estimate",
        "mitigation": "Specific action"
      }
    ],
    "opportunities": [
      {
        "opportunity": "Specific opportunity",
        "sizing": "Revenue potential",
        "requirements": "What's needed to capture",
        "timeline": "When to pursue"
      }
    ]
  },
  
  "goToMarket": {
    "assumedBudget": "SAR amount assumption",
    "channelMix": [
      {
        "channel": "Specific channel",
        "budgetAllocation": "% of total",
        "rationale": "Why this channel for THIS product in GCC",
        "targetPersona": "Primary persona this targets",
        "expectedReach": "Impressions estimate",
        "expectedCAC": "SAR per acquisition",
        "conversionRate": "Expected %",
        "kpis": ["Specific KPI"],
        "tactics": ["Specific tactic"]
      }
    ],
    "ninetyDayRoadmap": {
      "preLaunch": {
        "days": "Days 1-30",
        "objective": "Specific objective",
        "tactics": ["Specific actions"],
        "budget": "SAR for this phase",
        "successMetrics": ["Metrics"]
      },
      "launch": {
        "days": "Days 31-60",
        "objective": "Specific objective",
        "tactics": ["Specific actions"],
        "budget": "SAR",
        "successMetrics": ["Metrics"]
      },
      "scale": {
        "days": "Days 61-90",
        "objective": "Specific objective",
        "tactics": ["Specific actions"],
        "budget": "SAR",
        "successMetrics": ["Metrics"]
      }
    },
    "funnelDesign": {
      "stages": [
        {
          "stage": "Awareness/Consideration/Decision/Purchase/Retention",
          "mechanism": "How people move through",
          "expectedVolume": "Numbers",
          "conversionToNext": "% to next stage",
          "dropoffReasons": ["Why people don't convert"]
        }
      ],
      "funnelOptimization": ["Priority fixes"]
    },
    "partnershipStrategy": {
      "distributionPartnerships": [
        {
          "partnerType": "Specific type",
          "specificTargets": ["Real potential partners"],
          "valueProposition": "What's in it for them",
          "economics": "Specific terms",
          "timeline": "When to approach"
        }
      ]
    }
  },
  
  "risks": {
    "marketRisks": [
      {
        "risk": "Specific market risk",
        "likelihood": "HIGH/MEDIUM/LOW with reasoning",
        "financialImpact": "Quantified",
        "strategicImpact": "Qualitative",
        "earlyWarningSignals": ["Signals"],
        "mitigation": ["Preventive actions", "Contingencies"]
      }
    ],
    "competitiveRisks": [
      {
        "scenario": "What if [competitor] does X?",
        "likelihood": "% chance",
        "timeframe": "When could this happen",
        "impact": "Effect on business",
        "defensibility": ["Barriers"],
        "responseStrategy": "What to do if it happens"
      }
    ],
    "executionRisks": [
      {
        "assumption": "Key assumption",
        "downside": "What if wrong",
        "breakpoint": "When this becomes fatal",
        "contingency": ["Actions"]
      }
    ]
  },
  
  "investmentThesis": {
    "scenarios": {
      "bullCase": {
        "label": "90th Percentile Outcome",
        "narrative": "Everything goes right...",
        "keyAssumptions": ["Assumptions"],
        "year1": {
          "customers": "Number",
          "revenue": "SAR amount",
          "grossMargin": "%",
          "cac": "SAR",
          "ltv": "SAR",
          "cashFlow": "Positive/Negative"
        },
        "year3": {
          "customers": "Cumulative",
          "revenue": "SAR amount",
          "ebitdaMargin": "%"
        },
        "valuation": {
          "method": "How valued",
          "estimate": "SAR amount"
        },
        "probability": "10-15%"
      },
      "baseCase": {
        "label": "50th Percentile (Most Likely)",
        "narrative": "Realistic execution...",
        "keyAssumptions": ["Assumptions"],
        "year1": { "customers": "", "revenue": "", "grossMargin": "", "cac": "", "ltv": "", "cashFlow": "" },
        "year3": { "customers": "", "revenue": "", "ebitdaMargin": "" },
        "valuation": { "method": "", "estimate": "" },
        "probability": "45-55%"
      },
      "bearCase": {
        "label": "10th Percentile (Stress Case)",
        "narrative": "Multiple things go wrong...",
        "keyAssumptions": ["Assumptions"],
        "year1": { "customers": "", "revenue": "", "grossMargin": "", "cac": "", "ltv": "", "cashFlow": "" },
        "year3": { "customers": "", "revenue": "", "ebitdaMargin": "" },
        "valuation": { "estimate": "" },
        "probability": "10-20%"
      }
    },
    "recommendation": {
      "recommendation": "${psmScore >= 60 ? "PROCEED" : psmScore >= 40 ? "PROCEED_WITH_CAUTION" : "RECONSIDER"}",
      "reasoning": "Based on Bayesian validation: ${(demandProbability * 100).toFixed(0)}% demand with PSM ${psmScore}/100...",
      "confidenceLevel": "${psmScore >= 70 ? "HIGH" : psmScore >= 50 ? "MEDIUM" : "LOW"}"
    },
    "keySuccessFactors": [
      {
        "factor": "Specific success factor",
        "criticality": "HIGH/MEDIUM/LOW",
        "currentStatus": "Where you are now",
        "actionRequired": "What to do",
        "metric": "How to measure"
      }
    ],
    "dealBreakers": ["Conditions that would kill the business"],
    "financialProjections": {
      "keyMetrics": {
        "customerAcquisition": { "month3": "", "month6": "", "month12": "", "year3": "" },
        "revenue": { "month3": "", "month6": "", "month12": "", "year3": "" },
        "unitEconomics": {
          "cac": "SAR expected",
          "ltv": "SAR calculated",
          "ltvCacRatio": "Target >3",
          "paybackPeriod": "Months"
        },
        "cashflow": {
          "burnRate": "Monthly SAR",
          "cashflowPositive": "Month",
          "fundingRequired": "Total SAR needed"
        }
      }
    }
  }
}

---

## ⚠️ FINAL REMINDERS:
1. **ZERO HARDCODED CONTENT** - Every competitor name, persona detail must be specific to THIS product
2. **NUMERICAL GROUNDING** - Every claim ties to Bayesian results
3. **4 DISTINCT PERSONAS** - Each with NON-OVERLAPPING jobs-to-be-done, sizes summing to 100%
4. **5-7 REAL COMPETITORS** - Use actual brand names for ${category} in GCC markets
5. **ACTIONABLE SPECIFICITY** - WHO, WHAT, WHEN, HOW MUCH, EXPECTED OUTCOME
6. **INVESTMENT-GRADE LANGUAGE** - C-suite executives are reading this

BEGIN ANALYSIS NOW. Return ONLY valid JSON.`;
}
