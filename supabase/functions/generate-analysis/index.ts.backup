import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Generate mock Bayesian results
function generateMockResults(config: GenerateRequest["smvsConfig"]) {
  const { pricing, features, regions } = config;
  const { min: priceMin, target: priceTarget, max: priceMax } = pricing;
  
  // Generate realistic demand curve
  const demandCurve = [];
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
  let remaining = 1;
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
  const regionKeys = Object.keys(regions);
  const regionalBreakdown: Record<string, { demand: number; optimalPrice: number; insight: string }> = {};
  regionKeys.forEach((region, i) => {
    regionalBreakdown[region] = {
      demand: Math.round((demandProbability + (i === 0 ? 0.04 : -0.05)) * 100) / 100,
      optimalPrice: Math.round(optimalPrice * (i === 0 ? 1.06 : 0.91)),
      insight: i === 0 ? "Higher willingness to pay premium" : "Price-sensitive, prefers value"
    };
  });

  // MaxDiff results
  const featureRanking = features.map((f, i) => ({
    rank: i + 1,
    feature: f,
    utility: Math.round(30 - i * 4 + Math.random() * 2),
    gap: i === features.length - 1 ? "baseline" : `+${Math.round(2 + Math.random() * 3)} vs #${i + 2}`
  }));

  const maxDiffResults = {
    mostImportant: {
      feature: features[0],
      utilityScore: featureRanking[0]?.utility || 28,
      significance: `Drives ${featureRanking[0]?.utility || 28}% of purchase intent`
    },
    featureRanking,
    insight: `Top 3 features account for ${featureRanking.slice(0, 3).reduce((a, b) => a + b.utility, 0)}% of total utility.`
  };

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
    acceptableRange: [Math.round(priceTarget * 0.93), Math.round(priceTarget * 1.2)],
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
  const personas = [
    {
      name: "The Wellness Executive",
      segment: "high_trust_seeker",
      size: 0.32,
      demographics: { age: "35-48", income: "25K+ SAR/month", location: "Riyadh, Jeddah" },
      psychographics: {
        quote: "I don't have time to be sick. Show me it's legitimate.",
        values: ["Performance", "Quality", "Trust"]
      },
      bayesianProfile: {
        demandProbability: 0.71,
        optimalPrice: 380,
        featurePreferences: Object.fromEntries(features.slice(0, 3).map((f, i) => [f, [0.35, 0.30, 0.22][i]])),
        identityDrivers: { trust: 0.65, status: 0.20, upgrade: 0.15 }
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
      demographics: { age: "30-42", income: "15-25K SAR/month", location: "Suburban KSA/UAE" },
      psychographics: {
        quote: "If it's good enough for my kids, it needs to be the best.",
        values: ["Safety", "Natural", "Family health"]
      },
      bayesianProfile: {
        demandProbability: 0.65,
        optimalPrice: 290,
        featurePreferences: Object.fromEntries(features.slice(0, 3).map((f, i) => [f, [0.40, 0.30, 0.20][i]])),
        identityDrivers: { trust: 0.55, upgrade: 0.30, status: 0.15 }
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
      demographics: { age: "25-38", income: "12-20K SAR/month", location: "Urban centers" },
      psychographics: {
        quote: "I track everything. Show me the data.",
        values: ["Results", "Optimization", "Science"]
      },
      bayesianProfile: {
        demandProbability: 0.69,
        optimalPrice: 320,
        featurePreferences: Object.fromEntries(features.slice(0, 3).map((f, i) => [f, [0.38, 0.32, 0.20][i]])),
        identityDrivers: { upgrade: 0.45, trust: 0.35, status: 0.20 }
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
      demographics: { age: "28-45", income: "8-15K SAR/month", location: "Mixed urban/suburban" },
      psychographics: {
        quote: "Quality doesn't have to break the bank.",
        values: ["Value", "Smart spending", "Research"]
      },
      bayesianProfile: {
        demandProbability: 0.58,
        optimalPrice: 250,
        featurePreferences: Object.fromEntries(features.slice(0, 3).map((f, i) => [f, [0.35, 0.30, 0.25][i]])),
        identityDrivers: { upgrade: 0.50, trust: 0.35, status: 0.15 }
      },
      recommendations: {
        messaging: "Premium quality, smart pricing",
        channels: ["Comparison sites", "Deal forums", "WhatsApp groups"],
        creativeAngle: "Smart choice, not compromise"
      }
    }
  ];

  return {
    bayesianResults: {
      demandProbability,
      psmScore,
      optimalPrice,
      confidenceInterval: [0.58, 0.76],
      demandCurve,
      regionalBreakdown,
      featureWeights
    },
    maxDiffResults,
    kanoResults,
    vanWestendorp,
    brandAnalysis,
    personas
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const { testId, smvsConfig }: GenerateRequest = await req.json();
    console.log("Generating analysis for test:", testId);

    // Verify test belongs to user
    const { data: test, error: testError } = await supabase
      .from("tests")
      .select("*")
      .eq("id", testId)
      .eq("user_id", user.id)
      .single();

    if (testError || !test) {
      console.error("Test not found:", testError);
      return new Response(JSON.stringify({ error: "Test not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Update test status to GENERATING
    await supabase
      .from("tests")
      .update({ status: "GENERATING", smvs_config: smvsConfig })
      .eq("id", testId);

    // Generate mock results
    const results = generateMockResults(smvsConfig);

    // Update test with results
    const { error: updateError } = await supabase
      .from("tests")
      .update({
        status: "COMPLETED",
        bayesian_results: results.bayesianResults,
        max_diff_results: results.maxDiffResults,
        kano_results: results.kanoResults,
        van_westendorp: results.vanWestendorp,
        brand_analysis: results.brandAnalysis,
        personas: results.personas
      })
      .eq("id", testId);

    if (updateError) {
      console.error("Failed to update test:", updateError);
      throw updateError;
    }

    console.log("Analysis complete for test:", testId);

    return new Response(JSON.stringify({
      status: "COMPLETED",
      testId,
      ...results
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: unknown) {
    console.error("Error generating analysis:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});
