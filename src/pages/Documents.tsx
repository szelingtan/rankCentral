
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FileText, Trash2, ArrowRight, Upload } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNavigate } from 'react-router-dom';
import apiClient, { checkBackendHealth } from '@/lib/api-client';
import CriteriaForm from '@/components/CriteriaForm';
import { request } from 'http';

type Document = {
  id: string;
  content: string;
  displayName?: string;
  fileSize?: string;
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

const displayedToasts = new Set<string>();

const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [useCustomCriteria, setUseCustomCriteria] = useState(false);
  const [criteria, setCriteria] = useState<Criterion[]>(defaultCriteria);
  const [activeTab, setActiveTab] = useState('documents');
  const [evaluationMethod, setEvaluationMethod] = useState('criteria');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [documentNames, setDocumentNames] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5003';
  
  useEffect(() => {
    checkBackendStatus();
  }, []);

  const showUniqueToast = (message: string, type = 'error') => {
    const toastKey = `${type}:${message}`;
    
    if (displayedToasts.has(toastKey)) {
      return null;
    }
    
    displayedToasts.add(toastKey);
    
    let toastId;
    if (type === 'success') {
      toastId = toast.success(message, {
        position: 'top-right',
        onAutoClose: () => {
          displayedToasts.delete(toastKey);
        }
      });
    } else if (type === 'loading') {
      toastId = toast.loading(message, {
        position: 'top-right'
      });
    } else {
      toastId = toast.error(message, {
        position: 'top-right',
        onAutoClose: () => {
          displayedToasts.delete(toastKey);
        }
      });
    }

    return toastId;
  };

  const checkBackendStatus = async () => {
    setBackendStatus('checking');
    
    try {
      const health = await checkBackendHealth();
      
      if (health.isHealthy) {
        console.log('Backend health check passed:', health.message);
        setBackendStatus('online');
      } else {
        console.error('Backend health check failed:', health.error);
        setBackendStatus('offline');
        showUniqueToast('Backend server is not available. Please start the backend server.');
      }
    } catch (error) {
      console.error("Backend health check error:", error);
      setBackendStatus('offline');
      showUniqueToast('Backend server is not available. Please start the backend server.');
    }
  };

  const removeDocument = (id: string) => {
    if (documents.length <= 2) {
      showUniqueToast('Cannot remove. You need at least two documents for comparison.');
      return;
    }
    setDocuments(documents.filter((doc) => doc.id !== id));

    setDocumentNames(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
    showUniqueToast(`Document removed successfully.`, 'success');
  };

  const updateDocument = (id: string, field: keyof Document, value: string) => {
    setDocuments(
      documents.map((doc) => (doc.id === id ? { ...doc, [field]: value } : doc))
    );
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const uploadFiles = async (files: File[], docId?: string) => {
    if (files.length === 0) return;
  
    setIsLoading(true);
  
    try {
      if (backendStatus === 'offline') {
        await checkBackendStatus();
        if (backendStatus === 'offline') {
          throw new Error("Backend server is not available");
        }
      }
  
      const newDocuments = [...documents];
  
      await Promise.all(files.map(async (file, index) => {
        if (file.type === 'application/pdf') {
          const base64Content = await fileToBase64(file);
          const currDocId = docId || (documents.length + index + 1).toString(); // Ensure unique ID for each file
  
          updateDocument(currDocId, 'content', base64Content);
  
          const fileSizeKB = (file.size / 1024).toFixed(2);
  
          newDocuments.push({
            id: currDocId,
            displayName: file.name,
            content: base64Content,
            fileSize: `${fileSizeKB} KB`
          });
  
          setDocumentNames(prev => ({
            ...prev,
            [currDocId]: file.name
          }));
        }
      }));
  
      setDocuments(newDocuments);
      showUniqueToast('Files uploaded successfully.', 'success');
    } catch (error: any) {
      console.error('Error uploading files:', error);
      showUniqueToast('Upload failed. Make sure the backend server is running.');
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
    const files = event.target.files;
    if (files && files.length > 0) {
      uploadFiles([files[0]], docId);
    }
  };

  const handleSubmit = async () => {
    const emptyDocs = documents.filter(doc => !doc.content.trim());
    if (emptyDocs.length > 0) {
      showUniqueToast("Please fill in content for all documents.");
      return;
    }

    if (evaluationMethod === 'criteria' && useCustomCriteria) {
      const invalidCriteria = criteria.filter(c => !c.name.trim());
      if (invalidCriteria.length > 0) {
        showUniqueToast('Please provide a name for all criteria.');
        return;
      }
    }

    if (evaluationMethod === 'prompt' && !customPrompt.trim()) {
      showUniqueToast('Please provide an evaluation prompt.');
      return;
    }

    if (backendStatus === 'offline') {
      try {
        await checkBackendStatus();
        if (backendStatus === 'offline') {
          showUniqueToast('Cannot connect to the backend server.');
          return;
        }
      } catch (error) {
        showUniqueToast('Cannot connect to the backend server.');
        return;
      }
    }

    setIsLoading(true);
    const processingToastId = showUniqueToast('Processing documents. This may take a moment.', 'loading');

    try {
      const requestData = {
        documents: documents.map(doc => ({
          id: doc.id,
          name: doc.displayName,
          content: doc.content
        })),
        compare_method: 'mergesort',
        criteria: evaluationMethod === 'criteria' 
          ? (useCustomCriteria ? criteria : defaultCriteria)
          : [],
        custom_prompt: evaluationMethod === 'prompt' ? customPrompt : '',
        evaluation_method: evaluationMethod
      };

      console.log('Sending comparison request:', {
        ...requestData,
        documents: requestData.documents.map(d => ({
          ...d,
          content: d.content.length > 50 ? `${d.content.substring(0, 50)}... (${d.content.length} chars)` : d.content
        }))
      });
      
      const response = await apiClient.post('/compare-documents', requestData);
      
      if (response.data) {
        showUniqueToast('Analysis complete. Your comparison report is ready.', 'success');
        navigate('/results');
      }
    } catch (error: any) {
      console.error('Error comparing documents:', error);
      showUniqueToast(error.message || "There was an error analyzing your documents.");
    } finally {
      setIsLoading(false);
      if (processingToastId) {
        toast.dismiss(processingToastId);
      }
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Document Comparison</h1>
        
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
                      Upload PDF(s)
                    </Button>
                  </div>
                </div>
              </div>

              {documents.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No documents uploaded yet.</p>
                  <p className="text-gray-500">Click "Upload PDF(s)" to start.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {documents.map((doc) => (
                    <Card key={doc.id} className="shadow-sm">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <div className="truncate">
                            {doc.displayName ? doc.displayName : `Document ${doc.id}`}
                          </div>
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
                              accept=".pdf,.txt,.doc,.docx,.md"
                            />
                            <div className="flex items-center gap-2 text-sm text-gray-500 py-2 border rounded px-3 cursor-pointer">
                              <FileText className="h-4 w-4" />
                              {doc.displayName || 'Upload file (or enter text below)'}
                            </div>
                          </div>
                        </div>
                        {doc.content && doc.content.startsWith('data:application/pdf;base64,') || 
                         doc.content && doc.fileSize ? (
                          <div className="min-h-[200px] border rounded p-3 bg-gray-50 flex items-center justify-center">
                            <div className="text-center">
                              <FileText className="h-10 w-10 text-brand-primary mx-auto mb-2" />
                              <p className="text-sm font-medium">{doc.displayName}</p>
                              <p className="text-xs text-gray-500">
                                {doc.fileSize || (doc.content ? `${(Math.round(doc.content.length / 1024 / 1.37)).toFixed(2)} KB` : '-- KB')}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <Textarea
                            placeholder="Enter document content here..."
                            value={doc.content}
                            onChange={(e) => updateDocument(doc.id, 'content', e.target.value)}
                            className="min-h-[200px] resize-y"
                          />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="flex justify-end mt-8">
                <Button 
                  onClick={() => documents.length > 0 ? setActiveTab('evaluation'): showUniqueToast('Please upload at least two documents.')}
                  className="flex items-center gap-2 fixed bottom-8 right-8"
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
