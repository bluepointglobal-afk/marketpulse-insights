import { TestResults } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { FileText, Download, PieChart, FileSpreadsheet } from "lucide-react";

interface Props { test: TestResults; }

const ReportsTab = ({ test }: Props) => {
  const reports = [
    { icon: FileText, title: "Market Validation Report", desc: "35-page comprehensive PDF", format: "PDF" },
    { icon: PieChart, title: "Pitch Deck Slides", desc: "5 investor-ready slides", format: "PPTX" },
    { icon: FileSpreadsheet, title: "Financial Model", desc: "12 data sheets with projections", format: "Excel" },
  ];

  return (
    <div className="space-y-4">
      {reports.map((report, i) => (
        <div key={i} className="metric-card flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
              <report.icon className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">{report.title}</h3>
              <p className="text-sm text-muted-foreground">{report.desc}</p>
            </div>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            {report.format}
          </Button>
        </div>
      ))}
    </div>
  );
};

export default ReportsTab;
