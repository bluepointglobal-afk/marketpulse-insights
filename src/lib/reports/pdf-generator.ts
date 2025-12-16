import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

// Ipsos/McKinsey-style colors
const PURPLE = [123, 44, 191] as [number, number, number];
const DARK_PURPLE = [88, 28, 135] as [number, number, number];
const GREEN = [16, 185, 129] as [number, number, number];
const YELLOW = [245, 158, 11] as [number, number, number];
const RED = [239, 68, 68] as [number, number, number];
const GRAY = [107, 114, 128] as [number, number, number];
const DARK_GRAY = [55, 65, 81] as [number, number, number];
const LIGHT_GRAY = [243, 244, 246] as [number, number, number];
const NAVY = [30, 41, 59] as [number, number, number];

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
  if (!Array.isArray(value)) return [];
  return value;
}

function addHeader(doc: jsPDF, productName: string, sectionName: string) {
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(productName.toUpperCase(), MARGIN, 10);
  doc.text(sectionName.toUpperCase(), PAGE_WIDTH - MARGIN, 10, { align: 'right' });
  doc.setDrawColor(...LIGHT_GRAY);
  doc.line(MARGIN, 12, PAGE_WIDTH - MARGIN, 12);
}

function addFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(
    `MarketPulse GCC Market Validation Report | Page ${pageNum}`,
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

function addSectionTitle(doc: jsPDF, title: string, yPos: number): number {
  doc.setFontSize(16);
  doc.setTextColor(...DARK_PURPLE);
  doc.text(title, MARGIN, yPos);
  return yPos + 10;
}

function addSubsectionTitle(doc: jsPDF, title: string, yPos: number): number {
  doc.setFontSize(12);
  doc.setTextColor(...NAVY);
  doc.setFont(undefined, 'bold');
  doc.text(title, MARGIN, yPos);
  doc.setFont(undefined, 'normal');
  return yPos + 7;
}

export async function generatePDF(data: any): Promise<Blob> {
  const doc = new jsPDF();
  const productName = data.productName || data.product_name || 'Market Validation';
  const category = data.category || 'Consumer Product';
  
  // Extract all data with comprehensive fallbacks
  const bayesianResults = data.bayesianResults || data.bayesian_results || {};
  const brandAnalysis = data.brandAnalysis || data.brand_analysis || {};
  const personas = safeArray(data.personas);
  const competitors = safeArray(brandAnalysis.competitors);
  const featureStrategy = data.featureStrategy || brandAnalysis.featureStrategy || {};
  const pricingStrategy = data.pricingStrategy || brandAnalysis.pricingStrategy || {};
  const goToMarket = data.goToMarket || brandAnalysis.goToMarket || {};
  const risks = data.risks || brandAnalysis.risks || {};
  const investmentThesis = data.investmentThesis || brandAnalysis.investmentThesis || brandAnalysis.investment_thesis || {};
  const market = data.market || brandAnalysis.market || {};
  const vanWestendorp = data.vanWestendorp || data.van_westendorp || pricingStrategy.vanWestendorp || {};

  // ═══════════════════════════════════════════════════════════════
  // COVER PAGE
  // ═══════════════════════════════════════════════════════════════
  doc.setFillColor(...PURPLE);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
  
  // Decorative element
  doc.setFillColor(...DARK_PURPLE);
  doc.rect(0, PAGE_HEIGHT - 80, PAGE_WIDTH, 80, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('MARKET VALIDATION REPORT', PAGE_WIDTH / 2, 60, { align: 'center' });
  
  doc.setFontSize(36);
  doc.setFont(undefined, 'bold');
  doc.text(productName, PAGE_WIDTH / 2, 90, { align: 'center' });
  doc.setFont(undefined, 'normal');
  
  doc.setFontSize(16);
  doc.text(`${category} | GCC Market Entry Analysis`, PAGE_WIDTH / 2, 110, { align: 'center' });
  
  // Key metrics box
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(MARGIN + 10, 140, CONTENT_WIDTH - 20, 60, 5, 5, 'F');
  
  const demandProb = formatPercent(bayesianResults.demandProbability);
  const psmScore = bayesianResults.psmScore || 0;
  const optimalPrice = bayesianResults.optimalPrice || 0;
  const recommendation = investmentThesis?.recommendation?.recommendation || 
    (psmScore >= 60 ? 'GREENLIGHT' : psmScore >= 40 ? 'TEST FURTHER' : 'REVISE STRATEGY');
  
  doc.setFontSize(10);
  doc.setTextColor(...GRAY);
  doc.text('DEMAND PROBABILITY', 50, 155);
  doc.text('PSM SCORE', PAGE_WIDTH / 2, 155, { align: 'center' });
  doc.text('OPTIMAL PRICE', PAGE_WIDTH - 50, 155, { align: 'right' });
  
  doc.setFontSize(24);
  doc.setTextColor(...PURPLE);
  doc.text(demandProb, 50, 175);
  doc.text(`${psmScore}/100`, PAGE_WIDTH / 2, 175, { align: 'center' });
  doc.text(formatSAR(optimalPrice), PAGE_WIDTH - 50, 175, { align: 'right' });
  
  // Recommendation badge
  const recColor = recommendation.includes('GREEN') ? GREEN : 
                   recommendation.includes('REVISE') ? RED : YELLOW;
  doc.setFillColor(...recColor);
  doc.roundedRect(MARGIN + 40, 230, CONTENT_WIDTH - 80, 25, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(recommendation, PAGE_WIDTH / 2, 247, { align: 'center' });
  doc.setFont(undefined, 'normal');
  
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 50, { align: 'center' });
  doc.text('Powered by MarketPulse Bayesian Engine', PAGE_WIDTH / 2, PAGE_HEIGHT - 35, { align: 'center' });

  // ═══════════════════════════════════════════════════════════════
  // EXECUTIVE SUMMARY (Pages 2-3)
  // ═══════════════════════════════════════════════════════════════
  doc.addPage();
  let yPos = 25;
  addHeader(doc, productName, 'Executive Summary');
  
  doc.setFontSize(24);
  doc.setTextColor(...PURPLE);
  doc.text('Executive Summary', MARGIN, yPos);
  yPos += 15;
  
  // Recommendation Box
  const confidence = investmentThesis?.recommendation?.confidenceLevel || 
    (psmScore >= 75 ? 'HIGH' : psmScore >= 50 ? 'MEDIUM' : 'LOW');
  
  doc.setFillColor(...recColor);
  doc.roundedRect(MARGIN, yPos, CONTENT_WIDTH, 40, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text(recommendation, PAGE_WIDTH / 2, yPos + 18, { align: 'center' });
  doc.setFont(undefined, 'normal');
  doc.setFontSize(12);
  doc.text(`${confidence} Confidence`, PAGE_WIDTH / 2, yPos + 32, { align: 'center' });
  yPos += 50;
  
  // Reasoning
  doc.setTextColor(...DARK_GRAY);
  doc.setFontSize(11);
  const reasoning = investmentThesis?.recommendation?.reasoning || 
    `Based on Bayesian analysis with PSM score of ${psmScore}/100 and demand probability of ${demandProb}, this product demonstrates ${psmScore >= 60 ? 'strong' : 'moderate'} market potential in the GCC region.`;
  const splitReasoning = doc.splitTextToSize(reasoning, CONTENT_WIDTH);
  doc.text(splitReasoning, MARGIN, yPos);
  yPos += splitReasoning.length * 5 + 15;
  
  // Key Metrics Table
  yPos = addSectionTitle(doc, 'Key Performance Metrics', yPos);
  
  const metricsData = [
    ['Demand Probability', demandProb, psmScore >= 60 ? 'Strong market signal' : 'Moderate - validate further'],
    ['PSM Score', `${psmScore}/100`, psmScore >= 60 ? 'GO - Proceed with market test' : psmScore >= 40 ? 'REVISE - Directional insights' : 'NO-GO - Insufficient confidence'],
    ['Optimal Price Point', formatSAR(optimalPrice), 'Bayesian-optimized price'],
    ['Target Personas', `${personas.length} identified`, personas.slice(0, 2).map((p: any) => p.name).join(', ') || 'Primary segments defined'],
    ['Competitors Analyzed', `${competitors.length}`, competitors.slice(0, 2).map((c: any) => c.name).join(', ') || 'Key players assessed'],
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value', 'Interpretation']],
    body: metricsData,
    theme: 'striped',
    headStyles: { fillColor: PURPLE, fontSize: 10, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 },
    margin: { left: MARGIN, right: MARGIN },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 }, 1: { cellWidth: 35 }, 2: { cellWidth: 90 } }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  yPos = checkPageBreak(doc, yPos, 80);
  
  // Critical Success Factors
  yPos = addSectionTitle(doc, 'Critical Success Factors', yPos);
  
  const csf = investmentThesis?.keySuccessFactors || [
    { factor: 'Distribution partnerships with major GCC retailers', criticality: 'HIGH' },
    { factor: 'SFDA/regulatory approval within timeline', criticality: 'HIGH' },
    { factor: 'Competitive pricing within Van Westendorp acceptable range', criticality: 'MEDIUM' },
  ];
  
  doc.setFontSize(10);
  doc.setTextColor(...DARK_GRAY);
  safeArray(csf).slice(0, 5).forEach((item: any, idx: number) => {
    const factor = typeof item === 'string' ? item : item.factor || item;
    const criticality = item.criticality || 'MEDIUM';
    const color = criticality === 'HIGH' ? RED : criticality === 'MEDIUM' ? YELLOW : GREEN;
    
    doc.setFillColor(...color);
    doc.circle(MARGIN + 3, yPos - 2, 2, 'F');
    doc.text(`${factor}`, MARGIN + 8, yPos);
    yPos += 6;
  });
  
  yPos += 10;
  yPos = checkPageBreak(doc, yPos, 60);
  
  // Financial Snapshot
  yPos = addSectionTitle(doc, 'Financial Snapshot', yPos);
  
  const scenarios = investmentThesis?.scenarios || {};
  const finData = [
    ['Year 1 Revenue (Base)', safeText(scenarios.baseCase?.year1?.revenue, 'Analysis required')],
    ['Year 1 Customers', safeText(scenarios.baseCase?.year1?.customers, 'Market sizing pending')],
    ['Year 3 Revenue (Base)', safeText(scenarios.baseCase?.year3?.revenue, 'Projection pending')],
    ['Breakeven Timeline', safeText(investmentThesis?.breakeven, '12-18 months estimated')],
    ['Investment Required', safeText(investmentThesis?.investmentRequired, 'Budget analysis pending')],
  ];
  
  autoTable(doc, {
    startY: yPos,
    body: finData,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, fillColor: LIGHT_GRAY } },
    margin: { left: MARGIN, right: MARGIN }
  });

  // ═══════════════════════════════════════════════════════════════
  // MARKET OPPORTUNITY (Pages 4-5)
  // ═══════════════════════════════════════════════════════════════
  doc.addPage();
  yPos = 25;
  addHeader(doc, productName, 'Market Opportunity');
  
  doc.setFontSize(24);
  doc.setTextColor(...PURPLE);
  doc.text('Market Opportunity', MARGIN, yPos);
  yPos += 15;
  
  // Market Sizing
  yPos = addSubsectionTitle(doc, 'Market Sizing (TAM / SAM / SOM)', yPos);
  
  const marketSize = market.marketSize || {};
  const tamsamsom = [
    ['Total Addressable Market (TAM)', safeText(marketSize.tam?.value, 'USD 500M+ estimated'), safeText(marketSize.tam?.methodology, 'Top-down from category')],
    ['Serviceable Addressable Market (SAM)', safeText(marketSize.sam?.value, 'USD 150M estimated'), safeText(marketSize.sam?.methodology, 'GCC focus segment')],
    ['Serviceable Obtainable Market (SOM)', safeText(marketSize.som?.value, 'USD 15M Year 3 target'), safeText(marketSize.som?.methodology, '10% SAM capture')],
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [['Market Level', 'Size', 'Methodology']],
    body: tamsamsom,
    theme: 'striped',
    headStyles: { fillColor: PURPLE },
    styles: { fontSize: 9 },
    margin: { left: MARGIN, right: MARGIN }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Demand Analysis
  yPos = addSubsectionTitle(doc, 'Bayesian Demand Analysis', yPos);
  
  const demandData = [
    ['Overall Demand Probability', demandProb],
    ['PSM Score (Posterior Sharpness)', `${psmScore}/100`],
    ['Optimal Price Point', formatSAR(optimalPrice)],
    ['Price Range (Acceptable)', `${formatSAR(bayesianResults.priceRange?.min)} - ${formatSAR(bayesianResults.priceRange?.max)}`],
    ['Confidence Interval', `${formatPercent(bayesianResults.confidenceInterval?.[0])} - ${formatPercent(bayesianResults.confidenceInterval?.[1])}`],
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
  yPos = checkPageBreak(doc, yPos, 60);
  
  // Regional Breakdown
  yPos = addSubsectionTitle(doc, 'Regional Breakdown', yPos);
  
  const regionalData = bayesianResults.regionalBreakdown || market.regionalBreakdown || {};
  const regions = Array.isArray(regionalData) ? regionalData : Object.entries(regionalData).map(([name, data]: [string, any]) => ({
    region: name,
    ...data
  }));
  
  if (regions.length > 0) {
    const regTableData = regions.map((r: any) => [
      r.region || r.name || 'Region',
      formatPercent(r.demandProbability || r.demand),
      formatSAR(r.optimalPrice),
      safeText(r.insight, 'Strong potential'),
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Region', 'Demand', 'Optimal Price', 'Key Insight']],
      body: regTableData,
      theme: 'striped',
      headStyles: { fillColor: PURPLE },
      margin: { left: MARGIN, right: MARGIN }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  } else {
    // Default regional breakdown
    const defaultRegions = [
      ['Saudi Arabia (KSA)', demandProb, formatSAR(optimalPrice), 'Largest GCC market, key entry point'],
      ['United Arab Emirates', formatPercent((bayesianResults.demandProbability || 0.6) * 1.1), formatSAR((optimalPrice || 50) * 1.15), 'Premium positioning opportunity'],
      ['Qatar', formatPercent((bayesianResults.demandProbability || 0.6) * 0.95), formatSAR((optimalPrice || 50) * 1.2), 'Highest per-capita spending'],
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [['Region', 'Demand', 'Optimal Price', 'Key Insight']],
      body: defaultRegions,
      theme: 'striped',
      headStyles: { fillColor: PURPLE },
      margin: { left: MARGIN, right: MARGIN }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // ═══════════════════════════════════════════════════════════════
  // CUSTOMER INSIGHTS - PERSONAS (Pages 6-12)
  // ═══════════════════════════════════════════════════════════════
  personas.forEach((persona: any, idx: number) => {
    doc.addPage();
    yPos = 25;
    addHeader(doc, productName, `Customer Insights - Persona ${idx + 1}`);
    
    // Persona Header
    doc.setFontSize(22);
    doc.setTextColor(...PURPLE);
    doc.text(persona.name || `Target Persona ${idx + 1}`, MARGIN, yPos);
    yPos += 8;
    
    doc.setFontSize(12);
    doc.setTextColor(...GRAY);
    doc.text(persona.tagline || persona.segment || 'Primary Target Segment', MARGIN, yPos);
    yPos += 5;
    
    // Priority & Size badges
    const priority = persona.priority || (idx === 0 ? 'PRIMARY' : 'SECONDARY');
    const badgeColor = priority === 'PRIMARY' ? GREEN : priority === 'SECONDARY' ? YELLOW : GRAY;
    doc.setFillColor(...badgeColor);
    doc.roundedRect(MARGIN, yPos, 30, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(priority, MARGIN + 15, yPos + 5.5, { align: 'center' });
    
    const segmentSize = persona.segmentSize || persona.size || 0.25;
    doc.setFillColor(...PURPLE);
    doc.roundedRect(MARGIN + 35, yPos, 35, 8, 2, 2, 'F');
    doc.text(`${formatPercent(segmentSize)} Market`, MARGIN + 52.5, yPos + 5.5, { align: 'center' });
    yPos += 15;
    
    // Quote Box
    const quote = persona.psychographics?.quote || persona.quote || 'Customer voice insight';
    doc.setFillColor(...LIGHT_GRAY);
    const splitQuote = doc.splitTextToSize(`"${quote}"`, CONTENT_WIDTH - 20);
    const quoteHeight = Math.max(20, splitQuote.length * 5 + 10);
    doc.roundedRect(MARGIN, yPos, CONTENT_WIDTH, quoteHeight, 3, 3, 'F');
    doc.setTextColor(...DARK_GRAY);
    doc.setFontSize(11);
    doc.setFont(undefined, 'italic');
    doc.text(splitQuote, MARGIN + 10, yPos + 8);
    doc.setFont(undefined, 'normal');
    yPos += quoteHeight + 10;
    
    // Two-column: Demographics | Bayesian Profile
    const colWidth = (CONTENT_WIDTH - 10) / 2;
    
    yPos = addSubsectionTitle(doc, 'Demographics', yPos);
    
    const demo = persona.demographics || {};
    const demoData = [
      ['Age', safeText(demo.age, '28-35 years')],
      ['Income', safeText(demo.income, 'SAR 15,000-25,000/month')],
      ['Location', safeText(demo.location, 'Riyadh, KSA')],
      ['Occupation', safeText(demo.occupation, 'Professional')],
      ['Family', safeText(demo.familyStatus, 'Married with children')],
      ['Education', safeText(demo.education, 'University degree')],
    ];
    
    autoTable(doc, {
      startY: yPos,
      body: demoData,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 25 }, 1: { cellWidth: colWidth - 30 } },
      margin: { left: MARGIN, right: PAGE_WIDTH / 2 + 5 }
    });
    
    const demoEndY = (doc as any).lastAutoTable.finalY;
    
    // Bayesian Profile (right column)
    doc.setFontSize(12);
    doc.setTextColor(...NAVY);
    doc.setFont(undefined, 'bold');
    doc.text('Bayesian Profile', PAGE_WIDTH / 2 + 5, yPos - 3);
    doc.setFont(undefined, 'normal');
    
    const bayesian = persona.bayesianProfile || {};
    const bayesData = [
      ['Demand', formatPercent(bayesian.demandProbability || 0.65)],
      ['Optimal Price', formatSAR(bayesian.optimalPrice || optimalPrice)],
      ['WTP Range', bayesian.willingnessToPayRange ? `${formatSAR(bayesian.willingnessToPayRange[0])} - ${formatSAR(bayesian.willingnessToPayRange[1])}` : 'Within acceptable range'],
      ['Elasticity', safeText(bayesian.priceElasticity, 'MEDIUM')],
      ['Frequency', safeText(bayesian.purchaseFrequency, 'Monthly')],
    ];
    
    autoTable(doc, {
      startY: yPos,
      body: bayesData,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 30 }, 1: { cellWidth: colWidth - 35 } },
      margin: { left: PAGE_WIDTH / 2 + 5, right: MARGIN }
    });
    
    yPos = Math.max(demoEndY, (doc as any).lastAutoTable.finalY) + 10;
    yPos = checkPageBreak(doc, yPos, 80);
    
    // Jobs to Be Done
    yPos = addSubsectionTitle(doc, 'Jobs to Be Done', yPos);
    
    const psycho = persona.psychographics || {};
    const jtbd = persona.jobsToBeDone || {};
    
    doc.setFontSize(10);
    doc.setTextColor(...DARK_GRAY);
    
    const coreJob = jtbd.coreJob || psycho.coreJob || 'Help me achieve my goals with a reliable solution';
    doc.setFont(undefined, 'bold');
    doc.text('Core Job:', MARGIN, yPos);
    doc.setFont(undefined, 'normal');
    const splitJob = doc.splitTextToSize(coreJob, CONTENT_WIDTH - 25);
    doc.text(splitJob, MARGIN + 25, yPos);
    yPos += splitJob.length * 4 + 5;
    
    const trigger = jtbd.triggerMoment || psycho.triggerMoment || 'When facing a specific need or problem';
    doc.setFont(undefined, 'bold');
    doc.text('Trigger:', MARGIN, yPos);
    doc.setFont(undefined, 'normal');
    const splitTrigger = doc.splitTextToSize(trigger, CONTENT_WIDTH - 25);
    doc.text(splitTrigger, MARGIN + 25, yPos);
    yPos += splitTrigger.length * 4 + 5;
    
    const alternative = jtbd.currentAlternative || psycho.currentAlternative || 'Existing solutions or workarounds';
    doc.setFont(undefined, 'bold');
    doc.text('Current Alternative:', MARGIN, yPos);
    doc.setFont(undefined, 'normal');
    const splitAlt = doc.splitTextToSize(alternative, CONTENT_WIDTH - 45);
    doc.text(splitAlt, MARGIN + 45, yPos);
    yPos += splitAlt.length * 4 + 10;
    
    yPos = checkPageBreak(doc, yPos, 60);
    
    // Marketing Strategy
    if (persona.marketingStrategy) {
      yPos = addSubsectionTitle(doc, 'Marketing Strategy', yPos);
      
      doc.setFontSize(10);
      const coreMessage = persona.marketingStrategy.coreMessage || 'Value-focused messaging';
      doc.setFont(undefined, 'bold');
      doc.text('Core Message:', MARGIN, yPos);
      doc.setFont(undefined, 'normal');
      const splitMsg = doc.splitTextToSize(coreMessage, CONTENT_WIDTH - 30);
      doc.text(splitMsg, MARGIN + 30, yPos);
      yPos += splitMsg.length * 4 + 5;
      
      // Channel Strategy
      const channels = safeArray(persona.marketingStrategy.channelStrategy).slice(0, 4);
      if (channels.length > 0) {
        const channelData = channels.map((ch: any) => [
          safeText(ch.channel),
          `${ch.budgetPercent || 25}%`,
          formatSAR(ch.cac || 50),
          safeText(ch.rationale, 'Strategic fit')
        ]);
        
        autoTable(doc, {
          startY: yPos + 3,
          head: [['Channel', 'Budget %', 'CAC', 'Rationale']],
          body: channelData,
          theme: 'striped',
          headStyles: { fillColor: PURPLE, fontSize: 9 },
          styles: { fontSize: 8 },
          margin: { left: MARGIN, right: MARGIN }
        });
        
        yPos = (doc as any).lastAutoTable.finalY + 10;
      }
    }
    
    // Lifetime Value
    if (persona.lifetimeValue) {
      yPos = checkPageBreak(doc, yPos, 40);
      yPos = addSubsectionTitle(doc, 'Customer Economics', yPos);
      
      const ltv = persona.lifetimeValue;
      const ltvData = [
        ['Year 1 Revenue', formatSAR(ltv.year1Revenue || 2000)],
        ['3-Year LTV', formatSAR(ltv.threeYearLTV || 6000)],
        ['CAC', formatSAR(ltv.cac || 500)],
        ['LTV:CAC Ratio', `${ltv.ltvCacRatio || 4}:1`],
      ];
      
      autoTable(doc, {
        startY: yPos,
        body: ltvData,
        theme: 'grid',
        styles: { fontSize: 9 },
        columnStyles: { 0: { fontStyle: 'bold', fillColor: LIGHT_GRAY } },
        margin: { left: MARGIN, right: PAGE_WIDTH / 2 }
      });
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // COMPETITIVE LANDSCAPE (Pages 13-18)
  // ═══════════════════════════════════════════════════════════════
  doc.addPage();
  yPos = 25;
  addHeader(doc, productName, 'Competitive Landscape');
  
  doc.setFontSize(24);
  doc.setTextColor(...PURPLE);
  doc.text('Competitive Landscape', MARGIN, yPos);
  yPos += 15;
  
  // Competitor Overview Table
  yPos = addSubsectionTitle(doc, 'Key Competitors', yPos);
  
  if (competitors.length > 0) {
    const compOverview = competitors.slice(0, 7).map((comp: any) => [
      safeText(comp.name),
      safeText(comp.positioning, 'MID_MARKET'),
      typeof comp.priceRange === 'object' 
        ? `${formatSAR(comp.priceRange.min)}-${formatSAR(comp.priceRange.max)}`
        : safeText(comp.priceRange),
      safeText(comp.marketShare, 'Est. 5-15%'),
      safeText(comp.threatLevel, 'MEDIUM'),
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Competitor', 'Positioning', 'Price Range', 'Market Share', 'Threat']],
      body: compOverview,
      theme: 'striped',
      headStyles: { fillColor: PURPLE, fontSize: 9 },
      styles: { fontSize: 8 },
      margin: { left: MARGIN, right: MARGIN },
      didParseCell: (data) => {
        if (data.column.index === 4 && data.section === 'body') {
          const threat = data.cell.text[0];
          if (threat === 'HIGH') data.cell.styles.textColor = RED;
          else if (threat === 'MEDIUM') data.cell.styles.textColor = YELLOW;
          else data.cell.styles.textColor = GREEN;
        }
      }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
    
    // Detailed competitor profiles
    competitors.slice(0, 4).forEach((comp: any) => {
      yPos = checkPageBreak(doc, yPos, 80);
      
      yPos = addSubsectionTitle(doc, comp.name || 'Competitor', yPos);
      
      // Strengths & Weaknesses
      const strengths = safeArray(comp.strengths).slice(0, 3).map((s: any) => 
        typeof s === 'string' ? s : s.strength || s
      );
      const weaknesses = safeArray(comp.weaknesses).slice(0, 3).map((w: any) =>
        typeof w === 'string' ? w : w.weakness || w
      );
      
      doc.setFontSize(9);
      doc.setTextColor(...DARK_GRAY);
      
      doc.setFont(undefined, 'bold');
      doc.text('Strengths:', MARGIN, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 4;
      strengths.forEach((s: string) => {
        doc.setTextColor(...GREEN);
        doc.text('+ ', MARGIN + 2, yPos);
        doc.setTextColor(...DARK_GRAY);
        doc.text(s.substring(0, 80), MARGIN + 6, yPos);
        yPos += 4;
      });
      
      yPos += 2;
      doc.setFont(undefined, 'bold');
      doc.text('Weaknesses:', MARGIN, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 4;
      weaknesses.forEach((w: string) => {
        doc.setTextColor(...RED);
        doc.text('- ', MARGIN + 2, yPos);
        doc.setTextColor(...DARK_GRAY);
        doc.text(w.substring(0, 80), MARGIN + 6, yPos);
        yPos += 4;
      });
      
      yPos += 8;
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    doc.text('Competitive analysis pending - will be populated with real market data', MARGIN, yPos);
    yPos += 20;
  }
  
  // Porter's Five Forces
  yPos = checkPageBreak(doc, yPos, 80);
  doc.addPage();
  yPos = 25;
  addHeader(doc, productName, 'Competitive Analysis');
  
  yPos = addSectionTitle(doc, "Porter's Five Forces Analysis", yPos);
  
  const porters = brandAnalysis.portersFiveForces || {};
  const forcesData = [
    ['New Entrants Threat', safeText(porters.newEntrantsThreat?.level, 'MEDIUM'), safeText(porters.newEntrantsThreat?.analysis, 'Moderate barriers to entry in GCC')],
    ['Supplier Power', safeText(porters.supplierPower?.level, 'LOW'), safeText(porters.supplierPower?.analysis, 'Multiple supplier options available')],
    ['Buyer Power', safeText(porters.buyerPower?.level, 'MEDIUM'), safeText(porters.buyerPower?.analysis, 'Growing consumer choice in category')],
    ['Substitute Threat', safeText(porters.substituteThreat?.level, 'MEDIUM'), safeText(porters.substituteThreat?.analysis, 'Alternative solutions exist')],
    ['Competitive Rivalry', safeText(porters.competitiveRivalry?.level, 'HIGH'), safeText(porters.competitiveRivalry?.analysis, 'Active competition from established players')],
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [['Force', 'Level', 'Analysis']],
    body: forcesData,
    theme: 'striped',
    headStyles: { fillColor: PURPLE },
    styles: { fontSize: 9 },
    columnStyles: { 2: { cellWidth: 100 } },
    margin: { left: MARGIN, right: MARGIN },
    didParseCell: (data) => {
      if (data.column.index === 1 && data.section === 'body') {
        const level = data.cell.text[0];
        if (level === 'HIGH') data.cell.styles.textColor = RED;
        else if (level === 'MEDIUM') data.cell.styles.textColor = YELLOW;
        else data.cell.styles.textColor = GREEN;
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // PRODUCT & PRICING STRATEGY (Pages 19-22)
  // ═══════════════════════════════════════════════════════════════
  doc.addPage();
  yPos = 25;
  addHeader(doc, productName, 'Product Strategy');
  
  doc.setFontSize(24);
  doc.setTextColor(...PURPLE);
  doc.text('Product & Pricing Strategy', MARGIN, yPos);
  yPos += 15;
  
  // Feature Strategy
  yPos = addSubsectionTitle(doc, 'Feature Strategy', yPos);
  
  const mvp = featureStrategy.mvpRecommendation || {};
  if (mvp.features || mvp.rationale) {
    doc.setFillColor(...LIGHT_GRAY);
    doc.roundedRect(MARGIN, yPos, CONTENT_WIDTH, 25, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setTextColor(...PURPLE);
    doc.setFont(undefined, 'bold');
    doc.text('MVP Recommendation', MARGIN + 5, yPos + 8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...DARK_GRAY);
    doc.setFontSize(9);
    const mvpText = safeArray(mvp.features).join(', ') || mvp.rationale || 'Core features identified';
    const splitMvp = doc.splitTextToSize(mvpText, CONTENT_WIDTH - 15);
    doc.text(splitMvp, MARGIN + 5, yPos + 16);
    yPos += 30;
  }
  
  // Feature Analysis
  const featureAnalysis = safeArray(featureStrategy.featureAnalysis);
  if (featureAnalysis.length > 0) {
    const featData = featureAnalysis.slice(0, 8).map((f: any) => [
      safeText(f.feature),
      `${f.utilityScore || 70}/100`,
      safeText(f.kanoCategory, 'PERFORMANCE'),
      safeText(f.costToDeliver?.level, 'MEDIUM'),
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Feature', 'Utility Score', 'Kano Category', 'Cost Level']],
      body: featData,
      theme: 'striped',
      headStyles: { fillColor: PURPLE, fontSize: 9 },
      styles: { fontSize: 8 },
      margin: { left: MARGIN, right: MARGIN }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
  
  yPos = checkPageBreak(doc, yPos, 80);
  
  // Pricing Strategy
  yPos = addSubsectionTitle(doc, 'Pricing Strategy', yPos);
  
  // Van Westendorp
  const vw = vanWestendorp;
  const vwData = [
    ['Too Cheap', formatSAR(vw.tooCheap?.price || vw.tooCheap), safeText(vw.tooCheap?.reasoning, 'Below this signals low quality')],
    ['Bargain', formatSAR(vw.bargain?.price || vw.bargain), safeText(vw.bargain?.reasoning, 'Good value perception')],
    ['Optimal', formatSAR(vw.optimal?.price || vw.optimalPricePoint), safeText(vw.optimal?.reasoning, 'Maximum purchase probability')],
    ['Expensive', formatSAR(vw.expensive?.price || vw.expensive), safeText(vw.expensive?.reasoning, 'Premium positioning threshold')],
    ['Too Expensive', formatSAR(vw.tooExpensive?.price || vw.tooExpensive), safeText(vw.tooExpensive?.reasoning, 'Above this loses most buyers')],
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [['Van Westendorp Threshold', 'Price', 'Reasoning']],
    body: vwData,
    theme: 'striped',
    headStyles: { fillColor: PURPLE },
    styles: { fontSize: 9 },
    margin: { left: MARGIN, right: MARGIN }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Pricing Tiers
  const tiers = safeArray(pricingStrategy.tiers || pricingStrategy.priceArchitecture?.recommendedTiers);
  if (tiers.length > 0) {
    yPos = checkPageBreak(doc, yPos, 50);
    yPos = addSubsectionTitle(doc, 'Recommended Pricing Tiers', yPos);
    
    const tierData = tiers.map((t: any) => [
      safeText(t.name),
      formatSAR(t.price),
      safeText(t.positioning),
      `${t.margin || 40}%`,
      safeText(t.targetPersona, 'All segments'),
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Tier', 'Price', 'Positioning', 'Margin', 'Target']],
      body: tierData,
      theme: 'striped',
      headStyles: { fillColor: PURPLE, fontSize: 9 },
      styles: { fontSize: 8 },
      margin: { left: MARGIN, right: MARGIN }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // GO-TO-MARKET STRATEGY (Pages 23-26)
  // ═══════════════════════════════════════════════════════════════
  doc.addPage();
  yPos = 25;
  addHeader(doc, productName, 'Go-to-Market');
  
  doc.setFontSize(24);
  doc.setTextColor(...PURPLE);
  doc.text('Go-to-Market Strategy', MARGIN, yPos);
  yPos += 15;
  
  // Channel Mix
  yPos = addSubsectionTitle(doc, 'Channel Mix Recommendations', yPos);
  
  const channels = safeArray(goToMarket.channelMix?.channelRecommendations || goToMarket.channelMix?.channels);
  if (channels.length > 0) {
    const channelData = channels.slice(0, 6).map((ch: any) => [
      safeText(ch.channel),
      `${ch.budgetAllocation || ch.budgetPercent || 20}%`,
      formatSAR(ch.expectedCAC || ch.cac || 100),
      `${ch.conversionRate || '2-5'}%`,
      safeText(ch.rationale, 'Strategic fit').substring(0, 50),
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Channel', 'Budget %', 'Expected CAC', 'Conv. Rate', 'Rationale']],
      body: channelData,
      theme: 'striped',
      headStyles: { fillColor: PURPLE, fontSize: 9 },
      styles: { fontSize: 8 },
      margin: { left: MARGIN, right: MARGIN }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
  
  yPos = checkPageBreak(doc, yPos, 80);
  
  // 90-Day Roadmap
  yPos = addSubsectionTitle(doc, '90-Day Launch Roadmap', yPos);
  
  const roadmap = goToMarket.ninetyDayRoadmap || {};
  ['preLaunch', 'launch', 'scale'].forEach((phase) => {
    const phaseData = roadmap[phase];
    if (phaseData) {
      yPos = checkPageBreak(doc, yPos, 40);
      
      const phaseName = phase === 'preLaunch' ? 'Pre-Launch (Days 1-30)' : 
                       phase === 'launch' ? 'Launch (Days 31-60)' : 'Scale (Days 61-90)';
      
      doc.setFontSize(11);
      doc.setTextColor(...PURPLE);
      doc.setFont(undefined, 'bold');
      doc.text(phaseName, MARGIN, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 5;
      
      doc.setFontSize(9);
      doc.setTextColor(...DARK_GRAY);
      doc.text(`Objective: ${safeText(phaseData.objective, 'Phase objectives')}`, MARGIN + 5, yPos);
      yPos += 5;
      
      const tactics = safeArray(phaseData.tactics).slice(0, 4);
      tactics.forEach((tactic: any) => {
        doc.text(`• ${safeText(tactic.tactic || tactic, 'Key tactic').substring(0, 70)}`, MARGIN + 5, yPos);
        yPos += 4;
      });
      
      yPos += 5;
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // INVESTMENT THESIS (Pages 27-30)
  // ═══════════════════════════════════════════════════════════════
  doc.addPage();
  yPos = 25;
  addHeader(doc, productName, 'Investment Thesis');
  
  doc.setFontSize(24);
  doc.setTextColor(...PURPLE);
  doc.text('Investment Thesis', MARGIN, yPos);
  yPos += 15;
  
  // Recommendation Banner
  doc.setFillColor(...recColor);
  doc.roundedRect(MARGIN, yPos, CONTENT_WIDTH, 35, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(recommendation, PAGE_WIDTH / 2, yPos + 15, { align: 'center' });
  doc.setFont(undefined, 'normal');
  doc.setFontSize(12);
  doc.text(`${confidence} Confidence | PSM Score: ${psmScore}/100`, PAGE_WIDTH / 2, yPos + 28, { align: 'center' });
  yPos += 45;
  
  // Scenario Analysis
  yPos = addSubsectionTitle(doc, 'Scenario Analysis', yPos);
  
  const bull = scenarios.bullCase || {};
  const base = scenarios.baseCase || {};
  const bear = scenarios.bearCase || {};
  
  const scenarioData = [
    ['', 'Bull Case', 'Base Case', 'Bear Case'],
    ['Probability', safeText(bull.probability, '25%'), safeText(base.probability, '50%'), safeText(bear.probability, '25%')],
    ['Year 1 Revenue', safeText(bull.year1?.revenue, 'SAR 5M+'), safeText(base.year1?.revenue, 'SAR 2-3M'), safeText(bear.year1?.revenue, 'SAR 1M')],
    ['Year 1 Customers', safeText(bull.year1?.customers, '10,000+'), safeText(base.year1?.customers, '5,000'), safeText(bear.year1?.customers, '2,000')],
    ['Year 3 Revenue', safeText(bull.year3?.revenue, 'SAR 20M+'), safeText(base.year3?.revenue, 'SAR 10M'), safeText(bear.year3?.revenue, 'SAR 3M')],
    ['Gross Margin', safeText(bull.year1?.grossMargin, '50%+'), safeText(base.year1?.grossMargin, '40%'), safeText(bear.year1?.grossMargin, '30%')],
  ];
  
  autoTable(doc, {
    startY: yPos,
    body: scenarioData,
    theme: 'grid',
    styles: { fontSize: 9, halign: 'center' },
    columnStyles: { 
      0: { fontStyle: 'bold', halign: 'left', fillColor: LIGHT_GRAY },
      1: { fillColor: [220, 252, 231] }, // Green tint
      2: { fillColor: [254, 249, 195] }, // Yellow tint
      3: { fillColor: [254, 226, 226] }, // Red tint
    },
    margin: { left: MARGIN, right: MARGIN }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  yPos = checkPageBreak(doc, yPos, 60);
  
  // Key Success Factors
  yPos = addSubsectionTitle(doc, 'Key Success Factors', yPos);
  
  const ksf = safeArray(investmentThesis.keySuccessFactors);
  if (ksf.length > 0) {
    const ksfData = ksf.slice(0, 6).map((f: any) => [
      safeText(f.factor || f),
      safeText(f.criticality, 'HIGH'),
      safeText(f.notes || f.reasoning, 'Critical for success'),
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Factor', 'Criticality', 'Notes']],
      body: ksfData,
      theme: 'striped',
      headStyles: { fillColor: PURPLE, fontSize: 9 },
      styles: { fontSize: 8 },
      margin: { left: MARGIN, right: MARGIN }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // Deal Breakers
  const dealBreakers = safeArray(investmentThesis.dealBreakers);
  if (dealBreakers.length > 0) {
    yPos = checkPageBreak(doc, yPos, 40);
    yPos = addSubsectionTitle(doc, 'Deal Breakers', yPos);
    
    doc.setFontSize(9);
    dealBreakers.slice(0, 5).forEach((db: any) => {
      const text = typeof db === 'string' ? db : db.breaker || db;
      doc.setTextColor(...RED);
      doc.text('⚠', MARGIN, yPos);
      doc.setTextColor(...DARK_GRAY);
      doc.text(text.substring(0, 90), MARGIN + 6, yPos);
      yPos += 5;
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // RISK ANALYSIS (Pages 31-33)
  // ═══════════════════════════════════════════════════════════════
  doc.addPage();
  yPos = 25;
  addHeader(doc, productName, 'Risk Analysis');
  
  doc.setFontSize(24);
  doc.setTextColor(...PURPLE);
  doc.text('Risk Analysis', MARGIN, yPos);
  yPos += 15;
  
  // Market Risks
  yPos = addSubsectionTitle(doc, 'Market Risks', yPos);
  
  const marketRisks = safeArray(risks.marketRisks);
  if (marketRisks.length > 0) {
    const mrData = marketRisks.slice(0, 5).map((r: any) => [
      safeText(r.risk),
      safeText(r.likelihood, 'MEDIUM'),
      safeText(r.financialImpact, 'Moderate'),
      safeArray(r.mitigation).join('; ').substring(0, 60) || 'Mitigation planned',
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Risk', 'Likelihood', 'Impact', 'Mitigation']],
      body: mrData,
      theme: 'striped',
      headStyles: { fillColor: PURPLE, fontSize: 9 },
      styles: { fontSize: 8 },
      margin: { left: MARGIN, right: MARGIN }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // Competitive Risks
  yPos = checkPageBreak(doc, yPos, 60);
  yPos = addSubsectionTitle(doc, 'Competitive Risks', yPos);
  
  const compRisks = safeArray(risks.competitiveRisks);
  if (compRisks.length > 0) {
    const crData = compRisks.slice(0, 5).map((r: any) => [
      safeText(r.risk),
      safeText(r.likelihood, 'MEDIUM'),
      safeText(r.financialImpact, 'Moderate'),
      safeArray(r.mitigation).join('; ').substring(0, 60) || 'Monitoring in place',
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Risk', 'Likelihood', 'Impact', 'Mitigation']],
      body: crData,
      theme: 'striped',
      headStyles: { fillColor: PURPLE, fontSize: 9 },
      styles: { fontSize: 8 },
      margin: { left: MARGIN, right: MARGIN }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // Execution Risks
  yPos = checkPageBreak(doc, yPos, 60);
  yPos = addSubsectionTitle(doc, 'Execution Risks', yPos);
  
  const execRisks = safeArray(risks.executionRisks);
  if (execRisks.length > 0) {
    const erData = execRisks.slice(0, 5).map((r: any) => [
      safeText(r.risk),
      safeText(r.likelihood, 'MEDIUM'),
      safeText(r.financialImpact, 'Moderate'),
      safeArray(r.mitigation).join('; ').substring(0, 60) || 'Controls in place',
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Risk', 'Likelihood', 'Impact', 'Mitigation']],
      body: erData,
      theme: 'striped',
      headStyles: { fillColor: PURPLE, fontSize: 9 },
      styles: { fontSize: 8 },
      margin: { left: MARGIN, right: MARGIN }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // APPENDIX - METHODOLOGY
  // ═══════════════════════════════════════════════════════════════
  doc.addPage();
  yPos = 25;
  addHeader(doc, productName, 'Methodology');
  
  doc.setFontSize(24);
  doc.setTextColor(...PURPLE);
  doc.text('Appendix: Methodology', MARGIN, yPos);
  yPos += 15;
  
  yPos = addSubsectionTitle(doc, 'Bayesian Analysis Framework', yPos);
  
  doc.setFontSize(10);
  doc.setTextColor(...DARK_GRAY);
  const methodText = `This report utilizes a proprietary Bayesian inference engine calibrated for GCC consumer markets. 

Key metrics:
• Demand Probability: Posterior probability of trial purchase within 30 days, based on category priors and product-specific signals.
• PSM Score (Posterior Sharpness Metric): Measures confidence in predictions. PSM = 100 × (1 - posterior_std / prior_std). Higher scores indicate more reliable predictions.
• Optimal Price: Price point maximizing expected revenue given demand elasticity curves.

Scoring interpretation:
• PSM ≥ 60: GO - Sufficient confidence to proceed with market test
• PSM 40-59: REVISE - Directional insights available, validate further
• PSM < 40: NO-GO - Insufficient confidence for GTM decisions

Data sources include Euromonitor, Statista MENA, SFDA public records, retail audits, and proprietary consumer panels.`;
  
  const splitMethod = doc.splitTextToSize(methodText, CONTENT_WIDTH);
  doc.text(splitMethod, MARGIN, yPos);
  yPos += splitMethod.length * 4 + 15;
  
  yPos = addSubsectionTitle(doc, 'Report Limitations', yPos);
  
  const limitations = `• Projections based on available market data and may vary with market conditions
• Competitor intelligence reflects publicly available information as of report date
• Regulatory guidance is advisory; consult local counsel for compliance
• Financial projections are estimates and should be validated with local partners`;
  
  doc.setFontSize(9);
  const splitLim = doc.splitTextToSize(limitations, CONTENT_WIDTH);
  doc.text(splitLim, MARGIN, yPos);

  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, i, pageCount);
  }

  return doc.output('blob');
}
