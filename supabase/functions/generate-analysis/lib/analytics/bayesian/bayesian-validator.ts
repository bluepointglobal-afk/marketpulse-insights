/**
 * Bayesian Validation Models
 * Sophisticated confidence scoring using Bayesian inference
 * 
 * This module implements Bayesian statistical methods to provide more nuanced
 * confidence scores and credible intervals for survey analysis results.
 */

interface BayesianPrior {
  mean: number
  variance: number
  distribution: 'normal' | 'beta' | 'gamma' | 'uniform'
  parameters?: Record<string, number>
}

interface BayesianPosterior {
  mean: number
  variance: number
  credibleInterval: {
    lower: number
    upper: number
    probability: number
  }
  probability: number
  evidence: number
}

interface ValidationResult {
  metric: string
  value: number
  confidence: number
  credibleInterval: {
    lower: number
    upper: number
    probability: number
  }
  bayesianPValue: number
  effectSize: number
  robustness: number
  multipleTestingCorrection: number
}

interface SurveyData {
  responses: number[]
  demographics?: Record<string, any>
  metadata?: Record<string, any>
}

export class BayesianValidator {
  private priors: Map<string, BayesianPrior> = new Map()
  private sampleSize: number = 0
  private multipleComparisons: number = 0

  constructor() {
    this.initializeDefaultPriors()
  }

  /**
   * Initialize default priors for common metrics
   */
  private initializeDefaultPriors(): void {
    // Purchase intent prior (Beta distribution)
    this.priors.set('purchase_intent', {
      mean: 0.3,
      variance: 0.05,
      distribution: 'beta',
      parameters: { alpha: 3, beta: 7 }
    })

    // Price sensitivity prior (Normal distribution)
    this.priors.set('price_sensitivity', {
      mean: 0.5,
      variance: 0.1,
      distribution: 'normal'
    })

    // Brand preference prior (Beta distribution)
    this.priors.set('brand_preference', {
      mean: 0.4,
      variance: 0.08,
      distribution: 'beta',
      parameters: { alpha: 4, beta: 6 }
    })

    // Feature importance prior (Gamma distribution)
    this.priors.set('feature_importance', {
      mean: 0.6,
      variance: 0.12,
      distribution: 'gamma',
      parameters: { shape: 2, scale: 0.3 }
    })
  }

  /**
   * Validate purchase intent with Bayesian analysis
   */
  validatePurchaseIntent(data: SurveyData): ValidationResult {
    const responses = data.responses
    const positiveResponses = responses.filter(r => r >= 4).length // Assuming 1-5 scale
    const totalResponses = responses.length

    // Beta-Binomial conjugate prior
    const prior = this.priors.get('purchase_intent')!
    const alphaPrior = prior.parameters!.alpha
    const betaPrior = prior.parameters!.beta

    // Posterior parameters
    const alphaPosterior = alphaPrior + positiveResponses
    const betaPosterior = betaPrior + totalResponses - positiveResponses

    // Posterior statistics
    const posteriorMean = alphaPosterior / (alphaPosterior + betaPosterior)
    const posteriorVariance = (alphaPosterior * betaPosterior) / 
      ((alphaPosterior + betaPosterior) ** 2 * (alphaPosterior + betaPosterior + 1))

    // Credible interval (95%)
    const credibleInterval = this.calculateBetaCredibleInterval(alphaPosterior, betaPosterior, 0.95)

    // Bayesian p-value (probability that true value > 0.5)
    const bayesianPValue = this.calculateBetaCumulativeProbability(0.5, alphaPosterior, betaPosterior)

    // Effect size (Cohen's h)
    const effectSize = this.calculateEffectSize(posteriorMean, 0.5)

    // Robustness check
    const robustness = this.calculateRobustness(responses)

    // Multiple testing correction
    const multipleTestingCorrection = this.calculateMultipleTestingCorrection()

    return {
      metric: 'purchase_intent',
      value: posteriorMean,
      confidence: 1 - bayesianPValue,
      credibleInterval,
      bayesianPValue,
      effectSize,
      robustness,
      multipleTestingCorrection
    }
  }

