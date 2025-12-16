import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResearchRequest {
  productName: string;
  category: string;
  description: string;
  targetCountries: string[];
  priceRange?: { min: number; target: number; max: number };
  features?: string[];
  researchType: "market_size" | "competitors" | "trends" | "regulations" | "personas" | "comprehensive";
}

interface PerplexityMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const GCC_CONTEXT = `
CRITICAL GCC MARKET CONTEXT - Use this knowledge in all responses:

**Regional Distribution Channels:**
- Hypermarkets: Carrefour, LuLu Hypermarket, Panda (KSA), Spinneys (UAE), Al Meera (Qatar)
- Supermarkets: Tamimi Markets, Danube, Farm Superstores, Géant
- Convenience: ADNOC Oasis, ENOC, Al Baik (QSR example)
- E-commerce: Noon.com, Amazon.sa, Carrefour.sa, Instashop, Talabat Mart
- Modern Trade: Sultan Center, Choithrams, Waitrose (Dubai)
- Pharmacies: Nahdi, Al Dawaa, Boots, Life Pharmacy (UAE)

**Key GCC Brands by Category:**
- Dairy: Almarai (market leader ~55% KSA), Nadec, Al Safi Danone, Nada, Rainbow
- Beverages: Al Rabie, Barbican, Red Bull Arabia, Coca-Cola MENA, Vimto Arabia
- Snacks: Americana (Kuwaiti), BRF Foods, Halwani Bros, Deemah
- Health/Beauty: Al Nahdi, Kunooz, Lush Arabia, The Body Shop MENA
- Tech/Electronics: Jarir Bookstore, eXtra, Virgin Megastore MENA, Sharaf DG

**Regulatory Bodies:**
- Saudi: SFDA (Saudi Food & Drug Authority) - sfda.gov.sa
- UAE: Emirates Authority for Standardization (ESMA), Dubai Municipality
- Qatar: MOPH (Ministry of Public Health)
- All: GCC Standardization Organization (GSO), Halal certification bodies (ESMA, SASO)

**Consumer Insights:**
- Saudi population: ~36M (70% under 35, 45% female workforce growth)
- UAE population: ~10M (89% expat, high purchasing power)
- Qatar population: ~3M (highest GDP per capita globally)
- Average household income: SAR 15,000-25,000/month (middle class)
- Digital penetration: 99%+ smartphone, 85%+ social media users
- E-commerce: Growing 20%+ YoY, COD still 40% of transactions

**Pricing Context:**
- Premium positioning: 20-40% above mass market
- Value segment: SAR 5-15 range for FMCG
- Mid-market: SAR 15-50 for personal care/health
- Premium: SAR 50-200+ for specialty items
- Always include VAT (15% KSA, 5% UAE/Qatar)
`;

