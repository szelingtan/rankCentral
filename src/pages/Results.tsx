import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import PastReports from '@/components/PastReports';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import apiClient, { checkBackendHealth } from '@/lib/api-client';
import { Link } from 'react-router-dom';

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

const Results = () => {
  const [pastReports, setPastReports] = useState<EvaluationReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [backendError, setBackendError] = useState<string | null>(null);
  const { toast: uiToast } = useToast();
  const apiUrl = import.meta.env.VITE_API_URL || 'https://rankcentral.onrender.com';
  
  const checkBackend = async () => {
    try {
      const health = await checkBackendHealth();
      return health.isHealthy;
    } catch (error) {
      return false;
    }
  };
  
  const fetchReports = async () => {
    setIsLoading(true);
    setBackendError(null);
    
    try {
      // Check if backend is available first
      const backendAvailable = await checkBackend();
      
      if (!backendAvailable) {
        setBackendError(`Cannot connect to backend server at ${apiUrl}. Make sure it is running.`);
        setPastReports([]);
        setIsLoading(false);
        toast.error(`Cannot connect to the backend server at ${apiUrl}.`);
        uiToast({
          title: "Backend unavailable",
          description: `Cannot connect to the backend server at ${apiUrl}.`,
          variant: "destructive",
        });
        return;
      }
      
      // If backend is available, get the reports
      console.log('Fetching report history...');
      const response = await apiClient.get('/report-history');
      console.log('Report history response:', response.data);
      
      // Make sure each report has the correct document format
      const formattedReports = Array.isArray(response.data) 
        ? response.data.map((report: any) => ({
            ...report,
            // Ensure documents array is complete
            documents: Array.isArray(report.documents) ? report.documents : [],
            // Ensure top_ranked is a string
            top_ranked: report.top_ranked || '',
            // Include report name if available
            report_name: report.report_name || ''
          }))
        : [];
      
      setPastReports(formattedReports);
      
      if (formattedReports.length === 0) {
        toast.info("You haven't generated any comparison reports yet.");
        uiToast({
          title: "No reports found",
          description: "You haven't generated any comparison reports yet.",
        });
      }
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      setPastReports([]);
      setBackendError(`Error loading reports: ${error.message || "Unknown error"}`);
      toast.error('Error loading reports from the backend.');
      uiToast({
        title: "Unable to load reports",
        description: `There was an error loading past reports. Make sure the backend server is running.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameReport = (timestamp: string, newName: string) => {
    const updatedReports = pastReports.map(report =>
      report.timestamp === timestamp
        ? { ...report, report_name: newName }
        : report
    );
    setPastReports(updatedReports);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Report History</h1>
            <div className="flex mt-2">
              <Link to="/projects" className="text-brand-primary hover:underline flex items-center gap-1">
                <span>View Projects</span>
              </Link>
            </div>
          </div>
          <Button 
            onClick={fetchReports} 
            variant="outline" 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {backendError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-6 rounded relative" role="alert">
            <strong className="font-bold">Backend connection error: </strong>
            <span className="block sm:inline">{backendError}</span>
            <p className="mt-2 font-medium">Steps to fix:</p>
            <p className="mt-1">1. Run <code className="bg-gray-200 px-1 py-0.5 rounded">./run_backend.sh</code> or <code className="bg-gray-200 px-1 py-0.5 rounded">python backend/api.py</code> in your terminal</p>
            <p className="mt-1">2. Backend URL: <code className="bg-gray-200 px-1 py-0.5 rounded">{apiUrl}</code></p>
            <p className="mt-1">3. Check terminal for any errors</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={fetchReports}
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        <div className="mt-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-md">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mb-4"></div>
              <p className="text-gray-600">Loading reports...</p>
            </div>
          ) : pastReports.length > 0 ? (
            <PastReports reports={pastReports} onRenameReport={handleRenameReport}/>
          ) : !backendError ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-lg text-gray-600">No comparison reports found</p>
              <p className="text-gray-500 mt-2">Compare some documents to generate reports</p>
            </div>
          ) : null}
        </div>
      </div>
    </Layout>
  );
};

export default Results;
