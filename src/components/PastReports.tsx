
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, DownloadCloud, Calendar, Edit, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { updateReportName } from '@/lib/evaluations';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import ReportVisualization from './ReportVisualization';

type Report = {
  timestamp: string;
  documents: string[];
  top_ranked: string;
  criteria_count: number;
  evaluation_method: string;
  custom_prompt?: string;
  report_name?: string;
  report_path?: string;
};

type PastReportsProps = {
  reports: Report[];
  onRenameReport: (timestamp: string, newName: string) => void;
};

const PastReports = ({ reports, onRenameReport }: PastReportsProps) => {
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState<string>('');
  
  const toggleExpand = (timestamp: string) => {
    if (expandedReport === timestamp) {
      setExpandedReport(null);
    } else {
      setExpandedReport(timestamp);
    }
  };
  
  const startEditing = (timestamp: string, currentName: string) => {
    setEditingName(timestamp);
    setNewName(currentName || '');
  };
  
  const saveReportName = async (timestamp: string) => {
    try {
      const result = await updateReportName(timestamp, newName);
      
      if (result.success) {
        onRenameReport(timestamp, newName);
        toast.success("Report name updated successfully");
      } else {
        toast.error(result.message || "Failed to update report name");
      }
    } catch (error) {
      toast.error("An error occurred while updating the report name");
    }
    
    setEditingName(null);
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return dayjs(timestamp).format('MMM D, YYYY h:mm A');
    } catch (e) {
      return timestamp;
    }
  };

  return (
    <div className="space-y-6">
      {reports.map((report) => (
        <Card key={report.timestamp} className="overflow-hidden">
          <CardHeader className="bg-gray-50 pb-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-primary" />
                {editingName === report.timestamp ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Enter report name"
                      className="text-base font-medium h-8 w-56"
                      autoFocus
                    />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => saveReportName(report.timestamp)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <CardTitle className="flex items-center gap-2">
                    {report.report_name || 'Comparison Report'}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 ml-1" 
                      onClick={() => startEditing(
                        report.timestamp, 
                        report.report_name || 'Comparison Report'
                      )}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </CardTitle>
                )}
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                {formatTimestamp(report.timestamp)}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Documents</h3>
                  <p className="mt-1">{report.documents.length} document{report.documents.length !== 1 ? 's' : ''}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Top Ranked</h3>
                  <p className="mt-1">{report.top_ranked ? report.top_ranked.split('/').pop() : 'Not available'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Evaluation Method</h3>
                  <p className="mt-1 capitalize">{report.evaluation_method || 'Standard'}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => toggleExpand(report.timestamp)}
                >
                  {expandedReport === report.timestamp ? 'Hide Details' : 'Show Details'}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1 text-brand-primary border-brand-primary"
                  asChild
                >
                  <a href={`${import.meta.env.VITE_API_URL || 'https://rankcentral.onrender.com'}/download-report/${report.timestamp}`} target="_blank" rel="noopener noreferrer">
                    <DownloadCloud className="h-4 w-4 mr-1" />
                    Download Report
                  </a>
                </Button>
              </div>
              
              {expandedReport === report.timestamp && (
                <ReportVisualization 
                  timestamp={report.timestamp}
                  reportName={report.report_name}
                  documents={report.documents}
                />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PastReports;
