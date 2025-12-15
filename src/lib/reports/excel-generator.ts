import * as XLSX from 'xlsx';

export async function generateExcel(data: any): Promise<Blob> {
  const wb = XLSX.utils.book_new();

  const bayesianResults = data.bayesianResults || data.bayesian_results || {};
  const brandAnalysis = data.brandAnalysis || data.brand_analysis || {};
  const personas = data.personas || [];
  const vanWestendorp = data.vanWestendorp || data.van_westendorp || {};
  const investmentThesis = brandAnalysis.investment_thesis || {};
  const featureStrategy = brandAnalysis.featureStrategy || {};
  const pricingStrategy = brandAnalysis.pricingStrategy || {};
  const goToMarket = brandAnalysis.goToMarket || {};
  const risks = brandAnalysis.risks || {};

  // Sheet 1: Executive Summary
  const summaryData = [
    ['MARKET VALIDATION REPORT'],
    ['Product:', data.productName || data.product_name || 'Product'],
    ['Generated:', new Date().toLocaleDateString()],
    [''],
    ['KEY METRICS'],
    ['Metric', 'Value', 'Status'],
    ['Demand Probability', `${Math.round((bayesianResults.demandProbability || 0) * 100)}%`, bayesianResults.demandProbability > 0.6 ? 'Strong' : 'Moderate'],
    ['PSM Score', bayesianResults.psmScore || 0, bayesianResults.psmScore > 70 ? 'High' : 'Medium'],
    ['Optimal Price', `${bayesianResults.optimalPrice || 0} SAR`, 'Validated'],
    ['Confidence Interval', `${Math.round((bayesianResults.confidenceInterval?.[0] || 0) * 100)}% - ${Math.round((bayesianResults.confidenceInterval?.[1] || 0) * 100)}%`, ''],
    [''],
    ['RECOMMENDATION'],
    ['Decision', investmentThesis?.recommendation?.recommendation || (bayesianResults.psmScore > 60 ? 'PROCEED' : 'PROCEED WITH CAUTION')],
    ['Confidence', investmentThesis?.recommendation?.confidenceLevel || 'MEDIUM'],
    ['Reasoning', investmentThesis?.recommendation?.reasoning || 'Based on Bayesian analysis']
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  // Sheet 2: Personas
  const personaHeaders = ['Name', 'Tagline', 'Priority', 'Segment Size %', 'Demand %', 'Optimal Price', 'LTV:CAC', 'Age', 'Income', 'Location', 'Occupation'];
  const personaData = [personaHeaders];
  personas.forEach((persona: any) => {
    const demographics = persona.demographics || {};
    const bayesianProfile = persona.bayesianProfile || {};
    personaData.push([
      persona.name || 'Unknown',
      persona.tagline || '',
      persona.priority || '',
      persona.segmentSize || Math.round((persona.size || 0) * 100),
      bayesianProfile.demandProbability || '',
      bayesianProfile.optimalPrice || '',
      persona.lifetimeValue?.ltvCacRatio || '',
      demographics.age || '',
      demographics.income || '',
      demographics.location || '',
      demographics.occupation || ''
    ]);
  });
  const personaSheet = XLSX.utils.aoa_to_sheet(personaData);
  personaSheet['!cols'] = personaHeaders.map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, personaSheet, 'Personas');

  // Sheet 3: Competitors
  const competitors = brandAnalysis.competitors || [];
  const compHeaders = ['Competitor', 'Status Score', 'Trust Score', 'Overall Score', 'Threat Level', 'Price Range', 'Distribution', 'Market Share'];
  const compData = [compHeaders];
  competitors.forEach((comp: any) => {
    compData.push([
      comp.name || '',
      comp.brandScores?.status || comp.status || '',
      comp.brandScores?.trust || comp.trust || '',
      comp.brandScores?.overall || comp.overall || '',
      comp.threatLevel || '',
      comp.priceRange || '',
      comp.distribution || '',
      comp.marketShare || ''
    ]);
  });
  const compSheet = XLSX.utils.aoa_to_sheet(compData);
  compSheet['!cols'] = compHeaders.map(() => ({ wch: 16 }));
  XLSX.utils.book_append_sheet(wb, compSheet, 'Competitors');

  // Sheet 4: Pricing Analysis
  const pricingData = [
    ['VAN WESTENDORP ANALYSIS'],
    [''],
    ['Threshold', 'Price (SAR)', 'Reasoning'],
    ['Too Cheap', vanWestendorp.tooCheap || pricingStrategy?.vanWestendorp?.priceThresholds?.tooCheap?.price || '', pricingStrategy?.vanWestendorp?.priceThresholds?.tooCheap?.reasoning || ''],
    ['Bargain', vanWestendorp.bargain || pricingStrategy?.vanWestendorp?.priceThresholds?.bargain?.price || '', pricingStrategy?.vanWestendorp?.priceThresholds?.bargain?.reasoning || ''],
    ['Optimal', vanWestendorp.optimalPricePoint || pricingStrategy?.vanWestendorp?.priceThresholds?.optimal?.price || '', pricingStrategy?.vanWestendorp?.priceThresholds?.optimal?.reasoning || ''],
    ['Expensive', vanWestendorp.expensive || pricingStrategy?.vanWestendorp?.priceThresholds?.expensive?.price || '', pricingStrategy?.vanWestendorp?.priceThresholds?.expensive?.reasoning || ''],
    ['Too Expensive', vanWestendorp.tooExpensive || pricingStrategy?.vanWestendorp?.priceThresholds?.tooExpensive?.price || '', pricingStrategy?.vanWestendorp?.priceThresholds?.tooExpensive?.reasoning || ''],
    [''],
    ['Acceptable Range', `${vanWestendorp.acceptableRange?.[0] || ''} - ${vanWestendorp.acceptableRange?.[1] || ''} SAR`, ''],
    [''],
    ['PRICING TIERS'],
    ['Tier', 'Price', 'Positioning', 'Margin', 'Volume Expectation']
  ];
  
  const tiers = pricingStrategy?.priceArchitecture?.recommendedTiers || [];
  tiers.forEach((tier: any) => {
    pricingData.push([tier.name || '', tier.price || '', tier.positioning || '', tier.margin || '', tier.volumeExpectation || '']);
  });
  
  const pricingSheet = XLSX.utils.aoa_to_sheet(pricingData);
  pricingSheet['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 40 }, { wch: 15 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, pricingSheet, 'Pricing');

  // Sheet 5: Feature Strategy
  const featureData = [
    ['FEATURE STRATEGY'],
    [''],
    ['MVP Recommendation', featureStrategy?.mvpRecommendation || ''],
    [''],
    ['FEATURE MATRIX'],
    ['Category', 'Features']
  ];
  
  const matrix = featureStrategy?.featureMatrix || {};
  Object.entries(matrix).forEach(([category, features]: [string, any]) => {
    if (Array.isArray(features)) {
      featureData.push([category, features.join(', ')]);
    }
  });
  
  featureData.push(['']);
  featureData.push(['DETAILED FEATURE ANALYSIS']);
  featureData.push(['Feature', 'Utility Score', 'Kano Category', 'Strategic Importance', 'Cost Level', 'Competitive Status']);
  
  const featureAnalysis = featureStrategy?.featureAnalysis || [];
  featureAnalysis.forEach((feat: any) => {
    featureData.push([
      feat.feature || '',
      feat.utilityScore || '',
      feat.kanoCategory?.type || '',
      feat.strategicImportance?.score || '',
      feat.costToDeliver?.level || '',
      feat.competitiveParity?.status || ''
    ]);
  });
  
  const featureSheet = XLSX.utils.aoa_to_sheet(featureData);
  featureSheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 18 }, { wch: 20 }, { wch: 12 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, featureSheet, 'Features');

  // Sheet 6: Financial Projections
  const scenarios = investmentThesis?.scenarios || {};
  const finData = [
    ['FINANCIAL PROJECTIONS'],
    [''],
    ['SCENARIO ANALYSIS'],
    ['', 'Bull Case', 'Base Case', 'Bear Case'],
    ['Probability', scenarios.bullCase?.probability || '', scenarios.baseCase?.probability || '', scenarios.bearCase?.probability || ''],
    [''],
    ['Year 1'],
    ['Revenue', scenarios.bullCase?.year1?.revenue || '', scenarios.baseCase?.year1?.revenue || '', scenarios.bearCase?.year1?.revenue || ''],
    ['Customers', scenarios.bullCase?.year1?.customers || '', scenarios.baseCase?.year1?.customers || '', scenarios.bearCase?.year1?.customers || ''],
    ['Gross Margin', scenarios.bullCase?.year1?.grossMargin || '', scenarios.baseCase?.year1?.grossMargin || '', scenarios.bearCase?.year1?.grossMargin || ''],
    [''],
    ['Year 3'],
    ['Revenue', scenarios.bullCase?.year3?.revenue || '', scenarios.baseCase?.year3?.revenue || '', scenarios.bearCase?.year3?.revenue || ''],
    ['Customers', scenarios.bullCase?.year3?.customers || '', scenarios.baseCase?.year3?.customers || '', scenarios.bearCase?.year3?.customers || ''],
    ['EBITDA Margin', scenarios.bullCase?.year3?.ebitdaMargin || '', scenarios.baseCase?.year3?.ebitdaMargin || '', scenarios.bearCase?.year3?.ebitdaMargin || '']
  ];
  
  const finSheet = XLSX.utils.aoa_to_sheet(finData);
  finSheet['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, finSheet, 'Financial Model');

  // Sheet 7: Go-to-Market
  const gtmData = [
    ['GO-TO-MARKET STRATEGY'],
    [''],
    ['90-DAY ROADMAP']
  ];
  
  const roadmap = goToMarket?.ninetyDayRoadmap || {};
  ['preLaunch', 'launch', 'scale'].forEach((phase) => {
    const phaseData = roadmap[phase];
    if (phaseData) {
      gtmData.push(['']);
      gtmData.push([phase.toUpperCase(), phaseData.days || '', phaseData.objective || '']);
      gtmData.push(['Tactic', 'Budget', 'Owner', 'Timeline', 'Expected Outcome']);
      (phaseData.tactics || []).forEach((tactic: any) => {
        gtmData.push([tactic.tactic || '', tactic.budget || '', tactic.owner || '', tactic.timeline || '', tactic.expectedOutcome || '']);
      });
    }
  });
  
  gtmData.push(['']);
  gtmData.push(['CHANNEL MIX']);
  gtmData.push(['Channel', 'Budget Allocation', 'Expected CAC', 'Conversion Rate', 'Rationale']);
  
  const channels = goToMarket?.channelMix?.channelRecommendations || [];
  channels.forEach((ch: any) => {
    gtmData.push([ch.channel || '', ch.budgetAllocation || '', ch.expectedCAC || '', ch.conversionRate || '', ch.rationale || '']);
  });
  
  const gtmSheet = XLSX.utils.aoa_to_sheet(gtmData);
  gtmSheet['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 15 }, { wch: 18 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, gtmSheet, 'Go-to-Market');

  // Sheet 8: Risk Analysis
  const riskData = [
    ['RISK ANALYSIS'],
    [''],
    ['MARKET RISKS'],
    ['Risk', 'Likelihood', 'Financial Impact', 'Owner', 'Mitigation']
  ];
  
  (risks.marketRisks || []).forEach((risk: any) => {
    riskData.push([
      risk.risk || '',
      risk.likelihood || '',
      risk.financialImpact || '',
      risk.owner || '',
      (risk.mitigation || []).join('; ')
    ]);
  });
  
  riskData.push(['']);
  riskData.push(['COMPETITIVE RISKS']);
  riskData.push(['Risk', 'Likelihood', 'Financial Impact', 'Owner', 'Mitigation']);
  
  (risks.competitiveRisks || []).forEach((risk: any) => {
    riskData.push([
      risk.risk || '',
      risk.likelihood || '',
      risk.financialImpact || '',
      risk.owner || '',
      (risk.mitigation || []).join('; ')
    ]);
  });
  
  const riskSheet = XLSX.utils.aoa_to_sheet(riskData);
  riskSheet['!cols'] = [{ wch: 35 }, { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, riskSheet, 'Risk Analysis');

  // Sheet 9: Regional Breakdown
  const regionalBreakdown = bayesianResults.regionalBreakdown || {};
  const regionalData = [
    ['REGIONAL BREAKDOWN'],
    [''],
    ['Region', 'Demand %', 'Optimal Price', 'Key Insight']
  ];
  
  Object.entries(regionalBreakdown).forEach(([region, data]: [string, any]) => {
    regionalData.push([
      region,
      `${Math.round((data.demand || 0) * 100)}%`,
      `${data.optimalPrice || 'N/A'} SAR`,
      data.insight || ''
    ]);
  });
  
  const regionalSheet = XLSX.utils.aoa_to_sheet(regionalData);
  regionalSheet['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, regionalSheet, 'Regional Data');

  // Generate blob
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
