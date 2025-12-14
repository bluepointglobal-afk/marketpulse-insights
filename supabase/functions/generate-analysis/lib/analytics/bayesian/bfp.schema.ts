/**
 * BFP Zod Validation Schema
 * 
 * Runtime validation for BayesianFactPack
 * Ensures all BFP objects are valid before use
 * 
 * INSTALL TO: src/lib/analytics/bayesian/bfp.schema.ts
 */

import { z } from 'zod'

// Posterior Feature Schema
const PosteriorFeatureSchema = z.object({
  mean: z.number().min(0).max(1),
  ci95: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]),
  psm: z.number().min(0).max(1),
  alpha: z.number().positive(),
  beta: z.number().positive(),
  calibrationN: z.number().int().nonnegative().optional(),
  tier: z.enum(['REAL', 'ESTIMATED', 'INFERRED'])
}).refine(
  (data) => data.ci95[0] <= data.ci95[1],
  { message: 'CI lower bound must be <= upper bound' }
)

// Complete BFP Schema
export const BayesianFactPackSchema = z.object({
  meta: z.object({
    reportId: z.string(),
    category: z.string(),
    regions: z.array(z.string()).min(1),
    timestamp: z.string(),
    mode: z.enum(['PRIORS_ONLY', 'CALIBRATED', 'HISTORICAL']),
    priorVersion: z.string(),
    priorSource: z.string(),
    priorTier: z.enum(['REAL', 'ESTIMATED', 'INFERRED'])
  }),
  
  identity: z.object({
    status: z.number().min(0).max(1),
    trust: z.number().min(0).max(1),
    upgrade: z.number().min(0).max(1),
    dominant: z.enum(['S', 'T', 'U', 'BALANCED']),
    blendMethod: z.enum(['user_input', 'regional_prior', 'calibrated']),
    adjustment: z.number().positive()
  }),
  
  posteriors: z.object({
    demand_trial_30d: PosteriorFeatureSchema,
    premium_accept_20p: PosteriorFeatureSchema,
    online_share: PosteriorFeatureSchema
  }),
  
  summary: z.object({
    actionable: z.boolean(),
    overall_psm: z.number().min(0).max(1),
    recommendedAction: z.enum(['GO', 'REVISE', 'NO-GO']),
    goNoGoReasoning: z.string()
  }),
  
  pricing: z.object({
    targetPrice: z.number().positive(),
    optimalPrice: z.number().positive(),
    acceptableRange: z.tuple([z.number().positive(), z.number().positive()]),
    premiumTolerance: z.number().min(0).max(1),
    elasticity: z.enum(['high', 'medium', 'low'])
  }),
  
  smvs: z.object({
    hash: z.string(),
    bpcrCode: z.string()
  }).optional(),
  
  regionWeights: z.record(z.string(), z.number().min(0).max(1)).optional()
})

export type BayesianFactPack = z.infer<typeof BayesianFactPackSchema>

/**
 * Validate BFP (throws on invalid)
 */
export function assertValidBFP(bfp: unknown): asserts bfp is BayesianFactPack {
  BayesianFactPackSchema.parse(bfp)
}

/**
 * Validate BFP (returns result)
 */
export function validateBFP(bfp: unknown): { 
  valid: boolean
  error?: string
  data?: BayesianFactPack
} {
  const result = BayesianFactPackSchema.safeParse(bfp)
  
  if (result.success) {
    return { valid: true, data: result.data }
  }
  
  return {
    valid: false,
    error: result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
  }
}
