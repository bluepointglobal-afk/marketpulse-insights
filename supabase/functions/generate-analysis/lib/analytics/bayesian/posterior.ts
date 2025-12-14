/**
 * Posterior Calculator - Beta-Binomial Updates + PSM
 */

export interface PosteriorFeature {
  mean: number
  ci95: [number, number]
  psm: number
  alpha: number
  beta: number
  calibrationN?: number
  tier: 'REAL' | 'ESTIMATED' | 'INFERRED'
}

export interface BetaDistribution {
  alpha: number
  beta: number
}

export interface BetaUpdateInput {
  prior: BetaDistribution
  observations?: {
    trials: number
    successes: number
  }
  calibrationSource?: string
}

/**
 * Beta-Binomial conjugate update
 * Prior: Beta(α₀, β₀)
 * Data: x successes in n trials
 * Posterior: Beta(α₀ + x, β₀ + (n - x))
 */
export function betaUpdate(
  prior: BetaDistribution,
  observations: { trials: number; successes: number }
): BetaDistribution {
  return {
    alpha: prior.alpha + observations.successes,
    beta: prior.beta + (observations.trials - observations.successes)
  }
}

/**
 * Calculate Beta distribution mean
 * E[Beta(α,β)] = α / (α + β)
 */
export function betaMean(params: BetaDistribution): number {
  return params.alpha / (params.alpha + params.beta)
}

/**
 * Calculate Beta distribution variance
 * Var[Beta(α,β)] = (αβ) / ((α+β)²(α+β+1))
 */
export function betaVariance(params: BetaDistribution): number {
  const n = params.alpha + params.beta
  return (params.alpha * params.beta) / (n * n * (n + 1))
}

/**
 * Calculate 95% credible interval using quantile approximation
 */
export function betaCredibleInterval(params: BetaDistribution): [number, number] {
  const mean = betaMean(params)
  const variance = betaVariance(params)
  const stdDev = Math.sqrt(variance)
  
  // Approximate using normal distribution (works well for α,β > 5)
  const lower = Math.max(0, mean - 1.96 * stdDev)
  const upper = Math.min(1, mean + 1.96 * stdDev)
  
  return [lower, upper]
}

/**
 * Posterior Sharpness Metric (PSM)
 * PSM = (σ²_prior - σ²_posterior) / σ²_prior
 */
export function calculatePSM(
  prior: BetaDistribution,
  posterior: BetaDistribution
): number {
  const priorVar = betaVariance(prior)
  const postVar = betaVariance(posterior)
  
  if (priorVar === 0) return 0
  
  const psm = (priorVar - postVar) / priorVar
  return Math.max(0, Math.min(1, psm))
}

/**
 * Complete Beta update with PSM calculation
 */
export function betaUpdateFeature(input: BetaUpdateInput): PosteriorFeature {
  const { prior, observations, calibrationSource } = input
  
  if (!observations || observations.trials === 0) {
    const mean = betaMean(prior)
    const ci95 = betaCredibleInterval(prior)
    
    return {
      mean,
      ci95,
      psm: 0,
      alpha: prior.alpha,
      beta: prior.beta,
      calibrationN: 0,
      tier: 'ESTIMATED'
    }
  }
  
  const posterior = betaUpdate(prior, observations)
  const mean = betaMean(posterior)
  const ci95 = betaCredibleInterval(posterior)
  const psm = calculatePSM(prior, posterior)
  
  return {
    mean,
    ci95,
    psm,
    alpha: posterior.alpha,
    beta: posterior.beta,
    calibrationN: observations.trials,
    tier: calibrationSource ? 'REAL' : 'ESTIMATED'
  }
}

/**
 * Calculate overall PSM from multiple features
 */
export function calculateOverallPSM(features: {
  demand_trial_30d: PosteriorFeature
  premium_accept_20p: PosteriorFeature
  online_share: PosteriorFeature
}): number {
  const weights = {
    demand_trial_30d: 0.50,
    premium_accept_20p: 0.30,
    online_share: 0.20
  }
  
  return (
    features.demand_trial_30d.psm * weights.demand_trial_30d +
    features.premium_accept_20p.psm * weights.premium_accept_20p +
    features.online_share.psm * weights.online_share
  )
}

/**
 * Determine recommendation based on PSM
 */
export function determineRecommendation(overallPSM: number): {
  action: 'GO' | 'REVISE' | 'NO-GO'
  reasoning: string
} {
  if (overallPSM >= 0.40) {
    return {
      action: 'GO',
      reasoning: 'Confidence sufficient for controlled market test'
    }
  }
  
  if (overallPSM >= 0.30) {
    return {
      action: 'REVISE',
      reasoning: 'Directional insights available but not yet actionable'
    }
  }
  
  return {
    action: 'NO-GO',
    reasoning: 'Insufficient confidence for GTM decisions'
  }
}