  /**
   * Validate price sensitivity with Bayesian analysis
   */
  validatePriceSensitivity(data: SurveyData): ValidationResult {
    const responses = data.responses
    const meanResponse = responses.reduce((sum, r) => sum + r, 0) / responses.length
    const sampleVariance = responses.reduce((sum, r) => sum + Math.pow(r - meanResponse, 2), 0) / responses.length

    // Normal-Normal conjugate prior
    const prior = this.priors.get('price_sensitivity')!
    const priorMean = prior.mean
    const priorVariance = prior.variance

    // Posterior parameters
    const posteriorPrecision = 1 / priorVariance + responses.length / sampleVariance
    const posteriorMean = (priorMean / priorVariance + responses.length * meanResponse / sampleVariance) / posteriorPrecision
    const posteriorVariance = 1 / posteriorPrecision

    // Credible interval (95%)
    const credibleInterval = this.calculateNormalCredibleInterval(posteriorMean, posteriorVariance, 0.95)

    // Bayesian p-value
    const bayesianPValue = this.calculateNormalCumulativeProbability(0.5, posteriorMean, Math.sqrt(posteriorVariance))

    // Effect size
    const effectSize = this.calculateEffectSize(posteriorMean, 0.5)

    // Robustness
    const robustness = this.calculateRobustness(responses)

    return {
      metric: 'price_sensitivity',
      value: posteriorMean,
      confidence: 1 - bayesianPValue,
      credibleInterval,
      bayesianPValue,
      effectSize,
      robustness,
      multipleTestingCorrection: this.calculateMultipleTestingCorrection()
    }
  }

  /**
   * Validate brand preference with Bayesian analysis
   */
  validateBrandPreference(data: SurveyData): ValidationResult {
    const responses = data.responses
    const positiveResponses = responses.filter(r => r >= 4).length
    const totalResponses = responses.length

    const prior = this.priors.get('brand_preference')!
    const alphaPrior = prior.parameters!.alpha
    const betaPrior = prior.parameters!.beta

    const alphaPosterior = alphaPrior + positiveResponses
    const betaPosterior = betaPrior + totalResponses - positiveResponses

    const posteriorMean = alphaPosterior / (alphaPosterior + betaPosterior)
    const credibleInterval = this.calculateBetaCredibleInterval(alphaPosterior, betaPosterior, 0.95)
    const bayesianPValue = this.calculateBetaCumulativeProbability(0.4, alphaPosterior, betaPosterior)

    return {
      metric: 'brand_preference',
      value: posteriorMean,
      confidence: 1 - bayesianPValue,
      credibleInterval,
      bayesianPValue,
      effectSize: this.calculateEffectSize(posteriorMean, 0.4),
      robustness: this.calculateRobustness(responses),
      multipleTestingCorrection: this.calculateMultipleTestingCorrection()
    }
  }

