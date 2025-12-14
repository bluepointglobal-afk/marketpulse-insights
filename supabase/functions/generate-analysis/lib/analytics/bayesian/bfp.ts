/**
 * BayesPulse Fact Pack (BFP) - TypeScript Interface
 * Single source of truth for all market validation analysis
 */

import type { PosteriorFeature } from "./posterior.ts"

export interface BayesianFactPack {
  meta: {
    reportId: string
    category: string
    regions: string[]
    timestamp: string
    mode: 'PRIORS_ONLY' | 'CALIBRATED' | 'HISTORICAL'
    priorVersion: string
    priorSource: string
    priorTier: 'REAL' | 'ESTIMATED' | 'INFERRED'
  }
  
  identity: {
    status: number
    trust: number
    upgrade: number
    dominant: 'S' | 'T' | 'U' | 'BALANCED'
    blendMethod: 'user_input' | 'regional_prior' | 'calibrated'
    adjustment: number
  }
  
  posteriors: {
    demand_trial_30d: PosteriorFeature
    premium_accept_20p: PosteriorFeature
    online_share: PosteriorFeature
  }
  
  summary: {
    actionable: boolean
    overall_psm: number
    recommendedAction: 'GO' | 'REVISE' | 'NO-GO'
    goNoGoReasoning: string
  }
  
  pricing: {
    targetPrice: number
    optimalPrice: number
    acceptableRange: [number, number]
    premiumTolerance: number
    elasticity: 'high' | 'medium' | 'low'
  }
  
  smvs?: {
    hash: string
    bpcrCode: string
  }
  
  regionWeights?: Record<string, number>
}

export function getConfidenceLevel(psm: number): string {
  if (psm >= 0.60) return 'Very High'
  if (psm >= 0.55) return 'High'
  if (psm >= 0.40) return 'Moderate'
  if (psm >= 0.30) return 'Low'
  return 'Insufficient'
}

export function isActionable(bfp: BayesianFactPack): boolean {
  return bfp.summary.overall_psm >= 0.40
}

export function getPSMClass(psm: number): 'GO' | 'REVISE' | 'NO-GO' {
  if (psm >= 0.40) return 'GO'
  if (psm >= 0.30) return 'REVISE'
  return 'NO-GO'
}
