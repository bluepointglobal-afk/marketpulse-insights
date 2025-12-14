/**
 * Calibration Data Types & CSV Adapters
 * 
 * INSTALL TO: src/lib/analytics/bayesian/calibration.ts
 */

export type CalibrationFeature = 'demand_trial_30d' | 'premium_accept_20p' | 'online_share'

export interface CalibrationDatum {
  feature: CalibrationFeature
  trials: number
  successes: number
  source: 'survey' | 'sales' | 'ads' | 'analytics' | 'custom'
  meta?: Record<string, any>
}

export interface ColumnMapping {
  feature: CalibrationFeature
  trialsColumn: string
  successColumn: string
  source: CalibrationDatum['source']
}

export function validateCalibrationDatum(datum: CalibrationDatum): { valid: boolean; error?: string } {
  if (datum.trials < 0 || !Number.isFinite(datum.trials)) {
    return { valid: false, error: 'Trials must be non-negative finite number' }
  }
  if (datum.successes < 0 || !Number.isFinite(datum.successes)) {
    return { valid: false, error: 'Successes must be non-negative finite number' }
  }
  if (datum.successes > datum.trials) {
    return { valid: false, error: 'Successes cannot exceed trials' }
  }
  return { valid: true }
}

export function normalizeGA(
  data: Record<string, any>[],
  mapping: ColumnMapping
): CalibrationDatum[] {
  return data
    .map(row => ({
      feature: mapping.feature,
      trials: parseInt(row[mapping.trialsColumn]) || 0,
      successes: parseInt(row[mapping.successColumn]) || 0,
      source: 'analytics' as const,
      meta: { originalRow: row }
    }))
    .filter(d => validateCalibrationDatum(d).valid)
}

export function normalizeSales(
  data: Record<string, any>[],
  mapping: ColumnMapping
): CalibrationDatum[] {
  return data
    .map(row => ({
      feature: mapping.feature,
      trials: parseInt(row[mapping.trialsColumn]) || 0,
      successes: parseInt(row[mapping.successColumn]) || 0,
      source: 'sales' as const,
      meta: { originalRow: row }
    }))
    .filter(d => validateCalibrationDatum(d).valid)
}

export function normalizeAds(
  data: Record<string, any>[],
  mapping: ColumnMapping
): CalibrationDatum[] {
  return data
    .map(row => ({
      feature: mapping.feature,
      trials: parseInt(row[mapping.trialsColumn]) || 0,
      successes: parseInt(row[mapping.successColumn]) || 0,
      source: 'ads' as const,
      meta: { originalRow: row }
    }))
    .filter(d => validateCalibrationDatum(d).valid)
}

export function normalizeGeneric(
  data: Record<string, any>[],
  mapping: ColumnMapping
): CalibrationDatum[] {
  return data
    .map(row => ({
      feature: mapping.feature,
      trials: parseInt(row[mapping.trialsColumn]) || 0,
      successes: parseInt(row[mapping.successColumn]) || 0,
      source: mapping.source,
      meta: { originalRow: row }
    }))
    .filter(d => validateCalibrationDatum(d).valid)
}

export function aggregateCalibration(data: CalibrationDatum[]): Map<CalibrationFeature, CalibrationDatum> {
  const map = new Map<CalibrationFeature, CalibrationDatum>()
  
  for (const datum of data) {
    const existing = map.get(datum.feature)
    if (existing) {
      map.set(datum.feature, {
        ...existing,
        trials: existing.trials + datum.trials,
        successes: existing.successes + datum.successes
      })
    } else {
      map.set(datum.feature, { ...datum })
    }
  }
  
  return map
}
