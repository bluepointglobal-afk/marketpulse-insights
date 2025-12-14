import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runSmvsPipeline } from "./lib/analytics/smvs-pipeline.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateRequest {
  testId: string;
  smvsConfig: {
    category: string;
    regions: Record<string, number>;
    identitySignals: Record<string, number>;
    pricing: { min: number; target: number; max: number };
    features: string[];
  };
}

// Generate marketing intelligence using Groq API
async function generateMarketingIntelligence(
  bayesianResults: any,
  productInfo: any,
  smvsConfig: any
) {
  const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
  
  if (!GROQ_API_KEY) {
    console.warn("No Groq API key - using basic generation");
    return generateBasicMarketing(bayesianResults, smvsConfig);
  }

  const prompt = `You are an expert market research analyst specializing in GCC/MENA markets. Generate comprehensive marketing intelligence based on Bayesian analysis results.

# PRODUCT INFORMATION
Product Name: ${productInfo.product_name}
Category: ${smvsConfig.category}
Description: ${productInfo.product_description}
Features: ${smvsConfig.features.join(", ")}
Price Range: ${smvsConfig.pricing.min} - ${smvsConfig.pricing.max} SAR
Target Markets: ${Object.keys(smvsConfig.regions).join(", ")}

# BAYESIAN ANALYSIS RESULTS (MATHEMATICAL FACTS - USE AS CONSTRAINTS)

## Core Metrics
- Demand Probability: ${(bayesianResults.demandProbability * 100).toFixed(1)}%
- PSM Confidence Score: ${bayesianResults.psmScore}/100 (${bayesianResults.psmScore > 75 ? 'Very Strong' : bayesianResults.psmScore > 60 ? 'Strong' : 'Moderate'})
- Optimal Price: ${bayesianResults.optimalPrice} SAR
- Confidence Interval: ${(bayesianResults.confidenceInterval[0] * 100).toFixed(0)}% - ${(bayesianResults.confidenceInterval[1] * 100).toFixed(0)}%

## Feature Importance (Bayesian Weights)
${Object.entries(bayesianResults.featureWeights || {})
  .sort(([,a]: any, [,b]: any) => b - a)
  .map(([feature, weight]: [string, any]) => `- ${feature}: ${(weight * 100).toFixed(1)}%`)
  .join('\n')}

## Identity Signals (What Drives Purchase)
- Status Signal: ${(bayesianResults.identitySignals.status * 100).toFixed(0)}%
- Trust Signal: ${(bayesianResults.identitySignals.trust * 100).toFixed(0)}%
- Upgrade Signal: ${(bayesianResults.identitySignals.upgrade * 100).toFixed(0)}%

## Regional Breakdown
${Object.entries(bayesianResults.regionalBreakdown || {})
  .map(([region, data]: [string, any]) => 
    `- ${region}: ${(data.demand * 100).toFixed(0)}% demand, ${data.optimalPrice} SAR optimal price`)
  .join('\n')}

## Demand Curve Data
${bayesianResults.demandCurve?.slice(0, 5).map((point: any) => 
  `- ${point.price} SAR → ${(point.demand * 100).toFixed(0)}% demand`).join('\n')}

---

# YOUR TASK

Generate a complete marketing intelligence package in VALID JSON format. Use the Bayesian results as mathematical constraints - don't contradict the numbers.

RESPOND ONLY WITH THIS JSON STRUCTURE (no markdown, no backticks):

{
  "competitors": [
    {
      "name": "Real competitor name for ${smvsConfig.category} category in GCC/MENA",
      "status": <0-100 number based on brand prestige>,
      "trust": <0-100 based on market reputation>,
      "upgrade": <0-100 perceived innovation>,
      "overall": <calculated weighted average>,
      "gap": <difference vs Bayesian overall score of ${Math.round(bayesianResults.demandProbability * 100)}>
    }
  ],
  "maxDiffNarrative": {
    "insight": "Strategic insight about feature importance based on Bayesian weights",
    "featureRanking": [
      {
        "rank": 1,
        "feature": "<feature name>",
        "utility": <Bayesian weight as 0-100>,
        "strategicImplication": "Why this matters for go-to-market"
      }
    ]
  },
  "kanoAnalysis": {
    "mustHave": [
      {
        "feature": "<feature name>",
        "reasoning": "Why this is table-stakes based on Bayesian impact",
        "demandImpact": <percentage points>,
        "recommendation": "What to do about it"
      }
    ],
    "performance": [...],
    "delighters": [...],
    "indifferent": [...]
  },
  "vanWestendorpNarrative": {
    "optimalPriceReasoning": "Why ${bayesianResults.optimalPrice} SAR is optimal based on demand curve",
    "pricingStrategy": "Recommended pricing approach",
    "regionalPricingRecommendations": {
      "KSA": "Specific recommendation for KSA based on ${bayesianResults.regionalBreakdown?.KSA?.demand || 'N/A'}% demand",
      "UAE": "..."
    }
  },
  "brandPositioning": {
    "yourPosition": {
      "status": <calculated from identity signals>,
      "trust": <calculated from identity signals>,
      "upgrade": <calculated from identity signals>,
      "overall": ${Math.round(bayesianResults.demandProbability * 100)}
    },
    "positioningStatement": "One-sentence brand positioning based on Bayesian identity signals",
    "vulnerabilities": ["Array of competitive vulnerabilities"],
    "opportunities": ["Array of market opportunities"],
    "differentiationStrategy": "How to differentiate based on Bayesian strengths"
  },
  "personas": [
    {
      "name": "Descriptive persona name",
      "segment": "segment_id",
      "size": <segment size from identity signals, sum = 1.0>,
      "demographics": {
        "age": "age range",
        "income": "income bracket",
        "location": "Based on regional breakdown with highest demand"
      },
      "psychographics": {
        "quote": "First-person quote reflecting mindset",
        "values": ["values array"],
        "lifestyle": "lifestyle description"
      },
      "bayesianProfile": {
        "demandProbability": <from regional data>,
        "optimalPrice": <segment-specific price>,
        "topFeatures": ["features they care about from Bayesian weights"],
        "identityDrivers": {
          "primary": "status|trust|upgrade - whichever is highest for this segment",
          "weights": <identity signal weights>
        }
      },
      "recommendations": {
        "messaging": "How to message to this persona",
        "channels": ["marketing channels"],
        "creativeDirection": "Creative approach for this segment"
      }
    }
  ],
  "executiveSummary": {
    "launchRecommendation": "PROCEED|PROCEED_WITH_CAUTION|RECONSIDER based on PSM score",
    "confidenceLevel": "HIGH|MEDIUM|LOW based on PSM ${bayesianResults.psmScore}",
    "keyFinding": "One-sentence synthesis of most important insight",
    "riskFactors": ["Array of key risks"],
    "successFactors": ["Array of success drivers"]
  },
  "goToMarketInsights": {
    "immediate": [
      {
        "action": "Specific action item",
        "reasoning": "Why this matters based on Bayesian results",
        "impact": "HIGH|MEDIUM|LOW",
        "effort": "estimated hours/days",
        "expectedLift": "Expected impact on demand probability"
      }
    ],
    "nearTerm": [...],
    "longTerm": [...]
  }
}

Generate realistic, category-specific content for ${smvsConfig.category} in GCC/MENA markets. Use the Bayesian numbers as mathematical constraints.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a market research analyst. Respond ONLY with valid JSON. No markdown, no backticks, no explanations. Just the JSON object."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Clean and parse JSON (remove markdown if present)
    const cleanedContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const marketingIntel = JSON.parse(cleanedContent);
    
    console.log("Marketing intelligence generated successfully");
    return marketingIntel;

  } catch (error) {
    console.error("Groq API error:", error);
    return generateBasicMarketing(bayesianResults, smvsConfig);
  }
}

// Fallback if Groq API unavailable
function generateBasicMarketing(bayesianResults: any, smvsConfig: any) {
  const features = Object.entries(bayesianResults.featureWeights || {})
    .sort(([,a]: any, [,b]: any) => b - a);

  return {
    competitors: [
      { name: "Competitor A", status: 60, trust: 65, upgrade: 50, overall: 58, gap: Math.round(bayesianResults.demandProbability * 100) - 58 },
      { name: "Competitor B", status: 45, trust: 50, upgrade: 40, overall: 45, gap: Math.round(bayesianResults.demandProbability * 100) - 45 }
    ],
    maxDiffNarrative: {
      insight: "Feature importance ranked by Bayesian weights",
      featureRanking: features.map(([feature, weight]: any, i: number) => ({
        rank: i + 1,
        feature,
        utility: Math.round(weight * 100),
        strategicImplication: "Focus marketing on this feature"
      }))
    },
    personas: [
      {
        name: "Primary Buyer",
        segment: "main",
        size: 0.6,
        demographics: { age: "30-45", income: "Medium-High", location: Object.keys(smvsConfig.regions)[0] },
        bayesianProfile: {
          demandProbability: bayesianResults.demandProbability,
          optimalPrice: bayesianResults.optimalPrice,
          topFeatures: features.slice(0, 3).map(([f]: any) => f),
          identityDrivers: bayesianResults.identitySignals
        }
      }
    ],
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

    console.log("=== STARTING ANALYSIS ===");
    console.log("Test ID:", testId);

    // Get product info from database
    const { data: test, error: fetchError } = await supabase
      .from("tests")
      .select("*")
      .eq("id", testId)
      .single();

    if (fetchError || !test) {
      throw new Error("Test not found");
    }

    // Update status to GENERATING
    await supabase
      .from("tests")
      .update({ status: "GENERATING" })
      .eq("id", testId);

    try {
      // STEP 1: RUN BAYESIAN ENGINE (PURE MATH)
      console.log("Step 1: Running Bayesian engine...");
      const bayesianResults = await runSmvsPipeline(testId, supabase);
      
      console.log("Bayesian complete:", {
        demand: bayesianResults.demandProbability,
        psm: bayesianResults.psmScore,
        price: bayesianResults.optimalPrice
      });

      // STEP 2: GENERATE MARKETING INTELLIGENCE (GROQ API)
      console.log("Step 2: Generating marketing intelligence via Groq...");
      const marketingIntel = await generateMarketingIntelligence(
        bayesianResults,
        test,
        smvsConfig
      );

      console.log("Marketing intelligence complete");

      // STEP 3: COMBINE RESULTS
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
          vulnerabilities: marketingIntel.brandPositioning?.vulnerabilities || [],
          opportunities: marketingIntel.brandPositioning?.opportunities || []
        },
        personas: marketingIntel.personas || [],
        executive_summary: marketingIntel.executiveSummary || {},
        gtm_insights: marketingIntel.goToMarketInsights || {},
        status: "COMPLETED"
      };

      // Update database
      const { error: updateError } = await supabase
        .from("tests")
        .update(combinedResults)
        .eq("id", testId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true, ...combinedResults }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (analysisError) {
      console.error("Analysis failed:", analysisError);
      
      await supabase
        .from("tests")
        .update({ status: "FAILED" })
        .eq("id", testId);

      return new Response(
        JSON.stringify({
          error: "Analysis failed",
          details: analysisError.message,
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

  } catch (error) {
    console.error("Request error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
