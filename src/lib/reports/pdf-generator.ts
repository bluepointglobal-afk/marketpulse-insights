import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function generatePDF(data: any): Promise<Blob> {
  const doc = new jsPDF();
  let yPos = 20;

  // Title Page
  doc.setFontSize(28);
  doc.setTextColor(123, 44, 191); // Purple
  doc.text('Market Validation Report', 105, yPos + 30, { align: 'center' });
  
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text(data.productName || data.product_name || 'Product', 105, yPos + 50, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date(data.createdAt || data.created_at || new Date()).toLocaleDateString()}`, 105, yPos + 65, { align: 'center' });
  doc.text('Powered by MarketPulse Bayesian Analysis', 105, yPos + 75, { align: 'center' });

  // Executive Summary Page
  doc.addPage();
  yPos = 20;
  
  doc.setFontSize(20);
  doc.setTextColor(123, 44, 191);
  doc.text('Executive Summary', 20, yPos);
  yPos += 15;

  const bayesianResults = data.bayesianResults || data.bayesian_results || {};
  const brandAnalysis = data.brandAnalysis || data.brand_analysis || {};
  const personas = data.personas || [];
  const investmentThesis = brandAnalysis.investment_thesis || {};

  // Key Metrics Table
  const metricsData = [
    ['Demand Probability', `${Math.round((bayesianResults.demandProbability || 0) * 100)}%`],
    ['PSM Score', `${bayesianResults.psmScore || 0}/100`],
    ['Optimal Price', `${bayesianResults.optimalPrice || 0} SAR`],
    ['Confidence Level', bayesianResults.psmScore > 75 ? 'HIGH' : bayesianResults.psmScore > 50 ? 'MEDIUM' : 'LOW'],
    ['Recommendation', investmentThesis?.recommendation?.recommendation || (bayesianResults.psmScore > 60 ? 'PROCEED' : 'PROCEED WITH CAUTION')]
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: metricsData,
    theme: 'grid',
    headStyles: { fillColor: [123, 44, 191] },
    margin: { left: 20, right: 20 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Recommendation Box
  doc.setFillColor(240, 240, 250);
  doc.roundedRect(20, yPos, 170, 40, 3, 3, 'F');
  doc.setFontSize(14);
  doc.setTextColor(123, 44, 191);
  doc.text('Investment Recommendation', 25, yPos + 12);
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  const recText = investmentThesis?.recommendation?.reasoning || 
    `Based on PSM score of ${bayesianResults.psmScore || 0} and demand probability of ${Math.round((bayesianResults.demandProbability || 0) * 100)}%, this product shows strong market potential.`;
  const splitRec = doc.splitTextToSize(recText, 160);
  doc.text(splitRec, 25, yPos + 24);

  // Personas Section
  if (personas.length > 0) {
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(20);
    doc.setTextColor(123, 44, 191);
    doc.text('Customer Personas', 20, yPos);
    yPos += 15;

    personas.slice(0, 4).forEach((persona: any, idx: number) => {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 255 : 255);
      doc.roundedRect(20, yPos, 170, 55, 3, 3, 'F');
      
      doc.setFontSize(14);
      doc.setTextColor(123, 44, 191);
      doc.text(persona.name || `Persona ${idx + 1}`, 25, yPos + 10);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(persona.tagline || persona.segment || '', 25, yPos + 18);
      
      doc.setTextColor(60, 60, 60);
      const demographics = persona.demographics || {};
      doc.text(`Age: ${demographics.age || 'N/A'} | Income: ${demographics.income || 'N/A'}`, 25, yPos + 28);
      doc.text(`Location: ${demographics.location || 'N/A'}`, 25, yPos + 36);
      
      const bayesianProfile = persona.bayesianProfile || {};
      doc.text(`Demand: ${bayesianProfile.demandProbability || Math.round((persona.size || 0) * 100)}% | Optimal Price: ${bayesianProfile.optimalPrice || 'N/A'} SAR`, 25, yPos + 46);
      
      yPos += 60;
    });
  }

  // Competitive Landscape
  const competitors = brandAnalysis.competitors || [];
  if (competitors.length > 0) {
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(20);
    doc.setTextColor(123, 44, 191);
    doc.text('Competitive Landscape', 20, yPos);
    yPos += 15;

    const compData = competitors.map((comp: any) => [
      comp.name || 'Unknown',
      comp.brandScores?.overall || comp.overall || 'N/A',
      comp.threatLevel || 'N/A',
      comp.priceRange || 'N/A',
      comp.marketShare || 'N/A'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Competitor', 'Brand Score', 'Threat', 'Price Range', 'Market Share']],
      body: compData,
      theme: 'striped',
      headStyles: { fillColor: [123, 44, 191] },
      margin: { left: 20, right: 20 }
    });
  }

  // Investment Thesis
  if (investmentThesis?.scenarios) {
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(20);
    doc.setTextColor(123, 44, 191);
    doc.text('Financial Projections', 20, yPos);
    yPos += 15;

    const scenarios = investmentThesis.scenarios;
    const scenarioData = [
      ['Bull Case - Year 1', scenarios?.bullCase?.year1?.revenue || 'N/A', scenarios?.bullCase?.year1?.customers || 'N/A'],
      ['Base Case - Year 1', scenarios?.baseCase?.year1?.revenue || 'N/A', scenarios?.baseCase?.year1?.customers || 'N/A'],
      ['Bear Case - Year 1', scenarios?.bearCase?.year1?.revenue || 'N/A', scenarios?.bearCase?.year1?.customers || 'N/A'],
      ['Bull Case - Year 3', scenarios?.bullCase?.year3?.revenue || 'N/A', scenarios?.bullCase?.year3?.customers || 'N/A'],
      ['Base Case - Year 3', scenarios?.baseCase?.year3?.revenue || 'N/A', scenarios?.baseCase?.year3?.customers || 'N/A'],
      ['Bear Case - Year 3', scenarios?.bearCase?.year3?.revenue || 'N/A', scenarios?.bearCase?.year3?.customers || 'N/A']
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Scenario', 'Revenue', 'Customers']],
      body: scenarioData,
      theme: 'grid',
      headStyles: { fillColor: [123, 44, 191] },
      margin: { left: 20, right: 20 }
    });
  }

  // Risks
  const risks = brandAnalysis.risks || {};
  if (risks.marketRisks?.length > 0) {
    yPos = (doc as any).lastAutoTable?.finalY + 20 || 120;
    
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(16);
    doc.setTextColor(123, 44, 191);
    doc.text('Key Risks', 20, yPos);
    yPos += 10;

    risks.marketRisks.slice(0, 5).forEach((risk: any, idx: number) => {
      doc.setFontSize(11);
      doc.setTextColor(200, 50, 50);
      doc.text(`${idx + 1}. ${risk.risk || 'Unknown Risk'}`, 25, yPos);
      yPos += 7;
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      doc.text(`   Likelihood: ${risk.likelihood || 'N/A'} | Impact: ${risk.financialImpact || 'N/A'}`, 25, yPos);
      yPos += 10;
    });
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`MarketPulse Market Validation Report | Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
  }

  return doc.output('blob');
}
