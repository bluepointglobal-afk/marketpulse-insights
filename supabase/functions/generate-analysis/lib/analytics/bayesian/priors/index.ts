/**
 * Prior distributions loader
 * Loads category-specific priors for Bayesian analysis
 */

export interface PriorDistribution {
  alpha: number
  beta: number
}

export interface FeaturePrior {
  feature: string
  region: string
  alpha: number
  beta: number
  source?: string
  confidence?: number
  tier?: 'REAL' | 'ESTIMATED' | 'INFERRED'
}

export interface PriorsFile {
  category: string
  version: string
  priors: FeaturePrior[]
}

export type Category = 
  | 'HEALTH_SUPPLEMENTS' 
  | 'FOOD_SNACKS' 
  | 'FOOD_BEVERAGES' 
  | 'FOOD_FUNCTIONAL'

/**
 * Load priors for a category
 */
export async function loadPriorsForCategory(category: Category): Promise<PriorsFile> {
  // Return default priors - the JSON imports were causing issues
  console.log(`Loading default priors for ${category}`)
  
  return {
    category,
    version: '1.0.0',
    priors: [
      { feature: 'demand_trial_30d', region: 'GCC', alpha: 12, beta: 18, tier: 'ESTIMATED' },
      { feature: 'premium_accept_20p', region: 'GCC', alpha: 8, beta: 22, tier: 'ESTIMATED' },
      { feature: 'online_share', region: 'GCC', alpha: 15, beta: 15, tier: 'ESTIMATED' },
      { feature: 'demand_trial_30d', region: 'MENA', alpha: 10, beta: 20, tier: 'ESTIMATED' },
      { feature: 'premium_accept_20p', region: 'MENA', alpha: 7, beta: 23, tier: 'ESTIMATED' },
      { feature: 'online_share', region: 'MENA', alpha: 12, beta: 18, tier: 'ESTIMATED' },
    ]
  }
}

/**
 * Helper to find a specific prior
 */
export function findPrior(file: PriorsFile, feature: string, region: string): FeaturePrior | undefined {
  return file.priors.find((p: FeaturePrior) => p.feature === feature && p.region === region)
}

/**
 * Helper to get all features for a region
 */
export function getFeaturesForRegion(file: PriorsFile, region: string): FeaturePrior[] {
  return file.priors.filter((p: FeaturePrior) => p.region === region)
}

/**
 * Get default priors when category-specific not available
 */
export function getDefaultPriors(): Record<string, PriorDistribution> {
  return {
    demand_trial_30d: { alpha: 12, beta: 18 },
    premium_accept_20p: { alpha: 8, beta: 22 },
    online_share: { alpha: 15, beta: 15 }
  }
}
