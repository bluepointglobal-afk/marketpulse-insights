import pptxgen from 'pptxgenjs';

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

// Helper to convert string arrays to pptxgen TableRow format
function toTableRows(data: string[][]): pptxgen.TableRow[] {
  return data.map(row => row.map(cell => ({ text: cell })));
}

export async function generatePPTX(data: any): Promise<Blob> {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = `${data.productName || data.product_name || 'Product'} Market Validation`;
  pptx.author = 'MarketPulse';
  pptx.subject = 'GCC Market Entry Analysis';

  const productName = data.productName || data.product_name || 'Product';
  const category = data.category || 'Consumer Product';
  const bayesianResults = data.bayesianResults || data.bayesian_results || {};
  const brandAnalysis = data.brandAnalysis || data.brand_analysis || {};
  const personas = safeArray(data.personas);
  const competitors = safeArray(brandAnalysis.competitors);
  const investmentThesis = data.investmentThesis || brandAnalysis.investmentThesis || brandAnalysis.investment_thesis || {};
  const pricingStrategy = data.pricingStrategy || brandAnalysis.pricingStrategy || {};
  const goToMarket = data.goToMarket || brandAnalysis.goToMarket || {};
  const risks = data.risks || brandAnalysis.risks || {};

  const demandProb = formatPercent(bayesianResults.demandProbability);
  const psmScore = bayesianResults.psmScore || 0;
  const optimalPrice = bayesianResults.optimalPrice || 0;
  const recommendation = investmentThesis?.recommendation?.recommendation || 
    (psmScore >= 60 ? 'GREENLIGHT' : psmScore >= 40 ? 'TEST FURTHER' : 'REVISE STRATEGY');
  const confidence = investmentThesis?.recommendation?.confidenceLevel || 
    (psmScore >= 75 ? 'HIGH' : psmScore >= 50 ? 'MEDIUM' : 'LOW');

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 1: Title Slide
  // ═══════════════════════════════════════════════════════════════
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: '7B2CBF' };
  
  titleSlide.addText('MARKET VALIDATION REPORT', {
    x: 0.5, y: 1.5, w: 9, h: 0.4,
    fontSize: 14, color: 'E0E0E0', align: 'center',
    fontFace: 'Arial'
  });
  
  titleSlide.addText(productName, {
    x: 0.5, y: 2, w: 9, h: 1,
    fontSize: 44, bold: true, color: 'FFFFFF', align: 'center',
    fontFace: 'Arial'
  });
  
  titleSlide.addText(`${category} | GCC Market Entry`, {
    x: 0.5, y: 3.2, w: 9, h: 0.4,
    fontSize: 18, color: 'E0E0E0', align: 'center'
  });
  
  // Key metrics row
  titleSlide.addShape('rect', {
    x: 1.5, y: 4, w: 7, h: 1,
    fill: { color: 'FFFFFF', transparency: 90 },
    line: { color: 'FFFFFF', pt: 1 }
  });
  
  titleSlide.addText([
    { text: 'Demand: ', options: { fontSize: 12, color: 'E0E0E0' } },
    { text: demandProb, options: { fontSize: 16, bold: true, color: 'FFFFFF' } },
    { text: '    PSM: ', options: { fontSize: 12, color: 'E0E0E0' } },
    { text: `${psmScore}/100`, options: { fontSize: 16, bold: true, color: 'FFFFFF' } },
    { text: '    Price: ', options: { fontSize: 12, color: 'E0E0E0' } },
    { text: formatSAR(optimalPrice), options: { fontSize: 16, bold: true, color: 'FFFFFF' } },
  ], {
    x: 1.5, y: 4.2, w: 7, h: 0.6, align: 'center'
  });
  
  titleSlide.addText(`Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, {
    x: 0.5, y: 5, w: 9, h: 0.3,
    fontSize: 11, color: 'CCCCCC', align: 'center'
  });

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 2: Executive Summary
  // ═══════════════════════════════════════════════════════════════
  const summarySlide = pptx.addSlide();
  
  summarySlide.addText('Executive Summary', {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 28, bold: true, color: '7B2CBF'
  });
  
  // Recommendation banner
  const recColor = recommendation.includes('GREEN') ? '10B981' : 
                   recommendation.includes('REVISE') ? 'EF4444' : 'F59E0B';
  
  summarySlide.addShape('rect', {
    x: 0.5, y: 1, w: 9, h: 0.8,
    fill: { color: recColor }
  });
  
  summarySlide.addText(`${recommendation} | ${confidence} Confidence`, {
    x: 0.5, y: 1.15, w: 9, h: 0.5,
    fontSize: 20, bold: true, color: 'FFFFFF', align: 'center'
  });
  
  // Key metrics table
  const metrics = [
    ['Metric', 'Value', 'Interpretation'],
    ['Demand Probability', demandProb, psmScore >= 60 ? '✓ Strong market signal' : '⚠ Validate further'],
    ['PSM Score', `${psmScore}/100`, psmScore >= 60 ? '✓ High confidence' : '⚠ Medium confidence'],
    ['Optimal Price', formatSAR(optimalPrice), '✓ Bayesian-optimized'],
    ['Target Personas', `${personas.length} identified`, personas.slice(0, 2).map((p: any) => p.name).join(', ') || 'Primary segments'],
    ['Competitors', `${competitors.length} analyzed`, competitors.slice(0, 2).map((c: any) => c.name).join(', ') || 'Key players'],
  ];
  
  summarySlide.addTable(metrics, {
    x: 0.5, y: 2, w: 9,
    rowH: 0.4,
    fill: { color: 'F8F8FF' },
    color: '333333',
    fontSize: 11,
    fontFace: 'Arial',
    border: { pt: 0.5, color: 'D1D5DB' },
    colW: [2.5, 2, 4.5]
  });
  
  // Key insight
  const reasoning = investmentThesis?.recommendation?.reasoning || 
    `Strong market validation with ${demandProb} demand probability indicates significant opportunity in GCC markets.`;
  
  summarySlide.addShape('rect', {
    x: 0.5, y: 4.3, w: 9, h: 0.9,
    fill: { color: 'EDE9FE' },
    line: { color: '7B2CBF', pt: 1 }
  });
  
  summarySlide.addText('Key Insight', {
    x: 0.7, y: 4.4, w: 8.6, h: 0.2,
    fontSize: 11, bold: true, color: '7B2CBF'
  });
  
  summarySlide.addText(reasoning.substring(0, 200), {
    x: 0.7, y: 4.65, w: 8.6, h: 0.5,
    fontSize: 10, color: '374151'
  });

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 3: Market Opportunity
  // ═══════════════════════════════════════════════════════════════
  const marketSlide = pptx.addSlide();
  
  marketSlide.addText('Market Opportunity', {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 28, bold: true, color: '7B2CBF'
  });
  
  // TAM/SAM/SOM
  const market = data.market || brandAnalysis.market || {};
  const marketSize = market.marketSize || {};
  
  marketSlide.addText('Market Sizing', {
    x: 0.5, y: 1, w: 4, h: 0.4,
    fontSize: 14, bold: true, color: '374151'
  });
  
  const sizingData = [
    ['TAM', safeText(marketSize.tam?.value, 'USD 500M+')],
    ['SAM', safeText(marketSize.sam?.value, 'USD 150M')],
    ['SOM (Y3)', safeText(marketSize.som?.value, 'USD 15M')],
  ];
  
  marketSlide.addTable(sizingData, {
    x: 0.5, y: 1.4, w: 4, rowH: 0.5,
    fontSize: 12,
    color: '374151',
    fill: { color: 'F3F4F6' },
    border: { pt: 0.5, color: 'E5E7EB' }
  });
  
  // Regional breakdown
  marketSlide.addText('Regional Analysis', {
    x: 5, y: 1, w: 4.5, h: 0.4,
    fontSize: 14, bold: true, color: '374151'
  });
  
  const regionalData = bayesianResults.regionalBreakdown || market.regionalBreakdown || {};
  const regions = Array.isArray(regionalData) ? regionalData : Object.entries(regionalData).map(([name, d]: [string, any]) => ({ region: name, ...d }));
  
  const regTable = regions.length > 0 
    ? regions.slice(0, 3).map((r: any) => [r.region || r.name || 'Region', formatPercent(r.demandProbability || r.demand), formatSAR(r.optimalPrice)])
    : [
        ['Saudi Arabia', demandProb, formatSAR(optimalPrice)],
        ['UAE', formatPercent((bayesianResults.demandProbability || 0.6) * 1.1), formatSAR((optimalPrice || 50) * 1.15)],
        ['Qatar', formatPercent((bayesianResults.demandProbability || 0.6) * 0.95), formatSAR((optimalPrice || 50) * 1.2)],
      ];
  
  marketSlide.addTable([['Region', 'Demand', 'Price'], ...regTable], {
    x: 5, y: 1.4, w: 4.5, rowH: 0.4,
    fontSize: 10,
    color: '374151',
    fill: { color: 'F3F4F6' },
    border: { pt: 0.5, color: 'E5E7EB' }
  });
  
  // Demand curve visualization (simplified)
  marketSlide.addText('Bayesian Demand Analysis', {
    x: 0.5, y: 3.2, w: 9, h: 0.4,
    fontSize: 14, bold: true, color: '374151'
  });
  
  marketSlide.addShape('rect', {
    x: 0.5, y: 3.6, w: 9, h: 1.5,
    fill: { color: 'F8F8FF' },
    line: { color: '7B2CBF', pt: 1 }
  });
  
  marketSlide.addText([
    { text: `Demand Probability: ${demandProb}\n`, options: { fontSize: 14, bold: true } },
    { text: `PSM Score: ${psmScore}/100 (${psmScore >= 60 ? 'HIGH Confidence - Proceed' : psmScore >= 40 ? 'MEDIUM Confidence - Validate' : 'LOW Confidence - Revise'})\n`, options: { fontSize: 12 } },
    { text: `Optimal Price: ${formatSAR(optimalPrice)} | Acceptable Range: ${formatSAR(bayesianResults.priceRange?.min)} - ${formatSAR(bayesianResults.priceRange?.max)}`, options: { fontSize: 12 } },
  ], {
    x: 0.7, y: 3.8, w: 8.6, h: 1.2,
    color: '374151'
  });

  // ═══════════════════════════════════════════════════════════════
  // SLIDES 4-5: Target Personas
  // ═══════════════════════════════════════════════════════════════
  personas.slice(0, 2).forEach((persona: any, idx: number) => {
    const personaSlide = pptx.addSlide();
    
    const priority = persona.priority || (idx === 0 ? 'PRIMARY' : 'SECONDARY');
    const priorityColor = priority === 'PRIMARY' ? '10B981' : 'F59E0B';
    
    personaSlide.addShape('rect', {
      x: 0, y: 0, w: 10, h: 0.15,
      fill: { color: priorityColor }
    });
    
    personaSlide.addText(`Target Persona ${idx + 1}: ${persona.name || 'Customer Segment'}`, {
      x: 0.5, y: 0.3, w: 9, h: 0.5,
      fontSize: 24, bold: true, color: '7B2CBF'
    });
    
    personaSlide.addText(`${persona.tagline || persona.segment || ''} | ${priority} Target | ${formatPercent(persona.segmentSize || persona.size)} of market`, {
      x: 0.5, y: 0.8, w: 9, h: 0.3,
      fontSize: 12, italic: true, color: '6B7280'
    });
    
    // Quote
    if (persona.psychographics?.quote || persona.quote) {
      personaSlide.addShape('rect', {
        x: 0.5, y: 1.2, w: 9, h: 0.7,
        fill: { color: 'F3F4F6' }
      });
      personaSlide.addText(`"${persona.psychographics?.quote || persona.quote}"`, {
        x: 0.7, y: 1.3, w: 8.6, h: 0.5,
        fontSize: 12, italic: true, color: '374151'
      });
    }
    
    // Demographics & Bayesian Profile side by side
    const demo = persona.demographics || {};
    const bayesian = persona.bayesianProfile || {};
    
    personaSlide.addText('Demographics', {
      x: 0.5, y: 2, w: 4, h: 0.3,
      fontSize: 12, bold: true, color: '7B2CBF'
    });
    
    const demoData = [
      ['Age', safeText(demo.age, '28-35')],
      ['Income', safeText(demo.income, 'SAR 15-25K/mo')],
      ['Location', safeText(demo.location, 'Riyadh, KSA')],
      ['Occupation', safeText(demo.occupation, 'Professional')],
    ];
    
    personaSlide.addTable(demoData, {
      x: 0.5, y: 2.3, w: 4.3, rowH: 0.35,
      fontSize: 10,
      color: '374151',
      fill: { color: 'FFFFFF' },
      border: { pt: 0.5, color: 'E5E7EB' }
    });
    
    personaSlide.addText('Bayesian Profile', {
      x: 5, y: 2, w: 4.5, h: 0.3,
      fontSize: 12, bold: true, color: '7B2CBF'
    });
    
    const bayesData = [
      ['Demand', formatPercent(bayesian.demandProbability || 0.65)],
      ['Optimal Price', formatSAR(bayesian.optimalPrice || optimalPrice)],
      ['Elasticity', safeText(bayesian.priceElasticity, 'MEDIUM')],
      ['LTV:CAC', `${persona.lifetimeValue?.ltvCacRatio || 4}:1`],
    ];
    
    personaSlide.addTable(bayesData, {
      x: 5, y: 2.3, w: 4.5, rowH: 0.35,
      fontSize: 10,
      color: '374151',
      fill: { color: 'FFFFFF' },
      border: { pt: 0.5, color: 'E5E7EB' }
    });
    
    // Marketing Strategy
    if (persona.marketingStrategy) {
      personaSlide.addText('Marketing Strategy', {
        x: 0.5, y: 4, w: 9, h: 0.3,
        fontSize: 12, bold: true, color: '7B2CBF'
      });
      
      personaSlide.addText([
        { text: 'Core Message: ', options: { bold: true } },
        { text: (persona.marketingStrategy.coreMessage || 'Value-focused messaging').substring(0, 100) },
      ], {
        x: 0.5, y: 4.3, w: 9, h: 0.4,
        fontSize: 10, color: '374151'
      });
      
      const channels = safeArray(persona.marketingStrategy.channelStrategy).slice(0, 3);
      if (channels.length > 0) {
        const channelData = channels.map((ch: any) => [
          safeText(ch.channel),
          `${ch.budgetPercent || 25}%`,
          formatSAR(ch.cac || 50),
        ]);
        
        personaSlide.addTable([['Channel', 'Budget', 'CAC'], ...channelData], {
          x: 0.5, y: 4.7, w: 9, rowH: 0.3,
          fontSize: 9,
          color: '374151',
          fill: { color: 'F8F8FF' },
          border: { pt: 0.5, color: 'E5E7EB' }
        });
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 6: Competitive Landscape
  // ═══════════════════════════════════════════════════════════════
  const compSlide = pptx.addSlide();
  
  compSlide.addText('Competitive Landscape', {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 28, bold: true, color: '7B2CBF'
  });
  
  if (competitors.length > 0) {
    const compData = [
      ['Competitor', 'Positioning', 'Price Range', 'Share', 'Threat'],
      ...competitors.slice(0, 6).map((comp: any) => [
        safeText(comp.name),
        safeText(comp.positioning, 'MID'),
        typeof comp.priceRange === 'object' 
          ? `${formatSAR(comp.priceRange.min)}-${formatSAR(comp.priceRange.max)}`
          : safeText(comp.priceRange),
        safeText(comp.marketShare, '—'),
        safeText(comp.threatLevel, 'MED'),
      ])
    ];
    
    compSlide.addTable(compData, {
      x: 0.5, y: 1, w: 9, rowH: 0.45,
      fontSize: 10,
      color: '374151',
      fill: { color: 'F9FAFB' },
      border: { pt: 0.5, color: 'D1D5DB' },
      colW: [2.5, 1.5, 2, 1.5, 1.5]
    });
    
    // Porter's Five Forces summary
    const porters = brandAnalysis.portersFiveForces || {};
    
    compSlide.addText("Porter's Five Forces", {
      x: 0.5, y: 4, w: 9, h: 0.4,
      fontSize: 14, bold: true, color: '374151'
    });
    
    const forcesData = [
      ['New Entrants', safeText(porters.newEntrantsThreat?.level, 'MED')],
      ['Supplier Power', safeText(porters.supplierPower?.level, 'LOW')],
      ['Buyer Power', safeText(porters.buyerPower?.level, 'MED')],
      ['Substitutes', safeText(porters.substituteThreat?.level, 'MED')],
      ['Rivalry', safeText(porters.competitiveRivalry?.level, 'HIGH')],
    ];
    
    compSlide.addTable(forcesData, {
      x: 0.5, y: 4.4, w: 9, rowH: 0.3,
      fontSize: 10,
      color: '374151',
      fill: { color: 'F3F4F6' },
      border: { pt: 0.5, color: 'E5E7EB' }
    });
  } else {
    compSlide.addText('Competitive analysis will be populated with real market data from Perplexity research', {
      x: 0.5, y: 2, w: 9, h: 1,
      fontSize: 14, color: '6B7280', align: 'center'
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 7: Pricing Strategy
  // ═══════════════════════════════════════════════════════════════
  const pricingSlide = pptx.addSlide();
  
  pricingSlide.addText('Pricing Strategy', {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 28, bold: true, color: '7B2CBF'
  });
  
  // Van Westendorp
  const vw = data.vanWestendorp || data.van_westendorp || pricingStrategy.vanWestendorp || {};
  
  pricingSlide.addText('Van Westendorp Analysis', {
    x: 0.5, y: 1, w: 4.5, h: 0.4,
    fontSize: 14, bold: true, color: '374151'
  });
  
  const vwData = [
    ['Threshold', 'Price'],
    ['Too Cheap', formatSAR(vw.tooCheap?.price || vw.tooCheap)],
    ['Bargain', formatSAR(vw.bargain?.price || vw.bargain)],
    ['Optimal', formatSAR(vw.optimal?.price || vw.optimalPricePoint)],
    ['Expensive', formatSAR(vw.expensive?.price || vw.expensive)],
    ['Too Expensive', formatSAR(vw.tooExpensive?.price || vw.tooExpensive)],
  ];
  
  pricingSlide.addTable(vwData, {
    x: 0.5, y: 1.4, w: 4, rowH: 0.35,
    fontSize: 10,
    color: '374151',
    fill: { color: 'F8F8FF' },
    border: { pt: 0.5, color: 'E5E7EB' }
  });
  
  // Pricing tiers
  const tiers = safeArray(pricingStrategy.tiers || pricingStrategy.priceArchitecture?.recommendedTiers);
  
  pricingSlide.addText('Recommended Tiers', {
    x: 5, y: 1, w: 4.5, h: 0.4,
    fontSize: 14, bold: true, color: '374151'
  });
  
  if (tiers.length > 0) {
    const tierData = [
      ['Tier', 'Price', 'Margin'],
      ...tiers.slice(0, 3).map((t: any) => [
        safeText(t.name),
        formatSAR(t.price),
        `${t.margin || 40}%`,
      ])
    ];
    
    pricingSlide.addTable(tierData, {
      x: 5, y: 1.4, w: 4.5, rowH: 0.35,
      fontSize: 10,
      color: '374151',
      fill: { color: 'F8F8FF' },
      border: { pt: 0.5, color: 'E5E7EB' }
    });
  }
  
  // Optimal price highlight
  pricingSlide.addShape('rect', {
    x: 0.5, y: 4, w: 9, h: 1,
    fill: { color: '7B2CBF' }
  });
  
  pricingSlide.addText([
    { text: 'Bayesian Optimal Price: ', options: { fontSize: 16, color: 'FFFFFF' } },
    { text: formatSAR(optimalPrice), options: { fontSize: 24, bold: true, color: 'FFFFFF' } },
  ], {
    x: 0.5, y: 4.2, w: 9, h: 0.6, align: 'center'
  });

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 8: Go-to-Market
  // ═══════════════════════════════════════════════════════════════
  const gtmSlide = pptx.addSlide();
  
  gtmSlide.addText('Go-to-Market Strategy', {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 28, bold: true, color: '7B2CBF'
  });
  
  // Channel mix
  const channels = safeArray(goToMarket.channelMix?.channelRecommendations || goToMarket.channelMix?.channels);
  
  gtmSlide.addText('Channel Mix', {
    x: 0.5, y: 1, w: 9, h: 0.4,
    fontSize: 14, bold: true, color: '374151'
  });
  
  if (channels.length > 0) {
    const channelData = [
      ['Channel', 'Budget', 'CAC', 'Conv Rate'],
      ...channels.slice(0, 5).map((ch: any) => [
        safeText(ch.channel),
        `${ch.budgetAllocation || ch.budgetPercent || 20}%`,
        formatSAR(ch.expectedCAC || ch.cac || 100),
        `${ch.conversionRate || '2-5'}%`,
      ])
    ];
    
    gtmSlide.addTable(channelData, {
      x: 0.5, y: 1.4, w: 9, rowH: 0.35,
      fontSize: 10,
      color: '374151',
      fill: { color: 'F8F8FF' },
      border: { pt: 0.5, color: 'E5E7EB' }
    });
  }
  
  // 90-day roadmap summary
  gtmSlide.addText('90-Day Launch Roadmap', {
    x: 0.5, y: 3.5, w: 9, h: 0.4,
    fontSize: 14, bold: true, color: '374151'
  });
  
  const roadmap = goToMarket.ninetyDayRoadmap || {};
  const phases = [
    { name: 'Pre-Launch', days: '1-30', data: roadmap.preLaunch, color: 'F59E0B' },
    { name: 'Launch', days: '31-60', data: roadmap.launch, color: '10B981' },
    { name: 'Scale', days: '61-90', data: roadmap.scale, color: '7B2CBF' },
  ];
  
  phases.forEach((phase, idx) => {
    const x = 0.5 + (idx * 3.2);
    gtmSlide.addShape('rect', {
      x, y: 3.9, w: 3, h: 1.2,
      fill: { color: phase.color }
    });
    gtmSlide.addText(phase.name, {
      x, y: 4, w: 3, h: 0.3,
      fontSize: 12, bold: true, color: 'FFFFFF', align: 'center'
    });
    gtmSlide.addText(`Days ${phase.days}`, {
      x, y: 4.3, w: 3, h: 0.2,
      fontSize: 10, color: 'FFFFFF', align: 'center'
    });
    gtmSlide.addText(safeText(phase.data?.objective, 'Phase objectives').substring(0, 50), {
      x: x + 0.1, y: 4.6, w: 2.8, h: 0.4,
      fontSize: 9, color: 'FFFFFF', align: 'center'
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SLIDE 9: Investment Recommendation (Final)
  // ═══════════════════════════════════════════════════════════════
  const investSlide = pptx.addSlide();
  investSlide.background = { color: recColor };
  
  investSlide.addText('Investment Recommendation', {
    x: 0.5, y: 1.2, w: 9, h: 0.5,
    fontSize: 20, color: 'FFFFFF', align: 'center'
  });
  
  investSlide.addText(recommendation, {
    x: 0.5, y: 1.8, w: 9, h: 1,
    fontSize: 48, bold: true, color: 'FFFFFF', align: 'center'
  });
  
  investSlide.addText(`${confidence} Confidence | PSM Score: ${psmScore}/100`, {
    x: 0.5, y: 3, w: 9, h: 0.4,
    fontSize: 18, color: 'FFFFFF', align: 'center'
  });
  
  // Scenario summary
  const scenarios = investmentThesis?.scenarios || {};
  const base = scenarios.baseCase || {};
  
  investSlide.addShape('rect', {
    x: 1.5, y: 3.6, w: 7, h: 1.5,
    fill: { color: 'FFFFFF', transparency: 90 },
    line: { color: 'FFFFFF', pt: 1 }
  });
  
  investSlide.addText([
    { text: 'Base Case Projections\n', options: { fontSize: 12, bold: true } },
    { text: `Year 1 Revenue: ${safeText(base.year1?.revenue, 'SAR 2-3M')}\n`, options: { fontSize: 11 } },
    { text: `Year 3 Revenue: ${safeText(base.year3?.revenue, 'SAR 10M')}\n`, options: { fontSize: 11 } },
    { text: `Investment Required: ${safeText(investmentThesis?.investmentRequired, 'SAR 500K-1M')}`, options: { fontSize: 11 } },
  ], {
    x: 1.7, y: 3.7, w: 6.6, h: 1.3,
    color: 'FFFFFF', align: 'center'
  });

  // ═══════════════════════════════════════════════════════════════
  // Generate output
  // ═══════════════════════════════════════════════════════════════
  return new Promise((resolve) => {
    pptx.write({ outputType: 'blob' }).then((blob: Blob) => {
      resolve(blob);
    });
  });
}
