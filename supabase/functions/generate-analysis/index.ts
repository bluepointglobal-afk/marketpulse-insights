import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runSmvsPipeline, type SmvsConfig } from "./lib/analytics/smvs-pipeline.ts";
import { buildInvestmentGradePrompt } from "./lib/prompts/investment-grade-prompt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HARD_TIMEOUT_MS = 55000; // 55 seconds hard timeout (Supabase has 60s limit)
const GROQ_TIMEOUT_MS = 50000; // 50 seconds for Groq (complex analysis needs time)

interface GenerateRequest {
  testId: string;
  smvsConfig: SmvsConfig;
}

// Helper to create job audit entry
async function createJobAudit(supabase: any, testId: string, step: string, metadata?: any) {
  const { data, error } = await supabase
    .from("job_audit")
    .insert({
      test_id: testId,
      status: "STARTED",
      step,
      metadata: metadata || {}
    })
    .select("id")
    .single();
  
  if (error) console.error("Failed to create job audit:", error);
  return data?.id;
}

// Helper to update job audit
async function updateJobAudit(supabase: any, auditId: string, status: string, errorMessage?: string) {
  if (!auditId) return;
  
  const update: any = {
    status,
    ended_at: new Date().toISOString()
  };
  if (errorMessage) update.error_message = errorMessage;
  
  const { error } = await supabase
    .from("job_audit")
    .update(update)
    .eq("id", auditId);
  
  if (error) console.error("Failed to update job audit:", error);
}

// Wrap async operation with timeout
function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(timeoutMsg)), ms)
    )
  ]);
}

async function generateMarketingIntelligence(
  bayesianResults: any,
  productInfo: any,
  smvsConfig: SmvsConfig
) {
  const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

  console.log("=== MARKETING INTELLIGENCE GENERATION ===");
  console.log("GROQ_API_KEY present:", !!GROQ_API_KEY);

  if (!GROQ_API_KEY) {
    console.warn("❌ No Groq API key configured - using basic generation");
    return generateBasicMarketing(bayesianResults, smvsConfig);
  }

  // Build the investment-grade prompt with all Bayesian data
  const prompt = buildInvestmentGradePrompt({
    productName: productInfo.product_name,
    category: smvsConfig.category,
    description: productInfo.product_description,
    features: smvsConfig.features,
    priceMin: smvsConfig.pricing.min,
    priceTarget: smvsConfig.pricing.target,
    priceMax: smvsConfig.pricing.max,
    regions: smvsConfig.regions,
    demandProbability: bayesianResults.demandProbability,
    psmScore: bayesianResults.psmScore,
    optimalPrice: bayesianResults.optimalPrice,
    confidenceInterval: bayesianResults.confidenceInterval || [0.4, 0.8],
    demandCurve: bayesianResults.demandCurve || [],
    featureWeights: bayesianResults.featureWeights || {},
    identitySignals: bayesianResults.identitySignals || { status: 0.33, trust: 0.34, upgrade: 0.33 },
    regionalBreakdown: bayesianResults.regionalBreakdown || {},
  });

  console.log("📝 Investment-grade prompt length:", prompt.length, "characters");
  console.log("📊 Input data - Product:", productInfo.product_name, "| Category:", smvsConfig.category);
  console.log("📊 Bayesian results - Demand:", bayesianResults.demandProbability, "| PSM:", bayesianResults.psmScore);

  try {
    console.log("🚀 Calling Groq API with investment-grade prompt...");
    console.log("   Model: llama-3.3-70b-versatile");
    console.log("   Timeout:", GROQ_TIMEOUT_MS / 1000, "seconds");
    console.log("   Max tokens: 8000");

    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log("⏱️ Groq API timeout triggered after", GROQ_TIMEOUT_MS / 1000, "s");
      controller.abort();
    }, GROQ_TIMEOUT_MS);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a McKinsey senior partner specializing in GCC/MENA market entry. Return ONLY valid JSON matching the exact schema provided. No markdown, no code fences, no preamble. Every insight must be specific, actionable, and grounded in the Bayesian data provided.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3, // Lower for more consistent output
        max_tokens: 8000, // Increased for comprehensive analysis
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;

    console.log("📥 Groq API response received in", elapsed, "ms");
    console.log("   Status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Groq API error response:");
      console.error("   Status:", response.status);
      console.error("   Body:", errorText);
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ Groq API JSON parsed successfully");
    console.log("   Choices count:", data.choices?.length || 0);
    console.log("   Usage:", JSON.stringify(data.usage || {}));
    console.log("   Finish reason:", data.choices?.[0]?.finish_reason);

    const content = data.choices?.[0]?.message?.content;
    console.log("📄 Response content length:", content?.length || 0, "characters");

    if (!content) {
      console.warn("⚠️ Groq returned empty content - falling back");
      return generateBasicMarketing(bayesianResults, smvsConfig);
    }

    // Clean up the response
    const cleanedContent = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    console.log("📄 Cleaned content preview:", cleanedContent.substring(0, 300) + "...");

    let parsed: any;
    try {
      parsed = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("❌ Failed to parse Groq response as JSON:");
      console.error("   Parse error:", parseError);
      console.error("   Raw content (first 1000 chars):", cleanedContent.substring(0, 1000));
      return generateBasicMarketing(bayesianResults, smvsConfig);
    }

    // Validate the new comprehensive structure
    const hasCompetitors = parsed?.competitiveLandscape?.competitors?.length > 0;
    const hasPersonas = parsed?.personas?.length > 0;
    const hasFeatureStrategy = !!parsed?.featureStrategy;
    const hasPricingStrategy = !!parsed?.pricingStrategy;
    const hasGoToMarket = !!parsed?.goToMarket;
    const hasInvestmentThesis = !!parsed?.investmentThesis;

    console.log("✅ Investment-grade analysis validation:");
    console.log("   Competitors:", hasCompetitors ? parsed.competitiveLandscape.competitors.length : 0);
    console.log("   Personas:", hasPersonas ? parsed.personas.length : 0);
    console.log("   Feature Strategy:", hasFeatureStrategy);
    console.log("   Pricing Strategy:", hasPricingStrategy);
    console.log("   GTM:", hasGoToMarket);
    console.log("   Investment Thesis:", hasInvestmentThesis);

    // If we got a partial response, still use what we got but log it
    if (!hasCompetitors || !hasPersonas) {
      console.warn("⚠️ Groq returned incomplete analysis - some sections missing");
      // Don't fallback completely - try to use what we got
    }

    // Transform the comprehensive response to match our database schema
    return transformInvestmentGradeResponse(parsed, bayesianResults, smvsConfig);
  } catch (error) {
    console.error("❌ Groq API call failed:");
    console.error("   Error type:", (error as any)?.constructor?.name);
    console.error("   Error message:", error instanceof Error ? error.message : String(error));
    console.log("⚠️ Falling back to basic marketing generation");
    return generateBasicMarketing(bayesianResults, smvsConfig);
  }
}

