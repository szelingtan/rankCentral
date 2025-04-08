
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RecentEvaluation from '@/components/RecentEvaluation';
import PastReports from '@/components/PastReports';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

// Mock data - in a real app, this would come from your API
const mockResults = {
  documents: [
    { id: '1', name: 'Project Proposal A', score: 87 },
    { id: '2', name: 'Project Proposal B', score: 72 },
    { id: '3', name: 'Project Proposal C', score: 94 },
  ],
  criteriaScores: [
    { 
      documentId: '1', 
      scores: [
        { criterionId: '1', name: 'Clarity', score: 85 },
        { criterionId: '2', name: 'Relevance', score: 90 },
        { criterionId: '3', name: 'Thoroughness', score: 82 },
        { criterionId: '4', name: 'Structure', score: 92 },
      ] 
    },
    { 
      documentId: '2', 
      scores: [
        { criterionId: '1', name: 'Clarity', score: 70 },
        { criterionId: '2', name: 'Relevance', score: 75 },
        { criterionId: '3', name: 'Thoroughness', score: 68 },
        { criterionId: '4', name: 'Structure', score: 76 },
      ] 
    },
    { 
      documentId: '3', 
      scores: [
        { criterionId: '1', name: 'Clarity', score: 95 },
        { criterionId: '2', name: 'Relevance', score: 92 },
        { criterionId: '3', name: 'Thoroughness', score: 96 },
        { criterionId: '4', name: 'Structure', score: 90 },
      ] 
    },
  ],
  pairwiseComparisons: [
    {
      doc1: { id: '1', name: 'Project Proposal A' },
      doc2: { id: '3', name: 'Project Proposal C' },
      winner: '3',
      reasoning: "Project Proposal C demonstrates superior clarity of objectives and a more comprehensive analysis of the market opportunity. The document is better structured with clear sections that flow logically. While Proposal A has good insights, Proposal C provides more detailed implementation strategies and addresses potential challenges more thoroughly."
    },
    {
      doc1: { id: '1', name: 'Project Proposal A' },
      doc2: { id: '2', name: 'Project Proposal B' },
      winner: '1',
      reasoning: "Project Proposal A presents a more coherent argument with better supporting evidence. The financial projections are more realistic and the timeline is more detailed. Proposal B lacks sufficient detail in the implementation plan and does not address key stakeholder concerns as effectively as Proposal A."
    },
    {
      doc1: { id: '2', name: 'Project Proposal B' },
      doc2: { id: '3', name: 'Project Proposal C' },
      winner: '3',
      reasoning: "Project Proposal C significantly outperforms Proposal B across all evaluation criteria. The market analysis is more data-driven, the value proposition is clearer, and the execution plan is more detailed with specific milestones. Proposal B's analysis lacks depth and the proposed solution doesn't address the problem statement as effectively."
    }
  ]
};

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
  const [activeTab, setActiveTab] = useState('current');
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
          <h1 className="text-3xl font-bold text-gray-800">Evaluation Results</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="current">Current Evaluation</TabsTrigger>
            <TabsTrigger value="history">Report History</TabsTrigger>
          </TabsList>

          <TabsContent value="current">
            <RecentEvaluation 
              documents={mockResults.documents}
              criteriaScores={mockResults.criteriaScores}
              pairwiseComparisons={mockResults.pairwiseComparisons}
            />
          </TabsContent>

          <TabsContent value="history">
            <PastReports reports={pastReports} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Results;
