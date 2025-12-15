import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SmvsConfig {
  category: string;
  regions: Record<string, number>;
  identitySignals: Record<string, number>;
  pricing: { min: number; target: number; max: number };
  features: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { testId } = await req.json();
    console.log("=== REGENERATE MARKETING ONLY ===", testId);

    // Fetch existing test with bayesian results
    const { data: test, error: fetchError } = await supabase
      .from("tests")
      .select("*")
      .eq("id", testId)
      .single();

    if (fetchError || !test) {
      throw new Error("Test not found");
    }

    if (!test.bayesian_results) {
      throw new Error("No Bayesian results found - run full analysis first");
    }

    const bayesianResults = test.bayesian_results;
    const smvsConfig: SmvsConfig = test.smvs_config || {
      category: test.category || "HEALTH_SUPPLEMENTS",
      regions: { GCC: 0.6, MENA: 0.4 },
      identitySignals: { status: 0.5, trust: 0.5, upgrade: 0.5 },
      pricing: {
        min: test.price_min || 10,
        target: test.price_target || 50,
        max: test.price_max || 100,
      },
      features: test.features || [],
    };

    // Generate marketing intelligence
    const marketingIntel = await generateMarketingIntelligence(
      bayesianResults,
      test,
      smvsConfig
    );

    // Update only marketing-related fields (don't touch bayesian_results)
    const updatePayload = {
      max_diff_results: marketingIntel.maxDiffNarrative || {},
      kano_results: marketingIntel.kanoAnalysis || {},
      van_westendorp: marketingIntel.vanWestendorpNarrative || {},
      brand_analysis: {
        yourPosition: marketingIntel.brandPositioning?.yourPosition || {},
        competitors: marketingIntel.competitors || [],
        positioning: marketingIntel.brandPositioning?.positioningStatement || "",
        vulnerabilities: marketingIntel.brandPositioning?.vulnerabilities || [],
        opportunities: marketingIntel.brandPositioning?.opportunities || [],
      },
      personas: marketingIntel.personas || [],
    };

    console.log("Updating marketing fields for test:", testId);
    console.log("   Competitors:", updatePayload.brand_analysis.competitors.length);
    console.log("   Personas:", updatePayload.personas.length);

    const { error: updateError } = await supabase
      .from("tests")
      .update(updatePayload)
      .eq("id", testId);

    if (updateError) {
      console.error("DATABASE UPDATE FAILED:", updateError);
      throw new Error(`Failed to save results: ${updateError.message}`);
    }

    console.log("=== MARKETING REGENERATION COMPLETE ===", testId);

    return new Response(JSON.stringify({ success: true, ...updatePayload }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("=== MARKETING REGENERATION FAILED ===", msg);

    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ============ Marketing Intelligence Generation ============

async function generateMarketingIntelligence(
  bayesianResults: any,
  productInfo: any,
  smvsConfig: SmvsConfig
) {
  const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");

  console.log("=== MARKETING INTELLIGENCE GENERATION ===");
  console.log("GROQ_API_KEY present:", !!GROQ_API_KEY);

  if (!GROQ_API_KEY) {
    console.warn("❌ No Groq API key - using fallback");
    return generateBasicMarketing(bayesianResults, smvsConfig);
  }

  const featureLines = Object.entries(bayesianResults.featureWeights || {})
    .sort(([, a]: any, [, b]: any) => b - a)
    .map(([feature, weight]: [string, any]) => `- ${feature}: ${(weight * 100).toFixed(1)}%`)
    .join("\n");

  const regionalLines = Object.entries(bayesianResults.regionalBreakdown || {})
    .map(
      ([region, data]: [string, any]) =>
        `- ${region}: ${(data.demand * 100).toFixed(0)}% demand, ${data.optimalPrice} SAR`
    )
    .join("\n");

  const prompt = `You are an expert market research analyst specializing in GCC/MENA markets.
Return a marketing intelligence package in VALID JSON matching this schema EXACTLY (no extra wrapper keys):

{
  "competitors": [{"name": string, "status": number, "trust": number, "upgrade": number, "overall": number, "gap": number}],
  "maxDiffNarrative": {
    "insight": string,
    "featureRanking": [{"rank": number, "feature": string, "utility": number, "gap": string}]
  },
  "kanoAnalysis": {
    "mustHave": [{"feature": string, "demandWithout": number, "impact": number, "reasoning": string}],
    "performance": [{"feature": string, "demandWithout": number, "impact": number, "reasoning": string}],
    "delighters": [{"feature": string, "demandWithout": number, "impact": number, "reasoning": string}],
    "indifferent": []
  },
  "vanWestendorpNarrative": {
    "tooCheap": number, "bargain": number, "optimalPricePoint": number, "expensive": number, "tooExpensive": number,
    "acceptableRange": [number, number], "reasoning": string
  },
  "brandPositioning": {
    "yourPosition": {"status": number, "trust": number, "upgrade": number, "overall": number},
    "positioningStatement": string, "vulnerabilities": [string], "opportunities": [string]
  },
  "personas": [{
    "name": string, "segment": string, "size": number,
    "demographics": {"age": string, "income": string, "location": string},
    "psychographics": {"quote": string, "values": [string]},
    "bayesianProfile": {"demandProbability": number, "optimalPrice": number, "featurePreferences": object, "identityDrivers": object},
    "recommendations": {"messaging": string, "channels": [string], "creativeAngle": string}
  }],
  "executiveSummary": {"launchRecommendation": string, "confidenceLevel": string, "keyFinding": string},
  "goToMarketInsights": {"primaryChannel": string, "pricingStrategy": string, "keyMessages": [string]}
}

# PRODUCT INFORMATION
Product Name: ${productInfo.product_name}
Category: ${smvsConfig.category}
Description: ${productInfo.product_description}
Features: ${smvsConfig.features.join(", ")}
Price Range: ${smvsConfig.pricing.min} - ${smvsConfig.pricing.max} SAR
Target Markets: ${Object.keys(smvsConfig.regions).join(", ")}

# BAYESIAN ANALYSIS RESULTS
- Demand Probability: ${(bayesianResults.demandProbability * 100).toFixed(1)}%
- PSM Confidence Score: ${bayesianResults.psmScore}/100
- Optimal Price: ${bayesianResults.optimalPrice} SAR

## Feature Importance
${featureLines}

## Identity Signals
- Status: ${((bayesianResults.identitySignals?.status || 0.33) * 100).toFixed(0)}%
- Trust: ${((bayesianResults.identitySignals?.trust || 0.34) * 100).toFixed(0)}%
- Upgrade: ${((bayesianResults.identitySignals?.upgrade || 0.33) * 100).toFixed(0)}%

## Regional Breakdown
${regionalLines}

Respond ONLY with valid JSON (no markdown, no code fences).`;

  try {
    console.log("🚀 Calling Groq API...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Return ONLY valid JSON matching the requested schema." },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 4000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Groq API error:", response.status, errorText);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.warn("⚠️ Empty Groq response");
      return generateBasicMarketing(bayesianResults, smvsConfig);
    }

    const cleanedContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleanedContent);
    } catch {
      console.error("❌ JSON parse failed");
      return generateBasicMarketing(bayesianResults, smvsConfig);
    }

    // Normalize wrapped responses
    const root = parsed?.marketingIntelligencePackage || parsed?.marketingIntelligence || parsed;

    if (!root || !root.competitors?.length || !root.personas?.length) {
      console.warn("⚠️ Invalid Groq payload - using fallback");
      return generateBasicMarketing(bayesianResults, smvsConfig);
    }

    console.log("✅ Groq marketing generated - Competitors:", root.competitors.length, "| Personas:", root.personas.length);
    return root;
  } catch (error) {
    console.error("❌ Groq call failed:", error instanceof Error ? error.message : error);
    return generateBasicMarketing(bayesianResults, smvsConfig);
  }
}

