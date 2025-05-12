
import React from 'react';
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

interface ExportTabProps {
  isLoading: boolean;
  onExport: () => void;
}

const ExportTab: React.FC<ExportTabProps> = ({ isLoading, onExport }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-md">
      <FileText size={64} className="text-brand-primary mb-6" />
      <h2 className="text-2xl font-bold mb-4">Download Report Data</h2>
      <p className="text-gray-600 mb-8 text-center max-w-lg">
        Download all data associated with this report as CSV files (ZIP archive). The export includes document comparisons, scores, and analysis.
      </p>
      <Button 
        onClick={onExport} 
        disabled={isLoading}
        className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/90 px-6 py-5 h-auto text-base"
        size="lg"
      >
        <Download className="h-5 w-5 mr-2" />
        {isLoading ? "Preparing download..." : "Download as CSV files (ZIP)"}
      </Button>
    </div>
  );
};

export default ExportTab;
