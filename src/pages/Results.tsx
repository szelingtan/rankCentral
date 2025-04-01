
import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileText, Download, Share2 } from 'lucide-react';

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

const Results = () => {
  // Sort documents by score (highest first)
  const sortedDocuments = [...mockResults.documents].sort((a, b) => b.score - a.score);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Ranking Results</h1>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ranking summary */}
          <Card className="lg:col-span-3 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>Overall Ranking</CardTitle>
              <CardDescription>Documents ranked by their overall scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedDocuments.map((doc, index) => (
                  <div key={doc.id} className="flex items-center gap-4">
                    <div className="bg-brand-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{doc.name}</span>
                        <span className="font-medium">{doc.score}%</span>
                      </div>
                      <Progress value={doc.score} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed scores */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm h-full">
              <CardHeader>
                <CardTitle>Detailed Evaluation</CardTitle>
                <CardDescription>Scores by individual criteria</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={sortedDocuments[0]?.id} className="w-full">
                  <TabsList className="grid grid-cols-3 mb-4">
                    {sortedDocuments.map((doc) => (
                      <TabsTrigger key={doc.id} value={doc.id} className="text-sm">
                        {doc.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {mockResults.criteriaScores.map((docScores) => (
                    <TabsContent key={docScores.documentId} value={docScores.documentId} className="mt-0">
                      <div className="space-y-4">
                        {docScores.scores.map((criterionScore) => (
                          <div key={criterionScore.criterionId}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">{criterionScore.name}</span>
                              <span className="text-sm">{criterionScore.score}%</span>
                            </div>
                            <Progress 
                              value={criterionScore.score} 
                              className="h-2" 
                            />
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* LLM explanation */}
          <div className="lg:col-span-1">
            <Card className="shadow-sm h-full">
              <CardHeader>
                <CardTitle>AI Insights</CardTitle>
                <CardDescription>Pairwise comparisons by AI</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="0" className="w-full">
                  <TabsList className="grid grid-cols-3 mb-4">
                    {mockResults.pairwiseComparisons.map((_, index) => (
                      <TabsTrigger key={index} value={index.toString()} className="text-xs">
                        Pair {index + 1}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {mockResults.pairwiseComparisons.map((comparison, index) => (
                    <TabsContent key={index} value={index.toString()} className="mt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium">{comparison.doc1.name}</span>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-200">
                            {comparison.winner === comparison.doc1.id ? "Winner" : ""}
                          </span>
                        </div>
                        
                        <div className="text-center text-xs text-gray-500">vs</div>
                        
                        <div className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium">{comparison.doc2.name}</span>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-200">
                            {comparison.winner === comparison.doc2.id ? "Winner" : ""}
                          </span>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t">
                          <h4 className="text-sm font-medium mb-2">AI Analysis:</h4>
                          <p className="text-sm text-gray-600">{comparison.reasoning}</p>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Results;
