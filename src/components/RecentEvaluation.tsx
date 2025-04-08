
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText } from 'lucide-react';

type RecentEvaluationProps = {
  documents: Array<{id: string, name: string, score: number}>;
  criteriaScores: Array<{
    documentId: string;
    scores: Array<{criterionId: string, name: string, score: number}>
  }>;
  pairwiseComparisons: Array<{
    doc1: {id: string, name: string};
    doc2: {id: string, name: string};
    winner: string;
    reasoning: string;
  }>;
}

const RecentEvaluation = ({ documents, criteriaScores, pairwiseComparisons }: RecentEvaluationProps) => {
  // Sort documents by score (highest first)
  const sortedDocuments = [...documents].sort((a, b) => b.score - a.score);

  return (
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
              
              {criteriaScores.map((docScores) => (
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
                {pairwiseComparisons.map((_, index) => (
                  <TabsTrigger key={index} value={index.toString()} className="text-xs">
                    Pair {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {pairwiseComparisons.map((comparison, index) => (
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
  );
};

export default RecentEvaluation;
