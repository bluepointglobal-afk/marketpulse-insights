/**
 * SMVS Report Adapter
 * Converts BayesPulse engine output to standardized format
 */

import { SmvsReportPayload, type TSmvsReportPayload } from "./schema.ts"

type SimInput = {
  bpcrCode: string
  region: "GCC" | "MENA" | "BLEND"
  alpha?: number
  category: string
  product: { 
    name: string
    description: string
    useCase: string 
  }
  params: { 
    price: number
    messageBeta: {
      beta0: number
      betaS: number
      betaT: number
      betaU: number
    }
    personasN: number
    personaStats: any 
  }
}

type SimOutput = {
  demandProb: number
  dispersion: number
  ccs: number
  psm: number
  priceCurve?: Array<{ p: number; adopt: number }>
  messages?: Array<{
    label: string
    beta: {
      beta0: number
      betaS: number
      betaT: number
      betaU: number
    }
    like: number
  }>
  segments?: Array<{
    name: string
    share: number
    S: number
    T: number
    U: number
    notes?: string
  }>
}

/**
 * Build ISO SMVS v1.0 compliant report payload
 */
export async function buildSmvsPayload(
  input: SimInput, 
  output: SimOutput
): Promise<TSmvsReportPayload> {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10)
  const randomId = Math.random().toString(36).slice(2, 6).toUpperCase()
  
  const payload: TSmvsReportPayload = {
    meta: {
      reportId: `RPT-${dateStr}-${randomId}`,
      createdAtISO: now.toISOString(),
      smvsVersion: "1.0",
      bpcrCode: input.bpcrCode,
      region: input.region,
      alpha: input.region === "BLEND" ? (input.alpha ?? 0.6) : undefined,
      category: input.category,
      hash: ""
    },
    product: input.product,
    params: {
      price: input.params.price,
      messageBeta: input.params.messageBeta,
      personasN: input.params.personasN,
      personaStats: input.params.personaStats
    },
    results: {
      demandProb: output.demandProb,
      dispersion: output.dispersion,
      ccs: output.ccs,
      psm: output.psm,
      priceCurve: output.priceCurve,
      messages: output.messages,
      segments: output.segments
    },
    calibration: {
      convergenceC: undefined,
      limitations: generateLimitations(output.psm, input.params.personasN),
      assumptions: generateAssumptions(input.region, input.category)
    },
    recs: {
      goNoGo: determineGoNoGo(output.psm, output.demandProb),
      priceAdvice: generatePriceAdvice(output.priceCurve, input.params.price),
      nextExperiments: generateNextSteps(output.psm, input.params.personasN)
    }
  }

  // Calculate stable hash using Web Crypto API
  const { hash, ...payloadForHash } = payload.meta
  const stablePayload = { ...payload, meta: payloadForHash }
  const stableJson = JSON.stringify(stablePayload, Object.keys(stablePayload).sort())
  
  const encoder = new TextEncoder()
  const data = encoder.encode(stableJson)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  payload.meta.hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return SmvsReportPayload.parse(payload)
}

function determineGoNoGo(psm: number, demandProb: number): "GO" | "NO-GO" | "REVISE" {
  if (psm < 0.35) return "REVISE"
  if (demandProb < 0.30) return "NO-GO"
  if (demandProb >= 0.45 && psm >= 0.40) return "GO"
  return "REVISE"
}

function generateLimitations(psm: number, sampleSize: number): string[] {
  const limitations: string[] = []
  
  if (psm < 0.40) {
    limitations.push("Posterior confidence below recommended threshold. Add calibration data for higher certainty.")
  }
  
  if (sampleSize < 100) {
    limitations.push(`Small sample size (n=${sampleSize}). Results may have high variance.`)
  }
  
  limitations.push("Synthetic personas based on regional priors. Real survey data recommended for validation.")
  
  if (psm < 0.30) {
    limitations.push("High uncertainty - results are directional only, not actionable for launch decisions.")
  }
  
  return limitations
}

