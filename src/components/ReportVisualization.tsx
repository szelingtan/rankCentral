
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

interface ReportVisualizationProps {
  timestamp: string;
  reportName?: string;
  documents: string[];
}

const ReportVisualization = ({ timestamp, reportName, documents }: ReportVisualizationProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const { toast } = useToast();

  const fetchReportData = async () => {
    if (hasLoadedData) return; // Don't fetch again if already loaded
    
    setIsLoading(true);
    try {
      // Fetch data directly from the backend
      const response = await apiClient.get(`/report-data/${timestamp}`);
      setCsvData(response.data);
      setHasLoadedData(true);
      
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: "Error loading report data",
        description: "Could not load the visualization data for this report.",
        variant: "destructive",
      });
      
      // Generate sample data for demonstration if API fails
      const sampleData = documents.map(doc => ({
        name: doc.split('/').pop() || doc,
        score: Math.floor(Math.random() * 100),
      }));
      setCsvData(sampleData);
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setIsLoading(true);
    try {
      // Use the existing endpoint to download the report
      window.open(`${apiClient.defaults.baseURL}/download-report/${timestamp}`, '_blank');
      
      toast({
        title: "Download started",
        description: "Your CSV export has been initiated.",
      });
    } catch (error) {
      console.error('Error downloading CSV:', error);
      toast({
        title: "Download failed",
        description: "Could not download the CSV files. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle>{reportName || "Report Visualization"}</CardTitle>
        <CardDescription>View and export report data</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="visualization" className="w-full" onValueChange={(value) => {
          if (value === "visualization" && !hasLoadedData) {
            fetchReportData();
          }
        }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="visualization">Data Visualization</TabsTrigger>
            <TabsTrigger value="export">Export CSV</TabsTrigger>
          </TabsList>
          
          <TabsContent value="visualization" className="pt-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="h-64 w-full">
                  <ChartContainer 
                    config={{
                      score: {
                        label: "Document Score",
                        color: "#0D6E9A"
                      }
                    }}
                  >
                    <BarChart data={csvData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="score" name="Score" fill="#0D6E9A" />
                    </BarChart>
                  </ChartContainer>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Data Table</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document</TableHead>
                          <TableHead className="text-right">Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvData.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{row.name}</TableCell>
                            <TableCell className="text-right">{row.score}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="export" className="pt-4">
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-md">
              <FileText size={48} className="text-brand-primary mb-4" />
              <h3 className="text-lg font-medium mb-2">Export Report Data</h3>
              <p className="text-sm text-gray-500 mb-4 text-center">
                Download all data associated with this report as CSV files. 
                The export includes document comparisons, scores, and analysis.
              </p>
              <Button 
                onClick={handleExportCSV} 
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Download size={16} />
                {isLoading ? "Preparing download..." : "Download CSV Files"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ReportVisualization;
