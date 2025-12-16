import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

// Colors
const PURPLE = [123, 44, 191] as [number, number, number];
const GREEN = [16, 185, 129] as [number, number, number];
const YELLOW = [245, 158, 11] as [number, number, number];
const RED = [239, 68, 68] as [number, number, number];
const GRAY = [107, 114, 128] as [number, number, number];
const LIGHT_GRAY = [243, 244, 246] as [number, number, number];

function formatPercent(value: number | undefined | null): string {
  if (value === undefined || value === null) return 'N/A';
  // If value is already > 1, assume it's a percentage
  const percent = value > 1 ? value : value * 100;
  return `${Math.round(percent)}%`;
}

function safeText(value: any, fallback: string = 'N/A'): string {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value);
}

function addHeader(doc: jsPDF, productName: string, sectionName: string) {
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(productName, MARGIN, 10);
  doc.text(sectionName, PAGE_WIDTH - MARGIN, 10, { align: 'right' });
  doc.setDrawColor(...LIGHT_GRAY);
  doc.line(MARGIN, 12, PAGE_WIDTH - MARGIN, 12);
}

function addFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(
    `MarketPulse Market Validation Report | Page ${pageNum} of ${totalPages}`,
    PAGE_WIDTH / 2,
    PAGE_HEIGHT - 10,
    { align: 'center' }
  );
}

function checkPageBreak(doc: jsPDF, yPos: number, needed: number = 40): number {
  if (yPos > PAGE_HEIGHT - needed) {
    doc.addPage();
    return 25;
  }
  return yPos;
}