async function callPerplexity(messages: PerplexityMessage[], model: string = "sonar-pro") {
  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
  
  if (!PERPLEXITY_API_KEY) {
    throw new Error("PERPLEXITY_API_KEY not configured");
  }

  console.log(`🔍 Calling Perplexity API with model: ${model}`);
  
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 8000,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Perplexity API error:", response.status, errorText);
    throw new Error(`Perplexity API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || "",
    citations: data.citations || [],
  };
}

function buildCompetitorPrompt(req: ResearchRequest): PerplexityMessage[] {
  const regions = req.targetCountries.join(", ");
  
  return [
    {
      role: "system",
      content: `You are a senior market analyst at Ipsos MENA specializing in GCC consumer markets. You MUST provide REAL company names, REAL products, REAL prices in SAR, and REAL distribution data. NO placeholders, NO generic descriptions, NO "Competitor A" naming.

${GCC_CONTEXT}

OUTPUT REQUIREMENTS:
- 5-7 REAL competitors with actual company names operating in ${regions}
- Specific product SKUs and actual retail prices in SAR
- Real distribution presence (which retailers carry them)
- Actual market share estimates with sources
- Recent 2023-2024 strategic moves from news/press releases
- Return ONLY valid JSON, no markdown`
    },
    {
      role: "user",
      content: `Research the competitive landscape for a ${req.category} product called "${req.productName}" in ${regions}.

Product description: ${req.description}
${req.priceRange ? `Target price range: SAR ${req.priceRange.min}-${req.priceRange.max}` : ''}

Provide comprehensive competitive intelligence:

{
  "competitors": [
    {
      "name": "REAL company name (e.g., Almarai, Nadec, not 'Brand A')",
      "parentCompany": "Parent company if subsidiary",
      "products": [
        { "name": "Specific SKU name", "size": "ml/g/units", "price": "SAR XX.XX", "retailer": "Where sold" }
      ],
      "positioning": "PREMIUM|MID_MARKET|VALUE|NICHE",
      "priceRange": { "min": 0, "max": 0, "avgUnit": 0, "currency": "SAR" },
      "distribution": {
        "channels": ["Specific retailer names"],
        "coverage": "National/Regional/City-specific",
        "onlinePresence": ["Specific e-commerce platforms"]
      },
      "marketShare": { "percent": 0, "source": "Source name", "year": 2024 },
      "strengths": [
        { "strength": "Specific strength", "evidence": "Concrete evidence/data" }
      ],
      "weaknesses": [
        { "weakness": "Specific weakness", "evidence": "How you know this" }
      ],
      "recentMoves": [
        { "date": "Q1 2024", "move": "Specific action taken", "impact": "Market impact" }
      ],
      "brandScores": {
        "status": 0-100,
        "trust": 0-100,
        "upgrade": 0-100,
        "overall": 0-100,
        "justification": "Why these scores based on market position"
      },
      "threatLevel": "HIGH|MEDIUM|LOW",
      "threatReasoning": "Why this threat level"
    }
  ],
  "marketLeader": {
    "name": "Company name",
    "share": "XX%",
    "whyLeading": "Key reasons for leadership"
  },
  "competitiveIntensity": "HIGH|MEDIUM|LOW",
  "competitiveReasoning": "Why this intensity level",
  "entryBarriers": [
    { "barrier": "Specific barrier", "severity": "HIGH|MEDIUM|LOW", "mitigation": "How to overcome" }
  ],
  "portersFiveForces": {
    "newEntrantsThreat": { "level": "HIGH|MEDIUM|LOW", "analysis": "GCC-specific analysis" },
    "supplierPower": { "level": "HIGH|MEDIUM|LOW", "analysis": "Who are key suppliers" },
    "buyerPower": { "level": "HIGH|MEDIUM|LOW", "analysis": "Retailer/consumer power" },
    "substituteThreat": { "level": "HIGH|MEDIUM|LOW", "analysis": "What substitutes exist" },
    "competitiveRivalry": { "level": "HIGH|MEDIUM|LOW", "analysis": "How fierce is competition" }
  },
  "whitespaceOpportunities": [
    { "opportunity": "Unmet need", "sizing": "Potential SAR value", "requirements": "What's needed to capture" }
  ]
}`
    }
  ];
}

function buildMarketSizePrompt(req: ResearchRequest): PerplexityMessage[] {
  const regions = req.targetCountries.join(", ");
  
  return [
    {
      role: "system",
      content: `You are a senior market sizing analyst at Euromonitor/Statista MENA. Provide rigorous market sizing with clear methodology, real data sources, and GCC-specific insights.

${GCC_CONTEXT}

OUTPUT REQUIREMENTS:
- All figures in USD for TAM/SAM, SAR for pricing
- Clear bottom-up and top-down methodology
- Real data sources (Euromonitor, Statista, government reports, company filings)
- GCC regional breakdown with country-specific insights
- Return ONLY valid JSON`
    },
    {
      role: "user",
      content: `Size the market for "${req.productName}" (${req.category}) in ${regions}.

Product: ${req.description}

{
  "marketSize": {
    "tam": {
      "value": "USD X billion/million",
      "methodology": "How calculated (top-down from category size)",
      "source": "Specific source name and year",
      "geography": "What regions included"
    },
    "sam": {
      "value": "USD X million",
      "methodology": "How derived from TAM (what segments excluded)",
      "assumptions": ["Key assumption 1", "Key assumption 2"]
    },
    "som": {
      "value": "USD X million",
      "methodology": "Realistic 3-year capture based on",
      "marketShareTarget": "X% of SAM",
      "rationale": "Why this is achievable"
    }
  },
  "growth": {
    "historicalCagr": "X% (2019-2024)",
    "projectedCagr": "X% (2024-2029)",
    "drivers": [
      { "driver": "Specific driver", "impact": "HIGH|MEDIUM|LOW", "timeline": "When impact peaks" }
    ],
    "headwinds": [
      { "headwind": "Specific challenge", "impact": "HIGH|MEDIUM|LOW", "mitigation": "How to address" }
    ]
  },
  "regionalBreakdown": {
    "KSA": {
      "marketSize": "USD X million",
      "share": "X% of GCC total",
      "growth": "X% CAGR",
      "insight": "Specific KSA market dynamic",
      "keyPlayers": ["Top 3 players in KSA"]
    },
    "UAE": {
      "marketSize": "USD X million",
      "share": "X% of GCC total",
      "growth": "X% CAGR",
      "insight": "Specific UAE market dynamic",
      "keyPlayers": ["Top 3 players in UAE"]
    },
    "Qatar": {
      "marketSize": "USD X million",
      "share": "X% of GCC total",
      "growth": "X% CAGR",
      "insight": "Specific Qatar market dynamic"
    }
  },
  "segmentation": {
    "byPrice": [
      { "segment": "Premium (SAR X+)", "share": "X%", "growth": "X%" },
      { "segment": "Mid-market (SAR X-Y)", "share": "X%", "growth": "X%" },
      { "segment": "Value (<SAR X)", "share": "X%", "growth": "X%" }
    ],
    "byChannel": [
      { "channel": "Modern Trade (Hypermarkets)", "share": "X%", "trend": "Growing/Stable/Declining" },
      { "channel": "E-commerce", "share": "X%", "trend": "Growing" },
      { "channel": "Traditional Trade", "share": "X%", "trend": "Declining" }
    ]
  },
  "sources": [
    { "name": "Source name", "year": 2024, "dataPoint": "What data from this source" }
  ]
}`
    }
  ];
}

function buildPersonaPrompt(req: ResearchRequest): PerplexityMessage[] {
  const regions = req.targetCountries.join(", ");
  
  return [
    {
      role: "system",
      content: `You are a senior consumer insights researcher at Nielsen IQ MENA. Create hyper-specific, actionable buyer personas based on real GCC consumer segments. NO generic personas - each must be distinct with concrete, research-backed details.

${GCC_CONTEXT}

OUTPUT REQUIREMENTS:
- 4 distinct personas with non-overlapping jobs-to-be-done
- Real income levels in SAR, real neighborhoods in ${regions}
- Specific media consumption (which Saudi/UAE influencers, which apps)
- Actual purchasing behaviors and price sensitivity
- Return ONLY valid JSON`
    },
    {
      role: "user",
      content: `Create 4 detailed buyer personas for "${req.productName}" (${req.category}) targeting consumers in ${regions}.

Product: ${req.description}
${req.priceRange ? `Price range: SAR ${req.priceRange.min}-${req.priceRange.max}` : ''}

{
  "personas": [
    {
      "name": "Arabic name appropriate to region (e.g., Fatima Al-Rashid, Mohammed Al-Otaibi)",
      "tagline": "One-line descriptor capturing essence",
      "segment": "Behavioral segment name",
      "size": 0.25,
      "priority": "PRIMARY|SECONDARY|TERTIARY",
      
      "demographics": {
        "age": "XX-YY years",
        "income": "SAR XX,000-YY,000/month",
        "location": "Specific area (e.g., Al Olaya, Riyadh / JBR, Dubai)",
        "occupation": "Specific job title at type of company",
        "familyStatus": "Specific (e.g., married with 2 children aged 5 and 8)",
        "education": "Degree and institution type",
        "nationality": "Saudi/Emirati/Expat (specify origin)"
      },
      
      "psychographics": {
        "quote": "Something this person would actually say about their needs",
        "values": [
          { "value": "Specific value", "rank": 1, "explanation": "Why important to them" }
        ],
        "dayInLife": "Detailed paragraph: wake time, commute, work, shopping habits, evening routine",
        "mediaConsumption": ["Specific apps, influencers they follow, TV channels"],
        "socialCircle": "Who influences their purchasing decisions"
      },
      
      "jobsToBeDone": {
        "coreJob": "The primary job they hire this product to do",
        "triggerMoment": "Specific situation that triggers purchase consideration",
        "currentAlternative": "What they currently use/do instead",
        "successCriteria": "How they judge if the product worked",
        "obstacles": [
          { "obstacle": "Barrier to purchase", "severity": "HIGH|MEDIUM|LOW", "description": "Details" }
        ]
      },
      
      "bayesianProfile": {
        "demandProbability": 0.0-1.0,
        "optimalPrice": "SAR XX",
        "willingnessToPayRange": ["SAR XX", "SAR YY"],
        "priceElasticity": "HIGH|MEDIUM|LOW",
        "purchaseFrequency": "Specific (e.g., weekly, monthly, quarterly)",
        "featurePreferences": {
          "feature1": 0-100,
          "feature2": 0-100
        },
        "identityDrivers": {
          "status": 0-100,
          "trust": 0-100,
          "upgrade": 0-100
        }
      },
      
      "marketingStrategy": {
        "coreMessage": "The key message that resonates with this persona",
        "proofPoints": ["Evidence/claims that convince them"],
        "channelStrategy": [
          {
            "channel": "Specific channel (e.g., Instagram, Noon, Pharmacy counter)",
            "budgetPercent": 0-100,
            "cac": "SAR XX",
            "rationale": "Why this channel for this persona",
            "tactics": ["Specific tactics"]
          }
        ],
        "contentFormats": ["Formats that work (e.g., short-form video, WhatsApp groups)"],
        "objectionHandling": [
          { "objection": "Common objection", "response": "How to overcome" }
        ]
      },
      
      "lifetimeValue": {
        "year1Revenue": "SAR X,XXX",
        "threeYearLTV": "SAR XX,XXX",
        "cac": "SAR XXX",
        "ltvCacRatio": 0.0,
        "crossSellOpportunities": ["Related products they'd buy"],
        "retentionRiskFactors": ["What might cause churn"]
      }
    }
  ]
}`
    }
  ];
}

function buildRegulationsPrompt(req: ResearchRequest): PerplexityMessage[] {
  const regions = req.targetCountries.join(", ");
  
  return [
    {
      role: "system",
      content: `You are a regulatory affairs specialist for GCC markets with expertise in SFDA, ESMA, and GSO requirements. Provide specific, actionable regulatory guidance with timelines and costs.

${GCC_CONTEXT}

OUTPUT REQUIREMENTS:
- Specific registration numbers, fees, timelines
- Actual regulatory body contacts and processes
- Real certification requirements (not generic "may require")
- Import/labeling specifics for GCC
- Return ONLY valid JSON`
    },
    {
      role: "user",
      content: `Research regulatory requirements for "${req.productName}" (${req.category}) to enter ${regions}.

Product: ${req.description}

{
  "regulatory": {
    "KSA": {
      "primaryAuthority": "SFDA / SASO / Other",
      "registrationRequired": true,
      "registrationProcess": {
        "steps": ["Step 1 with specific details", "Step 2"],
        "documents": ["Specific documents needed"],
        "timeline": "X-Y months",
        "fees": { "registration": "SAR X", "renewal": "SAR X/year" }
      },
      "productClassification": "How SFDA classifies this product",
      "labelingRequirements": [
        { "requirement": "Specific requirement", "penalty": "Non-compliance penalty" }
      ],
      "importRequirements": {
        "importerLicense": true,
        "customsTariff": "X%",
        "portOfEntry": "Recommended ports"
      }
    },
    "UAE": {
      "primaryAuthority": "ESMA / Dubai Municipality / Other",
      "registrationRequired": true,
      "registrationProcess": {
        "steps": ["Step 1", "Step 2"],
        "timeline": "X-Y months",
        "fees": { "registration": "AED X" }
      },
      "freeZoneConsiderations": "If selling in free zones vs mainland"
    }
  },
  
  "certifications": {
    "halal": {
      "required": true,
      "acceptedBodies": ["ESMA", "JAKIM", "MUI"],
      "process": "How to obtain",
      "timeline": "X months",
      "cost": "USD X-Y",
      "validity": "X years"
    },
    "gsoCertification": {
      "required": true,
      "standard": "GSO XXXX:YYYY",
      "process": "Steps to obtain"
    },
    "other": [
      { "name": "Certification name", "required": true, "purpose": "Why needed" }
    ]
  },
  
  "restrictions": {
    "ingredientRestrictions": ["Any banned ingredients in GCC"],
    "claimsRestrictions": ["What claims cannot be made"],
    "advertisingRestrictions": ["Advertising limitations"],
    "packagingRestrictions": ["Packaging requirements"]
  },
  
  "timeline": {
    "fastTrack": { "months": 0, "conditions": "When possible" },
    "standard": { "months": 0, "conditions": "Normal process" },
    "worstCase": { "months": 0, "conditions": "If complications" }
  },
  
  "estimatedCosts": {
    "totalFirstYear": "SAR X-Y",
    "breakdown": [
      { "item": "Registration", "cost": "SAR X" },
      { "item": "Testing", "cost": "SAR X" },
      { "item": "Certification", "cost": "SAR X" }
    ]
  },
  
  "risks": [
    { "risk": "Regulatory risk", "likelihood": "HIGH|MEDIUM|LOW", "mitigation": "How to mitigate" }
  ],
  
  "recommendations": [
    "Specific actionable recommendation"
  ]
}`
    }
  ];
}

function buildComprehensivePrompt(req: ResearchRequest): PerplexityMessage[] {
  const regions = req.targetCountries.join(", ");
  
  return [
    {
      role: "system",
      content: `You are a senior partner at McKinsey MENA delivering a comprehensive market entry analysis. This must be investment-grade quality suitable for a $1M+ market entry decision. Use ONLY real data, real company names, real prices.

${GCC_CONTEXT}

QUALITY STANDARDS:
- NO generic phrases like "growing market" or "digital transformation"
- NO placeholder company names like "Brand A" or "Leading Player"
- ALL prices in SAR with actual market references
- ALL companies must be real, verifiable businesses
- ALL statistics must have sources
- Return ONLY valid JSON`
    },
    {
      role: "user",
      content: `Conduct comprehensive market entry analysis for "${req.productName}" (${req.category}) in ${regions}.

Product: ${req.description}
${req.priceRange ? `Target price: SAR ${req.priceRange.min}-${req.priceRange.max}` : ''}
${req.features ? `Key features: ${req.features.join(', ')}` : ''}

Deliver investment-grade analysis:

{
  "executiveSummary": {
    "recommendation": "GREENLIGHT|TEST_FURTHER|REVISE_STRATEGY|PASS",
    "confidenceLevel": "HIGH|MEDIUM|LOW",
    "keyRationale": "2-3 sentence justification",
    "criticalSuccessFactors": ["Factor 1", "Factor 2", "Factor 3"],
    "dealBreakers": ["Risk that could kill the venture"]
  },
  
  "marketOverview": {
    "tam": { "value": "USD X", "source": "Source", "methodology": "How calculated" },
    "sam": { "value": "USD X", "methodology": "Segmentation logic" },
    "som": { "value": "USD X", "assumptions": "Realistic capture assumptions" },
    "growth": { "historical": "X% CAGR", "projected": "X% CAGR", "source": "Source" },
    "maturity": "EMERGING|GROWING|MATURE|DECLINING",
    "categoryDynamics": "Key category-specific insight"
  },
  
  "competitors": [
    {
      "name": "REAL company name",
      "parentCompany": "If applicable",
      "products": [
        { "name": "SKU", "price": "SAR X", "size": "Xg/ml" }
      ],
      "positioning": "PREMIUM|MID_MARKET|VALUE",
      "distribution": ["Specific retailer names"],
      "marketShare": "X% (source)",
      "strengths": ["Specific strength with evidence"],
      "weaknesses": ["Specific weakness with evidence"],
      "recentMoves": ["2024: Specific action"],
      "threatLevel": "HIGH|MEDIUM|LOW",
      "threatReasoning": "Why"
    }
  ],
  
  "consumerInsights": {
    "primaryBuyers": {
      "demographic": "Specific description",
      "size": "X million consumers",
      "spending": "SAR X/month on category"
    },
    "purchaseDrivers": [
      { "driver": "Specific driver", "importance": "X/100", "evidence": "How we know" }
    ],
    "priceExpectations": {
      "tooCheap": "SAR X (below this seems low quality)",
      "bargain": "SAR X (good value)",
      "optimal": "SAR X (expected price)",
      "expensive": "SAR X (premium positioning)",
      "tooExpensive": "SAR X (would not consider)"
    },
    "channelPreferences": [
      { "channel": "Channel name", "preference": "X%", "trend": "Growing/Stable/Declining" }
    ],
    "unmetNeeds": ["Specific unmet need 1", "Specific unmet need 2"]
  },
  
  "regulatory": {
    "primaryAuthority": "SFDA/ESMA/Other",
    "registrationRequired": true,
    "keyRequirements": ["Requirement 1", "Requirement 2"],
    "halalRequired": true,
    "timeToMarket": "X months",
    "estimatedCost": "SAR X for registration/certification",
    "criticalRisks": ["Regulatory risk"]
  },
  
  "goToMarket": {
    "recommendedChannels": [
      {
        "channel": "Specific channel",
        "priority": 1,
        "rationale": "Why this channel",
        "partnerOptions": ["Specific distributor/retailer names"],
        "expectedCAC": "SAR X",
        "timeline": "X months to launch"
      }
    ],
    "pricingRecommendation": {
      "msrp": "SAR X",
      "rationale": "Based on competitive analysis and consumer WTP",
      "marginStructure": {
        "retailerMargin": "X%",
        "distributorMargin": "X%",
        "yourMargin": "X%"
      }
    },
    "launchSequence": [
      { "phase": "Phase 1", "market": "Start market", "timeline": "Q1 2025", "investment": "SAR X" }
    ]
  },
  
  "financialProjections": {
    "year1": {
      "revenue": "SAR X",
      "units": "X units",
      "customers": "X customers",
      "grossMargin": "X%"
    },
    "year3": {
      "revenue": "SAR X",
      "marketShare": "X%",
      "ebitdaMargin": "X%"
    },
    "investmentRequired": "SAR X",
    "breakeven": "X months",
    "assumptions": ["Key assumption 1", "Key assumption 2"]
  },
  
  "risks": [
    {
      "category": "MARKET|COMPETITIVE|EXECUTION|REGULATORY",
      "risk": "Specific risk",
      "likelihood": "HIGH|MEDIUM|LOW",
      "impact": "HIGH|MEDIUM|LOW",
      "financialExposure": "SAR X potential loss",
      "mitigation": ["Mitigation step 1", "Mitigation step 2"],
      "owner": "Who should own this risk"
    }
  ],
  
  "nextSteps": [
    {
      "action": "Specific action",
      "timeline": "By when",
      "owner": "Who",
      "budget": "SAR X",
      "outcome": "Expected result"
    }
  ],
  
  "sources": [
    { "name": "Source name", "type": "Report/Interview/Public Data", "year": 2024 }
  ]
}`
    }
  ];
}

function buildTrendsPrompt(req: ResearchRequest): PerplexityMessage[] {
  const regions = req.targetCountries.join(", ");
  
  return [
    {
      role: "system",
      content: `You are a trends analyst at WGSN/Mintel MENA tracking consumer and market trends in the GCC. Focus on actionable insights, not generic trend descriptions.

${GCC_CONTEXT}

OUTPUT REQUIREMENTS:
- GCC-specific trends with local examples
- Quantified trend data where possible
- Actionable implications for product strategy
- Return ONLY valid JSON`
    },
    {
      role: "user",
      content: `Research trends affecting "${req.productName}" (${req.category}) in ${regions}.

Product: ${req.description}

{
  "consumerTrends": [
    {
      "trend": "Specific trend name",
      "description": "What's happening in GCC specifically",
      "evidence": ["Data point 1", "Example 2"],
      "impact": "How it affects this product category",
      "timeline": "EMERGING|GROWING|MATURE|DECLINING",
      "actionRequired": "What to do about it"
    }
  ],
  
  "channelTrends": {
    "ecommerce": {
      "share": "X% of category sales",
      "growth": "X% YoY",
      "keyPlayers": ["Noon", "Amazon.sa", "Category-specific platforms"],
      "opportunities": ["Specific opportunity"]
    },
    "modernTrade": {
      "share": "X%",
      "keyPlayers": ["Carrefour", "LuLu", "Panda"],
      "trend": "Growing/Stable/Declining"
    },
    "directToConsumer": {
      "potential": "HIGH|MEDIUM|LOW",
      "examples": ["GCC D2C success stories in category"],
      "requirements": ["What's needed to succeed"]
    },
    "emergingChannels": [
      { "channel": "Quick commerce/Social commerce/etc", "potential": "HIGH|MEDIUM|LOW", "readiness": "Ready now/6-12 months/future" }
    ]
  },
  
  "demographicShifts": {
    "youthBulge": {
      "insight": "70% of Saudi population under 35",
      "implication": "What this means for product"
    },
    "femaleWorkforce": {
      "insight": "Female workforce participation growing",
      "implication": "Product implications"
    },
    "expatDynamics": {
      "insight": "Expat preferences and trends",
      "implication": "How to address"
    }
  },
  
  "regulatoryTrends": [
    {
      "trend": "Regulatory change",
      "status": "Implemented/Coming",
      "timeline": "When",
      "impact": "How it affects business"
    }
  ],
  
  "competitiveTrends": [
    {
      "trend": "What competitors are doing",
      "examples": ["Company X did Y"],
      "implication": "What you should do"
    }
  ],
  
  "opportunities": [
    {
      "opportunity": "Specific opportunity from trends",
      "sizing": "Potential value",
      "timeframe": "When to act",
      "requirements": "What's needed"
    }
  ],
  
  "threats": [
    {
      "threat": "Trend-based threat",
      "timeline": "When it becomes critical",
      "mitigation": "How to address"
    }
  ]
}`
    }
  ];
}

function validateAndCleanJSON(content: string): any {
  // Remove markdown code blocks
  let cleaned = content
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  
  // Try to extract JSON if there's text around it
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  
  try {
    const parsed = JSON.parse(cleaned);
    
    // Validate critical fields aren't generic
    if (parsed.competitors) {
      const genericNames = ['Brand A', 'Competitor A', 'Leading Brand', 'Market Leader'];
      const hasGeneric = parsed.competitors.some((c: any) => 
        genericNames.some(g => c.name?.includes(g))
      );
      if (hasGeneric) {
        console.warn("⚠️ Response contains generic competitor names - quality check failed");
      }
    }
    
    return parsed;
  } catch (e) {
    console.error("JSON parse error:", e);
    return { rawContent: content, parseError: true };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: ResearchRequest = await req.json();
    
    console.log("=== PERPLEXITY RESEARCH REQUEST ===");
    console.log("Product:", request.productName);
    console.log("Category:", request.category);
    console.log("Research type:", request.researchType);
    console.log("Target countries:", request.targetCountries);

    let messages: PerplexityMessage[];
    
    switch (request.researchType) {
      case "competitors":
        messages = buildCompetitorPrompt(request);
        break;
      case "market_size":
        messages = buildMarketSizePrompt(request);
        break;
      case "personas":
        messages = buildPersonaPrompt(request);
        break;
      case "regulations":
        messages = buildRegulationsPrompt(request);
        break;
      case "trends":
        messages = buildTrendsPrompt(request);
        break;
      case "comprehensive":
      default:
        messages = buildComprehensivePrompt(request);
        break;
    }
    
    // Use sonar-pro for all research types for better quality
    const result = await callPerplexity(messages, "sonar-pro");

    console.log("✅ Perplexity response received");
    console.log("Citations count:", result.citations.length);
    console.log("Content length:", result.content.length);

    const parsedContent = validateAndCleanJSON(result.content);

    return new Response(
      JSON.stringify({
        success: true,
        data: parsedContent,
        citations: result.citations,
        researchType: request.researchType,
        qualityCheck: {
          hasGenericNames: parsedContent.parseError || false,
          citationCount: result.citations.length,
          contentLength: result.content.length
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Perplexity research error:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
