import { z } from 'zod';

export const RegionZ = z.enum(['KSA','UAE','GCC','MENA']);

export const BetaParamsZ = z.object({
  alpha: z.number().positive(),
  beta: z.number().positive()
});

export const SourceLogZ = z.object({
  primary: z.string().min(1),
  secondary: z.string().optional(),
  expert: z.string().optional(),
  sampleSize: z.number().int().positive().optional(),
  dateRange: z.string().optional(),
  confidence: z.enum(['high','medium','low']).default('medium')
});

export const PriorTierZ = z.enum(['BENCHMARK','ESTIMATED','PLACEHOLDER']);

export const BoundsZ = z.object({
  min: z.number().min(0).max(1),
  max: z.number().min(0).max(1)
}).refine(b => b.min <= b.max, { message: 'bounds.min must be <= bounds.max' });

export const BenchmarksZ = z.object({
  competitorMean: z.number().min(0).max(1).optional(),
  topQuartile: z.number().min(0).max(1).optional(),
  dataSource: z.string().optional()
});

export const PriorZ = z.object({
  feature: z.string().min(1),
  region: RegionZ,
  distribution: z.literal('beta'),
  params: BetaParamsZ,
  bounds: BoundsZ,
  tier: PriorTierZ,
  sourceLog: SourceLogZ,
  benchmarks: BenchmarksZ.optional()
});

export const IdentityWeightsZ = z.object({ 
  S: z.number(), 
  T: z.number(), 
  U: z.number() 
});

export const RegionMetaZ = z.object({
  expatRatio: z.number().min(0).max(1).default(0),
  popWeight: z.number().positive().optional()
});

export const CategoryMetaZ = z.object({
  ticketSize: z.enum(['low','medium','high','enterprise']),
  cycle: z.enum(['impulse','considered','long','contract']),
  b2x: z.enum(['b2c','b2b','both']),
  psmGate: z.number().min(0).max(1)
});

export const PriorsFileZ = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  category: z.string().min(1),
  categoryMeta: CategoryMetaZ,
  priors: z.array(PriorZ).min(1),
  identity_weights: z.record(RegionZ, IdentityWeightsZ),
  region_meta: z.record(RegionZ, RegionMetaZ)
});

export type Region = z.infer<typeof RegionZ>;
export type BetaParams = z.infer<typeof BetaParamsZ>;
export type SourceLog = z.infer<typeof SourceLogZ>;
export type PriorTier = z.infer<typeof PriorTierZ>;
export type Bounds = z.infer<typeof BoundsZ>;
export type Benchmarks = z.infer<typeof BenchmarksZ>;
export type Prior = z.infer<typeof PriorZ>;
export type IdentityWeights = z.infer<typeof IdentityWeightsZ>;
export type RegionMeta = z.infer<typeof RegionMetaZ>;
export type CategoryMeta = z.infer<typeof CategoryMetaZ>;
export type PriorsFile = z.infer<typeof PriorsFileZ>;
