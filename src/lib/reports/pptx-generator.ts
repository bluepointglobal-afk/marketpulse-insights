import pptxgen from 'pptxgenjs';

export async function generatePPTX(data: any): Promise<Blob> {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = `${data.productName || data.product_name || 'Product'} Market Validation`;
  pptx.author = 'MarketPulse';

  const bayesianResults = data.bayesianResults || data.bayesian_results || {};
  const brandAnalysis = data.brandAnalysis || data.brand_analysis || {};
  const personas = data.personas || [];
  const investmentThesis = brandAnalysis.investment_thesis || {};

  // Slide 1: Title
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: '7B2CBF' };
  titleSlide.addText('Market Validation Report', {
    x: 0.5,
    y: 2.2,
    w: 9,
    h: 0.8,
    fontSize: 44,
    bold: true,
    color: 'FFFFFF',
    align: 'center'
  });
  titleSlide.addText(data.productName || data.product_name || 'Product', {
    x: 0.5,
    y: 3.2,
    w: 9,
    h: 0.5,
    fontSize: 28,
    color: 'FFFFFF',
    align: 'center'
  });
  titleSlide.addText(`Generated: ${new Date().toLocaleDateString()} | Powered by MarketPulse`, {
    x: 0.5,
    y: 4.5,
    w: 9,
    h: 0.3,
    fontSize: 14,
    color: 'E0E0E0',
    align: 'center'
  });

  // Slide 2: Executive Summary
  const summarySlide = pptx.addSlide();
  summarySlide.addText('Executive Summary', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.5,
    fontSize: 32,
    bold: true,
    color: '7B2CBF'
  });

  const metrics = [
    ['Metric', 'Value', 'Status'],
    ['Demand Probability', `${Math.round((bayesianResults.demandProbability || 0) * 100)}%`, bayesianResults.demandProbability > 0.6 ? '✓ Strong' : '⚠ Moderate'],
    ['PSM Score', `${bayesianResults.psmScore || 0}/100`, bayesianResults.psmScore > 70 ? '✓ High Confidence' : '⚠ Medium'],
    ['Optimal Price', `${bayesianResults.optimalPrice || 0} SAR`, '✓ Validated'],
    ['Recommendation', investmentThesis?.recommendation?.recommendation || 'PROCEED WITH CAUTION', investmentThesis?.recommendation?.confidenceLevel || 'MEDIUM']
  ];

  summarySlide.addTable(metrics, {
    x: 0.5,
    y: 1.2,
    w: 9,
    rowH: 0.5,
    fill: { color: 'F8F8FF' },
    color: '333333',
    fontSize: 14,
    border: { pt: 1, color: 'D1D5DB' },
    fontFace: 'Arial'
  });

  // Key insight box
  summarySlide.addShape('rect', {
    x: 0.5, y: 4,
    w: 9, h: 1,
    fill: { color: 'EDE9FE' },
    line: { color: '7B2CBF', pt: 2 }
  });
  summarySlide.addText('Key Insight', {
    x: 0.7, y: 4.1,
    w: 8.6, h: 0.3,
    fontSize: 14, bold: true, color: '7B2CBF'
  });
  summarySlide.addText(
    investmentThesis?.recommendation?.reasoning || 
    `Strong market validation with ${Math.round((bayesianResults.demandProbability || 0) * 100)}% demand probability indicates significant opportunity.`,
    {
      x: 0.7, y: 4.5,
      w: 8.6, h: 0.5,
      fontSize: 12, color: '374151'
    }
  );

  // Slide 3-4: Personas
  if (personas.length > 0) {
    personas.slice(0, 2).forEach((persona: any, idx: number) => {
      const personaSlide = pptx.addSlide();
      personaSlide.addText(`Target Persona ${idx + 1}: ${persona.name || 'Customer Segment'}`, {
        x: 0.5, y: 0.3, w: 9, h: 0.5,
        fontSize: 28, bold: true, color: '7B2CBF'
      });
      personaSlide.addText(persona.tagline || persona.segment || '', {
        x: 0.5, y: 0.85, w: 9, h: 0.3,
        fontSize: 16, italic: true, color: '6B7280'
      });

      // Quote box
      if (persona.psychographics?.quote) {
        personaSlide.addShape('rect', {
          x: 0.5, y: 1.3, w: 9, h: 0.8,
          fill: { color: 'F3F4F6' }
        });
        personaSlide.addText(`"${persona.psychographics.quote}"`, {
          x: 0.7, y: 1.4, w: 8.6, h: 0.6,
          fontSize: 14, italic: true, color: '374151'
        });
      }

      const demographics = persona.demographics || {};
      const bayesianProfile = persona.bayesianProfile || {};

      const personaData: pptxgen.TableRow[] = [
        [{ text: 'Demographics' }, { text: 'Bayesian Profile' }],
        [{ text: `Age: ${demographics.age || 'N/A'}` }, { text: `Demand: ${bayesianProfile.demandProbability || Math.round((persona.segmentSize || persona.size || 0) * 100)}%` }],
        [{ text: `Income: ${demographics.income || 'N/A'}` }, { text: `Optimal Price: ${bayesianProfile.optimalPrice || 'N/A'} SAR` }],
        [{ text: `Location: ${demographics.location || 'N/A'}` }, { text: `LTV:CAC: ${persona.lifetimeValue?.ltvCacRatio || 'N/A'}` }],
        [{ text: `Occupation: ${demographics.occupation || 'N/A'}` }, { text: `Priority: ${persona.priority || 'N/A'}` }]
      ];

      personaSlide.addTable(personaData, {
        x: 0.5, y: 2.3, w: 9, rowH: 0.45,
        fill: { color: 'FFFFFF' },
        fontSize: 12,
        border: { pt: 1, color: 'E5E7EB' }
      });

      // Marketing Strategy
      if (persona.marketingStrategy) {
        personaSlide.addText('Marketing Strategy', {
          x: 0.5, y: 4.6, w: 9, h: 0.3,
          fontSize: 14, bold: true, color: '7B2CBF'
        });
        personaSlide.addText(persona.marketingStrategy.coreMessage || '', {
          x: 0.5, y: 5, w: 9, h: 0.4,
          fontSize: 11, color: '374151'
        });
      }
    });
  }

  // Slide 5: Competitive Landscape
  const competitors = brandAnalysis.competitors || [];
  if (competitors.length > 0) {
    const compSlide = pptx.addSlide();
    compSlide.addText('Competitive Landscape', {
      x: 0.5, y: 0.3, w: 9, h: 0.5,
      fontSize: 28, bold: true, color: '7B2CBF'
    });

    const compData: pptxgen.TableRow[] = [
      [{ text: 'Competitor' }, { text: 'Brand Score' }, { text: 'Threat Level' }, { text: 'Price Range' }]
    ];
    competitors.slice(0, 6).forEach((comp: any) => {
      compData.push([
        { text: comp.name || 'Unknown' },
        { text: String(comp.brandScores?.overall || comp.overall || 'N/A') },
        { text: comp.threatLevel || 'N/A' },
        { text: comp.priceRange || 'N/A' }
      ]);
    });

    compSlide.addTable(compData, {
      x: 0.5, y: 1, w: 9, rowH: 0.5,
      fill: { color: 'F9FAFB' },
      fontSize: 12,
      border: { pt: 1, color: 'D1D5DB' }
    });
  }

  // Slide 6: Investment Recommendation
  const investSlide = pptx.addSlide();
  const recommendation = investmentThesis?.recommendation?.recommendation || 
    (bayesianResults.psmScore > 60 ? 'PROCEED' : 'PROCEED WITH CAUTION');
  const bgColor = recommendation === 'PROCEED' ? '10B981' : 
                  recommendation === 'RECONSIDER' ? 'EF4444' : 'F59E0B';

  investSlide.background = { color: bgColor };
  investSlide.addText('Investment Recommendation', {
    x: 0.5, y: 1.8, w: 9, h: 0.5,
    fontSize: 24, color: 'FFFFFF', align: 'center'
  });
  investSlide.addText(recommendation, {
    x: 0.5, y: 2.5, w: 9, h: 1,
    fontSize: 48, bold: true, color: 'FFFFFF', align: 'center'
  });
  investSlide.addText(`${investmentThesis?.recommendation?.confidenceLevel || 'MEDIUM'} Confidence`, {
    x: 0.5, y: 3.8, w: 9, h: 0.5,
    fontSize: 20, color: 'FFFFFF', align: 'center'
  });

  // Financial Projections
  if (investmentThesis?.scenarios?.baseCase) {
    investSlide.addText(`Base Case Year 1: ${investmentThesis.scenarios.baseCase.year1?.revenue || 'N/A'} Revenue`, {
      x: 0.5, y: 4.5, w: 9, h: 0.3,
      fontSize: 14, color: 'FFFFFF', align: 'center'
    });
  }

  return new Promise((resolve) => {
    pptx.write({ outputType: 'blob' }).then((blob: Blob) => {
      resolve(blob);
    });
  });
}
