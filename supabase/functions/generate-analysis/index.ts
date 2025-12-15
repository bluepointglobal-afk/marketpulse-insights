import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runSmvsPipeline, type SmvsConfig } from "./lib/analytics/smvs-pipeline.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HARD_TIMEOUT_MS = 55000; // 55 seconds hard timeout (Supabase has 60s limit)

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
  console.log("GROQ_API_KEY length:", GROQ_API_KEY?.length || 0);

  if (!GROQ_API_KEY) {
    console.warn("❌ No Groq API key configured - using basic generation");
    return generateBasicMarketing(bayesianResults, smvsConfig);
  }

  const featureLines = Object.entries(bayesianResults.featureWeights || {})
    .sort(([, a]: any, [, b]: any) => b - a)
    .map(
      ([feature, weight]: [string, any]) => `- ${feature}: ${(weight * 100).toFixed(1)}%`
    )
    .join("\n");

  const regionalLines = Object.entries(bayesianResults.regionalBreakdown || {})
    .map(
      ([region, data]: [string, any]) =>
        `- ${region}: ${(data.demand * 100).toFixed(0)}% demand, ${data.optimalPrice} SAR optimal price`
    )
    .join("\n");

  const demandCurveLines =
    bayesianResults.demandCurve
      ?.slice(0, 5)
      .map((point: any) => `- ${point.price} SAR → ${(point.demand * 100).toFixed(0)}% demand`)
      .join("\n") || "";

  // IMPORTANT: prompt schema must match what we save + what UI expects
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
    "indifferent": [{"feature": string, "demandWithout": number, "impact": number, "reasoning": string}]
  },
  "vanWestendorpNarrative": {
    "tooCheap": number,
    "bargain": number,
    "optimalPricePoint": number,
    "expensive": number,
    "tooExpensive": number,
    "acceptableRange": [number, number],
    "reasoning": string
  },
  "brandPositioning": {
    "yourPosition": {"status": number, "trust": number, "upgrade": number, "overall": number},
    "positioningStatement": string,
    "vulnerabilities": [string],
    "opportunities": [string]
  },
  "personas": [{
    "name": string,
    "segment": string,
    "size": number,
    "demographics": {"age": string, "income": string, "location": string},
    "psychographics": {"quote": string, "values": [string]},
    "bayesianProfile": {"demandProbability": number, "optimalPrice": number, "featurePreferences": object, "identityDrivers": object},
    "recommendations": {"messaging": string, "channels": [string], "creativeAngle": string}
  }],
  "executiveSummary": {
    "launchRecommendation": string,
    "confidenceLevel": string,
    "keyFinding": string
  },
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
- Status: ${(bayesianResults.identitySignals.status * 100).toFixed(0)}%
- Trust: ${(bayesianResults.identitySignals.trust * 100).toFixed(0)}%
- Upgrade: ${(bayesianResults.identitySignals.upgrade * 100).toFixed(0)}%

## Regional Breakdown
${regionalLines}

## Demand Curve
${demandCurveLines}

