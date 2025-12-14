/**
 * BFP Integration Wrapper
 * Legacy compatibility layer
 * 
 * INSTALL TO: src/lib/analytics/bfp-integration.ts
 */

import type { BayesianFactPack } from './bayesian/bfp'

export interface LegacyAnalysisResult {
  purchaseIntent: number
  pricing: {
    optimal: number
    range: [number, number]
  }
  confidence: string
  insights: string[]
}

export function bfpToLegacy(bfp: BayesianFactPack): LegacyAnalysisResult {
  return {
    purchaseIntent: bfp.posteriors.demand_trial_30d.mean,
    pricing: {
      optimal: bfp.pricing.optimalPrice,
      range: bfp.pricing.acceptableRange
    },
    confidence: bfp.summary.overall_psm >= 0.40 ? 'high' : 'medium',
    insights: [
      `${(bfp.posteriors.demand_trial_30d.mean * 100).toFixed(0)}% demand probability`,
      `PSM: ${(bfp.summary.overall_psm * 100).toFixed(0)}%`,
      `Action: ${bfp.summary.recommendedAction}`
    ]
  }
}

export function enrichLegacyWithBFP(legacy: any, bfp: BayesianFactPack): any {
  return {
    ...legacy,
    bayesian: {
      psm: bfp.summary.overall_psm,
      action: bfp.summary.recommendedAction,
      reportId: bfp.meta.reportId
    }
  }
}

/**
 * Run complete SMVS pipeline: BFP generation + recommendations + personas
 */
export async function runSmvsPipeline(testId: string) {
  const { prisma } = await import('@/lib/db')
  const { buildBFP } = await import('./bayesian/build-bfp')
  const { generateRecommendations } = await import('./recommendation/engine')
  const { buildPersonas } = await import('./segmentation/personas')
  
  // Get test with config
  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: { audiences: true }
  })
  
  if (!test || !test.smvsConfig) {
    throw new Error('Test not found or SMVS config missing')
  }
  
  const config = test.smvsConfig as any
  
  // 1. Generate BFP
  const bfp = await buildBFP({
    testId,
    category: config.category,
    regions: config.regions || ['KSA'],
    productName: (test.productInfo as any)?.name || 'Product',
    targetPrice: config.pricing?.target || 100,
    identity: config.identitySignals,
    mode: 'PRIORS_ONLY'
  })
  
  // 2. Generate recommendations
  const recommendations = generateRecommendations(bfp)
  
  // 3. Generate personas
  const personas = buildPersonas(bfp)
  
  // 4. Save to database
  await prisma.test.update({
    where: { id: testId },
    data: {
      smvsBfpSnapshot: bfp as any,
      smvsRecommendations: recommendations as any,
      smvsPersonas: personas as any,
      smvsLastRunAt: new Date()
    }
  })
  
  return { bfp, recommendations, personas }
}
