
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';

type EvaluationReport = {
  timestamp: string;
  documents: string[];
  top_ranked: string;
  report_path: string;
  criteria_count: number;
  evaluation_method: string;
  custom_prompt?: string;
};

type PastReportsProps = {
  reports: EvaluationReport[];
};

const PastReports = ({ reports }: PastReportsProps) => {
  const { toast } = useToast();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5002';

  const downloadReport = async (timestamp?: string) => {
    try {
      // For download, we need to open in a new window since it's a file
      const url = timestamp 
        ? `${apiUrl}/api/download-report/${timestamp}`
        : `${apiUrl}/api/download-report`;
      
      console.log(`Opening download URL: ${url}`);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "Download failed",
        description: "There was an error downloading the report.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Past Reports</CardTitle>
        <CardDescription>
          View and download your recent document comparison reports
        </CardDescription>
      </CardHeader>
      <CardContent>
        {Array.isArray(reports) && reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map((report, index) => (
              <div key={index} className="border rounded-md p-4 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">Report {index + 1}</h3>
                    <p className="text-sm text-gray-600">
                      Created: {new Date(report.timestamp).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Documents: {Array.isArray(report.documents) ? report.documents.join(', ') : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Top ranked: <span className="font-medium">{report.top_ranked || 'N/A'}</span>
                    </p>
                    {report.evaluation_method && (
                      <p className="text-sm text-gray-600 mt-1">
                        Evaluation method: <span className="font-medium">{report.evaluation_method}</span>
                      </p>
                    )}
                    {report.criteria_count > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        Criteria used: <span className="font-medium">{report.criteria_count}</span>
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => downloadReport(report.timestamp)}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No reports available yet.</p>
            <p className="text-sm mt-2">
              Compare documents to generate reports.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PastReports;
