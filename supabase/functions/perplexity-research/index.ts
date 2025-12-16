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
  researchType: "market_size" | "competitors" | "trends" | "regulations" | "comprehensive";
}

interface PerplexityMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callPerplexity(messages: PerplexityMessage[], model: string = "sonar") {
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
      max_tokens: 4000,
      temperature: 0.2,
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

function buildMarketResearchPrompt(req: ResearchRequest): PerplexityMessage[] {
  const regions = req.targetCountries.join(", ");
  
  const systemPrompt = `You are a boutique market research analyst specializing in GCC markets (Saudi Arabia, UAE, Qatar, and broader MENA). Your task is to provide investment-grade market intelligence with specific data, real company names, and actionable insights.

CRITICAL REQUIREMENTS:
- Use ONLY real data and verified information
- Name SPECIFIC companies, products, and price points
- Include regulatory requirements (SFDA, halal certification, etc.)
- Provide market size estimates with sources
- All prices in SAR unless otherwise specified
- Focus on ${regions} markets specifically

Output format: JSON with clear sections.`;

  let userPrompt = "";

  switch (req.researchType) {
    case "market_size":
      userPrompt = `Research the market size and growth for "${req.productName}" in the ${req.category} category for ${regions}.

Provide:
{
  "marketSize": {
    "tam": { "value": "USD amount", "source": "source name", "year": 2024 },
    "sam": { "value": "USD amount", "calculation": "how derived" },
    "som": { "value": "USD amount", "assumptions": "key assumptions" }
  },
  "growth": {
    "historicalCagr": "X%",
    "projectedCagr": "X%",
    "drivers": ["driver 1", "driver 2"]
  },
  "regionalBreakdown": {
    "KSA": { "share": "X%", "insight": "key insight" },
    "UAE": { "share": "X%", "insight": "key insight" }
  }
}`;
      break;

    case "competitors":
      userPrompt = `Research the competitive landscape for "${req.productName}" in ${req.category} targeting ${regions}.

Find 5-7 REAL competitors with:
{
  "competitors": [
    {
      "name": "Company Name",
      "products": ["Product 1", "Product 2"],
      "priceRange": { "min": X, "max": Y, "currency": "SAR" },
      "positioning": "premium/mid/value",
      "distribution": ["channel 1", "channel 2"],
      "marketShare": "X% (estimated)",
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1", "weakness 2"],
      "recentMoves": ["2024: launched X", "2023: expanded to Y"]
    }
  ],
  "marketLeader": "Company name with ~X% share",
  "competitiveIntensity": "HIGH/MEDIUM/LOW",
  "entryBarriers": ["barrier 1", "barrier 2"]
}

Product description: ${req.description}`;
      break;

    case "trends":
      userPrompt = `Research consumer trends and market dynamics for "${req.productName}" (${req.category}) in ${regions}.

Provide:
{
  "consumerTrends": [
    {
      "trend": "Trend name",
      "description": "What's happening",
      "impact": "How it affects this product",
      "timeline": "emerging/growing/mature"
    }
  ],
  "channelTrends": {
    "ecommerce": { "share": "X%", "growth": "Y%", "keyPlayers": ["Noon", "Amazon.sa"] },
    "retail": { "share": "X%", "keyPlayers": ["Carrefour", "Panda"] },
    "dtc": { "potential": "HIGH/MEDIUM/LOW" }
  },
  "demographicInsights": {
    "primaryBuyers": "Description",
    "emergingSegments": ["segment 1", "segment 2"]
  }
}`;
      break;

    case "regulations":
      userPrompt = `Research regulatory requirements for "${req.productName}" (${req.category}) in ${regions}.

Provide:
{
  "regulatoryRequirements": {
    "KSA": {
      "primaryAuthority": "SFDA",
      "registrationRequired": true/false,
      "timeline": "X months",
      "costs": "approximate",
      "halalRequired": true/false,
      "labelingRequirements": ["requirement 1", "requirement 2"]
    },
    "UAE": {
      "primaryAuthority": "Authority name",
      "registrationRequired": true/false,
      "timeline": "X months"
    }
  },
  "certifications": [
    {
      "name": "Certification name",
      "required": true/false,
      "cost": "approximate",
      "timeline": "X months"
    }
  ],
  "importRestrictions": ["restriction 1", "restriction 2"]
}`;
      break;

    case "comprehensive":
    default:
      userPrompt = `Conduct comprehensive market research for "${req.productName}" in the ${req.category} category targeting ${regions}.

Product description: ${req.description}

Provide a complete analysis:
{
  "marketOverview": {
    "tam": "USD X",
    "sam": "USD X", 
    "som": "USD X",
    "growth": "X% CAGR",
    "maturity": "emerging/growing/mature"
  },
  "competitors": [
    {
      "name": "Real Company Name",
      "products": ["specific products"],
      "priceRange": "X-Y SAR",
      "positioning": "premium/mid/value",
      "distribution": ["specific channels"],
      "strengths": ["2-3 specific strengths"],
      "weaknesses": ["2-3 specific weaknesses"],
      "marketShare": "X%"
    }
  ],
  "consumerInsights": {
    "primaryBuyers": "Specific demographic",
    "purchaseDrivers": ["driver 1", "driver 2", "driver 3"],
    "priceExpectations": { "min": X, "max": Y, "sweet_spot": Z },
    "channelPreferences": ["channel 1", "channel 2"]
  },
  "regulatory": {
    "ksaRequirements": ["requirement 1", "requirement 2"],
    "uaeRequirements": ["requirement 1", "requirement 2"],
    "halalRequired": true/false,
    "timeline": "X months to market"
  },
  "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
  "threats": ["threat 1", "threat 2", "threat 3"],
  "recommendations": {
    "positioning": "Recommended positioning",
    "pricePoint": "X SAR",
    "channels": ["priority channel 1", "priority channel 2"],
    "launchStrategy": "Brief recommendation"
  }
}`;
      break;
  }

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
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

    // Build the research prompt
    const messages = buildMarketResearchPrompt(request);
    
    // Call Perplexity with sonar-pro for comprehensive research
    const model = request.researchType === "comprehensive" ? "sonar-pro" : "sonar";
    const result = await callPerplexity(messages, model);

    console.log("✅ Perplexity response received");
    console.log("Citations count:", result.citations.length);
    console.log("Content length:", result.content.length);

    // Try to parse the JSON response
    let parsedContent: any = null;
    try {
      // Clean up the response - remove markdown code blocks if present
      const cleanedContent = result.content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      
      parsedContent = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.warn("Could not parse as JSON, returning raw content");
      parsedContent = { rawContent: result.content };
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: parsedContent,
        citations: result.citations,
        researchType: request.researchType,
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
