import * as XLSX from 'xlsx';

function formatPercent(value: number | undefined | null): string {
  if (value === undefined || value === null) return '—';
  const percent = value > 1 ? value : value * 100;
  return `${Math.round(percent)}%`;
}

function formatSAR(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') return '—';
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  if (isNaN(num)) return String(value);
  return `SAR ${num.toLocaleString()}`;
}

function safeText(value: any, fallback: string = '—'): string {
  if (value === undefined || value === null || value === '' || value === 'N/A') return fallback;
  return String(value);
}

function safeArray(value: any): any[] {
  return Array.isArray(value) ? value : [];
}

export async function generateExcel(data: any): Promise<Blob> {
  const wb = XLSX.utils.book_new();
  
  const productName = data.productName || data.product_name || 'Product';
  const category = data.category || 'Consumer Product';
  const bayesianResults = data.bayesianResults || data.bayesian_results || {};
  const brandAnalysis = data.brandAnalysis || data.brand_analysis || {};
  const personas = safeArray(data.personas);
  const competitors = safeArray(brandAnalysis.competitors);
  const vanWestendorp = data.vanWestendorp || data.van_westendorp || {};
  const investmentThesis = data.investmentThesis || brandAnalysis.investmentThesis || brandAnalysis.investment_thesis || {};
  const featureStrategy = data.featureStrategy || brandAnalysis.featureStrategy || {};
  const pricingStrategy = data.pricingStrategy || brandAnalysis.pricingStrategy || {};
  const goToMarket = data.goToMarket || brandAnalysis.goToMarket || {};
  const risks = data.risks || brandAnalysis.risks || {};
  const market = data.market || brandAnalysis.market || {};

  const demandProb = bayesianResults.demandProbability || 0;
  const psmScore = bayesianResults.psmScore || 0;
  const optimalPrice = bayesianResults.optimalPrice || 0;
  const recommendation = investmentThesis?.recommendation?.recommendation || 
    (psmScore >= 60 ? 'GREENLIGHT' : psmScore >= 40 ? 'TEST FURTHER' : 'REVISE STRATEGY');
  const confidence = investmentThesis?.recommendation?.confidenceLevel || 
    (psmScore >= 75 ? 'HIGH' : psmScore >= 50 ? 'MEDIUM' : 'LOW');

  // ═══════════════════════════════════════════════════════════════
  // SHEET 1: Executive Summary
  // ═══════════════════════════════════════════════════════════════
  const summaryData = [
    ['MARKETPULSE GCC MARKET VALIDATION REPORT'],
    [''],
    ['Product Name', productName],
    ['Category', category],
    ['Generated Date', new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })],
    [''],
    ['RECOMMENDATION'],
    ['Decision', recommendation],
    ['Confidence Level', confidence],
    ['Reasoning', safeText(investmentThesis?.recommendation?.reasoning, 'Based on Bayesian analysis')],
    [''],
    ['KEY METRICS'],
    ['Metric', 'Value', 'Interpretation'],
    ['Demand Probability', formatPercent(demandProb), demandProb >= 0.6 ? 'Strong market signal' : 'Moderate - validate further'],
    ['PSM Score', `${psmScore}/100`, psmScore >= 60 ? 'GO - Proceed with market test' : psmScore >= 40 ? 'REVISE - Directional insights' : 'NO-GO - Insufficient confidence'],
    ['Optimal Price', formatSAR(optimalPrice), 'Bayesian-optimized price point'],
    ['Price Range (Min)', formatSAR(bayesianResults.priceRange?.min), 'Lower bound of acceptable range'],
    ['Price Range (Max)', formatSAR(bayesianResults.priceRange?.max), 'Upper bound of acceptable range'],
    ['Confidence Interval', `${formatPercent(bayesianResults.confidenceInterval?.[0])} - ${formatPercent(bayesianResults.confidenceInterval?.[1])}`, '95% confidence band'],
    [''],
    ['MARKET SIZING'],
    ['TAM', safeText(market.marketSize?.tam?.value, 'USD 500M+'), safeText(market.marketSize?.tam?.methodology)],
    ['SAM', safeText(market.marketSize?.sam?.value, 'USD 150M'), safeText(market.marketSize?.sam?.methodology)],
    ['SOM (Year 3)', safeText(market.marketSize?.som?.value, 'USD 15M'), safeText(market.marketSize?.som?.methodology)],
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 35 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Executive Summary');

  // ═══════════════════════════════════════════════════════════════
  // SHEET 2: Regional Breakdown
  // ═══════════════════════════════════════════════════════════════
  const regionalData = bayesianResults.regionalBreakdown || market.regionalBreakdown || {};
  const regions = Array.isArray(regionalData) ? regionalData : Object.entries(regionalData).map(([name, d]: [string, any]) => ({ region: name, ...d }));
  
  const regionalSheetData = [
    ['REGIONAL ANALYSIS'],
    [''],
    ['Region', 'Demand Probability', 'Optimal Price', 'Market Size', 'Key Insight', 'Cultural Factors', 'Regulatory Factors'],
  ];
  
  if (regions.length > 0) {
    regions.forEach((r: any) => {
      regionalSheetData.push([
        safeText(r.region || r.name),
        formatPercent(r.demandProbability || r.demand),
        formatSAR(r.optimalPrice),
        safeText(r.marketSize),
        safeText(r.insight),
        safeArray(r.culturalFactors).join('; '),
        safeArray(r.regulatoryFactors).join('; '),
      ]);
    });
  } else {
    // Default regional data
    regionalSheetData.push(['Saudi Arabia (KSA)', formatPercent(demandProb), formatSAR(optimalPrice), 'Largest GCC market', 'Key entry point', 'Vision 2030 focus', 'SFDA approval required']);
    regionalSheetData.push(['United Arab Emirates', formatPercent(demandProb * 1.1), formatSAR(optimalPrice * 1.15), 'Premium market', 'High purchasing power', 'Expat-heavy', 'ESMA compliance']);
    regionalSheetData.push(['Qatar', formatPercent(demandProb * 0.95), formatSAR(optimalPrice * 1.2), 'Highest GDP/capita', 'Premium positioning', 'Qatari preferences', 'MOPH requirements']);
  }
  
  const regionalSheet = XLSX.utils.aoa_to_sheet(regionalSheetData);
  regionalSheet['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 15 }, { wch: 18 }, { wch: 35 }, { wch: 30 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, regionalSheet, 'Regional Analysis');

  // ═══════════════════════════════════════════════════════════════
  // SHEET 3: Personas
  // ═══════════════════════════════════════════════════════════════
  const personaSheetData = [
    ['TARGET PERSONAS'],
    [''],
    ['Name', 'Tagline', 'Priority', 'Segment Size', 'Demand Probability', 'Optimal Price', 'Age', 'Income', 'Location', 'Occupation', 'Family Status', 'Core Job', 'LTV:CAC Ratio', 'Year 1 Revenue', '3-Year LTV'],
  ];
  
  personas.forEach((persona: any) => {
    const demo = persona.demographics || {};
    const bayesian = persona.bayesianProfile || {};
    const jtbd = persona.jobsToBeDone || persona.psychographics || {};
    const ltv = persona.lifetimeValue || {};
    
    personaSheetData.push([
      safeText(persona.name),
      safeText(persona.tagline),
      safeText(persona.priority, 'SECONDARY'),
      formatPercent(persona.segmentSize || persona.size),
      formatPercent(bayesian.demandProbability),
      formatSAR(bayesian.optimalPrice || optimalPrice),
      safeText(demo.age),
      safeText(demo.income),
      safeText(demo.location),
      safeText(demo.occupation),
      safeText(demo.familyStatus),
      safeText(jtbd.coreJob),
      safeText(ltv.ltvCacRatio, '4'),
      formatSAR(ltv.year1Revenue),
      formatSAR(ltv.threeYearLTV),
    ]);
  });
  
  const personaSheet = XLSX.utils.aoa_to_sheet(personaSheetData);
  personaSheet['!cols'] = Array(15).fill({ wch: 18 });
  XLSX.utils.book_append_sheet(wb, personaSheet, 'Personas');

  // ═══════════════════════════════════════════════════════════════
  // SHEET 4: Competitors
  // ═══════════════════════════════════════════════════════════════
  const compSheetData = [
    ['COMPETITIVE LANDSCAPE'],
    [''],
    ['Competitor', 'Positioning', 'Price Range Min', 'Price Range Max', 'Market Share', 'Threat Level', 'Status Score', 'Trust Score', 'Overall Score', 'Distribution', 'Strengths', 'Weaknesses', 'Recent Moves'],
  ];
  
  competitors.forEach((comp: any) => {
    const priceRange = typeof comp.priceRange === 'object' ? comp.priceRange : {};
    const brandScores = comp.brandScores || {};
    
    compSheetData.push([
      safeText(comp.name),
      safeText(comp.positioning),
      formatSAR(priceRange.min),
      formatSAR(priceRange.max),
      safeText(comp.marketShare),
      safeText(comp.threatLevel),
      safeText(brandScores.status),
      safeText(brandScores.trust),
      safeText(brandScores.overall),
      safeArray(comp.distribution).join(', '),
      safeArray(comp.strengths).map((s: any) => typeof s === 'string' ? s : s.strength).join('; '),
      safeArray(comp.weaknesses).map((w: any) => typeof w === 'string' ? w : w.weakness).join('; '),
      safeArray(comp.recentMoves).map((m: any) => typeof m === 'string' ? m : `${m.date}: ${m.move}`).join('; '),
    ]);
  });
  
  const compSheet = XLSX.utils.aoa_to_sheet(compSheetData);
  compSheet['!cols'] = Array(13).fill({ wch: 20 });
  XLSX.utils.book_append_sheet(wb, compSheet, 'Competitors');

  // ═══════════════════════════════════════════════════════════════
  // SHEET 5: Pricing Analysis
  // ═══════════════════════════════════════════════════════════════
  const vw = vanWestendorp || pricingStrategy.vanWestendorp || {};
  
  const pricingSheetData = [
    ['PRICING ANALYSIS'],
    [''],
    ['VAN WESTENDORP PRICE SENSITIVITY'],
    ['Threshold', 'Price (SAR)', 'Reasoning'],
    ['Too Cheap', formatSAR(vw.tooCheap?.price || vw.tooCheap), safeText(vw.tooCheap?.reasoning, 'Below this signals low quality')],
    ['Bargain', formatSAR(vw.bargain?.price || vw.bargain), safeText(vw.bargain?.reasoning, 'Good value perception')],
    ['Optimal', formatSAR(vw.optimal?.price || vw.optimalPricePoint), safeText(vw.optimal?.reasoning, 'Maximum purchase probability')],
    ['Expensive', formatSAR(vw.expensive?.price || vw.expensive), safeText(vw.expensive?.reasoning, 'Premium positioning threshold')],
    ['Too Expensive', formatSAR(vw.tooExpensive?.price || vw.tooExpensive), safeText(vw.tooExpensive?.reasoning, 'Above this loses most buyers')],
    ['Acceptable Range', vw.acceptableRange ? `${formatSAR(vw.acceptableRange[0])} - ${formatSAR(vw.acceptableRange[1])}` : '—', ''],
    [''],
    ['PRICING TIERS'],
    ['Tier Name', 'Price', 'Positioning', 'Margin %', 'Target Persona', 'Volume Expectation', 'Rationale'],
  ];
  
  const tiers = safeArray(pricingStrategy.tiers || pricingStrategy.priceArchitecture?.recommendedTiers);
  tiers.forEach((tier: any) => {
    pricingSheetData.push([
      safeText(tier.name),
      formatSAR(tier.price),
      safeText(tier.positioning),
      safeText(tier.margin),
      safeText(tier.targetPersona),
      safeText(tier.volumeExpectation),
      safeText(tier.rationale),
    ]);
  });
  
  pricingSheetData.push(['']);
  pricingSheetData.push(['REGIONAL PRICING']);
  const regionalPricing = pricingStrategy.regionalPricing || {};
  pricingSheetData.push(['KSA Price', formatSAR(regionalPricing.ksaPrice), safeText(regionalPricing.ksaRationale)]);
  pricingSheetData.push(['UAE Price', formatSAR(regionalPricing.uaePrice), safeText(regionalPricing.uaeRationale)]);
  
  const pricingSheet = XLSX.utils.aoa_to_sheet(pricingSheetData);
  pricingSheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, pricingSheet, 'Pricing');

  // ═══════════════════════════════════════════════════════════════
  // SHEET 6: Feature Strategy
  // ═══════════════════════════════════════════════════════════════
  const featureSheetData = [
    ['FEATURE STRATEGY'],
    [''],
    ['MVP RECOMMENDATION'],
    ['Features', safeArray(featureStrategy.mvpRecommendation?.features).join(', ')],
    ['Rationale', safeText(featureStrategy.mvpRecommendation?.rationale)],
    ['Time to Market', safeText(featureStrategy.mvpRecommendation?.timeToMarket)],
    ['Investment Required', safeText(featureStrategy.mvpRecommendation?.investmentRequired)],
    [''],
    ['FEATURE MATRIX'],
    ['Category', 'Features'],
  ];
  
  const matrix = featureStrategy.featureMatrix || {};
  if (matrix.mustBuild) featureSheetData.push(['Must Build', safeArray(matrix.mustBuild).map((f: any) => f.feature || f).join(', ')]);
  if (matrix.shouldBuild) featureSheetData.push(['Should Build', safeArray(matrix.shouldBuild).map((f: any) => f.feature || f).join(', ')]);
  if (matrix.couldBuild) featureSheetData.push(['Could Build', safeArray(matrix.couldBuild).map((f: any) => f.feature || f).join(', ')]);
  if (matrix.skip) featureSheetData.push(['Skip', safeArray(matrix.skip).map((f: any) => f.feature || f).join(', ')]);
  
  featureSheetData.push(['']);
  featureSheetData.push(['DETAILED FEATURE ANALYSIS']);
  featureSheetData.push(['Feature', 'Utility Score', 'Kano Category', 'Strategic Importance', 'Cost Level', 'Competitive Status', 'Margin Impact', 'Marketing Angle']);
  
  safeArray(featureStrategy.featureAnalysis).forEach((feat: any) => {
    featureSheetData.push([
      safeText(feat.feature),
      safeText(feat.utilityScore),
      safeText(feat.kanoCategory),
      safeText(feat.strategicImportance?.score),
      safeText(feat.costToDeliver?.level),
      safeText(feat.competitiveParity?.status),
      safeText(feat.marginImpact),
      safeText(feat.marketingAngle),
    ]);
  });
  
  const featureSheet = XLSX.utils.aoa_to_sheet(featureSheetData);
  featureSheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 18 }, { wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, featureSheet, 'Features');

  // ═══════════════════════════════════════════════════════════════
  // SHEET 7: Go-to-Market
  // ═══════════════════════════════════════════════════════════════
  const gtmSheetData = [
    ['GO-TO-MARKET STRATEGY'],
    [''],
    ['CHANNEL MIX'],
    ['Channel', 'Budget Allocation', 'Expected CAC', 'Conversion Rate', 'Expected Reach', 'Rationale', 'Key Tactics'],
  ];
  
  const channels = safeArray(goToMarket.channelMix?.channelRecommendations || goToMarket.channelMix?.channels);
  channels.forEach((ch: any) => {
    gtmSheetData.push([
      safeText(ch.channel),
      `${ch.budgetAllocation || ch.budgetPercent || 20}%`,
      formatSAR(ch.expectedCAC || ch.cac),
      safeText(ch.conversionRate),
      safeText(ch.expectedReach),
      safeText(ch.rationale),
      safeArray(ch.tactics || ch.keyTactics).join('; '),
    ]);
  });
  
  gtmSheetData.push(['']);
  gtmSheetData.push(['90-DAY LAUNCH ROADMAP']);
  
  const roadmap = goToMarket.ninetyDayRoadmap || {};
  ['preLaunch', 'launch', 'scale'].forEach((phase) => {
    const phaseData = roadmap[phase];
    if (phaseData) {
      const phaseName = phase === 'preLaunch' ? 'Pre-Launch (Days 1-30)' : phase === 'launch' ? 'Launch (Days 31-60)' : 'Scale (Days 61-90)';
      gtmSheetData.push(['']);
      gtmSheetData.push([phaseName]);
      gtmSheetData.push(['Objective', safeText(phaseData.objective)]);
      gtmSheetData.push(['Tactic', 'Budget', 'Owner', 'Timeline', 'Expected Outcome']);
      safeArray(phaseData.tactics).forEach((tactic: any) => {
        gtmSheetData.push([
          safeText(tactic.tactic || tactic),
          formatSAR(tactic.budget),
          safeText(tactic.owner),
          safeText(tactic.timeline),
          safeText(tactic.expectedOutcome),
        ]);
      });
    }
  });
  
  const gtmSheet = XLSX.utils.aoa_to_sheet(gtmSheetData);
  gtmSheet['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 35 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, gtmSheet, 'Go-to-Market');

  // ═══════════════════════════════════════════════════════════════
  // SHEET 8: Financial Projections
  // ═══════════════════════════════════════════════════════════════
  const scenarios = investmentThesis?.scenarios || {};
  
  const finSheetData = [
    ['FINANCIAL PROJECTIONS'],
    [''],
    ['SCENARIO ANALYSIS'],
    ['Metric', 'Bull Case', 'Base Case', 'Bear Case'],
    ['Probability', safeText(scenarios.bullCase?.probability, '25%'), safeText(scenarios.baseCase?.probability, '50%'), safeText(scenarios.bearCase?.probability, '25%')],
    ['Narrative', safeText(scenarios.bullCase?.narrative), safeText(scenarios.baseCase?.narrative), safeText(scenarios.bearCase?.narrative)],
    [''],
    ['YEAR 1 PROJECTIONS'],
    ['Revenue', safeText(scenarios.bullCase?.year1?.revenue), safeText(scenarios.baseCase?.year1?.revenue), safeText(scenarios.bearCase?.year1?.revenue)],
    ['Customers', safeText(scenarios.bullCase?.year1?.customers), safeText(scenarios.baseCase?.year1?.customers), safeText(scenarios.bearCase?.year1?.customers)],
    ['Gross Margin', safeText(scenarios.bullCase?.year1?.grossMargin), safeText(scenarios.baseCase?.year1?.grossMargin), safeText(scenarios.bearCase?.year1?.grossMargin)],
    [''],
    ['YEAR 3 PROJECTIONS'],
    ['Revenue', safeText(scenarios.bullCase?.year3?.revenue), safeText(scenarios.baseCase?.year3?.revenue), safeText(scenarios.bearCase?.year3?.revenue)],
    ['Customers', safeText(scenarios.bullCase?.year3?.customers), safeText(scenarios.baseCase?.year3?.customers), safeText(scenarios.bearCase?.year3?.customers)],
    ['Market Share', safeText(scenarios.bullCase?.year3?.marketShare), safeText(scenarios.baseCase?.year3?.marketShare), safeText(scenarios.bearCase?.year3?.marketShare)],
    ['EBITDA Margin', safeText(scenarios.bullCase?.year3?.ebitdaMargin), safeText(scenarios.baseCase?.year3?.ebitdaMargin), safeText(scenarios.bearCase?.year3?.ebitdaMargin)],
    [''],
    ['KEY SUCCESS FACTORS'],
    ['Factor', 'Criticality', 'Notes'],
  ];
  
  safeArray(investmentThesis.keySuccessFactors).forEach((f: any) => {
    finSheetData.push([
      safeText(f.factor || f),
      safeText(f.criticality, 'HIGH'),
      safeText(f.notes || f.reasoning),
    ]);
  });
  
  finSheetData.push(['']);
  finSheetData.push(['DEAL BREAKERS']);
  safeArray(investmentThesis.dealBreakers).forEach((db: any) => {
    finSheetData.push([typeof db === 'string' ? db : safeText(db.breaker)]);
  });
  
  const finSheet = XLSX.utils.aoa_to_sheet(finSheetData);
  finSheet['!cols'] = [{ wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, finSheet, 'Financial Model');

  // ═══════════════════════════════════════════════════════════════
  // SHEET 9: Risk Analysis
  // ═══════════════════════════════════════════════════════════════
  const riskSheetData = [
    ['RISK ANALYSIS'],
    [''],
    ['MARKET RISKS'],
    ['Risk', 'Likelihood', 'Financial Impact', 'Owner', 'Mitigation'],
  ];
  
  safeArray(risks.marketRisks).forEach((r: any) => {
    riskSheetData.push([
      safeText(r.risk),
      safeText(r.likelihood),
      safeText(r.financialImpact),
      safeText(r.owner),
      safeArray(r.mitigation).join('; '),
    ]);
  });
  
  riskSheetData.push(['']);
  riskSheetData.push(['COMPETITIVE RISKS']);
  riskSheetData.push(['Risk', 'Likelihood', 'Financial Impact', 'Owner', 'Mitigation']);
  
  safeArray(risks.competitiveRisks).forEach((r: any) => {
    riskSheetData.push([
      safeText(r.risk),
      safeText(r.likelihood),
      safeText(r.financialImpact),
      safeText(r.owner),
      safeArray(r.mitigation).join('; '),
    ]);
  });
  
  riskSheetData.push(['']);
  riskSheetData.push(['EXECUTION RISKS']);
  riskSheetData.push(['Risk', 'Likelihood', 'Financial Impact', 'Owner', 'Mitigation']);
  
  safeArray(risks.executionRisks).forEach((r: any) => {
    riskSheetData.push([
      safeText(r.risk),
      safeText(r.likelihood),
      safeText(r.financialImpact),
      safeText(r.owner),
      safeArray(r.mitigation).join('; '),
    ]);
  });
  
  const riskSheet = XLSX.utils.aoa_to_sheet(riskSheetData);
  riskSheet['!cols'] = [{ wch: 35 }, { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, riskSheet, 'Risk Analysis');

  // ═══════════════════════════════════════════════════════════════
  // SHEET 10: Porter's Five Forces
  // ═══════════════════════════════════════════════════════════════
  const porters = brandAnalysis.portersFiveForces || {};
  
  const portersSheetData = [
    ["PORTER'S FIVE FORCES ANALYSIS"],
    [''],
    ['Force', 'Level', 'Analysis'],
    ['Threat of New Entrants', safeText(porters.newEntrantsThreat?.level, 'MEDIUM'), safeText(porters.newEntrantsThreat?.analysis, 'Moderate barriers to entry in GCC')],
    ['Supplier Power', safeText(porters.supplierPower?.level, 'LOW'), safeText(porters.supplierPower?.analysis, 'Multiple supplier options available')],
    ['Buyer Power', safeText(porters.buyerPower?.level, 'MEDIUM'), safeText(porters.buyerPower?.analysis, 'Growing consumer choice in category')],
    ['Threat of Substitutes', safeText(porters.substituteThreat?.level, 'MEDIUM'), safeText(porters.substituteThreat?.analysis, 'Alternative solutions exist')],
    ['Competitive Rivalry', safeText(porters.competitiveRivalry?.level, 'HIGH'), safeText(porters.competitiveRivalry?.analysis, 'Active competition from established players')],
    [''],
    ['BLUE OCEAN STRATEGY'],
    ['Action', 'Factor', 'Rationale'],
  ];
  
  const blueOcean = brandAnalysis.blueOceanStrategy || {};
  safeArray(blueOcean.eliminate).forEach((e: any) => {
    portersSheetData.push(['Eliminate', safeText(e.factor || e), safeText(e.rationale)]);
  });
  safeArray(blueOcean.reduce).forEach((r: any) => {
    portersSheetData.push(['Reduce', safeText(r.factor || r), safeText(r.rationale)]);
  });
  safeArray(blueOcean.raise).forEach((r: any) => {
    portersSheetData.push(['Raise', safeText(r.factor || r), safeText(r.rationale)]);
  });
  safeArray(blueOcean.create).forEach((c: any) => {
    portersSheetData.push(['Create', safeText(c.factor || c), safeText(c.rationale)]);
  });
  
  const portersSheet = XLSX.utils.aoa_to_sheet(portersSheetData);
  portersSheet['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, portersSheet, 'Competitive Forces');

  // Generate blob
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