function generateBasicMarketing(bayesianResults: any, smvsConfig: SmvsConfig) {
  console.log("📦 Generating basic marketing fallback...");

  const features = Object.entries(bayesianResults.featureWeights || {}).sort(
    ([, a]: any, [, b]: any) => b - a
  );

  const categoryCompetitors: Record<string, string[]> = {
    BEVERAGES: ["Lipton", "Nestea", "Arizona", "Snapple"],
    HEALTH_SUPPLEMENTS: ["Nature's Bounty", "GNC", "Solgar", "NOW Foods"],
    SNACKS: ["Lay's", "Doritos", "Pringles", "Cheetos"],
    TECH_GADGETS: ["Apple", "Samsung", "Sony", "Bose"],
    FOOD: ["Nestle", "Kraft", "General Mills", "Kellogg's"],
  };

  const competitorNames =
    categoryCompetitors[smvsConfig.category?.toUpperCase()] ||
    ["Market Leader", "Challenger Brand", "Value Player"];

  const competitors = competitorNames.slice(0, 3).map((name, i) => ({
    name,
    status: 55 + i * 8,
    trust: 60 + i * 5,
    upgrade: 45 + i * 10,
    overall: 55 + i * 7,
    gap: Math.round(bayesianResults.demandProbability * 100) - (55 + i * 7),
  }));

  const regions = Object.keys(smvsConfig.regions);
  const identitySignals = bayesianResults.identitySignals || { status: 0.33, trust: 0.34, upgrade: 0.33 };

  const personas = [];

  if (identitySignals.trust >= 0.3) {
    personas.push({
      name: "The Quality Seeker",
      segment: "trust_driven",
      size: identitySignals.trust,
      demographics: { age: "35-50", income: "High", location: regions[0] || "GCC" },
      psychographics: {
        quote: "I research everything before buying - quality matters most.",
        values: ["Quality", "Trust", "Transparency"],
      },
      bayesianProfile: {
        demandProbability: bayesianResults.demandProbability * 1.1,
        optimalPrice: bayesianResults.optimalPrice * 1.15,
        topFeatures: features.slice(0, 3).map(([f]: any) => f),
        identityDrivers: { primary: "trust", weight: identitySignals.trust },
      },
    });
  }

  if (identitySignals.status >= 0.3) {
    personas.push({
      name: "The Status Conscious",
      segment: "status_driven",
      size: identitySignals.status,
      demographics: { age: "25-40", income: "Very High", location: regions[0] || "GCC" },
      psychographics: {
        quote: "I want products that reflect my success and taste.",
        values: ["Prestige", "Exclusivity", "Brand Image"],
      },
      bayesianProfile: {
        demandProbability: bayesianResults.demandProbability * 0.9,
        optimalPrice: bayesianResults.optimalPrice * 1.25,
        topFeatures: features.slice(0, 3).map(([f]: any) => f),
        identityDrivers: { primary: "status", weight: identitySignals.status },
      },
    });
  }

  if (identitySignals.upgrade >= 0.3) {
    personas.push({
      name: "The Upgrade Seeker",
      segment: "upgrade_driven",
      size: identitySignals.upgrade,
      demographics: { age: "28-45", income: "Medium-High", location: regions[1] || regions[0] || "GCC" },
      psychographics: {
        quote: "I'm always looking for something better than what I have.",
        values: ["Innovation", "Improvement", "Value"],
      },
      bayesianProfile: {
        demandProbability: bayesianResults.demandProbability,
        optimalPrice: bayesianResults.optimalPrice,
        topFeatures: features.slice(0, 3).map(([f]: any) => f),
        identityDrivers: { primary: "upgrade", weight: identitySignals.upgrade },
      },
    });
  }

  if (personas.length === 0) {
    personas.push({
      name: "Primary Buyer",
      segment: "general",
      size: 0.6,
      demographics: { age: "30-45", income: "Medium-High", location: regions[0] || "GCC" },
      psychographics: {
        quote: "I want quality products at fair prices.",
        values: ["Value", "Quality", "Convenience"],
      },
      bayesianProfile: {
        demandProbability: bayesianResults.demandProbability,
        optimalPrice: bayesianResults.optimalPrice,
        topFeatures: features.slice(0, 3).map(([f]: any) => f),
        identityDrivers: identitySignals,
      },
    });
  }

  const mkKanoItem = (feature: string, tier: "must" | "perf" | "delight") => {
    const baseDemand = bayesianResults.demandProbability || 0.5;
    const impact = tier === "must" ? -30 : tier === "perf" ? -15 : -6;
    return {
      feature,
      demandWithout: Math.max(0, baseDemand + impact / 100),
      impact,
      reasoning:
        tier === "must"
          ? "Critical expectation."
          : tier === "perf"
            ? "More is better."
            : "Nice-to-have differentiator.",
    };
  };

  const mustHaveFeatures = features.slice(0, Math.ceil(features.length / 3)).map(([f]: any) => String(f));
  const perfFeatures = features.slice(Math.ceil(features.length / 3), Math.ceil(features.length * 2 / 3)).map(([f]: any) => String(f));
  const delightFeatures = features.slice(Math.ceil(features.length * 2 / 3)).map(([f]: any) => String(f));

  const optimal = Math.round(bayesianResults.optimalPrice || smvsConfig.pricing.target);

  console.log("✅ Basic marketing generated - Competitors:", competitors.length, "| Personas:", personas.length);

  return {
    competitors,
    maxDiffNarrative: {
      insight: "Feature importance derived from Bayesian analysis",
      featureRanking: features.map(([feature, weight]: any, i: number) => ({
        rank: i + 1,
        feature,
        utility: Math.round((weight as number) * 100),
        gap: i === 0 ? "leader" : `-${Math.round(((features[0]?.[1] as number) - (weight as number)) * 100)} vs #1`,
      })),
    },
    kanoAnalysis: {
      mustHave: mustHaveFeatures.map((f) => mkKanoItem(f, "must")),
      performance: perfFeatures.map((f) => mkKanoItem(f, "perf")),
      delighters: delightFeatures.map((f) => mkKanoItem(f, "delight")),
      indifferent: [],
    },
    vanWestendorpNarrative: {
      tooCheap: Math.round(smvsConfig.pricing.min * 0.9),
      bargain: Math.round(smvsConfig.pricing.target * 0.85),
      optimalPricePoint: optimal,
      expensive: Math.round(smvsConfig.pricing.target * 1.15),
      tooExpensive: Math.round(smvsConfig.pricing.max * 0.9),
      acceptableRange: [
        Math.round(smvsConfig.pricing.target * 0.93),
        Math.round(smvsConfig.pricing.target * 1.2),
      ],
      reasoning: `Optimal pricing at ${optimal} SAR balances demand with perceived value.`,
    },
    brandPositioning: {
      yourPosition: {
        status: Math.round(identitySignals.status * 100),
        trust: Math.round(identitySignals.trust * 100),
        upgrade: Math.round(identitySignals.upgrade * 100),
        overall: Math.round((identitySignals.status + identitySignals.trust + identitySignals.upgrade) / 3 * 100),
      },
      positioningStatement: `A ${smvsConfig.category?.toLowerCase() || "product"} delivering on ${features[0]?.[0] || "quality"} for discerning customers.`,
      vulnerabilities: ["New entrant with limited brand recognition", "Price sensitivity in current market"],
      opportunities: ["Growing premium demand in GCC", "Gap in market for trust-focused positioning"],
    },
    personas,
    executiveSummary: {
      launchRecommendation: bayesianResults.psmScore >= 60 ? "PROCEED" : "PROCEED_WITH_CAUTION",
      confidenceLevel: bayesianResults.psmScore >= 70 ? "HIGH" : "MEDIUM",
      keyFinding: `${Math.round(bayesianResults.demandProbability * 100)}% demand with ${bayesianResults.psmScore}/100 PSM`,
    },
    goToMarketInsights: {
      primaryChannel: "Digital marketing with regional focus",
      pricingStrategy: `Position at ${optimal} SAR`,
      keyMessages: features.slice(0, 3).map(([f]: any) => `Emphasize ${f}`),
    },
  };
}