// Transform the comprehensive investment-grade response to our DB schema
function transformInvestmentGradeResponse(parsed: any, bayesianResults: any, smvsConfig: SmvsConfig) {
  const competitiveLandscape = parsed.competitiveLandscape || {};
  const featureStrategy = parsed.featureStrategy || {};
  const pricingStrategy = parsed.pricingStrategy || {};
  const brandAndMessaging = parsed.brandAndMessaging || {};
  const goToMarket = parsed.goToMarket || {};
  const risks = parsed.risks || {};
  const investmentThesis = parsed.investmentThesis || {};

  // Helper to normalize scores to 0-100 range
  const normalizeScore = (score: any, fallback = 50): number => {
    const num = typeof score === 'number' ? score : parseFloat(score) || fallback;
    // If score is > 100, likely wrong scale - normalize
    if (num > 100) return Math.min(100, Math.round(num / 100));
    return Math.min(100, Math.max(0, Math.round(num)));
  };

  // Extract competitors in the format the UI expects
  const competitors = (competitiveLandscape.competitors || []).map((c: any) => ({
    name: c.name || "Unknown Competitor",
    status: normalizeScore(c.brandScores?.status, 50),
    trust: normalizeScore(c.brandScores?.trust, 50),
    upgrade: normalizeScore(c.brandScores?.upgrade, 50),
    overall: normalizeScore(c.brandScores?.overall, 50),
    gap: typeof c.brandScores?.gap === 'number' ? c.brandScores.gap : 0,
    products: c.products || [],
    positioning: c.positioning || "",
    priceRange: c.priceRange || "",
    distribution: c.distribution || "",
    strengths: c.strengths || [],
    weaknesses: c.weaknesses || [],
    threatLevel: c.threatLevel || "MEDIUM",
  }));

  console.log("Competitors processed:", competitors.map((c: any) => ({name: c.name, status: c.status, trust: c.trust})));

  // Transform feature strategy to maxDiff format
  const featureAnalysis = featureStrategy.featureAnalysis || [];
  const maxDiffNarrative = {
    insight: featureStrategy.mvpRecommendation || "Feature importance derived from Bayesian analysis",
    methodology: "MaxDiff utility scoring with Kano classification",
    featureRanking: featureAnalysis.map((f: any, i: number) => ({
      rank: f.rank || i + 1,
      feature: f.feature,
      utility: f.utilityScore || Math.round((bayesianResults.featureWeights?.[f.feature] || 0) * 100),
      gap: f.strategicImportance?.reasoning || "",
    })),
    featureMatrix: featureStrategy.featureMatrix || {},
    roadmap: featureStrategy.roadmap || {},
  };

  // Transform to kano format
  const kanoAnalysis = {
    mustHave: featureAnalysis
      .filter((f: any) => f.kanoCategory?.type === "Must-Have")
      .map((f: any) => ({
        feature: f.feature,
        demandWithout: f.kanoCategory?.demandWithout || 0.3,
        impact: parseFloat(f.kanoCategory?.impact) || -30,
        reasoning: f.kanoCategory?.reasoning || "",
      })),
    performance: featureAnalysis
      .filter((f: any) => f.kanoCategory?.type === "Performance")
      .map((f: any) => ({
        feature: f.feature,
        demandWithout: f.kanoCategory?.demandWithout || 0.5,
        impact: parseFloat(f.kanoCategory?.impact) || -15,
        reasoning: f.kanoCategory?.reasoning || "",
      })),
    delighters: featureAnalysis
      .filter((f: any) => f.kanoCategory?.type === "Delighter")
      .map((f: any) => ({
        feature: f.feature,
        demandWithout: f.kanoCategory?.demandWithout || 0.7,
        impact: parseFloat(f.kanoCategory?.impact) || -5,
        reasoning: f.kanoCategory?.reasoning || "",
      })),
    indifferent: featureAnalysis
      .filter((f: any) => f.kanoCategory?.type === "Indifferent")
      .map((f: any) => ({
        feature: f.feature,
        demandWithout: f.kanoCategory?.demandWithout || 0.9,
        impact: parseFloat(f.kanoCategory?.impact) || -2,
        reasoning: f.kanoCategory?.reasoning || "",
      })),
  };

  // Van Westendorp
  const vanWestendorpNarrative = {
    tooCheap: pricingStrategy.vanWestendorp?.tooCheap || Math.round(smvsConfig.pricing.min * 0.9),
    bargain: pricingStrategy.vanWestendorp?.bargain || Math.round(smvsConfig.pricing.target * 0.85),
    optimalPricePoint: pricingStrategy.vanWestendorp?.optimalPricePoint || bayesianResults.optimalPrice,
    expensive: pricingStrategy.vanWestendorp?.expensive || Math.round(smvsConfig.pricing.target * 1.15),
    tooExpensive: pricingStrategy.vanWestendorp?.tooExpensive || Math.round(smvsConfig.pricing.max * 0.9),
    acceptableRange: pricingStrategy.vanWestendorp?.acceptableRange || [
      Math.round(smvsConfig.pricing.target * 0.93),
      Math.round(smvsConfig.pricing.target * 1.2),
    ],
    reasoning: pricingStrategy.vanWestendorp?.reasoning || "",
    priceArchitecture: pricingStrategy.priceArchitecture || {},
    regionalPricing: pricingStrategy.regionalPricing || {},
    psychologicalPricing: pricingStrategy.psychologicalPricing || {},
  };

  // Brand positioning - normalize all scores to 0-100
  const rawYourPosition = brandAndMessaging.competitorComparison?.yourPosition || {};
  const brandPositioning = {
    yourPosition: {
      status: normalizeScore(rawYourPosition.status, Math.round((bayesianResults.identitySignals?.status || 0.33) * 100)),
      trust: normalizeScore(rawYourPosition.trust, Math.round((bayesianResults.identitySignals?.trust || 0.34) * 100)),
      upgrade: normalizeScore(rawYourPosition.upgrade, Math.round((bayesianResults.identitySignals?.upgrade || 0.33) * 100)),
      overall: normalizeScore(rawYourPosition.overall, Math.round(bayesianResults.demandProbability * 100)),
      interpretation: rawYourPosition.interpretation || "",
    },
    positioningStatement: brandAndMessaging.positioningStatement?.statement || "",
    blueOceanStrategy: brandAndMessaging.blueOceanStrategy || {},
    messagingArchitecture: brandAndMessaging.messagingArchitecture || {},
    vulnerabilities: (brandAndMessaging.vulnerabilitiesAndOpportunities?.vulnerabilities || brandAndMessaging.vulnerabilities || []).map((v: any) =>
      typeof v === "string" ? v : v.risk || ""
    ),
    opportunities: (brandAndMessaging.vulnerabilitiesAndOpportunities?.opportunities || brandAndMessaging.opportunities || []).map((o: any) =>
      typeof o === "string" ? o : o.opportunity || ""
    ),
  };
  
  console.log("Brand yourPosition normalized:", brandPositioning.yourPosition);

  // Transform personas
  const personas = (parsed.personas || []).map((p: any) => ({
    name: p.name,
    tagline: p.tagline || "",
    segment: p.segment,
    size: p.size,
    demographics: p.demographics || {},
    psychographics: p.psychographics || {},
    bayesianProfile: p.bayesianProfile || {},
    marketingStrategy: p.marketingStrategy || {},
    lifetimeValue: p.lifetimeValue || {},
    priority: p.priority || "SECONDARY",
    recommendations: {
      messaging: p.marketingStrategy?.coreMessage || "",
      channels: (p.marketingStrategy?.channels || []).map((c: any) => c.channel || c),
      creativeAngle: (p.marketingStrategy?.proofPoints || []).join("; "),
    },
  }));

  // Executive summary from investment thesis
  const recommendation = investmentThesis.recommendation || {};
  const executiveSummary = {
    launchRecommendation: recommendation.recommendation || 
      (bayesianResults.psmScore >= 60 ? "PROCEED" : 
       bayesianResults.psmScore >= 40 ? "PROCEED_WITH_CAUTION" : "REVISIT"),
    confidenceLevel: recommendation.confidenceLevel || 
      (bayesianResults.psmScore >= 70 ? "HIGH" : 
       bayesianResults.psmScore >= 50 ? "MEDIUM" : "LOW"),
    keyFinding: recommendation.reasoning || 
      `${Math.round(bayesianResults.demandProbability * 100)}% demand probability with ${bayesianResults.psmScore}/100 PSM confidence`,
    scenarios: investmentThesis.scenarios || {},
    keySuccessFactors: investmentThesis.keySuccessFactors || [],
    dealBreakers: investmentThesis.dealBreakers || [],
    financialProjections: investmentThesis.financialProjections || {},
  };

  // Go-to-market insights
  const goToMarketInsights = {
    assumedBudget: goToMarket.assumedBudget || "",
    channelMix: goToMarket.channelMix || [],
    ninetyDayRoadmap: goToMarket.ninetyDayRoadmap || {},
    funnelDesign: goToMarket.funnelDesign || {},
    partnershipStrategy: goToMarket.partnershipStrategy || {},
    primaryChannel: goToMarket.channelMix?.[0]?.channel || "Digital marketing with regional focus",
    pricingStrategy: `Position at ${bayesianResults.optimalPrice} SAR to maximize demand`,
    keyMessages: (goToMarket.channelMix || []).slice(0, 3).map((c: any) => c.rationale || ""),
  };

  // Risk analysis
  const riskAnalysis = {
    marketRisks: risks.marketRisks || [],
    competitiveRisks: risks.competitiveRisks || [],
    executionRisks: risks.executionRisks || [],
  };

  // Competitive dynamics
  const competitiveDynamics = competitiveLandscape.competitiveDynamics || {};

  console.log("✅ Transformed investment-grade response:");
  console.log("   Competitors:", competitors.length);
  console.log("   Personas:", personas.length);
  console.log("   Features analyzed:", featureAnalysis.length);

  return {
    competitors,
    competitiveDynamics,
    maxDiffNarrative,
    kanoAnalysis,
    vanWestendorpNarrative,
    brandPositioning,
    personas,
    executiveSummary,
    goToMarketInsights,
    riskAnalysis,
    metadata: parsed.metadata || {},
  };
}

