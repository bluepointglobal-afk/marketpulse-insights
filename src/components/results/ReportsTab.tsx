import { useState } from "react";
import { TestResults } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Download, PieChart, FileSpreadsheet, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generatePDF } from "@/lib/reports/pdf-generator";
import { generatePPTX } from "@/lib/reports/pptx-generator";
import { generateExcel } from "@/lib/reports/excel-generator";

interface Props { test: TestResults; }

const ReportsTab = ({ test }: Props) => {
  const { toast } = useToast();
  const [generating, setGenerating] = useState<string | null>(null);

  const handleDownload = async (type: 'pdf' | 'pptx' | 'excel') => {
    setGenerating(type);
    try {
      let blob: Blob;
      let filename: string;
      
      switch (type) {
        case 'pdf':
          blob = await generatePDF(test);
          filename = `${test.productName}_Market_Validation_Report.pdf`;
          break;
        case 'pptx':
          blob = await generatePPTX(test);
          filename = `${test.productName}_Pitch_Deck.pptx`;
          break;
        case 'excel':
          blob = await generateExcel(test);
          filename = `${test.productName}_Financial_Model.xlsx`;
          break;
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Report Generated",
        description: `${filename} has been downloaded.`,
      });
    } catch (error) {
      console.error(`${type} generation failed:`, error);
      toast({
        title: "Generation Failed",
        description: `Failed to generate ${type.toUpperCase()} report. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setGenerating(null);
    }
  };

  const reports = [
    { 
      icon: FileText, 
      title: "Market Validation Report", 
      desc: "Comprehensive PDF with executive summary, personas, competitive analysis, and investment thesis", 
      format: "PDF",
      type: 'pdf' as const,
      pages: "35+ pages"
    },
    { 
      icon: PieChart, 
      title: "Investor Pitch Deck", 
      desc: "Presentation-ready slides with key metrics, personas, competitive landscape, and recommendations", 
      format: "PPTX",
      type: 'pptx' as const,
      pages: "6 slides"
    },
    { 
      icon: FileSpreadsheet, 
      title: "Financial Model & Data", 
      desc: "Complete data export with personas, competitors, pricing analysis, and financial projections", 
      format: "Excel",
      type: 'excel' as const,
      pages: "9 sheets"
    },
  ];

  return (
    <div className="space-y-4">
      {reports.map((report, i) => (
        <Card key={i} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl gradient-bg flex items-center justify-center">
                  <report.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{report.title}</h3>
                  <p className="text-sm text-muted-foreground max-w-md">{report.desc}</p>
                  <p className="text-xs text-muted-foreground mt-1">{report.pages}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => handleDownload(report.type)}
                disabled={generating !== null}
              >
                {generating === report.type ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {generating === report.type ? 'Generating...' : report.format}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ReportsTab;
