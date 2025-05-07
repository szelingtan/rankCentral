
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import apiClient from '@/lib/api-client';

type EvaluationReport = {
  timestamp: string;
  documents: string[];
  top_ranked: string;
  report_path: string;
  criteria_count: number;
  evaluation_method: string;
  custom_prompt?: string;
  report_name?: string;
};

dayjs.extend(utc);
dayjs.extend(timezone);

type PastReportsProps = {
  reports: EvaluationReport[];
  onRenameReport: (timestamp: string, newName: string) => void; 
};

const PastReports = ({ reports, onRenameReport }: PastReportsProps) => {
  const { toast: uiToast } = useToast();
  const apiUrl = import.meta.env.VITE_API_URL || 'https://rankcentral.onrender.com';
  const [editingReport, setEditingReport] = useState<EvaluationReport | null>(null);
  const [newReportName, setNewReportName] = useState('');
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  const downloadReport = async (timestamp?: string) => {
    try {
      // For download, we need to open in a new window since it's a file
      const url = timestamp 
        ? `${apiUrl}/api/download-report/${timestamp}`
        : `${apiUrl}/api/download-report`;
      
      console.log(`Opening download URL: ${url}`);
      window.open(url, '_blank');
      
      toast.info('Download started. Check your downloads folder.');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Download failed.');
      uiToast({
        title: "Download failed",
        description: "There was an error downloading the report.",
        variant: "destructive",
      });
    }
  };

  const openRenameDialog = (report: EvaluationReport) => {
    setEditingReport(report);
    setNewReportName(report.report_name || '');
    setRenameDialogOpen(true);
  };

  const handleRenameReport = async () => {
    if (!editingReport || !newReportName.trim()) {
      return;
    }

    try {
      setIsRenaming(true);

      // Validate payload
      const data = {
        timestamp: editingReport.timestamp,
        newName: newReportName.trim()
      };

      // Call the API to rename the report
      const response = await apiClient.post('/api/update-report-name', data);

      if (response.data && response.data.success) {
        toast.success('Report renamed successfully.');
        
        // Close the dialog
        setRenameDialogOpen(false);
        onRenameReport(editingReport.timestamp, newReportName.trim());
      } else {
        throw new Error(response.data?.message || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Error renaming report:', error);
      toast.error(`Failed to rename report: ${error.message || 'Unknown error'}`);
      uiToast({
        title: "Rename failed",
        description: error.message || "There was an error renaming the report.",
        variant: "destructive",
      });
    } finally {
      setIsRenaming(false);
    }
  };

  // Helper function to get actual filename without path and extension
  const extractFileName = (fullPath: string): string => {
    // Check if the string looks like a filename
    if (typeof fullPath !== 'string') return 'Unknown';
    
    // Remove any directory path if present
    const fileName = fullPath.split('/').pop() || fullPath;
    
    return fileName;
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
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">
                        {report.report_name || `Report ${index + 1}`}
                      </h3>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openRenameDialog(report)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">
                      Created: {dayjs.utc(report.timestamp).tz('Asia/Singapore').format('DD MMM YYYY, hh:mm A')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Documents: {Array.isArray(report.documents) && report.documents.length > 0 
                        ? report.documents.map(doc => extractFileName(doc)).join(', ') 
                        : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Top ranked: <span className="font-medium">{extractFileName(report.top_ranked) || 'N/A'}</span>
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

      {/* Rename Report Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Report</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={newReportName}
              onChange={(e) => setNewReportName(e.target.value)}
              placeholder="Enter a new name for this report"
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRenameReport} disabled={isRenaming}>
              {isRenaming ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PastReports;
