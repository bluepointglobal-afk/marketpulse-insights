import { z } from "zod";

export const RegionCode = z.enum(["GCC","MENA","BLEND"]);

export const MessageBeta = z.object({ 
  beta0: z.number(), 
  betaS: z.number(), 
  betaT: z.number(), 
  betaU: z.number() 
});

export const SmvsMeta = z.object({
  reportId: z.string(),
  createdAtISO: z.string(),
  smvsVersion: z.literal("1.0"),
  bpcrCode: z.string(),
  region: RegionCode,
  alpha: z.number().min(0).max(1).optional(),
  category: z.string(),
  hash: z.string().optional()
});

export const ProductSpec = z.object({
  name: z.string(),
  description: z.string(),
  useCase: z.string()
});

export const TestParams = z.object({
  price: z.number(),
  messageBeta: MessageBeta,
  personasN: z.number().int().nonnegative(),
  personaStats: z.object({
    S: z.object({ mean: z.number(), sd: z.number() }),
    T: z.object({ mean: z.number(), sd: z.number() }),
    U: z.object({ mean: z.number(), sd: z.number() }),
    basePrior: z.object({ mean: z.number(), sd: z.number() })
  })
});

export const ResultsCore = z.object({
  demandProb: z.number().min(0).max(1),
  dispersion: z.number().min(0).max(1),
  ccs: z.number().min(0).max(100),
  psm: z.number().min(0).max(1),
  priceCurve: z.array(z.object({ 
    p: z.number(), 
    adopt: z.number().min(0).max(1) 
  })).optional(),
  messages: z.array(z.object({ 
    label: z.string(), 
    beta: MessageBeta, 
    like: z.number().min(0).max(1) 
  })).optional(),
  segments: z.array(z.object({
    name: z.string(), 
    share: z.number().min(0).max(1), 
    S: z.number(), 
    T: z.number(), 
    U: z.number(), 
    notes: z.string().optional()
  })).optional()
});

export const CalibrationBlock = z.object({
  convergenceC: z.number().min(0).max(1).optional(),
  limitations: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([])
});

export const Recommendations = z.object({
  goNoGo: z.enum(["GO","NO-GO","REVISE"]),
  priceAdvice: z.string(),
  nextExperiments: z.array(z.string())
});

export const SmvsReportPayload = z.object({
  meta: SmvsMeta,
  product: ProductSpec,
  params: TestParams,
  results: ResultsCore,
  calibration: CalibrationBlock,
  recs: Recommendations
});

export type TSmvsReportPayload = z.infer<typeof SmvsReportPayload>;
export type TSmvsMeta = z.infer<typeof SmvsMeta>;
export type TProductSpec = z.infer<typeof ProductSpec>;
export type TTestParams = z.infer<typeof TestParams>;
export type TResultsCore = z.infer<typeof ResultsCore>;
export type TCalibrationBlock = z.infer<typeof CalibrationBlock>;
export type TRecommendations = z.infer<typeof Recommendations>;