function generateBasicMarketing(bayesianResults: any, smvsConfig: SmvsConfig) {
  console.log("📦 Generating basic marketing fallback...");
  
  const features = Object.entries(bayesianResults.featureWeights || {})
    .sort(([,a]: any, [,b]: any) => b - a);

  // Category-specific competitors
  const categoryCompetitors: Record<string, string[]> = {
    'BEVERAGES': ['Lipton', 'Nestea', 'Arizona', 'Snapple', 'Twinings'],
    'HEALTH_SUPPLEMENTS': ['Nature\'s Bounty', 'GNC', 'Solgar', 'NOW Foods', 'Centrum'],
    'SNACKS': ['Lay\'s', 'Doritos', 'Pringles', 'Cheetos', 'Kettle'],
    'TECH_GADGETS': ['Apple', 'Samsung', 'Sony', 'Bose', 'JBL'],
    'FOOD': ['Nestle', 'Kraft', 'General Mills', 'Kellogg\'s', 'Heinz'],
  };

  const competitorNames = categoryCompetitors[smvsConfig.category?.toUpperCase()] || 
    ['Market Leader', 'Challenger Brand', 'Value Player', 'Premium Brand', 'Regional Player'];

  const competitors = competitorNames.slice(0, 5).map((name, i) => ({
    name,
    status: 55 + (i * 8),
    trust: 60 + (i * 5),
    upgrade: 45 + (i * 10),
    overall: 55 + (i * 7),
    gap: Math.round(bayesianResults.demandProbability * 100) - (55 + (i * 7)),
    products: [],
    positioning: i < 2 ? "Premium" : "Mid-market",
    priceRange: "",
    distribution: "Regional retail",
    strengths: ["Established brand"],
    weaknesses: ["Limited innovation"],
    threatLevel: i < 2 ? "HIGH" : "MEDIUM",
  }));

  const regions = Object.keys(smvsConfig.regions);
  const identitySignals = bayesianResults.identitySignals || { status: 0.33, trust: 0.34, upgrade: 0.33 };

  // Generate meaningful personas based on identity signals
  const personas = [];
  
  if (identitySignals.trust >= 0.3) {
    personas.push({
      name: "The Quality Seeker",
      tagline: "I research everything before buying - quality matters most.",
      segment: "trust_driven",
      size: identitySignals.trust,
      demographics: {
        age: "35-50",
        income: "25,000-40,000 SAR/month",
        occupation: "Senior professionals, managers",
        location: regions[0] || "GCC",
        familyStatus: "Married with children",
        education: "Bachelor's or higher"
      },
      psychographics: {
        coreJob: "Find products I can trust for my family",
        triggerMoment: "Disappointed by a low-quality purchase",
        currentAlternative: "Established international brands",
        successCriteria: "Product performs as advertised",
        obstacles: ["Skeptical of new brands", "Limited time for research"],
        quote: "I research everything before buying - quality matters most.",
        values: ["Quality", "Trust", "Transparency", "Value", "Reliability"]
      },
      bayesianProfile: {
        demandProbability: bayesianResults.demandProbability * 1.1,
        optimalPrice: Math.round(bayesianResults.optimalPrice * 1.15),
        topFeatures: features.slice(0, 3).map(([f]: any) => f),
        identityDrivers: { primary: "trust", weight: Math.round(identitySignals.trust * 100) },
        priceElasticity: "LOW"
      },
      marketingStrategy: {
        coreMessage: "Proven quality you can trust",
        proofPoints: ["Third-party certifications", "Customer testimonials", "Transparent sourcing"],
        channels: [{ rank: 1, channel: "LinkedIn", rationale: "Professional audience", budgetAllocation: "30%", expectedCAC: "SAR 60-80" }],
        objections: [{ objection: "Is this brand reliable?", response: "Show certifications and reviews" }]
      },
      lifetimeValue: {
        firstYearRevenue: `${Math.round(bayesianResults.optimalPrice * 12)} SAR`,
        acquisitionCost: "SAR 70",
        ltvCacRatio: "4.2"
      },
      priority: "PRIMARY",
      recommendations: {
        messaging: "Proven quality you can trust",
        channels: ["LinkedIn", "Industry publications"],
        creativeAngle: "Third-party certifications and transparent sourcing"
      }
    });
  }

  if (identitySignals.status >= 0.3) {
    personas.push({
      name: "The Status Conscious",
      tagline: "I want products that reflect my success and taste.",
      segment: "status_driven",
      size: identitySignals.status,
      demographics: {
        age: "25-40",
        income: "40,000-70,000 SAR/month",
        occupation: "Executives, entrepreneurs, high earners",
        location: regions[0] || "GCC",
        familyStatus: "Single or young married",
        education: "MBA or equivalent"
      },
      psychographics: {
        coreJob: "Signal success and taste to peers",
        triggerMoment: "Promotion or social event",
        currentAlternative: "Ultra-premium international brands",
        successCriteria: "Colleagues notice and ask about it",
        obstacles: ["High expectations", "Risk of looking cheap"],
        quote: "I want products that reflect my success and taste.",
        values: ["Prestige", "Exclusivity", "Brand Image", "Innovation", "Quality"]
      },
      bayesianProfile: {
        demandProbability: bayesianResults.demandProbability * 0.9,
        optimalPrice: Math.round(bayesianResults.optimalPrice * 1.25),
        topFeatures: features.slice(0, 3).map(([f]: any) => f),
        identityDrivers: { primary: "status", weight: Math.round(identitySignals.status * 100) },
        priceElasticity: "LOW"
      },
      marketingStrategy: {
        coreMessage: "Premium quality for discerning tastes",
        proofPoints: ["Exclusive sourcing", "Limited availability", "Premium packaging"],
        channels: [{ rank: 1, channel: "Instagram", rationale: "Visual status display", budgetAllocation: "40%", expectedCAC: "SAR 80-100" }],
        objections: [{ objection: "Is this premium enough?", response: "Exclusive positioning and limited editions" }]
      },
      lifetimeValue: {
        firstYearRevenue: `${Math.round(bayesianResults.optimalPrice * 1.25 * 12)} SAR`,
        acquisitionCost: "SAR 90",
        ltvCacRatio: "4.8"
      },
      priority: "SECONDARY",
      recommendations: {
        messaging: "Premium quality for discerning tastes",
        channels: ["Instagram", "Influencer partnerships"],
        creativeAngle: "Exclusive sourcing and premium packaging"
      }
    });
  }

  if (identitySignals.upgrade >= 0.3) {
    personas.push({
      name: "The Upgrade Seeker",
      tagline: "I'm always looking for something better than what I have.",
      segment: "upgrade_driven",
      size: identitySignals.upgrade,
      demographics: {
        age: "28-45",
        income: "18,000-30,000 SAR/month",
        occupation: "Mid-level professionals, emerging leaders",
        location: regions[1] || regions[0] || "GCC",
        familyStatus: "Various",
        education: "Bachelor's degree"
      },
      psychographics: {
        coreJob: "Improve current situation with better options",
        triggerMoment: "Discovered a better alternative exists",
        currentAlternative: "Current category leader",
        successCriteria: "Noticeable improvement over previous choice",
        obstacles: ["Switching costs", "Uncertainty about benefits"],
        quote: "I'm always looking for something better than what I have.",
        values: ["Innovation", "Improvement", "Value", "Progress", "Optimization"]
      },
      bayesianProfile: {
        demandProbability: bayesianResults.demandProbability,
        optimalPrice: bayesianResults.optimalPrice,
        topFeatures: features.slice(0, 3).map(([f]: any) => f),
        identityDrivers: { primary: "upgrade", weight: Math.round(identitySignals.upgrade * 100) },
        priceElasticity: "MEDIUM"
      },
      marketingStrategy: {
        coreMessage: "The upgrade you've been looking for",
        proofPoints: ["Comparative advantages", "Innovation features", "Value proposition"],
        channels: [{ rank: 1, channel: "YouTube", rationale: "Comparison content", budgetAllocation: "35%", expectedCAC: "SAR 50-70" }],
        objections: [{ objection: "Is it really better?", response: "Side-by-side comparisons and trial offers" }]
      },
      lifetimeValue: {
        firstYearRevenue: `${Math.round(bayesianResults.optimalPrice * 10)} SAR`,
        acquisitionCost: "SAR 55",
        ltvCacRatio: "3.5"
      },
      priority: "PRIMARY",
      recommendations: {
        messaging: "The upgrade you've been looking for",
        channels: ["YouTube", "Comparison sites"],
        creativeAngle: "Side-by-side comparisons and innovation features"
      }
    });
  }

  // Value seeker persona
  personas.push({
    name: "The Value Optimizer",
    tagline: "I want the best quality at a fair price.",
    segment: "value_driven",
    size: Math.max(0.15, 1 - (identitySignals.status + identitySignals.trust + identitySignals.upgrade)),
    demographics: {
      age: "30-50",
      income: "12,000-22,000 SAR/month",
      occupation: "Various professionals",
      location: regions[0] || "GCC",
      familyStatus: "Family-oriented",
      education: "Various"
    },
    psychographics: {
      coreJob: "Maximize value for money spent",
      triggerMoment: "Budget review or price increase on current option",
      currentAlternative: "Mid-market options",
      successCriteria: "Quality-to-price ratio satisfaction",
      obstacles: ["Budget constraints", "Risk aversion"],
      quote: "I want the best quality at a fair price.",
      values: ["Value", "Quality", "Practicality", "Savings", "Reliability"]
    },
    bayesianProfile: {
      demandProbability: bayesianResults.demandProbability * 0.85,
      optimalPrice: Math.round(bayesianResults.optimalPrice * 0.9),
      topFeatures: features.slice(0, 3).map(([f]: any) => f),
      identityDrivers: { primary: "value", weight: 60 },
      priceElasticity: "HIGH"
    },
    marketingStrategy: {
      coreMessage: "Premium quality at a fair price",
      proofPoints: ["Value comparison", "Cost-per-use analysis", "Bundle savings"],
      channels: [{ rank: 1, channel: "Google Search", rationale: "Comparison shopping", budgetAllocation: "30%", expectedCAC: "SAR 40-55" }],
      objections: [{ objection: "Is it worth the price?", response: "Total value analysis and guarantees" }]
    },
    lifetimeValue: {
      firstYearRevenue: `${Math.round(bayesianResults.optimalPrice * 0.9 * 8)} SAR`,
      acquisitionCost: "SAR 45",
      ltvCacRatio: "3.0"
    },
    priority: "TERTIARY",
    recommendations: {
      messaging: "Premium quality at a fair price",
      channels: ["Google Search", "Price comparison sites"],
      creativeAngle: "Value comparison and bundle savings"
    }
  });

  // MaxDiff narrative
  const maxDiffNarrative = {
    insight: "Feature importance derived from Bayesian analysis",
    methodology: "MaxDiff utility scoring based on feature weights",
    featureRanking: features.map(([feature, weight]: any, i: number) => ({
      rank: i + 1,
      feature,
      utility: Math.round((weight as number) * 100),
      gap: i === 0 ? 'leader' : `-${Math.round(((features[0]?.[1] as number) - (weight as number)) * 100)} vs #1`
    })),
    roadmap: {
      phase1Launch: { features: features.slice(0, 3).map(([f]: any) => f), expectedDemand: "85%", timeline: "Q1" },
      phase2Enhancement: { features: features.slice(3, 5).map(([f]: any) => f), expectedUplift: "10%", timeline: "+6 months" },
      phase3Delight: { features: features.slice(5).map(([f]: any) => f), timeline: "+12 months" }
    },
    featureMatrix: {
      mustBuild: features.slice(0, Math.ceil(features.length / 3)).map(([f]: any) => f),
      shouldBuild: features.slice(Math.ceil(features.length / 3), Math.ceil(features.length * 2 / 3)).map(([f]: any) => f),
      couldBuild: features.slice(Math.ceil(features.length * 2 / 3)).map(([f]: any) => f),
      shouldSkip: []
    }
  };

  // Kano analysis
  const mkKanoItem = (feature: string, tier: 'must' | 'perf' | 'delight' | 'indiff') => {
    const baseDemand = bayesianResults.demandProbability || 0.5;
    const impact = tier === 'must' ? -30 : tier === 'perf' ? -15 : tier === 'delight' ? -6 : -2;
    return {
      feature,
      demandWithout: Math.max(0, Math.min(1, baseDemand + impact / 100)),
      impact,
      reasoning:
        tier === 'must'
          ? 'Critical expectation—absence significantly reduces demand.'
          : tier === 'perf'
            ? 'More is better—drives measurable lift in demand.'
            : tier === 'delight'
              ? 'Nice-to-have—differentiates but not mandatory.'
              : 'Low influence on purchase decision.'
    };
  };

  const mustHaveFeatures = features.slice(0, Math.ceil(features.length / 3)).map(([f]: any) => String(f));
  const perfFeatures = features.slice(Math.ceil(features.length / 3), Math.ceil(features.length * 2 / 3)).map(([f]: any) => String(f));
  const delightFeatures = features.slice(Math.ceil(features.length * 2 / 3)).map(([f]: any) => String(f));

  const kanoAnalysis = {
    mustHave: mustHaveFeatures.map((f) => mkKanoItem(f, 'must')),
    performance: perfFeatures.map((f) => mkKanoItem(f, 'perf')),
    delighters: delightFeatures.map((f) => mkKanoItem(f, 'delight')),
    indifferent: [] as any[],
  };

  // Van Westendorp narrative
  const optimal = Math.round(bayesianResults.optimalPrice || smvsConfig.pricing.target);
  const tooCheap = Math.round(smvsConfig.pricing.min * 0.9);
  const bargain = Math.round(smvsConfig.pricing.target * 0.85);
  const expensive = Math.round(smvsConfig.pricing.target * 1.15);
  const tooExpensive = Math.round(smvsConfig.pricing.max * 0.9);

  const vanWestendorpNarrative = {
    tooCheap,
    bargain,
    optimalPricePoint: optimal,
    expensive,
    tooExpensive,
    acceptableRange: [Math.round(smvsConfig.pricing.target * 0.93), Math.round(smvsConfig.pricing.target * 1.2)],
    priceArchitecture: {},
    regionalPricing: {},
    psychologicalPricing: {},
    reasoning: `Optimal pricing at ${optimal} SAR balances demand with perceived value in GCC/MENA markets.`
  };

  // Brand positioning
  const brandPositioning = {
    yourPosition: {
      status: Math.round(identitySignals.status * 100),
      trust: Math.round(identitySignals.trust * 100),
      upgrade: Math.round(identitySignals.upgrade * 100),
      overall: Math.round((identitySignals.status + identitySignals.trust + identitySignals.upgrade) / 3 * 100)
    },
    positioningStatement: `A ${smvsConfig.category?.toLowerCase() || 'product'} that delivers on ${features[0]?.[0] || 'quality'} for discerning customers in GCC markets.`,
    blueOceanStrategy: {},
    messagingArchitecture: {},
    vulnerabilities: [
      "New entrant with limited brand recognition in GCC",
      "Price sensitivity in current market conditions"
    ],
    opportunities: [
      "Growing demand for premium options in GCC markets",
      "Gap in market for trust-focused positioning",
      "Digital-first consumers seeking alternatives"
    ]
  };

  console.log("✅ Basic marketing generated - Competitors:", competitors.length, "| Personas:", personas.length);

  return {
    competitors,
    competitiveDynamics: {},
    maxDiffNarrative,
    kanoAnalysis,
    vanWestendorpNarrative,
    brandPositioning,
    personas,
    executiveSummary: {
      launchRecommendation: bayesianResults.psmScore >= 60 ? "PROCEED" : 
        bayesianResults.psmScore >= 40 ? "PROCEED_WITH_CAUTION" : "REVISIT",
      confidenceLevel: bayesianResults.psmScore >= 70 ? "HIGH" : 
        bayesianResults.psmScore >= 50 ? "MEDIUM" : "LOW",
      keyFinding: `${Math.round(bayesianResults.demandProbability * 100)}% demand probability with ${bayesianResults.psmScore}/100 PSM confidence`
    },
    goToMarketInsights: {
      primaryChannel: "Digital marketing with regional focus",
      pricingStrategy: `Position at ${bayesianResults.optimalPrice} SAR to maximize demand`,
      keyMessages: features.slice(0, 3).map(([f]: any) => `Emphasize ${f}`)
    },
    riskAnalysis: {
      marketRisks: [],
      competitiveRisks: [],
      executionRisks: []
    },
    metadata: {}
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  let testId: string | undefined;
  let auditId: string | undefined;

  try {
    const body: GenerateRequest = await req.json();
    testId = body.testId;
    const smvsConfig = body.smvsConfig;

    console.log("=== STARTING INVESTMENT-GRADE ANALYSIS ===", testId);
    
    // Create audit entry
    auditId = await createJobAudit(supabase, testId, "INIT", { smvsConfig });

    const { data: test, error: fetchError } = await supabase
      .from("tests").select("*").eq("id", testId).single();

    if (fetchError || !test) {
      throw new Error("Test not found");
    }

    await supabase.from("tests").update({ status: "GENERATING" }).eq("id", testId);
    await updateJobAudit(supabase, auditId!, "RUNNING");

    // Wrap the entire analysis in a hard timeout
    const analysisPromise = async () => {
      console.log("Step 1: Running Bayesian engine...");
      await updateJobAudit(supabase, auditId!, "RUNNING");
      
      const bayesianResults = await runSmvsPipeline(testId!, smvsConfig);
      console.log("Bayesian engine complete");

      console.log("Step 2: Generating investment-grade marketing intelligence...");
      const marketingIntel = await generateMarketingIntelligence(bayesianResults, test, smvsConfig);
      console.log("Marketing intelligence complete");

      return { bayesianResults, marketingIntel };
    };

    const { bayesianResults, marketingIntel } = await withTimeout(
      analysisPromise(),
      HARD_TIMEOUT_MS,
      `Analysis timed out after ${HARD_TIMEOUT_MS / 1000}s`
    );

    const combinedResults = {
      bayesian_results: bayesianResults,
      max_diff_results: {
        ...marketingIntel.maxDiffNarrative,
        featureMatrix: marketingIntel.maxDiffNarrative?.featureMatrix || {},
        roadmap: marketingIntel.maxDiffNarrative?.roadmap || {},
      },
      kano_results: marketingIntel.kanoAnalysis || {},
      van_westendorp: {
        ...marketingIntel.vanWestendorpNarrative,
        priceArchitecture: marketingIntel.vanWestendorpNarrative?.priceArchitecture || {},
        regionalPricing: marketingIntel.vanWestendorpNarrative?.regionalPricing || {},
      },
      brand_analysis: {
        yourPosition: marketingIntel.brandPositioning?.yourPosition || {},
        competitors: marketingIntel.competitors || [],
        competitiveDynamics: marketingIntel.competitiveDynamics || {},
        positioning: marketingIntel.brandPositioning?.positioningStatement || "",
        blueOceanStrategy: marketingIntel.brandPositioning?.blueOceanStrategy || {},
        messagingArchitecture: marketingIntel.brandPositioning?.messagingArchitecture || {},
        vulnerabilities: marketingIntel.brandPositioning?.vulnerabilities || [],
        opportunities: marketingIntel.brandPositioning?.opportunities || [],
      },
      personas: marketingIntel.personas || [],
      // Store additional investment-grade data
      smvs_config: {
        ...smvsConfig,
        executiveSummary: marketingIntel.executiveSummary || {},
        goToMarketInsights: marketingIntel.goToMarketInsights || {},
        riskAnalysis: marketingIntel.riskAnalysis || {},
        metadata: marketingIntel.metadata || {},
      },
      status: "COMPLETED",
    };

    console.log("Saving investment-grade results to database for test:", testId);
    console.log("Combined results keys:", Object.keys(combinedResults));
    console.log("Personas count:", combinedResults.personas.length);
    console.log("Competitors count:", combinedResults.brand_analysis.competitors.length);
    
    const { data: updateData, error: updateError } = await supabase
      .from("tests")
      .update(combinedResults)
      .eq("id", testId)
      .select();

    if (updateError) {
      console.error("DATABASE UPDATE FAILED:", updateError.message, updateError.details, updateError.hint);
      throw new Error(`Failed to save results: ${updateError.message}`);
    }

    console.log("Database update successful, rows affected:", updateData?.length || 0);
    await updateJobAudit(supabase, auditId!, "COMPLETED");

    console.log("=== INVESTMENT-GRADE ANALYSIS COMPLETE ===", testId);

    return new Response(JSON.stringify({ success: true, ...combinedResults }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error("=== ANALYSIS FAILED ===", testId, msg);

    // Update test to FAILED
    if (testId) {
      await supabase.from("tests").update({ status: "FAILED" }).eq("id", testId);
    }

    // Update audit
    if (auditId) {
      await updateJobAudit(supabase, auditId, "FAILED", msg);
    }

    return new Response(JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