function generateAssumptions(region: string, category: string): string[] {
  const assumptions = [
    `Regional priors calibrated for ${region} market dynamics`,
    `Category taxonomy: ${category}`,
    "Identity utility weights (S/T/U) derived from cultural research",
    "Beta-Binomial conjugate prior framework with progressive updating",
    "Demand probability reflects 30-day trial intent unless specified otherwise"
  ]
  
  if (region === "BLEND") {
    assumptions.push("Multi-region blending uses population-weighted averages")
  }
  
  return assumptions
}

function generatePriceAdvice(
  priceCurve: Array<{ p: number; adopt: number }> | undefined,
  currentPrice: number
): string {
  if (!priceCurve || priceCurve.length < 2) {
    return `Hold current price (${currentPrice}) and test ±20% range to establish elasticity curve.`
  }
  
  const optimal = priceCurve.reduce((best, curr) => 
    curr.adopt > best.adopt ? curr : best
  )
  
  if (Math.abs(optimal.p - currentPrice) / currentPrice < 0.05) {
    return `Current price (${currentPrice}) is near optimal. Consider testing premium positioning at +15-20%.`
  }
  
  const direction = optimal.p < currentPrice ? "lower" : "higher"
  const diff = Math.abs(optimal.p - currentPrice)
  
  return `Consider ${direction} price point around ${optimal.p} (${diff} ${direction} than current). ` +
         `Adoption increases from ${(priceCurve.find(p => p.p === currentPrice)?.adopt ?? 0) * 100}% ` +
         `to ${(optimal.adopt * 100).toFixed(0)}%.`
}

function generateNextSteps(psm: number, sampleSize: number): string[] {
  const steps: string[] = []
  
  if (psm < 0.40) {
    steps.push(`Collect ${Math.max(100 - sampleSize, 50)} real survey responses to improve confidence`)
  }
  
  if (psm >= 0.40) {
    steps.push("Run message×price 2×2 test on priority segments")
    steps.push("A/B test top 2 messaging variants with real ad spend")
  } else {
    steps.push("Expand synthetic analysis to 3-5 message variants before real spend")
  }
  
  steps.push("Track conversion funnel metrics: awareness → consideration → trial")
  
  if (sampleSize < 200) {
    steps.push("Scale sample to 200+ for segment-level analysis")
  }
  
  return steps
}

function determineRegion(testData: any): "GCC" | "MENA" | "BLEND" {
  const target = (testData.targetAudience || "").toLowerCase()
  if (target.includes("gcc")) return "GCC"
  if (target.includes("mena")) return "MENA"
  return "BLEND"
}

export function convertLegacyToSmvsInput(
  testData: any,
  analysisResults: any
): SimInput {
  const now = new Date()
  const bpcrCode = `BPCR-${now.toISOString().slice(0, 10)}`
  
  return {
    bpcrCode,
    region: determineRegion(testData),
    category: testData.category || "UNCATEGORIZED",
    product: {
      name: testData.productName || testData.name || "Unnamed Product",
      description: testData.productDescription || testData.description || "",
      useCase: testData.validationGoals?.join("; ") || "Market validation"
    },
    params: {
      price: analysisResults.pricing?.optimalPrice || 0,
      messageBeta: {
        beta0: 0.1,
        betaS: 1.0,
        betaT: 0.7,
        betaU: 0.4
      },
      personasN: analysisResults.sampleSize || 0,
      personaStats: {
        S: { mean: 0.33, sd: 0.15 },
        T: { mean: 0.33, sd: 0.15 },
        U: { mean: 0.34, sd: 0.15 },
        basePrior: { mean: 0.50, sd: 0.12 }
      }
    }
  }
}

export function convertLegacyToSmvsOutput(analysisResults: any): SimOutput {
  const demandMean = analysisResults.purchaseIntent?.overall?.mean || 0
  const demandProb = demandMean > 1 ? demandMean / 100 : demandMean
  
  return {
    demandProb: Math.min(1, Math.max(0, demandProb)),
    dispersion: 0.10,
    ccs: Math.round(analysisResults.confidence * 100) || 70,
    psm: analysisResults.bayesPulse?.features?.demand_trial_30d?.psm || 0.35,
    priceCurve: undefined,
    messages: undefined,
    segments: undefined
  }
}
