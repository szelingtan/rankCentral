
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { 
  getProjectById, 
  getProjectDocuments, 
  getProjectEvaluations,
  uploadDocument, 
  createEvaluation 
} from '../lib/api';
import { FileText, Upload, Download, PlusCircle, File, Clock } from 'lucide-react';
import type { IProject } from '../models/Project';
import type { IDocument } from '../models/Document';
import type { IEvaluation } from '../models/Evaluation';

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [project, setProject] = useState<IProject | null>(null);
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [evaluations, setEvaluations] = useState<IEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("documents");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [documentName, setDocumentName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchProjectData = async () => {
    if (!user || !id) return;
    
    setIsLoading(true);
    try {
      const [projectData, documentsData, evaluationsData] = await Promise.all([
        getProjectById(id, user.id),
        getProjectDocuments(id, user.id),
        getProjectEvaluations(id, user.id)
      ]);
      
      setProject(projectData);
      setDocuments(documentsData);
      setEvaluations(evaluationsData);
    } catch (error) {
      toast({
        title: "Error loading project",
        description: "Failed to load project data. Please try again.",
        variant: "destructive",
      });
      navigate('/projects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Set document name from file name if not already set
      if (!documentName) {
        setDocumentName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUploadDocument = async () => {
    if (!user || !id || !selectedFile) return;
    
    if (!documentName.trim()) {
      toast({
        title: "Document name required",
        description: "Please enter a name for your document.",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, you would upload to a storage service
    // Here we'll simulate it by generating a fake URL
    const fakeFileUrl = `https://storage.example.com/${Date.now()}-${selectedFile.name}`;
    
    try {
      const newDocument = await uploadDocument(id, user.id, documentName, fakeFileUrl);
      setDocuments([newDocument, ...documents]);
      setDocumentName('');
      setSelectedFile(null);
      setIsUploadDialogOpen(false);
      
      toast({
        title: "Document uploaded",
        description: "Your document has been uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error uploading document",
        description: "Failed to upload your document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string | Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-brand-primary border-r-gray-200 border-b-gray-200 border-l-gray-200 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading project data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{project?.name}</h1>
            {project?.description && (
              <p className="text-gray-600 mt-1">{project.description}</p>
            )}
          </div>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-brand-primary hover:bg-brand-dark flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription>
                  Upload a PDF document to include in your project.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="document-name">Document Name</Label>
                  <Input
                    id="document-name"
                    placeholder="Enter document name"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document-file">PDF File</Label>
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-6 bg-gray-50">
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="document-file"
                      accept=".pdf"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    {selectedFile ? (
                      <div className="text-center">
                        <FileText className="h-8 w-8 text-brand-primary mx-auto mb-2" />
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Change File
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          Drag and drop your file here or
                        </p>
                        <Button 
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-brand-primary"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Browse Files
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">
                          PDF files only, max 10MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsUploadDialogOpen(false);
                    setDocumentName('');
                    setSelectedFile(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUploadDocument}
                  disabled={!selectedFile}
                  className="bg-brand-primary hover:bg-brand-dark"
                >
                  Upload Document
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="mt-0">
            {documents.length === 0 ? (
              <Card className="shadow-sm border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium text-gray-700 mb-2">No documents yet</h3>
                  <p className="text-gray-500 text-center mb-6 max-w-md">
                    Upload your first document to start the evaluation process
                  </p>
                  <Button 
                    onClick={() => setIsUploadDialogOpen(true)}
                    className="bg-brand-primary hover:bg-brand-dark"
                  >
                    Upload Your First Document
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map((document) => (
                  <Card key={document._id.toString()} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-start gap-2 truncate">
                        <FileText className="h-5 w-5 text-brand-primary shrink-0" />
                        <span className="truncate">{document.name}</span>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          Uploaded on {formatDate(document.createdAt)}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => {
                          // In a real app, this would download the file
                          toast({
                            title: "Download started",
                            description: `Downloading ${document.name}.pdf`,
                          });
                        }}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                <Card 
                  className="shadow-sm border-dashed border-2 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setIsUploadDialogOpen(true)}
                >
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <PlusCircle className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500">Upload New Document</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="evaluations" className="mt-0">
            {evaluations.length === 0 ? (
              <Card className="shadow-sm border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <File className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium text-gray-700 mb-2">No evaluations yet</h3>
                  <p className="text-gray-500 text-center mb-6 max-w-md">
                    Upload at least two documents and then start the evaluation process
                  </p>
                  <Button 
                    onClick={() => {
                      if (documents.length < 2) {
                        toast({
                          title: "Not enough documents",
                          description: "You need at least two documents to start an evaluation.",
                          variant: "destructive",
                        });
                        setActiveTab("documents");
                      } else {
                        // Navigate to evaluation page
                        navigate("/documents");
                      }
                    }}
                    className="bg-brand-primary hover:bg-brand-dark"
                  >
                    Start Evaluation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {evaluations.map((evaluation) => (
                  <Card key={evaluation._id.toString()} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-start gap-2 truncate">
                        <File className="h-5 w-5 text-brand-primary shrink-0" />
                        <span className="truncate">{evaluation.name}</span>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          Created on {formatDate(evaluation.createdAt)}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => {
                          // In a real app, this would download the evaluation
                          toast({
                            title: "Download started",
                            description: `Downloading ${evaluation.name}`,
                          });
                        }}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                <Card 
                  className="shadow-sm border-dashed border-2 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    if (documents.length < 2) {
                      toast({
                        title: "Not enough documents",
                        description: "You need at least two documents to start an evaluation.",
                        variant: "destructive",
                      });
                      setActiveTab("documents");
                    } else {
                      // Navigate to evaluation page
                      navigate("/documents");
                    }
                  }}
                >
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <PlusCircle className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500">New Evaluation</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ProjectDetails;
