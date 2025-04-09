
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import PastReports from '@/components/PastReports';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
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

const Results = () => {
  const [pastReports, setPastReports] = useState<EvaluationReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [backendError, setBackendError] = useState<string | null>(null);
  const { toast } = useToast();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5003';
  
  const fetchReports = async () => {
    setIsLoading(true);
    setBackendError(null);
    
    try {
      console.log('Checking backend health...');
      // Check if backend is available first
      try {
        // Use the full path with /api prefix
        const healthResponse = await apiClient.get('/api/health');
        console.log('Backend health response:', healthResponse.data);
      } catch (error) {
        // Health check failed, backend is down
        console.error('Backend health check failed:', error);
        setBackendError(`Cannot connect to backend server. Make sure it is running on the configured port.`);
        setPastReports([]);
        setIsLoading(false);
        toast({
          title: "Backend unavailable",
          description: `Cannot connect to the backend server at ${apiUrl}.`,
          variant: "destructive",
        });
        return;
      }
      
      // If health check passed, get the reports
      console.log('Fetching report history...');
      const response = await apiClient.get('/api/report-history');
      console.log('Report history response:', response.data);
      
      setPastReports(Array.isArray(response.data) ? response.data : []);
      
      if (response.data.length === 0) {
        toast({
          title: "No reports found",
          description: "You haven't generated any comparison reports yet.",
        });
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setPastReports([]);
      setBackendError('Error loading reports from backend.');
      toast({
        title: "Unable to load reports",
        description: `There was an error loading past reports. Make sure the backend server is running.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Report History</h1>
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
            <span className="block mt-2">Make sure the backend server is running.</span>
            <span className="block mt-1">Backend URL: {apiUrl}</span>
            <span className="block mt-1">Try running: <code>./run_backend.sh 5003</code></span>
          </div>
        )}

        <div className="mt-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-md">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mb-4"></div>
              <p className="text-gray-600">Loading reports...</p>
            </div>
          ) : pastReports.length > 0 ? (
            <PastReports reports={pastReports} />
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
