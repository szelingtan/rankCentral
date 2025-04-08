import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { FileUp, Plus, Trash2, ArrowRight, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

type Document = {
  id: string;
  name: string;
  content: string;
};

type Criterion = {
  id: string;
  name: string;
  description: string;
  weight: number;
};

type EvaluationReport = {
  timestamp: string;
  documents: string[];
  top_ranked: string;
  report_path: string;
  criteria_count: number;
};

const defaultCriteria: Criterion[] = [
  {
    id: '1',
    name: 'Clarity',
    description: 'How clear and understandable is the document?',
    weight: 30,
  },
  {
    id: '2',
    name: 'Relevance',
    description: 'How relevant is the content to the subject matter?',
    weight: 30,
  },
  {
    id: '3',
    name: 'Thoroughness',
    description: 'How comprehensive and complete is the document?',
    weight: 20,
  },
  {
    id: '4',
    name: 'Structure',
    description: 'How well-organized is the document?',
    weight: 20,
  },
];

const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>([
    { id: '1', name: 'Document 1', content: '' },
    { id: '2', name: 'Document 2', content: '' },
  ]);
  const [useCustomCriteria, setUseCustomCriteria] = useState(false);
  const [criteria, setCriteria] = useState<Criterion[]>(defaultCriteria);
  const [activeTab, setActiveTab] = useState('documents');
  const [evaluationMethod, setEvaluationMethod] = useState('criteria');
  const [customPrompt, setCustomPrompt] = useState('');
  const [pastReports, setPastReports] = useState<EvaluationReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await axios.get('/api/report-history');
        setPastReports(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching reports:', error);
        setPastReports([]);
      }
    };

    fetchReports();
  }, []);

  const addDocument = () => {
    const newId = (documents.length + 1).toString();
    setDocuments([
      ...documents,
      { id: newId, name: `Document ${newId}`, content: '' },
    ]);
  };

  const removeDocument = (id: string) => {
    if (documents.length <= 2) {
      toast({
        title: "Cannot remove",
        description: "You need at least two documents for comparison.",
        variant: "destructive",
      });
      return;
    }
    setDocuments(documents.filter((doc) => doc.id !== id));
  };

  const updateDocument = (id: string, field: keyof Document, value: string) => {
    setDocuments(
      documents.map((doc) => (doc.id === id ? { ...doc, [field]: value } : doc))
    );
  };

  const addCriterion = () => {
    const newId = (criteria.length + 1).toString();
    setCriteria([
      ...criteria,
      { id: newId, name: '', description: '', weight: 20 },
    ]);
  };

  const removeCriterion = (id: string) => {
    if (criteria.length <= 1) {
      toast({
        title: "Cannot remove",
        description: "You need at least one criterion.",
        variant: "destructive",
      });
      return;
    }
    setCriteria(criteria.filter((c) => c.id !== id));
    normalizeWeights(criteria.filter((c) => c.id !== id));
  };

  const updateCriterion = (
    id: string,
    field: keyof Criterion,
    value: string | number
  ) => {
    setCriteria(
      criteria.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
    
    if (field === 'weight') {
      normalizeWeights(
        criteria.map((c) => (c.id === id ? { ...c, weight: value as number } : c))
      );
    }
  };

  const normalizeWeights = (updatedCriteria: Criterion[]) => {
    const totalWeight = updatedCriteria.reduce((sum, c) => sum + c.weight, 0);
    
    if (totalWeight > 0 && totalWeight !== 100) {
      const normalizedCriteria = updatedCriteria.map(c => ({
        ...c,
        weight: Math.round((c.weight / totalWeight) * 100)
      }));
      
      const calculatedTotal = normalizedCriteria.reduce((sum, c) => sum + c.weight, 0);
      if (calculatedTotal !== 100 && normalizedCriteria.length > 0) {
        const diff = 100 - calculatedTotal;
        const lastItem = normalizedCriteria[normalizedCriteria.length - 1];
        normalizedCriteria[normalizedCriteria.length - 1] = {
          ...lastItem,
          weight: lastItem.weight + diff
        };
      }
      
      setCriteria(normalizedCriteria);
    }
  };

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;
    
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files[]', file);
      });
      
      const response = await axios.post('/api/upload-pdfs', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.files) {
        toast({
          title: "Files uploaded",
          description: `Successfully uploaded ${response.data.files.length} files.`,
        });
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your files.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      uploadFiles(Array.from(files));
    }
  };

  const handleSubmit = async () => {
    const emptyDocs = documents.filter(doc => !doc.content.trim());
    if (emptyDocs.length > 0) {
      toast({
        title: "Empty documents",
        description: "Please fill in content for all documents.",
        variant: "destructive",
      });
      return;
    }

    if (evaluationMethod === 'criteria' && useCustomCriteria) {
      const invalidCriteria = criteria.filter(c => !c.name.trim());
      if (invalidCriteria.length > 0) {
        toast({
          title: "Invalid criteria",
          description: "Please provide a name for all criteria.",
          variant: "destructive",
        });
        return;
      }
    }

    if (evaluationMethod === 'prompt' && !customPrompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please provide an evaluation prompt.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    toast({
      title: "Processing documents",
      description: "Your documents are being analyzed. This may take a moment.",
    });

    try {
      const requestData = {
        compare_method: 'mergesort',
        criteria: evaluationMethod === 'criteria' 
          ? (useCustomCriteria ? criteria : defaultCriteria)
          : [],
        custom_prompt: evaluationMethod === 'prompt' ? customPrompt : '',
        evaluation_method: evaluationMethod
      };

      const response = await axios.post('/api/compare-documents', requestData);
      
      if (response.data) {
        toast({
          title: "Analysis complete",
          description: "Your comparison report is ready.",
        });
        
        const reportsResponse = await axios.get('/api/report-history');
        setPastReports(Array.isArray(reportsResponse.data) ? reportsResponse.data : []);
      }
    } catch (error) {
      console.error('Error comparing documents:', error);
      toast({
        title: "Comparison failed",
        description: "There was an error analyzing your documents.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentUpload = (docId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      updateDocument(docId, 'content', content);
      
      toast({
        title: "File uploaded",
        description: `${file.name} has been loaded.`,
      });
    };
    reader.readAsText(file);
  };

  const downloadReport = async (timestamp?: string) => {
    try {
      const url = timestamp 
        ? `/api/download-report/${timestamp}` 
        : '/api/download-report';
      
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
    <Layout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Document Comparison</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="documents">1. Documents</TabsTrigger>
            <TabsTrigger value="evaluation">2. Evaluation Method</TabsTrigger>
            <TabsTrigger value="reports">3. Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="mt-0">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-700">Upload Documents</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <input
                      type="file"
                      id="file-upload"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileUpload}
                      accept=".pdf"
                      multiple
                    />
                    <Button variant="outline" className="flex items-center gap-2">
                      <FileUp className="h-4 w-4" />
                      Upload PDF Files
                    </Button>
                  </div>
                  <Button onClick={addDocument} className="flex items-center gap-1">
                    <Plus className="h-4 w-4" />
                    Add Document
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {documents.map((doc) => (
                  <Card key={doc.id} className="shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <Input
                          value={doc.name}
                          onChange={(e) => updateDocument(doc.id, 'name', e.target.value)}
                          className="text-lg font-medium border-none focus:ring-0 p-0 h-auto"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDocument(doc.id)}
                        >
                          <Trash2 className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-3">
                        <div className="relative">
                          <input
                            type="file"
                            id={`file-${doc.id}`}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => handleDocumentUpload(doc.id, e)}
                            accept=".txt,.doc,.docx,.pdf,.md"
                          />
                          <div className="flex items-center gap-2 text-sm text-gray-500 py-2 border rounded px-3 cursor-pointer">
                            <FileUp className="h-4 w-4" />
                            Upload file (or enter text below)
                          </div>
                        </div>
                      </div>
                      <Textarea
                        placeholder="Enter document content here..."
                        value={doc.content}
                        onChange={(e) => updateDocument(doc.id, 'content', e.target.value)}
                        className="min-h-[200px] resize-y"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end mt-8">
                <Button 
                  onClick={() => setActiveTab('evaluation')}
                  className="flex items-center gap-2"
                >
                  Next: Choose Evaluation Method <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="evaluation" className="mt-0">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Evaluation Method</CardTitle>
                <CardDescription>
                  Choose how you want to evaluate the documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={evaluationMethod} 
                  onValueChange={setEvaluationMethod}
                  className="mb-6 space-y-4"
                >
                  <div className="flex items-center space-x-2 border p-4 rounded-md">
                    <RadioGroupItem value="criteria" id="criteria" />
                    <Label htmlFor="criteria" className="font-medium">
                      Criteria-based Evaluation
                    </Label>
                    <span className="text-sm text-gray-500 ml-2">
                      Evaluate documents based on structured criteria and rubrics
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 border p-4 rounded-md">
                    <RadioGroupItem value="prompt" id="prompt" />
                    <Label htmlFor="prompt" className="font-medium">
                      Prompt-based Evaluation
                    </Label>
                    <span className="text-sm text-gray-500 ml-2">
                      Evaluate documents using a custom prompt
                    </span>
                  </div>
                </RadioGroup>

                {evaluationMethod === 'criteria' ? (
                  <div>
                    <div className="flex items-center space-x-2 mb-6">
                      <Switch
                        id="custom-criteria"
                        checked={useCustomCriteria}
                        onCheckedChange={setUseCustomCriteria}
                      />
                      <Label htmlFor="custom-criteria">
                        Use custom criteria instead of default
                      </Label>
                    </div>

                    {useCustomCriteria ? (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-md font-medium">Custom Criteria</h3>
                          <Button onClick={addCriterion} variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-1" /> Add Criterion
                          </Button>
                        </div>

                        {criteria.map((criterion) => (
                          <div
                            key={criterion.id}
                            className="p-4 border rounded-md bg-gray-50"
                          >
                            <div className="flex justify-between mb-3">
                              <div className="flex-1 mr-4">
                                <Label htmlFor={`criterion-name-${criterion.id}`}>
                                  Criterion Name
                                </Label>
                                <Input
                                  id={`criterion-name-${criterion.id}`}
                                  value={criterion.name}
                                  onChange={(e) =>
                                    updateCriterion(criterion.id, 'name', e.target.value)
                                  }
                                  placeholder="e.g., Clarity, Relevance, etc."
                                  className="mt-1"
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCriterion(criterion.id)}
                                className="h-8 w-8 mt-6"
                              >
                                <Trash2 className="h-4 w-4 text-gray-500" />
                              </Button>
                            </div>

                            <div className="mb-3">
                              <Label htmlFor={`criterion-desc-${criterion.id}`}>
                                Description
                              </Label>
                              <Textarea
                                id={`criterion-desc-${criterion.id}`}
                                value={criterion.description}
                                onChange={(e) =>
                                  updateCriterion(
                                    criterion.id,
                                    'description',
                                    e.target.value
                                  )
                                }
                                placeholder="Describe what this criterion measures..."
                                className="mt-1"
                              />
                            </div>

                            <div className="mb-1">
                              <div className="flex justify-between">
                                <Label htmlFor={`criterion-weight-${criterion.id}`}>
                                  Weight
                                </Label>
                                <span className="text-sm text-gray-500">
                                  {criterion.weight}%
                                </span>
                              </div>
                              <Slider
                                id={`criterion-weight-${criterion.id}`}
                                value={[criterion.weight]}
                                min={5}
                                max={100}
                                step={5}
                                onValueChange={(value) =>
                                  updateCriterion(criterion.id, 'weight', value[0])
                                }
                                className="mt-2"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <h3 className="text-md font-medium">Default Criteria</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {defaultCriteria.map((criterion) => (
                            <div
                              key={criterion.id}
                              className="p-4 border rounded-md bg-gray-50"
                            >
                              <div className="flex justify-between mb-1">
                                <h4 className="font-medium">{criterion.name}</h4>
                                <span className="text-sm text-gray-500">
                                  {criterion.weight}%
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {criterion.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-6">
                    <Label htmlFor="custom-prompt">Custom Evaluation Prompt</Label>
                    <Textarea
                      id="custom-prompt"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Enter a detailed prompt explaining how you want to evaluate and compare the documents..."
                      className="mt-2 min-h-[200px] resize-y"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Provide specific instructions about what aspects to evaluate, how to weigh different factors, 
                      and any other details needed for accurate comparison.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('documents')}
              >
                Back to Documents
              </Button>
              <Button 
                onClick={handleSubmit}
                className="bg-brand-primary hover:bg-brand-dark"
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Compare Documents"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Past Reports</CardTitle>
                <CardDescription>
                  View and download your recent document comparison reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Array.isArray(pastReports) && pastReports.length > 0 ? (
                  <div className="space-y-4">
                    {pastReports.map((report, index) => (
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
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Documents;