  /**
   * Calculate credible interval for Beta distribution
   */
  private calculateBetaCredibleInterval(alpha: number, beta: number, probability: number): {
    lower: number
    upper: number
    probability: number
  } {
    const lowerTail = (1 - probability) / 2
    const upperTail = 1 - lowerTail

    // Approximate quantiles using normal approximation for large samples
    const mean = alpha / (alpha + beta)
    const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1))
    const stdDev = Math.sqrt(variance)

    const lower = Math.max(0, mean - 1.96 * stdDev)
    const upper = Math.min(1, mean + 1.96 * stdDev)

    return {
      lower,
      upper,
      probability
    }
  }

  /**
   * Calculate credible interval for Normal distribution
   */
  private calculateNormalCredibleInterval(mean: number, variance: number, probability: number): {
    lower: number
    upper: number
    probability: number
  } {
    const stdDev = Math.sqrt(variance)
    const zScore = 1.96 // For 95% credible interval

    return {
      lower: mean - zScore * stdDev,
      upper: mean + zScore * stdDev,
      probability
    }
  }

  /**
   * Calculate cumulative probability for Beta distribution
   */
  private calculateBetaCumulativeProbability(x: number, alpha: number, beta: number): number {
    // Simplified approximation using normal approximation
    const mean = alpha / (alpha + beta)
    const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1))
    const stdDev = Math.sqrt(variance)

    return this.calculateNormalCumulativeProbability(x, mean, stdDev)
  }

  /**
   * Calculate cumulative probability for Normal distribution
   */
  private calculateNormalCumulativeProbability(x: number, mean: number, stdDev: number): number {
    // Approximation using error function
    const z = (x - mean) / stdDev
    return 0.5 * (1 + this.erf(z / Math.sqrt(2)))
  }

  /**
   * Error function approximation
   */
  private erf(x: number): number {
    // Abramowitz and Stegun approximation
    const a1 = 0.254829592
    const a2 = -0.284496736
    const a3 = 1.421413741
    const a4 = -1.453152027
    const a5 = 1.061405429
    const p = 0.3275911

    const sign = x >= 0 ? 1 : -1
    x = Math.abs(x)

    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

    return sign * y
  }

  /**
   * Calculate effect size (Cohen's h for proportions)
   */
  private calculateEffectSize(observed: number, expected: number): number {
    return 2 * (Math.asin(Math.sqrt(observed)) - Math.asin(Math.sqrt(expected)))
  }

  /**
   * Calculate robustness of the result
   */
  private calculateRobustness(responses: number[]): number {
    const n = responses.length
    if (n < 30) return 0.5 // Low robustness for small samples

    // Check for outliers using IQR method
    const sorted = [...responses].sort((a, b) => a - b)
    const q1 = sorted[Math.floor(n * 0.25)]
    const q3 = sorted[Math.floor(n * 0.75)]
    const iqr = q3 - q1
    const outliers = responses.filter(r => r < q1 - 1.5 * iqr || r > q3 + 1.5 * iqr).length

    const outlierRatio = outliers / n
    const robustness = Math.max(0, 1 - outlierRatio * 2)

    return robustness
  }

  /**
   * Calculate multiple testing correction (Bonferroni)
   */
  private calculateMultipleTestingCorrection(): number {
    this.multipleComparisons++
    return Math.min(1, 0.05 / this.multipleComparisons)
  }

  /**
   * Perform comprehensive Bayesian validation
   */
  validateComprehensive(data: SurveyData): {
    purchaseIntent: ValidationResult
    priceSensitivity: ValidationResult
    brandPreference: ValidationResult
    overallConfidence: number
    recommendations: string[]
  } {
    const purchaseIntent = this.validatePurchaseIntent(data)
    const priceSensitivity = this.validatePriceSensitivity(data)
    const brandPreference = this.validateBrandPreference(data)

    // Calculate overall confidence
    const overallConfidence = (
      purchaseIntent.confidence +
      priceSensitivity.confidence +
      brandPreference.confidence
    ) / 3

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      purchaseIntent,
      priceSensitivity,
      brandPreference
    })

    return {
      purchaseIntent,
      priceSensitivity,
      brandPreference,
      overallConfidence,
      recommendations
    }
  }

  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations(results: {
    purchaseIntent: ValidationResult
    priceSensitivity: ValidationResult
    brandPreference: ValidationResult
  }): string[] {
    const recommendations: string[] = []

    // Purchase intent recommendations
    if (results.purchaseIntent.confidence > 0.8) {
      recommendations.push('High confidence in purchase intent - proceed with product development')
    } else if (results.purchaseIntent.confidence < 0.6) {
      recommendations.push('Low confidence in purchase intent - consider additional market research')
    }

    // Price sensitivity recommendations
    if (results.priceSensitivity.value > 0.7) {
      recommendations.push('High price sensitivity detected - consider competitive pricing strategy')
    } else if (results.priceSensitivity.value < 0.3) {
      recommendations.push('Low price sensitivity - premium pricing strategy recommended')
    }

    // Brand preference recommendations
    if (results.brandPreference.confidence > 0.8 && results.brandPreference.value > 0.6) {
      recommendations.push('Strong brand preference - invest in brand building and marketing')
    } else if (results.brandPreference.value < 0.4) {
      recommendations.push('Weak brand preference - focus on product differentiation')
    }

    // Robustness recommendations
    const minRobustness = Math.min(
      results.purchaseIntent.robustness,
      results.priceSensitivity.robustness,
      results.brandPreference.robustness
    )

    if (minRobustness < 0.7) {
      recommendations.push('Results may be sensitive to outliers - consider robust statistical methods')
    }

    // Sample size recommendations
    if (this.sampleSize < 100) {
      recommendations.push('Small sample size - consider increasing sample size for more reliable results')
    }

    return recommendations
  }

  /**
   * Update priors based on historical data
   */
  updatePriors(historicalData: Record<string, number[]>): void {
    Object.entries(historicalData).forEach(([metric, values]) => {
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length

      const existingPrior = this.priors.get(metric)
      if (existingPrior) {
        // Update prior using empirical Bayes
        const newMean = (existingPrior.mean + mean) / 2
        const newVariance = (existingPrior.variance + variance) / 2

        this.priors.set(metric, {
          ...existingPrior,
          mean: newMean,
          variance: newVariance
        })
      }
    })
  }

  /**
   * Get current priors
   */
  getPriors(): Map<string, BayesianPrior> {
    return new Map(this.priors)
  }

  /**
   * Set custom prior for a metric
   */
  setPrior(metric: string, prior: BayesianPrior): void {
    this.priors.set(metric, prior)
  }

  /**
   * Calculate Bayes Factor for model comparison
   */
  calculateBayesFactor(data: SurveyData, model1: string, model2: string): number {
    // Simplified Bayes factor calculation
    const likelihood1 = this.calculateLikelihood(data, model1)
    const likelihood2 = this.calculateLikelihood(data, model2)

    return likelihood1 / likelihood2
  }

  /**
   * Calculate likelihood for a model
   */
  private calculateLikelihood(data: SurveyData, model: string): number {
    const responses = data.responses
    const n = responses.length
    const mean = responses.reduce((sum, r) => sum + r, 0) / n
    const variance = responses.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / n

    // Simplified likelihood calculation
    return Math.exp(-n * Math.log(2 * Math.PI * variance) / 2 - 
      responses.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (2 * variance))
  }

  /**
   * Perform sensitivity analysis
   */
  performSensitivityAnalysis(data: SurveyData): {
    priorSensitivity: number
    sampleSizeSensitivity: number
    outlierSensitivity: number
  } {
    const baseResult = this.validatePurchaseIntent(data)
    
    // Test prior sensitivity
    const originalPrior = this.priors.get('purchase_intent')!
    const modifiedPrior = { ...originalPrior, mean: originalPrior.mean * 1.5 }
    this.priors.set('purchase_intent', modifiedPrior)
    const modifiedResult = this.validatePurchaseIntent(data)
    this.priors.set('purchase_intent', originalPrior)
    
    const priorSensitivity = Math.abs(baseResult.value - modifiedResult.value)

    // Test sample size sensitivity
    const halfData = { ...data, responses: data.responses.slice(0, Math.floor(data.responses.length / 2)) }
    const halfResult = this.validatePurchaseIntent(halfData)
    const sampleSizeSensitivity = Math.abs(baseResult.value - halfResult.value)

    // Test outlier sensitivity
    const outlierData = { ...data, responses: [...data.responses, 1, 1, 1, 5, 5, 5] }
    const outlierResult = this.validatePurchaseIntent(outlierData)
    const outlierSensitivity = Math.abs(baseResult.value - outlierResult.value)

    return {
      priorSensitivity,
      sampleSizeSensitivity,
      outlierSensitivity
    }
  }
}

/**
 * Utility function to create survey data from responses
 */
export function createSurveyDataFromResponses(responses: number[], demographics?: Record<string, any>): SurveyData {
  return {
    responses,
    demographics,
    metadata: {
      timestamp: new Date().toISOString(),
      sampleSize: responses.length
    }
  }
}

/**
 * Utility function to format Bayesian validation results
 */
export function formatBayesianResults(results: ValidationResult): string {
  return `
${results.metric.replace('_', ' ').toUpperCase()}:
  Value: ${(results.value * 100).toFixed(1)}%
  Confidence: ${(results.confidence * 100).toFixed(1)}%
  95% Credible Interval: [${(results.credibleInterval.lower * 100).toFixed(1)}%, ${(results.credibleInterval.upper * 100).toFixed(1)}%]
  Bayesian p-value: ${results.bayesianPValue.toFixed(4)}
  Effect Size: ${results.effectSize.toFixed(3)}
  Robustness: ${(results.robustness * 100).toFixed(1)}%
  Multiple Testing Correction: ${(results.multipleTestingCorrection * 100).toFixed(1)}%
  `.trim()
}