export async function generatePDF(data: any): Promise<Blob> {
  const doc = new jsPDF();
  const productName = data.productName || data.product_name || 'Product';
  
  const bayesianResults = data.bayesianResults || data.bayesian_results || {};
  const brandAnalysis = data.brandAnalysis || data.brand_analysis || {};
  const personas = data.personas || [];
  const featureStrategy = data.featureStrategy || data.feature_strategy || brandAnalysis.featureStrategy || {};
  const pricingStrategy = data.pricingStrategy || data.pricing_strategy || brandAnalysis.pricingStrategy || {};
  const goToMarket = data.goToMarket || data.go_to_market || brandAnalysis.goToMarket || {};
  const risks = data.risks || brandAnalysis.risks || {};
  const investmentThesis = data.investmentThesis || data.investment_thesis || brandAnalysis.investment_thesis || {};

  // ═══════════════════════════════════════════════════════════════
  // PAGE 1: COVER PAGE
  // ═══════════════════════════════════════════════════════════════
  doc.setFillColor(...PURPLE);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(36);
  doc.text('Market Validation', PAGE_WIDTH / 2, 80, { align: 'center' });
  doc.text('Report', PAGE_WIDTH / 2, 95, { align: 'center' });
  
  doc.setFontSize(28);
  doc.text(productName, PAGE_WIDTH / 2, 130, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text('Investment-Grade Market Analysis', PAGE_WIDTH / 2, 155, { align: 'center' });
  doc.text('Powered by MarketPulse Bayesian Engine', PAGE_WIDTH / 2, 170, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date(data.createdAt || data.created_at || new Date()).toLocaleDateString()}`, PAGE_WIDTH / 2, 200, { align: 'center' });
  
  // Key metrics box
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(MARGIN + 20, 220, CONTENT_WIDTH - 40, 50, 5, 5, 'F');
  doc.setTextColor(...PURPLE);
  doc.setFontSize(10);
  doc.text('KEY METRICS', PAGE_WIDTH / 2, 232, { align: 'center' });
  
  doc.setFontSize(14);
  const demandProb = formatPercent(bayesianResults.demandProbability);
  const psmScore = bayesianResults.psmScore || 0;
  const optimalPrice = bayesianResults.optimalPrice || 0;
  
  doc.text(`Demand: ${demandProb}`, 55, 250);
  doc.text(`PSM: ${psmScore}/100`, PAGE_WIDTH / 2, 250, { align: 'center' });
  doc.text(`Price: ${optimalPrice} SAR`, PAGE_WIDTH - 55, 250, { align: 'right' });

  // ═══════════════════════════════════════════════════════════════
  // PAGES 2-3: EXECUTIVE SUMMARY
  // ═══════════════════════════════════════════════════════════════
  doc.addPage();
  let yPos = 25;
  addHeader(doc, productName, 'Executive Summary');
  
  doc.setFontSize(24);
  doc.setTextColor(...PURPLE);
  doc.text('Executive Summary', MARGIN, yPos);
  yPos += 15;
  
  // Investment Recommendation Box
  const recommendation = investmentThesis?.recommendation?.recommendation || 
    (psmScore >= 60 ? 'PROCEED' : psmScore >= 40 ? 'PROCEED WITH CAUTION' : 'RECONSIDER');
  const confidence = investmentThesis?.recommendation?.confidenceLevel || 
    (psmScore >= 75 ? 'HIGH' : psmScore >= 50 ? 'MEDIUM' : 'LOW');
  
  const recColor = recommendation === 'PROCEED' ? GREEN : 
                   recommendation === 'RECONSIDER' ? RED : YELLOW;
  
  doc.setFillColor(...recColor);
  doc.roundedRect(MARGIN, yPos, CONTENT_WIDTH, 35, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text(recommendation, PAGE_WIDTH / 2, yPos + 15, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`${confidence} Confidence`, PAGE_WIDTH / 2, yPos + 27, { align: 'center' });
  yPos += 45;
  
  // Reasoning
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  const reasoning = investmentThesis?.recommendation?.reasoning || 
    `Based on PSM score of ${psmScore} and demand probability of ${demandProb}, this product shows ${psmScore >= 60 ? 'strong' : 'moderate'} market potential.`;
  const splitReasoning = doc.splitTextToSize(reasoning, CONTENT_WIDTH);
  doc.text(splitReasoning, MARGIN, yPos);
  yPos += splitReasoning.length * 5 + 10;
  
  // Key Metrics Table
  doc.setFontSize(14);
  doc.setTextColor(...PURPLE);
  doc.text('Key Performance Metrics', MARGIN, yPos);
  yPos += 5;
  
  const metricsData = [
    ['Demand Probability', demandProb, 'Likelihood of trial purchase within 30 days'],
    ['PSM Score', `${psmScore}/100`, psmScore >= 60 ? 'GO - Proceed with market test' : psmScore >= 40 ? 'REVISE - Directional insights' : 'NO-GO - Insufficient confidence'],
    ['Optimal Price Point', `${optimalPrice} SAR`, 'Price maximizing expected revenue'],
    ['Target Personas', `${personas.length} identified`, personas.slice(0, 2).map((p: any) => p.name).join(', ')],
    ['Competitors Analyzed', `${brandAnalysis.competitors?.length || 0}`, 'Key market players assessed'],
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value', 'Interpretation']],
    body: metricsData,
    theme: 'striped',
    headStyles: { fillColor: PURPLE, fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 4 },
    margin: { left: MARGIN, right: MARGIN }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  yPos = checkPageBreak(doc, yPos, 80);
  
  // Top Insights
  doc.setFontSize(14);
  doc.setTextColor(...PURPLE);
  doc.text('Top Strategic Insights', MARGIN, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  const insights = [
    `Primary target: ${personas[0]?.name || 'N/A'} (${formatPercent(personas[0]?.segmentSize)} of market)`,
    `Key differentiator: ${brandAnalysis.blueOceanStrategy?.create?.[0] || 'Unique value proposition'}`,
    `Main competitor threat: ${brandAnalysis.competitors?.[0]?.name || 'N/A'} (${brandAnalysis.competitors?.[0]?.threatLevel || 'N/A'} threat)`,
    `Price positioning: ${pricingStrategy.priceArchitecture?.rationale || 'Competitive pricing strategy'}`,
    `Go-to-market focus: ${goToMarket.channelMix?.channelRecommendations?.[0]?.channel || 'Multi-channel approach'}`
  ];
  
  insights.forEach((insight, idx) => {
    doc.text(`${idx + 1}. ${insight}`, MARGIN, yPos);
    yPos += 6;
  });
  
  yPos += 10;
  yPos = checkPageBreak(doc, yPos, 60);
  
  // Financial Snapshot
  doc.setFontSize(14);
  doc.setTextColor(...PURPLE);
  doc.text('Financial Snapshot', MARGIN, yPos);
  yPos += 5;
  
  const scenarios = investmentThesis?.scenarios || {};
  const finData = [
    ['Year 1 Revenue (Base)', safeText(scenarios.baseCase?.year1?.revenue)],
    ['Year 1 Customers (Base)', safeText(scenarios.baseCase?.year1?.customers)],
    ['Year 3 Revenue (Base)', safeText(scenarios.baseCase?.year3?.revenue)],
    ['Year 3 Customers (Base)', safeText(scenarios.baseCase?.year3?.customers)],
    ['Bull Case Y1 Revenue', safeText(scenarios.bullCase?.year1?.revenue)],
    ['Bear Case Y1 Revenue', safeText(scenarios.bearCase?.year1?.revenue)],
  ];
  
  autoTable(doc, {
    startY: yPos,
    body: finData,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
    margin: { left: MARGIN, right: MARGIN }
  });

  // ═══════════════════════════════════════════════════════════════
  // PAGES 4-5: MARKET OPPORTUNITY
  // ═══════════════════════════════════════════════════════════════
  doc.addPage();
  yPos = 25;
  addHeader(doc, productName, 'Market Opportunity');
  
  doc.setFontSize(24);
  doc.setTextColor(...PURPLE);
  doc.text('Market Opportunity', MARGIN, yPos);
  yPos += 15;
  
  // Demand Analysis
  doc.setFontSize(16);
  doc.text('Demand Analysis', MARGIN, yPos);
  yPos += 10;
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  
  const demandData = [
    ['Overall Demand Probability', demandProb],
    ['PSM Score', `${psmScore}/100`],
    ['Optimal Price', `${optimalPrice} SAR`],
    ['Price Range (Acceptable)', `${bayesianResults.priceRange?.min || 'N/A'} - ${bayesianResults.priceRange?.max || 'N/A'} SAR`],
    ['Confidence Interval', safeText(bayesianResults.confidenceInterval)]
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: demandData,
    theme: 'striped',
    headStyles: { fillColor: PURPLE },
    margin: { left: MARGIN, right: MARGIN }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Regional Breakdown
  doc.setFontSize(16);
  doc.setTextColor(...PURPLE);
  doc.text('Regional Breakdown', MARGIN, yPos);
  yPos += 5;
  
  const regionalData = bayesianResults.regionalBreakdown || [];
  if (regionalData.length > 0) {
    const regTableData = regionalData.map((r: any) => [
      r.region || r.name,
      formatPercent(r.demandProbability),
      `${r.optimalPrice || 'N/A'} SAR`,
      formatPercent(r.weight || r.marketWeight)
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Region', 'Demand', 'Optimal Price', 'Market Weight']],
      body: regTableData,
      theme: 'striped',
      headStyles: { fillColor: PURPLE },
      margin: { left: MARGIN, right: MARGIN }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
  
  yPos = checkPageBreak(doc, yPos, 60);
  
  // Market Sizing
  doc.setFontSize(16);
  doc.setTextColor(...PURPLE);
  doc.text('Market Sizing & Growth', MARGIN, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const marketText = `The target market shows a demand probability of ${demandProb} with an optimal price point of ${optimalPrice} SAR. ` +
    `Based on ${personas.length} identified customer segments, the addressable market represents significant opportunity ` +
    `across GCC markets with particular strength in ${regionalData[0]?.region || 'Saudi Arabia'}.`;
  const splitMarket = doc.splitTextToSize(marketText, CONTENT_WIDTH);
  doc.text(splitMarket, MARGIN, yPos);

  // ═══════════════════════════════════════════════════════════════
  // PAGES 6-15: CUSTOMER INSIGHTS (2-3 pages per persona)
  // ═══════════════════════════════════════════════════════════════
  personas.forEach((persona: any, idx: number) => {
    doc.addPage();
    yPos = 25;
    addHeader(doc, productName, `Customer Insights - Persona ${idx + 1}`);
    
    // Persona Header
    doc.setFontSize(22);
    doc.setTextColor(...PURPLE);
    doc.text(persona.name || `Persona ${idx + 1}`, MARGIN, yPos);
    yPos += 8;
    
    doc.setFontSize(12);
    doc.setTextColor(...GRAY);
    doc.text(persona.tagline || '', MARGIN, yPos);
    yPos += 5;
    
    // Priority & Size badges
    const priority = persona.priority || (idx === 0 ? 'PRIMARY' : 'SECONDARY');
    const badgeColor = priority === 'PRIMARY' ? GREEN : GRAY;
    doc.setFillColor(...badgeColor);
    doc.roundedRect(MARGIN, yPos, 30, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(priority, MARGIN + 15, yPos + 5.5, { align: 'center' });
    
    doc.setFillColor(...PURPLE);
    doc.roundedRect(MARGIN + 35, yPos, 35, 8, 2, 2, 'F');
    doc.text(`${formatPercent(persona.segmentSize)} Market`, MARGIN + 52.5, yPos + 5.5, { align: 'center' });
    yPos += 15;
    
    // Quote Box
    doc.setFillColor(...LIGHT_GRAY);
    const quote = persona.psychographics?.quote || 'Customer insight pending';
    const splitQuote = doc.splitTextToSize(`"${quote}"`, CONTENT_WIDTH - 20);
    const quoteHeight = Math.max(20, splitQuote.length * 5 + 10);
    doc.roundedRect(MARGIN, yPos, CONTENT_WIDTH, quoteHeight, 3, 3, 'F');
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(11);
    doc.setFont(undefined, 'italic');
    doc.text(splitQuote, MARGIN + 10, yPos + 8);
    doc.setFont(undefined, 'normal');
    yPos += quoteHeight + 10;
    
    // Two-column layout: Demographics | Bayesian Profile
    doc.setFontSize(14);
    doc.setTextColor(...PURPLE);
    doc.text('Demographics', MARGIN, yPos);
    doc.text('Bayesian Profile', PAGE_WIDTH / 2 + 5, yPos);
    yPos += 5;
    
    const demo = persona.demographics || {};
    const demoData = [
      ['Age', safeText(demo.age)],
      ['Income', safeText(demo.income)],
      ['Location', safeText(demo.location)],
      ['Occupation', safeText(demo.occupation)],
      ['Family', safeText(demo.familyStatus)],
      ['Education', safeText(demo.education)]
    ];
    
    autoTable(doc, {
      startY: yPos,
      body: demoData,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 25 }, 1: { cellWidth: 55 } },
      margin: { left: MARGIN, right: PAGE_WIDTH / 2 + 5 }
    });
    
    const bayesian = persona.bayesianProfile || {};
    const bayesData = [
      ['Demand', formatPercent(bayesian.demandProbability)],
      ['Optimal Price', `${safeText(bayesian.optimalPrice)} SAR`],
      ['WTP Range', bayesian.willingnessToPayRange ? bayesian.willingnessToPayRange.join(' - ') + ' SAR' : 'N/A'],
      ['Elasticity', safeText(bayesian.priceElasticity)],
      ['Frequency', safeText(bayesian.purchaseFrequency)]
    ];
    
    autoTable(doc, {
      startY: yPos,
      body: bayesData,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 30 }, 1: { cellWidth: 50 } },
      margin: { left: PAGE_WIDTH / 2 + 5, right: MARGIN }
    });
    
    yPos = Math.max((doc as any).lastAutoTable.finalY + 10, yPos + 50);
    yPos = checkPageBreak(doc, yPos, 80);
    
    // Psychographics Section
    doc.setFontSize(14);
    doc.setTextColor(...PURPLE);
    doc.text('Jobs to Be Done & Psychographics', MARGIN, yPos);
    yPos += 8;
    
    const psycho = persona.psychographics || {};
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text('Core Job:', MARGIN, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 5;
    const coreJob = doc.splitTextToSize(safeText(psycho.coreJob, 'Customer job definition pending'), CONTENT_WIDTH);
    doc.setFontSize(10);
    doc.text(coreJob, MARGIN, yPos);
    yPos += coreJob.length * 4 + 5;
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Trigger Moment:', MARGIN, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 5;
    const trigger = doc.splitTextToSize(safeText(psycho.triggerMoment, 'Purchase trigger pending'), CONTENT_WIDTH);
    doc.setFontSize(10);
    doc.text(trigger, MARGIN, yPos);
    yPos += trigger.length * 4 + 5;
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Success Criteria:', MARGIN, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 5;
    const success = doc.splitTextToSize(safeText(psycho.successCriteria, 'Success metrics pending'), CONTENT_WIDTH);
    doc.setFontSize(10);
    doc.text(success, MARGIN, yPos);
    yPos += success.length * 4 + 5;
    
    yPos = checkPageBreak(doc, yPos, 60);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Current Alternative:', MARGIN, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 5;
    const altText = doc.splitTextToSize(safeText(psycho.currentAlternative, 'Current solution pending'), CONTENT_WIDTH);
    doc.setFontSize(10);
    doc.text(altText, MARGIN, yPos);
    yPos += altText.length * 4 + 8;
    
    // Obstacles
    if (psycho.obstacles?.length > 0) {
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Key Obstacles:', MARGIN, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 5;
      
      psycho.obstacles.slice(0, 5).forEach((obs: string, i: number) => {
        doc.setFontSize(10);
        doc.setTextColor(180, 50, 50);
        doc.text(`⚠ ${obs}`, MARGIN + 5, yPos);
        yPos += 5;
      });
      doc.setTextColor(0, 0, 0);
    }
    
    yPos = checkPageBreak(doc, yPos, 100);
    
    // Marketing Strategy - New Page if needed
    if (yPos > 180) {
      doc.addPage();
      yPos = 25;
      addHeader(doc, productName, `Customer Insights - ${persona.name} (cont.)`);
    }
    
    const marketing = persona.marketingStrategy || {};
    
    doc.setFontSize(14);
    doc.setTextColor(...PURPLE);
    doc.text('Marketing Strategy', MARGIN, yPos);
    yPos += 10;
    
    // Core Message Box
    if (marketing.coreMessage) {
      doc.setFillColor(237, 233, 254); // Light purple
      const msgSplit = doc.splitTextToSize(marketing.coreMessage, CONTENT_WIDTH - 20);
      const msgHeight = msgSplit.length * 5 + 10;
      doc.roundedRect(MARGIN, yPos, CONTENT_WIDTH, msgHeight, 3, 3, 'F');
      doc.setFontSize(10);
      doc.setTextColor(...PURPLE);
      doc.text('Core Message:', MARGIN + 5, yPos + 6);
      doc.setTextColor(0, 0, 0);
      doc.text(msgSplit, MARGIN + 5, yPos + 12);
      yPos += msgHeight + 8;
    }
    
    // Proof Points
    if (marketing.proofPoints?.length > 0) {
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text('Proof Points:', MARGIN, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 5;
      
      marketing.proofPoints.slice(0, 4).forEach((point: string) => {
        doc.setFontSize(9);
        doc.setTextColor(16, 185, 129);
        doc.text('✓', MARGIN + 2, yPos);
        doc.setTextColor(0, 0, 0);
        const pointSplit = doc.splitTextToSize(point, CONTENT_WIDTH - 10);
        doc.text(pointSplit, MARGIN + 8, yPos);
        yPos += pointSplit.length * 4 + 2;
      });
      yPos += 5;
    }
    
    yPos = checkPageBreak(doc, yPos, 50);
    
    // Channel Strategy Table
    if (marketing.channels?.length > 0) {
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Channel Strategy:', MARGIN, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 5;
      
      const channelData = marketing.channels.slice(0, 5).map((ch: any) => [
        ch.channel || 'N/A',
        ch.budgetAllocation || 'N/A',
        ch.expectedCAC || 'N/A',
        ch.rationale?.substring(0, 50) + '...' || 'N/A'
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Channel', 'Budget', 'CAC', 'Rationale']],
        body: channelData,
        theme: 'striped',
        headStyles: { fillColor: PURPLE, fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: MARGIN, right: MARGIN }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
    yPos = checkPageBreak(doc, yPos, 50);
    
    // Lifetime Value
    const ltv = persona.lifetimeValue || {};
    if (Object.keys(ltv).length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(...PURPLE);
      doc.text('Customer Economics', MARGIN, yPos);
      yPos += 5;
      
      const ltvData = [
        ['Year 1 Revenue', safeText(ltv.firstYearRevenue)],
        ['3-Year LTV', safeText(ltv.threeYearRevenue)],
        ['Acquisition Cost', safeText(ltv.acquisitionCost)],
        ['LTV:CAC Ratio', safeText(ltv.ltvCacRatio)],
        ['Payback Period', safeText(ltv.paybackPeriod)]
      ];
      
      autoTable(doc, {
        startY: yPos,
        body: ltvData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold' } },
        margin: { left: MARGIN, right: MARGIN }
      });
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // PAGES: FEATURE STRATEGY
  // ═══════════════════════════════════════════════════════════════
  doc.addPage();
  yPos = 25;
  addHeader(doc, productName, 'Feature Strategy');
  
  doc.setFontSize(24);
  doc.setTextColor(...PURPLE);
  doc.text('Feature Strategy', MARGIN, yPos);
  yPos += 15;
  
  // MVP Recommendation
  if (featureStrategy.mvpRecommendation) {
    doc.setFillColor(237, 233, 254);
    const mvpText = doc.splitTextToSize(featureStrategy.mvpRecommendation, CONTENT_WIDTH - 20);
    const mvpHeight = mvpText.length * 5 + 15;
    doc.roundedRect(MARGIN, yPos, CONTENT_WIDTH, mvpHeight, 3, 3, 'F');
    doc.setFontSize(12);
    doc.setTextColor(...PURPLE);
    doc.text('MVP Recommendation', MARGIN + 10, yPos + 8);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(mvpText, MARGIN + 10, yPos + 16);
    yPos += mvpHeight + 10;
  }
  
  // Feature Matrix
  const matrix = featureStrategy.featureMatrix || {};
  if (Object.keys(matrix).length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(...PURPLE);
    doc.text('Feature Impact Matrix', MARGIN, yPos);
    yPos += 8;
    
    const categories = [
      { key: 'mustBuild', label: 'Must Build', color: [220, 252, 231] },
      { key: 'shouldBuild', label: 'Should Build', color: [219, 234, 254] },
      { key: 'couldBuild', label: 'Could Build', color: [254, 243, 199] },
      { key: 'shouldSkip', label: 'Should Skip', color: [254, 226, 226] }
    ];
    
    const colWidth = (CONTENT_WIDTH - 15) / 4;
    categories.forEach((cat, i) => {
      const x = MARGIN + (i * (colWidth + 5));
      doc.setFillColor(...cat.color as [number, number, number]);
      doc.roundedRect(x, yPos, colWidth, 50, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setTextColor(...PURPLE);
      doc.text(cat.label, x + 3, yPos + 8);
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      const features = matrix[cat.key] || [];
      features.slice(0, 4).forEach((f: string, j: number) => {
        doc.text(`• ${f.substring(0, 20)}`, x + 3, yPos + 16 + (j * 8));
      });
    });
    yPos += 60;
  }
  
  yPos = checkPageBreak(doc, yPos, 80);
  
  // Feature Analysis Table
  const features = featureStrategy.featureAnalysis || [];
  if (features.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(...PURPLE);
    doc.text('Detailed Feature Analysis', MARGIN, yPos);
    yPos += 5;
    
    const featData = features.slice(0, 10).map((f: any) => [
      f.feature || 'N/A',
      `${f.utilityScore || 0}/100`,
      f.kanoCategory?.type || 'N/A',
      f.competitiveParity?.status || 'N/A',
      f.costToDeliver?.level || 'N/A'
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Feature', 'Utility', 'Kano Type', 'Comp. Status', 'Cost']],
      body: featData,
      theme: 'striped',
      headStyles: { fillColor: PURPLE, fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: MARGIN, right: MARGIN }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Roadmap
  const roadmap = featureStrategy.roadmap || [];
  if (roadmap.length > 0) {
    yPos = checkPageBreak(doc, yPos, 60);
    
    doc.setFontSize(14);
    doc.setTextColor(...PURPLE);
    doc.text('Feature Roadmap', MARGIN, yPos);
    yPos += 8;
    
    roadmap.slice(0, 3).forEach((phase: any, i: number) => {
      doc.setFontSize(11);
      doc.setTextColor(...PURPLE);
      doc.text(`Phase ${i + 1}: ${phase.phase || ''}`, MARGIN, yPos);
      yPos += 5;
      
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(`Timeline: ${phase.timeline || 'N/A'}`, MARGIN + 5, yPos);
      yPos += 4;
      doc.text(`Features: ${phase.features?.join(', ') || 'N/A'}`, MARGIN + 5, yPos);
      yPos += 8;
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // PAGES: PRICING STRATEGY
  // ═══════════════════════════════════════════════════════════════
  doc.addPage();
  yPos = 25;
  addHeader(doc, productName, 'Pricing Strategy');
  
  doc.setFontSize(24);
  doc.setTextColor(...PURPLE);
  doc.text('Pricing Strategy', MARGIN, yPos);
  yPos += 15;
  
  // Price Architecture - Tiers
  const priceArch = pricingStrategy.priceArchitecture || {};
  const tiers = priceArch.recommendedTiers || [];
  
  if (tiers.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(...PURPLE);
    doc.text('Recommended Price Tiers', MARGIN, yPos);
    yPos += 8;
    
    const tierWidth = (CONTENT_WIDTH - 10) / Math.min(tiers.length, 3);
    tiers.slice(0, 3).forEach((tier: any, i: number) => {
      const x = MARGIN + (i * (tierWidth + 5));
      const isCore = i === 1;
      
      doc.setFillColor(isCore ? 237 : 249, isCore ? 233 : 250, isCore ? 254 : 251);
      if (isCore) {
        doc.setDrawColor(...PURPLE);
        doc.setLineWidth(1);
        doc.roundedRect(x, yPos, tierWidth - 5, 70, 3, 3, 'FD');
        doc.setLineWidth(0.2);
      } else {
        doc.roundedRect(x, yPos, tierWidth - 5, 70, 3, 3, 'F');
      }
      
      doc.setFontSize(11);
      doc.setTextColor(...PURPLE);
      doc.text(tier.name || `Tier ${i + 1}`, x + 5, yPos + 10);
      
      doc.setFontSize(16);
      doc.text(`${tier.price || 0} SAR`, x + 5, yPos + 22);
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(tier.positioning || '', x + 5, yPos + 30);
      
      doc.setFontSize(7);
      doc.setTextColor(60, 60, 60);
      const featList = tier.features?.slice(0, 4) || [];
      featList.forEach((f: string, j: number) => {
        doc.text(`✓ ${f.substring(0, 25)}`, x + 5, yPos + 40 + (j * 7));
      });
    });
    yPos += 80;
  }
  
  yPos = checkPageBreak(doc, yPos, 80);
  
  // Van Westendorp Analysis
  const vw = pricingStrategy.vanWestendorp || {};
  const thresholds = vw.priceThresholds || {};
  
  if (Object.keys(thresholds).length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(...PURPLE);
    doc.text('Van Westendorp Price Sensitivity', MARGIN, yPos);
    yPos += 8;
    
    const vwData = [
      ['Too Cheap', safeText(thresholds.tooCheap?.price), safeText(thresholds.tooCheap?.reasoning)],
      ['Bargain', safeText(thresholds.bargain?.price), safeText(thresholds.bargain?.reasoning)],
      ['Optimal', safeText(thresholds.optimal?.price), safeText(thresholds.optimal?.reasoning)],
      ['Expensive', safeText(thresholds.expensive?.price), safeText(thresholds.expensive?.reasoning)],
      ['Too Expensive', safeText(thresholds.tooExpensive?.price), safeText(thresholds.tooExpensive?.reasoning)]
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [['Threshold', 'Price', 'Reasoning']],
      body: vwData,
      theme: 'striped',
      headStyles: { fillColor: PURPLE, fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 2: { cellWidth: 80 } },
      margin: { left: MARGIN, right: MARGIN }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Psychological Pricing
  const psychPricing = pricingStrategy.psychologicalPricing || {};
  if (Object.keys(psychPricing).length > 0) {
    yPos = checkPageBreak(doc, yPos, 50);
    
    doc.setFontSize(14);
    doc.setTextColor(...PURPLE);
    doc.text('Psychological Pricing Tactics', MARGIN, yPos);
    yPos += 8;
    
    if (psychPricing.anchoringStrategy) {
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text('Anchoring Strategy:', MARGIN, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 5;
      const anchor = doc.splitTextToSize(psychPricing.anchoringStrategy.technique || '', CONTENT_WIDTH);
      doc.setFontSize(9);
      doc.text(anchor, MARGIN, yPos);
      yPos += anchor.length * 4 + 5;
    }
    
    if (psychPricing.promotionalStrategy) {
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('Promotional Strategy:', MARGIN, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 5;
      const promo = doc.splitTextToSize(psychPricing.promotionalStrategy.whenToDiscount || '', CONTENT_WIDTH);
      doc.setFontSize(9);
      doc.text(promo, MARGIN, yPos);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PAGES: COMPETITIVE LANDSCAPE
  // ═══════════════════════════════════════════════════════════════
  doc.addPage();
  yPos = 25;
  addHeader(doc, productName, 'Competitive Landscape');
  
  doc.setFontSize(24);
  doc.setTextColor(...PURPLE);
  doc.text('Competitive Landscape', MARGIN, yPos);
  yPos += 10;
  
  // Positioning Summary
  if (brandAnalysis.competitiveDynamics?.positioningSummary) {
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const posSummary = doc.splitTextToSize(brandAnalysis.competitiveDynamics.positioningSummary, CONTENT_WIDTH);
    doc.text(posSummary, MARGIN, yPos);
    yPos += posSummary.length * 4 + 10;
  }
  
  // Competitors Detail
  const competitors = brandAnalysis.competitors || [];
  competitors.forEach((comp: any, idx: number) => {
    yPos = checkPageBreak(doc, yPos, 80);
    
    // Competitor Header
    doc.setFillColor(...LIGHT_GRAY);
    doc.roundedRect(MARGIN, yPos, CONTENT_WIDTH, 12, 2, 2, 'F');
    doc.setFontSize(12);
    doc.setTextColor(...PURPLE);
    doc.text(comp.name || `Competitor ${idx + 1}`, MARGIN + 5, yPos + 8);
    
    // Threat Badge
    const threatColor = comp.threatLevel === 'HIGH' ? RED : 
                       comp.threatLevel === 'MEDIUM' ? YELLOW : GREEN;
    doc.setFillColor(...threatColor);
    doc.roundedRect(PAGE_WIDTH - MARGIN - 30, yPos + 2, 25, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text(comp.threatLevel || 'N/A', PAGE_WIDTH - MARGIN - 17.5, yPos + 7, { align: 'center' });
    yPos += 18;
    
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    
    // Basic Info
    doc.text(`Positioning: ${safeText(comp.positioning)}`, MARGIN, yPos);
    yPos += 5;
    doc.text(`Price Range: ${safeText(comp.priceRange)} | Distribution: ${safeText(comp.distribution)} | Market Share: ${safeText(comp.marketShare)}`, MARGIN, yPos);
    yPos += 8;
    
    // Products
    if (comp.products?.length > 0) {
      doc.setFont(undefined, 'bold');
      doc.text('Key Products:', MARGIN, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(comp.products.slice(0, 3).join(', '), MARGIN + 25, yPos);
      yPos += 6;
    }
    
    // Strengths & Weaknesses
    const halfWidth = (CONTENT_WIDTH - 10) / 2;
    
    doc.setFont(undefined, 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text('Strengths:', MARGIN, yPos);
    doc.setTextColor(239, 68, 68);
    doc.text('Weaknesses:', MARGIN + halfWidth + 10, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 5;
    
    const maxItems = Math.max(comp.strengths?.length || 0, comp.weaknesses?.length || 0, 1);
    for (let i = 0; i < Math.min(maxItems, 3); i++) {
      doc.setTextColor(16, 185, 129);
      if (comp.strengths?.[i]) {
        doc.text(`✓ ${comp.strengths[i].substring(0, 40)}`, MARGIN, yPos);
      }
      doc.setTextColor(239, 68, 68);
      if (comp.weaknesses?.[i]) {
        doc.text(`✗ ${comp.weaknesses[i].substring(0, 40)}`, MARGIN + halfWidth + 10, yPos);
      }
      yPos += 5;
    }
    
    yPos += 3;
    
    // Recent Moves
    if (comp.recentMoves) {
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text('Recent Activity: ', MARGIN, yPos);
      doc.setFont(undefined, 'normal');
      const recentText = doc.splitTextToSize(comp.recentMoves, CONTENT_WIDTH - 30);
      doc.text(recentText, MARGIN + 28, yPos);
      yPos += recentText.length * 4 + 3;
    }
    
    // Brand Scores
    if (comp.brandScores) {
      doc.setTextColor(100, 100, 100);
      doc.text(`Brand Scores: Status ${comp.brandScores.status || 'N/A'} | Trust ${comp.brandScores.trust || 'N/A'} | Overall ${comp.brandScores.overall || 'N/A'}`, MARGIN, yPos);
      yPos += 8;
    }
    
    yPos += 5;
  });
  
  // Porter's Five Forces
  const dynamics = brandAnalysis.competitiveDynamics || {};
  if (Object.keys(dynamics).length > 1) {
    doc.addPage();
    yPos = 25;
    addHeader(doc, productName, 'Competitive Analysis');
    
    doc.setFontSize(18);
    doc.setTextColor(...PURPLE);
    doc.text("Porter's Five Forces Analysis", MARGIN, yPos);
    yPos += 12;
    
    const forces = [
      { key: 'buyerPower', label: 'Buyer Power' },
      { key: 'supplierPower', label: 'Supplier Power' },
      { key: 'newEntrants', label: 'Threat of New Entrants' },
      { key: 'substitutes', label: 'Threat of Substitutes' },
      { key: 'rivalry', label: 'Competitive Rivalry' }
    ];
    
    forces.forEach((force) => {
      if (dynamics[force.key]) {
        doc.setFontSize(11);
        doc.setTextColor(...PURPLE);
        doc.setFont(undefined, 'bold');
        doc.text(force.label, MARGIN, yPos);
        doc.setFont(undefined, 'normal');
        yPos += 5;
        
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        const forceText = doc.splitTextToSize(dynamics[force.key], CONTENT_WIDTH);
        doc.text(forceText, MARGIN, yPos);
        yPos += forceText.length * 4 + 8;
        
        yPos = checkPageBreak(doc, yPos, 30);
      }
    });
  }
  
  // Blue Ocean Strategy
  const blueOcean = brandAnalysis.blueOceanStrategy || {};
  if (Object.keys(blueOcean).length > 0) {
    yPos = checkPageBreak(doc, yPos, 80);
    
    doc.setFontSize(16);
    doc.setTextColor(...PURPLE);
    doc.text('Blue Ocean Strategy', MARGIN, yPos);
    yPos += 10;
    
    const quadrants = [
      { key: 'eliminate', label: 'ELIMINATE', color: [254, 226, 226] },
      { key: 'reduce', label: 'REDUCE', color: [254, 243, 199] },
      { key: 'raise', label: 'RAISE', color: [219, 234, 254] },
      { key: 'create', label: 'CREATE', color: [220, 252, 231] }
    ];
    
    const quadWidth = (CONTENT_WIDTH - 10) / 2;
    const quadHeight = 40;
    
    quadrants.forEach((quad, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const x = MARGIN + (col * (quadWidth + 10));
      const y = yPos + (row * (quadHeight + 5));
      
      doc.setFillColor(...quad.color as [number, number, number]);
      doc.roundedRect(x, y, quadWidth, quadHeight, 2, 2, 'F');
      
      doc.setFontSize(9);
      doc.setTextColor(...PURPLE);
      doc.text(quad.label, x + 3, y + 8);
      
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      const items = blueOcean[quad.key] || [];
      items.slice(0, 3).forEach((item: string, j: number) => {
        doc.text(`• ${item.substring(0, 35)}`, x + 3, y + 16 + (j * 7));
      });
    });
    
    yPos += (quadHeight * 2) + 15;
  }

  // ═══════════════════════════════════════════════════════════════
  // PAGES: GO-TO-MARKET STRATEGY
  // ═══════════════════════════════════════════════════════════════
  doc.addPage();
  yPos = 25;
  addHeader(doc, productName, 'Go-to-Market Strategy');
  
  doc.setFontSize(24);
  doc.setTextColor(...PURPLE);
  doc.text('Go-to-Market Strategy', MARGIN, yPos);
  yPos += 15;
  
  // Channel Mix
  const channelMix = goToMarket.channelMix || {};
  const channels = channelMix.channelRecommendations || [];
  
  if (channels.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(...PURPLE);
    doc.text('Marketing Channel Mix', MARGIN, yPos);
    yPos += 8;
    
    const channelData = channels.slice(0, 8).map((ch: any) => [
      ch.channel || 'N/A',
      ch.budgetAllocation || 'N/A',
      ch.expectedCAC || 'N/A',
      ch.conversionRate || 'N/A',
      (ch.rationale || '').substring(0, 40) + '...'
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Channel', 'Budget', 'CAC', 'Conv. Rate', 'Rationale']],
      body: channelData,
      theme: 'striped',
      headStyles: { fillColor: PURPLE, fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 2 },
      margin: { left: MARGIN, right: MARGIN }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
  
  yPos = checkPageBreak(doc, yPos, 100);
  
  // 90-Day Roadmap
  const roadmap90 = goToMarket.ninetyDayRoadmap || {};
  if (Object.keys(roadmap90).length > 0) {
    doc.setFontSize(16);
    doc.setTextColor(...PURPLE);
    doc.text('90-Day Launch Roadmap', MARGIN, yPos);
    yPos += 10;
    
    const phases = [
      { key: 'preLaunch', label: 'Pre-Launch (Days 1-30)', color: LIGHT_GRAY },
      { key: 'launch', label: 'Launch (Days 31-60)', color: [237, 233, 254] as [number, number, number] },
      { key: 'scale', label: 'Scale (Days 61-90)', color: [220, 252, 231] as [number, number, number] }
    ];
    
    phases.forEach((phase) => {
      const phaseData = roadmap90[phase.key];
      if (!phaseData) return;
      
      yPos = checkPageBreak(doc, yPos, 50);
      
      doc.setFillColor(...phase.color);
      doc.roundedRect(MARGIN, yPos, CONTENT_WIDTH, 8, 2, 2, 'F');
      doc.setFontSize(10);
      doc.setTextColor(...PURPLE);
      doc.text(phase.label, MARGIN + 5, yPos + 5.5);
      yPos += 12;
      
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text('Objective: ', MARGIN, yPos);
      doc.setFont(undefined, 'normal');
      const obj = doc.splitTextToSize(phaseData.objective || 'N/A', CONTENT_WIDTH - 20);
      doc.text(obj, MARGIN + 20, yPos);
      yPos += obj.length * 4 + 5;
      
      // Tactics
      const tactics = phaseData.tactics || [];
      if (tactics.length > 0) {
        const tacticData = tactics.slice(0, 4).map((t: any) => [
          t.tactic || 'N/A',
          t.budget || 'N/A',
          t.timeline || 'N/A',
          (t.expectedOutcome || '').substring(0, 30)
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [['Tactic', 'Budget', 'Timeline', 'Expected Outcome']],
          body: tacticData,
          theme: 'plain',
          headStyles: { fillColor: [240, 240, 240], fontSize: 7, textColor: [80, 80, 80] },
          styles: { fontSize: 7, cellPadding: 2 },
          margin: { left: MARGIN, right: MARGIN }
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 10;
      }
    });
  }
  
  // Funnel Design
  const funnel = goToMarket.funnelDesign || {};
  const stages = funnel.stages || [];
  if (stages.length > 0) {
    doc.addPage();
    yPos = 25;
    addHeader(doc, productName, 'Customer Acquisition Funnel');
    
    doc.setFontSize(16);
    doc.setTextColor(...PURPLE);
    doc.text('Customer Acquisition Funnel', MARGIN, yPos);
    yPos += 10;
    
    stages.forEach((stage: any, i: number) => {
      const width = CONTENT_WIDTH - (i * 15);
      const x = MARGIN + (i * 7.5);
      
      doc.setFillColor(237 - (i * 10), 233 - (i * 5), 254);
      doc.roundedRect(x, yPos, width, 20, 2, 2, 'F');
      
      doc.setFontSize(10);
      doc.setTextColor(...PURPLE);
      doc.text(stage.stage || `Stage ${i + 1}`, x + 5, yPos + 8);
      
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      doc.text(`Volume: ${stage.expectedVolume || 'N/A'} | Conv: ${stage.conversionToNext || 'N/A'}`, x + 5, yPos + 15);
      
      yPos += 25;
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // PAGES: RISK ANALYSIS
  // ═══════════════════════════════════════════════════════════════
  doc.addPage();
  yPos = 25;
  addHeader(doc, productName, 'Risk Analysis');
  
  doc.setFontSize(24);
  doc.setTextColor(...PURPLE);
  doc.text('Risk Analysis', MARGIN, yPos);
  yPos += 15;
  
  // Market Risks
  const marketRisks = risks.marketRisks || [];
  if (marketRisks.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(...PURPLE);
    doc.text('Market Risks', MARGIN, yPos);
    yPos += 8;
    
    marketRisks.slice(0, 7).forEach((risk: any, idx: number) => {
      yPos = checkPageBreak(doc, yPos, 40);
      
      // Risk Header
      doc.setFillColor(254, 226, 226);
      doc.roundedRect(MARGIN, yPos, CONTENT_WIDTH, 8, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setTextColor(180, 50, 50);
      doc.text(`${idx + 1}. ${risk.risk || 'Unknown Risk'}`, MARGIN + 3, yPos + 5.5);
      
      // Badges
      const likelihoodColor = risk.likelihood === 'HIGH' ? RED : risk.likelihood === 'MEDIUM' ? YELLOW : GREEN;
      doc.setFillColor(...likelihoodColor);
      doc.roundedRect(PAGE_WIDTH - MARGIN - 50, yPos + 1, 20, 6, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6);
      doc.text(risk.likelihood || 'N/A', PAGE_WIDTH - MARGIN - 40, yPos + 5, { align: 'center' });
      
      doc.setFillColor(...GRAY);
      doc.roundedRect(PAGE_WIDTH - MARGIN - 25, yPos + 1, 20, 6, 1, 1, 'F');
      doc.text(risk.financialImpact?.substring(0, 8) || 'N/A', PAGE_WIDTH - MARGIN - 15, yPos + 5, { align: 'center' });
      
      yPos += 12;
      
      // Mitigation
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text('Mitigation:', MARGIN + 3, yPos);
      doc.setFont(undefined, 'normal');
      
      const mitigations = risk.mitigation || [];
      if (Array.isArray(mitigations)) {
        mitigations.slice(0, 2).forEach((m: string) => {
          yPos += 4;
          doc.text(`• ${m.substring(0, 80)}`, MARGIN + 5, yPos);
        });
      }
      
      yPos += 8;
    });
  }
  
  // Execution Risks
  const execRisks = risks.executionRisks || [];
  if (execRisks.length > 0) {
    yPos = checkPageBreak(doc, yPos, 50);
    
    doc.setFontSize(14);
    doc.setTextColor(...PURPLE);
    doc.text('Execution Risks', MARGIN, yPos);
    yPos += 8;
    
    execRisks.slice(0, 5).forEach((risk: any) => {
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'bold');
      doc.text(`Assumption: `, MARGIN, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(risk.assumption || 'N/A', MARGIN + 25, yPos);
      yPos += 5;
      doc.text(`Downside: ${risk.downside || 'N/A'}`, MARGIN + 5, yPos);
      yPos += 8;
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // PAGES: INVESTMENT THESIS
  // ═══════════════════════════════════════════════════════════════
  doc.addPage();
  yPos = 25;
  addHeader(doc, productName, 'Investment Thesis');
  
  doc.setFontSize(24);
  doc.setTextColor(...PURPLE);
  doc.text('Investment Thesis', MARGIN, yPos);
  yPos += 15;
  
  // Main Recommendation Box
  doc.setFillColor(...recColor);
  doc.roundedRect(MARGIN, yPos, CONTENT_WIDTH, 50, 5, 5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.text(recommendation, PAGE_WIDTH / 2, yPos + 20, { align: 'center' });
  doc.setFontSize(14);
  doc.text(`${confidence} Confidence`, PAGE_WIDTH / 2, yPos + 35, { align: 'center' });
  yPos += 60;
  
  // Reasoning
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const fullReasoning = doc.splitTextToSize(
    investmentThesis?.recommendation?.reasoning || 
    `Based on comprehensive Bayesian analysis with PSM score of ${psmScore}/100 and demand probability of ${demandProb}, ` +
    `this product demonstrates ${psmScore >= 60 ? 'strong' : 'moderate'} market validation signals.`,
    CONTENT_WIDTH
  );
  doc.text(fullReasoning, MARGIN, yPos);
  yPos += fullReasoning.length * 4 + 15;
  
  // Scenarios Comparison
  const scenarios2 = investmentThesis?.scenarios || {};
  if (Object.keys(scenarios2).length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(...PURPLE);
    doc.text('Financial Scenarios', MARGIN, yPos);
    yPos += 8;
    
    const scenarioData = [
      ['Metric', 'Bull Case', 'Base Case', 'Bear Case'],
      ['Probability', safeText(scenarios2.bullCase?.probability), safeText(scenarios2.baseCase?.probability), safeText(scenarios2.bearCase?.probability)],
      ['Y1 Revenue', safeText(scenarios2.bullCase?.year1?.revenue), safeText(scenarios2.baseCase?.year1?.revenue), safeText(scenarios2.bearCase?.year1?.revenue)],
      ['Y1 Customers', safeText(scenarios2.bullCase?.year1?.customers), safeText(scenarios2.baseCase?.year1?.customers), safeText(scenarios2.bearCase?.year1?.customers)],
      ['Y3 Revenue', safeText(scenarios2.bullCase?.year3?.revenue), safeText(scenarios2.baseCase?.year3?.revenue), safeText(scenarios2.bearCase?.year3?.revenue)],
      ['Y3 Customers', safeText(scenarios2.bullCase?.year3?.customers), safeText(scenarios2.baseCase?.year3?.customers), safeText(scenarios2.bearCase?.year3?.customers)]
    ];
    
    autoTable(doc, {
      startY: yPos,
      body: scenarioData,
      theme: 'grid',
      headStyles: { fillColor: PURPLE },
      styles: { fontSize: 9, cellPadding: 3, halign: 'center' },
      columnStyles: { 
        0: { fontStyle: 'bold', halign: 'left' },
        1: { fillColor: [220, 252, 231] },
        2: { fillColor: [237, 233, 254] },
        3: { fillColor: [254, 226, 226] }
      },
      margin: { left: MARGIN, right: MARGIN }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
  
  yPos = checkPageBreak(doc, yPos, 80);
  
  // Key Success Factors
  const ksf = investmentThesis?.keySuccessFactors?.factors || [];
  if (ksf.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(...PURPLE);
    doc.text('Key Success Factors', MARGIN, yPos);
    yPos += 5;
    
    const ksfData = ksf.slice(0, 6).map((f: any) => [
      f.factor || 'N/A',
      f.criticality || 'N/A',
      f.currentStatus || 'N/A',
      (f.actionRequired || '').substring(0, 35)
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Factor', 'Criticality', 'Status', 'Action Required']],
      body: ksfData,
      theme: 'striped',
      headStyles: { fillColor: PURPLE, fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: MARGIN, right: MARGIN }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // ADD PAGE NUMBERS
  // ═══════════════════════════════════════════════════════════════
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  console.log(`PDF generated: ${totalPages} pages`);
  return doc.output('blob');
}
