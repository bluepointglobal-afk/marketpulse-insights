/**
 * BayesPulse Fact Pack (BFP) - TypeScript Interface
 * 
 * Single source of truth for all market validation analysis
 * Every number in the system traces back to this structure
 * 
 * INSTALL TO: src/lib/analytics/bayesian/bfp.ts
 */

export interface BayesianFactPack {
  // Report metadata
  meta: {
    reportId: string                    // RPT-YYYY-MM-DD-XXXX
    category: string                    // From taxonomy
    regions: string[]                   // Target regions
    timestamp: string                   // ISO timestamp
    mode: 'PRIORS_ONLY' | 'CALIBRATED' | 'HISTORICAL'
    priorVersion: string                // e.g., "HEALTH_SUPPLEMENTS v1.0.0"
    priorSource: string                 // Data provenance
    priorTier: 'REAL' | 'ESTIMATED' | 'INFERRED'
  }
  
  // Identity utility signals (Status/Trust/Upgrade)
  identity: {
    status: number                      // 0-1, premium/luxury appeal
    trust: number                       // 0-1, safety/certification importance
    upgrade: number                     // 0-1, transformation/results promise
    dominant: 'S' | 'T' | 'U' | 'BALANCED'
    blendMethod: 'user_input' | 'regional_prior' | 'calibrated'
    adjustment: number                  // Identity adjustment factor applied to demand
  }
  
  // Core posterior distributions
  posteriors: {
    demand_trial_30d: PosteriorFeature
    premium_accept_20p: PosteriorFeature
    online_share: PosteriorFeature
  }
  
  // Summary & decision
  summary: {
    actionable: boolean                 // PSM >= 0.40
    overall_psm: number                 // Weighted average PSM
    recommendedAction: 'GO' | 'REVISE' | 'NO-GO'
    goNoGoReasoning: string
  }
  
  // Pricing analysis
  pricing: {
    targetPrice: number
    optimalPrice: number
    acceptableRange: [number, number]
    premiumTolerance: number            // From premium_accept_20p
    elasticity: 'high' | 'medium' | 'low'
  }
  
  // SMVS provenance
  smvs?: {
    hash: string                        // SHA-256 of core BFP data
    bpcrCode: string                    // BayesPulse Credibility Rating
  }
  
  // Optional: Region weights (for multi-region tests)
  regionWeights?: Record<string, number>
}

/**
 * Individual posterior feature distribution
 */
export interface PosteriorFeature {
  mean: number                          // Point estimate (0-1)
  ci95: [number, number]                // 95% credible interval
  psm: number                           // Posterior Sharpness Metric (0-1)
  alpha: number                         // Beta distribution α parameter
  beta: number                          // Beta distribution β parameter
  calibrationN?: number                 // Sample size (if calibrated)
  tier: 'REAL' | 'ESTIMATED' | 'INFERRED'
}

/**
 * Helper: Get confidence level from PSM
 */
export function getConfidenceLevel(psm: number): string {
  if (psm >= 0.60) return 'Very High'
  if (psm >= 0.55) return 'High'
  if (psm >= 0.40) return 'Moderate'
  if (psm >= 0.30) return 'Low'
  return 'Insufficient'
}

/**
 * Helper: Check if BFP is actionable
 */
export function isActionable(bfp: BayesianFactPack): boolean {
  return bfp.summary.overall_psm >= 0.40
}

/**
 * Helper: Get PSM class
 */
export function getPSMClass(psm: number): 'GO' | 'REVISE' | 'NO-GO' {
  if (psm >= 0.40) return 'GO'
  if (psm >= 0.30) return 'REVISE'
  return 'NO-GO'
}
