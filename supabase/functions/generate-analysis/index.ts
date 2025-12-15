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
    const elapsed = Date.now() - startTime;

    console.log("📥 Groq API response received in", elapsed, "ms");
    console.log("   Status:", response.status, response.statusText);
    console.log("   Headers:", JSON.stringify(Object.fromEntries(response.headers.entries())));
    
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
    
    const content = data.choices[0].message.content;
    console.log("📄 Response content length:", content?.length || 0, "characters");
    console.log("📄 Response preview:", content?.substring(0, 200) + "...");
    
    const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const parsed = JSON.parse(cleanedContent);
      console.log("✅ Marketing intelligence JSON parsed successfully");
      console.log("   Keys:", Object.keys(parsed).join(", "));
      console.log("   Competitors count:", parsed.competitors?.length || 0);
      console.log("   Personas count:", parsed.personas?.length || 0);
      return parsed;
    } catch (parseError) {
      console.error("❌ Failed to parse Groq response as JSON:");
      console.error("   Parse error:", parseError);
      console.error("   Raw content (first 500 chars):", cleanedContent.substring(0, 500));
      throw parseError;
    }
  } catch (error) {
    console.error("❌ Groq API call failed:");
    console.error("   Error type:", error?.constructor?.name);
    console.error("   Error message:", error instanceof Error ? error.message : String(error));
    console.error("   Stack:", error instanceof Error ? error.stack : "N/A");
    console.log("⚠️ Falling back to basic marketing generation");
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
        executiveSummary: marketingIntel.executiveSummary || {},
        goToMarket: marketingIntel.goToMarketInsights || {},
      },
      personas: marketingIntel.personas || [],
      status: "COMPLETED"
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
