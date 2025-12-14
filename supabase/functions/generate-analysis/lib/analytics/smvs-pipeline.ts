/**
 * SMVS Pipeline Orchestrator
 * End-to-end flow from config to results
 */

import { buildBFP } from "./bayesian/build-bfp.ts"
import type { BayesianFactPack } from "./bayesian/bfp.ts"

export interface SmvsPipelineResult {
  bfp: BayesianFactPack
  demandProbability: number
  psmScore: number
  optimalPrice: number
  confidenceInterval: [number, number]
  featureWeights: Record<string, number>
  identitySignals: {
    status: number
    trust: number
    upgrade: number
  }
  regionalBreakdown: Record<string, {
    demand: number
    optimalPrice: number
  }>
  demandCurve: Array<{ price: number; demand: number }>
  meta: {
    duration: number
    cached: boolean
  }
}

export interface SmvsConfig {
  category: string
  regions: Record<string, number>
  identitySignals: Record<string, number>
  pricing: { min: number; target: number; max: number }
  features: string[]
}

export async function runSmvsPipeline(
  testId: string,
  smvsConfig: SmvsConfig
): Promise<SmvsPipelineResult> {
  const startTime = Date.now()
  
  // Build BFP with config
  const bfp = await buildBFP({
    testId,
    category: smvsConfig.category,
    regions: Object.keys(smvsConfig.regions),
    productName: 'Product',
    targetPrice: smvsConfig.pricing.target,
    competitorRange: {
      min: smvsConfig.pricing.min,
      max: smvsConfig.pricing.max
    },
    identity: {
      status: smvsConfig.identitySignals.status || 0.33,
      trust: smvsConfig.identitySignals.trust || 0.34,
      upgrade: smvsConfig.identitySignals.upgrade || 0.33,
      method: 'user_input'
    },
    regionWeights: smvsConfig.regions,
    mode: 'PRIORS_ONLY',
    calibrations: []
  })
  
  // Generate feature weights based on config
  const featureWeights: Record<string, number> = {}
  smvsConfig.features.forEach((feature, index) => {
    featureWeights[feature] = Math.max(0.1, 1 - (index * 0.15))
  })
  
  // Generate regional breakdown
  const regionalBreakdown: Record<string, { demand: number; optimalPrice: number }> = {}
  Object.entries(smvsConfig.regions).forEach(([region, weight]) => {
    // Adjust demand based on region weight
    const regionDemand = bfp.posteriors.demand_trial_30d.mean * (0.8 + weight * 0.4)
    regionalBreakdown[region] = {
      demand: Math.min(1, regionDemand),
      optimalPrice: bfp.pricing.optimalPrice * (0.9 + weight * 0.2)
    }
  })
  
  // Generate demand curve
  const demandCurve: Array<{ price: number; demand: number }> = []
  const priceStep = (smvsConfig.pricing.max - smvsConfig.pricing.min) / 10
  for (let i = 0; i <= 10; i++) {
    const price = smvsConfig.pricing.min + (i * priceStep)
    const priceRatio = price / smvsConfig.pricing.target
    const baseDemand = bfp.posteriors.demand_trial_30d.mean
    // Simple elasticity model
    const demand = baseDemand * Math.pow(0.9, (priceRatio - 1) * 5)
    demandCurve.push({ price: Math.round(price), demand: Math.max(0, Math.min(1, demand)) })
  }
  
  const duration = Date.now() - startTime
  
  return {
    bfp,
    demandProbability: bfp.posteriors.demand_trial_30d.mean,
    psmScore: Math.round(bfp.summary.overall_psm * 100),
    optimalPrice: bfp.pricing.optimalPrice,
    confidenceInterval: bfp.posteriors.demand_trial_30d.ci95,
    featureWeights,
    identitySignals: {
      status: bfp.identity.status,
      trust: bfp.identity.trust,
      upgrade: bfp.identity.upgrade
    },
    regionalBreakdown,
    demandCurve,
    meta: {
      duration,
      cached: false
    }
  }
}
