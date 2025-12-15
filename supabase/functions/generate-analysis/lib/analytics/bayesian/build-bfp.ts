/**
 * BFP Builder - Main Orchestrator
 */

import type { BayesianFactPack } from "./bfp.ts"
import type { PosteriorFeature } from "./posterior.ts"
import { betaUpdateFeature, calculateOverallPSM, determineRecommendation } from "./posterior.ts"

export interface BFPBuilderInput {
  testId: string
  category: string
  regions: string[]
  productName: string
  targetPrice: number
  competitorRange?: { min: number; max: number }
  identity?: {
    status: number
    trust: number
    upgrade: number
    method?: 'user_input' | 'regional_prior' | 'calibrated'
  }
  regionWeights?: Record<string, number>
  mode: 'PRIORS_ONLY' | 'CALIBRATED' | 'HISTORICAL'
  calibrations?: {
    feature: 'demand_trial_30d' | 'premium_accept_20p' | 'online_share'
    trials: number
    successes: number
    source?: string
  }[]
}

function applyIdentityAdjustment(
  rawDemand: number,
  identity: { status: number; trust: number; upgrade: number }
): { adjusted: number; factor: number } {
  const factor = 1.0 + (0.15 * identity.status + 0.10 * identity.trust + 0.08 * identity.upgrade)
  const adjusted = Math.min(1.0, rawDemand * factor)
  return { adjusted, factor }
}

function getDominantIdentity(identity: {
  status: number
  trust: number
  upgrade: number
}): 'S' | 'T' | 'U' | 'BALANCED' {
  const { status, trust, upgrade } = identity
  const max = Math.max(status, trust, upgrade)
  if (max - Math.min(status, trust, upgrade) < 0.10) return 'BALANCED'
  if (status === max) return 'S'
  if (trust === max) return 'T'
  return 'U'
}

async function generateSMVSHash(bfp: Partial<BayesianFactPack>): Promise<string> {
  const hashInput = JSON.stringify({
    category: bfp.meta?.category,
    regions: bfp.meta?.regions,
    posteriors: bfp.posteriors,
    identity: bfp.identity,
    timestamp: bfp.meta?.timestamp
  })
  
  // Use Web Crypto API (Deno compatible)
  const encoder = new TextEncoder()
  const data = encoder.encode(hashInput)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// PSM is now on 0-100 scale
function generateBPCRCode(tier: string, psm: number): string {
  const tierChar = tier === 'REAL' ? 'R' : tier === 'ESTIMATED' ? 'E' : 'I'
  const psmGrade = psm >= 60 ? 'A' : psm >= 50 ? 'B' : psm >= 40 ? 'C' : 'D'
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `BPCR-${tierChar}${psmGrade}${random}`
}

export async function buildBFP(input: BFPBuilderInput): Promise<BayesianFactPack> {
  // Load priors (placeholder - implement based on your prior system)
  const priors = {
    demand_trial_30d: { alpha: 12, beta: 18 },
    premium_accept_20p: { alpha: 8, beta: 22 },
    online_share: { alpha: 15, beta: 15 },
    tier: 'ESTIMATED' as const
  }
  
  const identity = input.identity || {
    status: 0.33,
    trust: 0.34,
    upgrade: 0.33,
    method: 'regional_prior' as const
  }
  
  const calibrationMap = new Map(
    input.calibrations?.map(c => [c.feature, c]) || []
  )
  
  const demand_trial_30d = betaUpdateFeature({
    prior: priors.demand_trial_30d,
    observations: calibrationMap.get('demand_trial_30d'),
    calibrationSource: calibrationMap.get('demand_trial_30d')?.source
  })
  
  const premium_accept_20p = betaUpdateFeature({
    prior: priors.premium_accept_20p,
    observations: calibrationMap.get('premium_accept_20p'),
    calibrationSource: calibrationMap.get('premium_accept_20p')?.source
  })
  
  const online_share = betaUpdateFeature({
    prior: priors.online_share,
    observations: calibrationMap.get('online_share'),
    calibrationSource: calibrationMap.get('online_share')?.source
  })
  
  const { adjusted: adjustedDemand, factor: adjustmentFactor } = 
    applyIdentityAdjustment(demand_trial_30d.mean, identity)
  
  const demand_adjusted: PosteriorFeature = {
    ...demand_trial_30d,
    mean: adjustedDemand
  }
  
  // calculateOverallPSM returns 0-100 range
  const overall_psm = calculateOverallPSM({
    demand_trial_30d: demand_adjusted,
    premium_accept_20p,
    online_share
  })
  
  const { action, reasoning } = determineRecommendation(overall_psm)
  
  // Calculate optimal price based on premium tolerance and demand
  // If high premium tolerance, price can be closer to max range
  const premiumTolerance = premium_accept_20p.mean
  const priceMultiplier = 0.9 + (premiumTolerance * 0.3) // 0.9x to 1.2x of target
  const optimalPrice = Math.round(input.targetPrice * priceMultiplier)
  
  const acceptableRange: [number, number] = [
    Math.round(input.targetPrice * 0.85),
    Math.round(input.targetPrice * 1.20)
  ]
  
  const elasticity = premiumTolerance > 0.40 ? 'low' 
    : premiumTolerance > 0.25 ? 'medium' 
    : 'high'
  
  const timestamp = new Date().toISOString()
  const reportId = `RPT-${timestamp.substring(0, 10)}-${
    Math.random().toString(36).substring(2, 6).toUpperCase()
  }`
  
  const bfp: BayesianFactPack = {
    meta: {
      reportId,
      category: input.category,
      regions: input.regions,
      timestamp,
      mode: input.mode,
      priorVersion: `${input.category} v1.0.0`,
      priorSource: 'Regional priors synthesis',
      priorTier: priors.tier
    },
    identity: {
      status: identity.status,
      trust: identity.trust,
      upgrade: identity.upgrade,
      dominant: getDominantIdentity(identity),
      blendMethod: identity.method || 'regional_prior',
      adjustment: adjustmentFactor
    },
    posteriors: {
      demand_trial_30d: demand_adjusted,
      premium_accept_20p,
      online_share
    },
    summary: {
      actionable: overall_psm >= 40, // PSM is 0-100 scale
      overall_psm,
      recommendedAction: action,
      goNoGoReasoning: reasoning
    },
    pricing: {
      targetPrice: input.targetPrice,
      optimalPrice,
      acceptableRange,
      premiumTolerance,
      elasticity
    },
    smvs: {
      hash: '',
      bpcrCode: generateBPCRCode(priors.tier, overall_psm)
    },
    regionWeights: input.regionWeights
  }
  
  bfp.smvs!.hash = await generateSMVSHash(bfp)
  
  return bfp
}

export async function buildQuickBFP(
  category: string,
  region: string,
  targetPrice: number
): Promise<BayesianFactPack> {
  return buildBFP({
    testId: 'test-quick',
    category,
    regions: [region],
    productName: 'Test Product',
    targetPrice,
    mode: 'PRIORS_ONLY'
  })
}
