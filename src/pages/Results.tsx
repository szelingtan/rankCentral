
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import PastReports from '@/components/PastReports';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await axios.get('/api/report-history');
        setPastReports(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching reports:', error);
        setPastReports([]);
        toast({
          title: "Unable to load reports",
          description: "There was an error loading past reports.",
          variant: "destructive",
        });
      }
    };

    fetchReports();
  }, [toast]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Report History</h1>
        </div>

        <div className="mt-4">
          <PastReports reports={pastReports} />
        </div>
      </div>
    </Layout>
  );
};

export default Results;
