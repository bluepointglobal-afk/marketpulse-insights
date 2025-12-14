/**
 * SMVS v1.0 Constants
 * All thresholds and configuration
 * 
 * INSTALL TO: src/lib/analytics/bayesian/constants.ts
 */

export const SMVS_VERSION = "1.0"

// PSM Thresholds
export const PSM_ACTIONABLE_THRESHOLD = 0.40
export const PSM_STRONG_THRESHOLD = 0.55
export const PSM_REVISE_THRESHOLD = 0.30
export const CI_MAX_WIDTH_ACTIONABLE = 0.25

// Identity Thresholds
export const IDENTITY_HIGH_THRESHOLD = 0.45
export const IDENTITY_MEDIUM_THRESHOLD = 0.30

// Sample Size Recommendations
export const MIN_CALIBRATION_SAMPLE = 50
export const RECOMMENDED_CALIBRATION_SAMPLE = 120
export const LARGE_CALIBRATION_SAMPLE = 200

// Feature Flags
export const FEATURE_FLAG_SMVS = process.env.SMVS_ENABLED === "1" || 
                                  process.env.NEXT_PUBLIC_SMVS_ENABLED === "1"

export const DEBUG_SMVS = process.env.SMVS_DEBUG === "1" || 
                          process.env.NEXT_PUBLIC_SMVS_DEBUG === "1"

// Cache Configuration
export const BFP_CACHE_TTL_HOURS = 24

// Groq Configuration
export const GROQ_MAX_RETRIES = 2
export const GROQ_TEMPERATURE = 0.2

// UI Labels
export const PSM_LABELS = {
  VERY_HIGH: "Very High",
  HIGH: "High", 
  MODERATE: "Moderate",
  LOW: "Low",
  INSUFFICIENT: "Insufficient"
} as const

export const DECISION_LABELS = {
  GO: "GO",
  REVISE: "REVISE",
  NO_GO: "NO-GO"
} as const

export const TIER_LABELS = {
  REAL: "Real Data",
  ESTIMATED: "Estimated",
  INFERRED: "Inferred"
} as const

export function getPSMLabel(psm: number): keyof typeof PSM_LABELS {
  if (psm >= 0.60) return "VERY_HIGH"
  if (psm >= PSM_STRONG_THRESHOLD) return "HIGH"
  if (psm >= PSM_ACTIONABLE_THRESHOLD) return "MODERATE"
  if (psm >= PSM_REVISE_THRESHOLD) return "LOW"
  return "INSUFFICIENT"
}

export function getDecisionFromPSM(psm: number): keyof typeof DECISION_LABELS {
  if (psm >= PSM_ACTIONABLE_THRESHOLD) return "GO"
  if (psm >= PSM_REVISE_THRESHOLD) return "REVISE"
  return "NO_GO"
}

export function isActionable(psm: number, ciWidth: number): boolean {
  return psm >= PSM_ACTIONABLE_THRESHOLD && ciWidth <= CI_MAX_WIDTH_ACTIONABLE
}

export function estimateSamplesNeeded(
  currentPSM: number,
  targetPSM: number,
  currentN: number
): number {
  if (currentPSM >= targetPSM) return 0
  const psmGap = targetPSM - currentPSM
  const multiplier = 1 + (psmGap / 0.10)
  return Math.ceil(currentN * multiplier - currentN)
}
