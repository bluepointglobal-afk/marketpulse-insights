import type { BetaParams } from '../../types';

export function betaPosterior(
  prior: BetaParams,
  evidence: { successes: number; trials: number }
): BetaParams {
  const x = Math.max(0, evidence.successes || 0);
  const n = Math.max(0, evidence.trials || 0);
  return {
    alpha: prior.alpha + x,
    beta: prior.beta + (n - x)
  };
}

export function betaStats(p: BetaParams) {
  const a = p.alpha, b = p.beta, k = a + b;
  const mean = a / k;
  const variance = (a * b) / (k * k * (k + 1));
  return { mean, variance, k };
}

// Posterior Sharpness Metric (simple bounded heuristic 0..1)
// Higher when variance is low AND k is decent.
export function psm(variance: number, k: number) {
  // Normalize variance against a Beta with k=10 at mean 0.5 (loose reference)
  const refVar = (5 * 5) / (10 * 10 * (11)); // Beta(5,5)
  const vScore = Math.max(0, 1 - variance / refVar); // 0..1
  const kScore = Math.min(1, k / 100);               // saturate ~100
  return 0.6 * vScore + 0.4 * kScore;
}
