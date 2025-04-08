import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileUp, Plus, Trash2, ArrowRight, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CriteriaForm from '@/components/CriteriaForm';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
  scoring_levels?: Record<number, string>;
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
  const [isLoading, setIsLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      const response = await axios.get('http://localhost:5002/api/health', { timeout: 5000 });
      if (response.data.status === 'healthy') {
        setBackendStatus('online');
      } else {
        setBackendStatus('offline');
        toast({
          title: "Backend connection issue",
          description: "The backend server is not responding correctly. Make sure it's running at http://localhost:5002.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Backend health check failed:", error);
      setBackendStatus('offline');
      toast({
        title: "Backend connection issue",
        description: "Cannot connect to the backend server. Make sure it's running at http://localhost:5002.",
        variant: "destructive",
      });
    }
  };

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

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;
    
    setIsLoading(true);
    
    try {
      if (backendStatus === 'offline') {
        await checkBackendStatus();
        if (backendStatus === 'offline') {
          throw new Error("Backend server is not available");
        }
      }
      
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files[]', file);
      });
      
      const response = await axios.post('http://localhost:5002/api/upload-pdfs', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      if (response.data.files) {
        toast({
          title: "Files uploaded",
          description: `Successfully uploaded ${response.data.files.length} files.`,
        });
        
        const newDocuments = [...documents];
        response.data.files.forEach((file: any, index: number) => {
          if (newDocuments.length + index < 10) {
            const newId = (newDocuments.length + index + 1).toString();
            newDocuments.push({
              id: newId,
              name: `Document ${newId}`,
              content: file.content || '',
            });
          }
        });
        
        setDocuments(newDocuments);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your files. Make sure the backend server is running at http://localhost:5002.",
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

    if (backendStatus === 'offline') {
      try {
        await checkBackendStatus();
        if (backendStatus === 'offline') {
          toast({
            title: "Backend unavailable",
            description: "Cannot connect to the backend server. Please check that it's running at http://localhost:5002.",
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        toast({
          title: "Backend connection failed",
          description: "Cannot connect to the backend server. Please check that it's running at http://localhost:5002.",
          variant: "destructive",
        });
        return;
      }
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

      const response = await axios.post('http://localhost:5002/api/compare-documents', requestData, {
        timeout: 60000,
      });
      
      if (response.data) {
        toast({
          title: "Analysis complete",
          description: "Your comparison report is ready.",
        });
        
        navigate('/results');
      }
    } catch (error) {
      console.error('Error comparing documents:', error);
      toast({
        title: "Comparison failed",
        description: "There was an error analyzing your documents. Make sure the backend server is running at http://localhost:5002.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Document Comparison</h1>
        
        {backendStatus === 'offline' && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-6 rounded relative" role="alert">
            <strong className="font-bold">Backend not connected: </strong>
            <span className="block sm:inline">Make sure the backend server is running at http://localhost:5002.</span>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2" 
              onClick={checkBackendStatus}
            >
              Retry Connection
            </Button>
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="documents">1. Documents</TabsTrigger>
            <TabsTrigger value="evaluation">2. Evaluation Method</TabsTrigger>
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
                      <Upload className="h-4 w-4" />
                      Upload Multiple PDFs
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

                    <CriteriaForm 
                      criteria={criteria}
                      setCriteria={setCriteria}
                      defaultCriteria={defaultCriteria}
                      useCustomCriteria={useCustomCriteria}
                      setUseCustomCriteria={setUseCustomCriteria}
                    />
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

            <div className="flex justify-between">
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
        </Tabs>
      </div>
    </Layout>
  );
};

export default Documents;
