/**
 * SMVS Pipeline Orchestrator
 * End-to-end flow from config to results
 * 
 * INSTALL TO: src/lib/analytics/smvs-pipeline.ts
 */

import { prisma } from '@/lib/db'
import { buildBFP } from './bayesian/build-bfp'
import { generateRecommendations } from './recommendation/engine'
import { buildPersonas } from './segmentation/personas'
import type { BayesianFactPack } from './bayesian/bfp'
import type { Recommendation } from './recommendation/engine'
import type { Persona } from './segmentation/personas'

export interface SmvsPipelineResult {
  bfp: BayesianFactPack
  recommendations: Recommendation[]
  personas: Persona[]
  narratives: any
  meta: {
    duration: number
    cached: boolean
  }
}

export function shouldRunSmvs(test: any): boolean {
  if (!test) return false
  if (!test.smvsEnabled) return false
  if (!test.smvsConfig) return false
  
  const config = test.smvsConfig as any
  if (!config.category) return false
  if (!config.regions || config.regions.length === 0) return false
  
  return true
}

export async function getCachedSmvsResults(testId: string): Promise<SmvsPipelineResult | null> {
  const test = await prisma.test.findUnique({
    where: { id: testId },
    select: {
      smvsBfpSnapshot: true,
      smvsRecommendations: true,
      smvsPersonas: true,
      smvsNarratives: true,
      smvsLastRunAt: true
    }
  })
  
  if (!test || !test.smvsBfpSnapshot) return null
  
  const hoursSinceRun = test.smvsLastRunAt 
    ? (Date.now() - new Date(test.smvsLastRunAt).getTime()) / (1000 * 60 * 60)
    : 999
  
  if (hoursSinceRun > 24) return null
  
  return {
    bfp: test.smvsBfpSnapshot as unknown as BayesianFactPack,
    recommendations: (test.smvsRecommendations || []) as unknown as Recommendation[],
    personas: (test.smvsPersonas || []) as unknown as Persona[],
    narratives: test.smvsNarratives || null,
    meta: {
      duration: 0,
      cached: true
    }
  }
}

export async function runSmvsPipeline(testId: string): Promise<SmvsPipelineResult> {
  const startTime = Date.now()
  
  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      audiences: true
    }
  })
  
  if (!test) throw new Error('Test not found')
  if (!shouldRunSmvs(test)) throw new Error('SMVS not enabled or configured')
  
  const config = test.smvsConfig as any
  const calibrations = test.smvsCalibration as any[]
  
  const bfp = await buildBFP({
    testId,
    category: config.category,
    regions: config.regions,
    productName: test.name,
    targetPrice: config.pricing?.target || 100,
    competitorRange: config.pricing ? {
      min: config.pricing.min,
      max: config.pricing.max
    } : undefined,
    identity: config.identitySignals,
    regionWeights: config.regionWeights?.weights,
    mode: test.dataMode as any || 'PRIORS_ONLY',
    calibrations: calibrations || []
  })
  
  const recommendations = generateRecommendations(bfp)
  const personas = buildPersonas(bfp)
  
  let narratives = null
  try {
    // Groq narratives generation would go here
    // For now, using simple templates
    narratives = {
      execSummary: {
        headline: `${bfp.summary.recommendedAction}: PSM ${(bfp.summary.overall_psm * 100).toFixed(0)}%`,
        bullets: recommendations.slice(0, 3).map(r => r.action)
      }
    }
  } catch (error) {
    console.error('Narrative generation failed, using fallback')
  }
  
  await prisma.test.update({
    where: { id: testId },
    data: {
      smvsBfpSnapshot: bfp as any,
      smvsRecommendations: recommendations as any,
      smvsPersonas: personas as any,
      smvsNarratives: narratives as any,
      smvsLastRunAt: new Date()
    }
  })
  
  const duration = Date.now() - startTime
  
  return {
    bfp,
    recommendations,
    personas,
    narratives,
    meta: {
      duration,
      cached: false
    }
  }
}
