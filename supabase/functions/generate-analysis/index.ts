import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runSmvsPipeline, type SmvsConfig } from "./lib/analytics/smvs-pipeline.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateRequest {
  testId: string;
  smvsConfig: SmvsConfig;
}

async function generateMarketingIntelligence(
  bayesianResults: any,
  productInfo: any,
  smvsConfig: SmvsConfig
) {
  const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
  
  if (!GROQ_API_KEY) {
    console.warn("No Groq API key - using basic generation");
    return generateBasicMarketing(bayesianResults, smvsConfig);
  }

  const featureLines = Object.entries(bayesianResults.featureWeights || {})
    .sort(([,a]: any, [,b]: any) => b - a)
    .map(([feature, weight]: [string, any]) => `- ${feature}: ${(weight * 100).toFixed(1)}%`)
    .join('\n');

  const regionalLines = Object.entries(bayesianResults.regionalBreakdown || {})
    .map(([region, data]: [string, any]) => 
      `- ${region}: ${(data.demand * 100).toFixed(0)}% demand, ${data.optimalPrice} SAR optimal price`)
    .join('\n');

  const demandCurveLines = bayesianResults.demandCurve?.slice(0, 5)
    .map((point: any) => `- ${point.price} SAR → ${(point.demand * 100).toFixed(0)}% demand`)
    .join('\n') || '';

  const prompt = `You are an expert market research analyst specializing in GCC/MENA markets. Generate comprehensive marketing intelligence based on Bayesian analysis results.

# PRODUCT INFORMATION
Product Name: ${productInfo.product_name}
Category: ${smvsConfig.category}
Description: ${productInfo.product_description}
Features: ${smvsConfig.features.join(", ")}
Price Range: ${smvsConfig.pricing.min} - ${smvsConfig.pricing.max} SAR
Target Markets: ${Object.keys(smvsConfig.regions).join(", ")}

# BAYESIAN ANALYSIS RESULTS
## Core Metrics
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

Generate a complete marketing intelligence package in VALID JSON format with: competitors, maxDiffNarrative, kanoAnalysis, vanWestendorpNarrative, brandPositioning, personas, executiveSummary, goToMarketInsights. Respond ONLY with valid JSON.`;

  try {
    console.log("Calling Groq API with key:", GROQ_API_KEY ? `${GROQ_API_KEY.substring(0, 10)}...` : "MISSING");
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
    
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a market research analyst. Respond ONLY with valid JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    console.log("Groq API response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error response:", errorText);
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Groq API response received, parsing...");
    
    const content = data.choices[0].message.content;
    const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsed = JSON.parse(cleanedContent);
    console.log("Marketing intelligence generated successfully");
    return parsed;
  } catch (error) {
    console.error("Groq API error:", error);
    console.log("Falling back to basic marketing generation");
    return generateBasicMarketing(bayesianResults, smvsConfig);
  }
}

function generateBasicMarketing(bayesianResults: any, smvsConfig: SmvsConfig) {
  const features = Object.entries(bayesianResults.featureWeights || {})
    .sort(([,a]: any, [,b]: any) => b - a);

  return {
    competitors: [
      { name: "Competitor A", status: 60, trust: 65, upgrade: 50, overall: 58, gap: Math.round(bayesianResults.demandProbability * 100) - 58 }
    ],
    maxDiffNarrative: {
      insight: "Feature importance ranked by Bayesian weights",
      featureRanking: features.map(([feature, weight]: any, i: number) => ({
        rank: i + 1, feature, utility: Math.round(weight * 100), strategicImplication: "Focus marketing on this feature"
      }))
    },
    personas: [{
      name: "Primary Buyer", segment: "main", size: 0.6,
      demographics: { age: "30-45", income: "Medium-High", location: Object.keys(smvsConfig.regions)[0] },
      bayesianProfile: {
        demandProbability: bayesianResults.demandProbability,
        optimalPrice: bayesianResults.optimalPrice,
        topFeatures: features.slice(0, 3).map(([f]: any) => f),
        identityDrivers: bayesianResults.identitySignals
      }
    }],
    executiveSummary: {
      launchRecommendation: bayesianResults.psmScore > 70 ? "PROCEED" : "PROCEED_WITH_CAUTION",
      confidenceLevel: bayesianResults.psmScore > 75 ? "HIGH" : "MEDIUM",
      keyFinding: `${Math.round(bayesianResults.demandProbability * 100)}% demand probability with ${bayesianResults.psmScore} PSM confidence`
    }
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { testId, smvsConfig }: GenerateRequest = await req.json();
    console.log("=== STARTING ANALYSIS ===", testId);

    const { data: test, error: fetchError } = await supabase
      .from("tests").select("*").eq("id", testId).single();

    if (fetchError || !test) throw new Error("Test not found");

    await supabase.from("tests").update({ status: "GENERATING" }).eq("id", testId);

    try {
      console.log("Step 1: Running Bayesian engine...");
      const bayesianResults = await runSmvsPipeline(testId, smvsConfig);
      
      console.log("Step 2: Generating marketing intelligence...");
      const marketingIntel = await generateMarketingIntelligence(bayesianResults, test, smvsConfig);

      const combinedResults = {
        bayesian_results: bayesianResults,
        competitors: marketingIntel.competitors || [],
        max_diff_results: marketingIntel.maxDiffNarrative || {},
        kano_results: marketingIntel.kanoAnalysis || {},
        van_westendorp: marketingIntel.vanWestendorpNarrative || {},
        brand_analysis: {
          yourPosition: marketingIntel.brandPositioning?.yourPosition || {},
          competitors: marketingIntel.competitors || [],
          positioning: marketingIntel.brandPositioning?.positioningStatement || "",
        },
        personas: marketingIntel.personas || [],
        status: "COMPLETED"
      };

      await supabase.from("tests").update(combinedResults).eq("id", testId);

      return new Response(JSON.stringify({ success: true, ...combinedResults }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (analysisError: unknown) {
      console.error("Analysis failed:", analysisError);
      await supabase.from("tests").update({ status: "FAILED" }).eq("id", testId);
      const msg = analysisError instanceof Error ? analysisError.message : 'Unknown error';
      return new Response(JSON.stringify({ error: "Analysis failed", details: msg }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

  } catch (error: unknown) {
    console.error("Request error:", error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