Respond ONLY with valid JSON that matches the schema (no markdown, no code fences).`;

  console.log("📝 Prompt length:", prompt.length, "characters");
  console.log("📊 Input data - Product:", productInfo.product_name, "| Category:", smvsConfig.category);
  console.log("📊 Bayesian results - Demand:", bayesianResults.demandProbability, "| PSM:", bayesianResults.psmScore);

  try {
    console.log("🚀 Calling Groq API...");
    console.log("   Model: llama-3.3-70b-versatile");
    console.log("   Timeout: 45 seconds");

    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log("⏱️ Groq API timeout triggered after 45s");
      controller.abort();
    }, 45000);

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
            content: "You are a market research analyst. Return ONLY valid JSON matching the requested schema.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 4000,
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
    console.log("📄 Response preview:", (content || "").substring(0, 200) + "...");

    if (!content) {
      console.warn("⚠️ Groq returned empty content - falling back");
      return generateBasicMarketing(bayesianResults, smvsConfig);
    }

    const cleanedContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("❌ Failed to parse Groq response as JSON:");
      console.error("   Parse error:", parseError);
      console.error("   Raw content (first 500 chars):", cleanedContent.substring(0, 500));
      return generateBasicMarketing(bayesianResults, smvsConfig);
    }

    // Normalize legacy/wrapped responses
    const root = parsed?.marketingIntelligencePackage || parsed?.marketingIntelligence || parsed;

    const competitorsCount = root?.competitors?.length || 0;
    const personasCount = root?.personas?.length || 0;
    console.log("✅ Marketing intelligence normalized");
    console.log("   Top-level keys:", Object.keys(root || {}).join(", "));
    console.log("   Competitors count:", competitorsCount);
    console.log("   Personas count:", personasCount);

    // Guardrail: if model returned empty marketing, fall back to deterministic basic output
    if (!root || competitorsCount === 0 || personasCount === 0) {
      console.warn("⚠️ Groq returned empty/invalid marketing payload - using fallback");
      return generateBasicMarketing(bayesianResults, smvsConfig);
    }

    return root;
  } catch (error) {
    console.error("❌ Groq API call failed:");
    console.error("   Error type:", (error as any)?.constructor?.name);
    console.error("   Error message:", error instanceof Error ? error.message : String(error));
    console.error("   Stack:", error instanceof Error ? error.stack : "N/A");
    console.log("⚠️ Falling back to basic marketing generation");
    return generateBasicMarketing(bayesianResults, smvsConfig);
  }
}

function generateBasicMarketing(bayesianResults: any, smvsConfig: SmvsConfig) {
  console.log("📦 Generating basic marketing fallback...");
  
  const features = Object.entries(bayesianResults.featureWeights || {})
    .sort(([,a]: any, [,b]: any) => b - a);

  // Category-specific competitors
  const categoryCompetitors: Record<string, string[]> = {
    'BEVERAGES': ['Lipton', 'Nestea', 'Arizona', 'Snapple'],
    'HEALTH_SUPPLEMENTS': ['Nature\'s Bounty', 'GNC', 'Solgar', 'NOW Foods'],
    'SNACKS': ['Lay\'s', 'Doritos', 'Pringles', 'Cheetos'],
    'TECH_GADGETS': ['Apple', 'Samsung', 'Sony', 'Bose'],
    'FOOD': ['Nestle', 'Kraft', 'General Mills', 'Kellogg\'s'],
  };

  const competitorNames = categoryCompetitors[smvsConfig.category?.toUpperCase()] || 
    ['Market Leader', 'Challenger Brand', 'Value Player'];

  const competitors = competitorNames.slice(0, 3).map((name, i) => ({
    name,
    status: 55 + (i * 8),
    trust: 60 + (i * 5),
    upgrade: 45 + (i * 10),
    overall: 55 + (i * 7),
    gap: Math.round(bayesianResults.demandProbability * 100) - (55 + (i * 7))
  }));

  const regions = Object.keys(smvsConfig.regions);
  const identitySignals = bayesianResults.identitySignals || { status: 0.33, trust: 0.34, upgrade: 0.33 };

  // Generate meaningful personas based on identity signals
  const personas = [];
  
  if (identitySignals.trust >= 0.3) {
    personas.push({
      name: "The Quality Seeker",
      segment: "trust_driven",
      size: identitySignals.trust,
      demographics: {
        age: "35-50",
        income: "High",
        location: regions[0] || "GCC"
      },
      psychographics: {
        quote: "I research everything before buying - quality matters most.",
        values: ["Quality", "Trust", "Transparency"],
        painPoints: ["Low quality products", "Misleading claims"]
      },
      bayesianProfile: {
        demandProbability: bayesianResults.demandProbability * 1.1,
        optimalPrice: bayesianResults.optimalPrice * 1.15,
        topFeatures: features.slice(0, 3).map(([f]: any) => f),
        identityDrivers: { primary: "trust", weight: identitySignals.trust }
      }
    });
  }

  if (identitySignals.status >= 0.3) {
    personas.push({
      name: "The Status Conscious",
      segment: "status_driven",
      size: identitySignals.status,
      demographics: {
        age: "25-40",
        income: "Very High",
        location: regions[0] || "GCC"
      },
      psychographics: {
        quote: "I want products that reflect my success and taste.",
        values: ["Prestige", "Exclusivity", "Brand Image"],
        painPoints: ["Mass market products", "Lack of exclusivity"]
      },
      bayesianProfile: {
        demandProbability: bayesianResults.demandProbability * 0.9,
        optimalPrice: bayesianResults.optimalPrice * 1.25,
        topFeatures: features.slice(0, 3).map(([f]: any) => f),
        identityDrivers: { primary: "status", weight: identitySignals.status }
      }
    });
  }

  if (identitySignals.upgrade >= 0.3) {
    personas.push({
      name: "The Upgrade Seeker",
      segment: "upgrade_driven",
      size: identitySignals.upgrade,
      demographics: {
        age: "28-45",
        income: "Medium-High",
        location: regions[1] || regions[0] || "GCC"
      },
      psychographics: {
        quote: "I'm always looking for something better than what I have.",
        values: ["Innovation", "Improvement", "Value"],
        painPoints: ["Stagnant products", "Poor value proposition"]
      },
      bayesianProfile: {
        demandProbability: bayesianResults.demandProbability,
        optimalPrice: bayesianResults.optimalPrice,
        topFeatures: features.slice(0, 3).map(([f]: any) => f),
        identityDrivers: { primary: "upgrade", weight: identitySignals.upgrade }
      }
    });
  }

  // Ensure at least one persona
  if (personas.length === 0) {
    personas.push({
      name: "Primary Buyer",
      segment: "general",
      size: 0.6,
      demographics: {
        age: "30-45",
        income: "Medium-High",
        location: regions[0] || "GCC"
      },
      psychographics: {
        quote: "I want quality products at fair prices.",
        values: ["Value", "Quality", "Convenience"],
        painPoints: ["Overpriced products", "Poor quality"]
      },
      bayesianProfile: {
        demandProbability: bayesianResults.demandProbability,
        optimalPrice: bayesianResults.optimalPrice,
        topFeatures: features.slice(0, 3).map(([f]: any) => f),
        identityDrivers: identitySignals
      }
    });
  }

  // MaxDiff narrative
  const maxDiffNarrative = {
    insight: "Feature importance derived from Bayesian analysis",
    methodology: "MaxDiff utility scoring based on feature weights",
    featureRanking: features.map(([feature, weight]: any, i: number) => ({
      rank: i + 1,
      feature,
      utility: Math.round((weight as number) * 100),
      gap: i === 0 ? 'leader' : `-${Math.round(((features[0]?.[1] as number) - (weight as number)) * 100)} vs #1`
    }))
  };

  // Kano analysis (shape must match frontend expectations)
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

  // Van Westendorp narrative (shape must match frontend expectations)
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
    positioningStatement: `A ${smvsConfig.category?.toLowerCase() || 'product'} that delivers on ${features[0]?.[0] || 'quality'} for discerning customers.`,
    vulnerabilities: [
      "New entrant with limited brand recognition",
      "Price sensitivity in current market conditions"
    ],
    opportunities: [
      "Growing demand for premium options in GCC",
      "Gap in market for trust-focused positioning"
    ]
  };

  console.log("✅ Basic marketing generated - Competitors:", competitors.length, "| Personas:", personas.length);

  return {
    competitors,
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
    }
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

    console.log("=== STARTING ANALYSIS ===", testId);
    
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

      console.log("Step 2: Generating marketing intelligence...");
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
      status: "COMPLETED",
    };

    console.log("Saving results to database for test:", testId);
    console.log("Combined results keys:", Object.keys(combinedResults));
    
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

    console.log("=== ANALYSIS COMPLETE ===", testId);

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
