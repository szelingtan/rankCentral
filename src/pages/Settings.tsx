
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const [apiKey, setApiKey] = useState('');
  const [savedApiKey, setSavedApiKey] = useState<string | null>(null);
  const [modelType, setModelType] = useState('gpt-4.1-mini');  // Updated default to gpt-4.1-mini
  const [maxDocuments, setMaxDocuments] = useState(10);
  const [maxLength, setMaxLength] = useState(10000);
  const [debugMode, setDebugMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const { toast } = useToast();

  const handleSaveApiKey = () => {
    // In a real app, this would be saved securely
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter a valid API key.",
        variant: "destructive",
      });
      return;
    }
    
    setSavedApiKey(apiKey);
    toast({
      title: "API Key Saved",
      description: "Your API key has been saved successfully.",
    });
  };

  const handleSaveSettings = () => {
    // In a real app, these settings would be saved to the server
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Settings</h1>
        
        <div className="space-y-6">
          {/* API Configuration */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
              <CardDescription>
                Configure the AI model settings for document comparison
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="flex space-x-2">
                  <Input
                    id="api-key"
                    type="password"
                    placeholder={savedApiKey ? "••••••••••••••••••••" : "Enter your API key"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <Button onClick={handleSaveApiKey}>Save Key</Button>
                </div>
                <p className="text-sm text-gray-500">
                  {savedApiKey 
                    ? "API key is saved. Enter a new key to update." 
                    : "Enter your API key for the LLM service to enable document comparison."}
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model-type">Model Type</Label>
                  <select
                    id="model-type"
                    value={modelType}
                    onChange={(e) => setModelType(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="gpt-4.1-mini">GPT-4.1-mini (Balanced performance and cost)</option>
                    <option value="gpt-3.5">GPT-3.5 (Faster, more economical)</option>
                    <option value="gpt-4">GPT-4 (Higher quality analysis)</option>
                    <option value="claude-3">Claude 3 (Alternative option)</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max-documents">Maximum Documents</Label>
                    <Input
                      id="max-documents"
                      type="number"
                      min={2}
                      max={50}
                      value={maxDocuments}
                      onChange={(e) => setMaxDocuments(Number(e.target.value))}
                    />
                    <p className="text-xs text-gray-500">
                      Maximum number of documents allowed for comparison
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="max-length">Maximum Document Length</Label>
                    <Input
                      id="max-length"
                      type="number"
                      min={1000}
                      max={100000}
                      step={1000}
                      value={maxLength}
                      onChange={(e) => setMaxLength(Number(e.target.value))}
                    />
                    <p className="text-xs text-gray-500">
                      Maximum characters per document (affects pricing)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* General Settings */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general application preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="debug-mode">Debug Mode</Label>
                  <p className="text-sm text-gray-500">
                    Show detailed AI comparison reasoning
                  </p>
                </div>
                <Switch
                  id="debug-mode"
                  checked={debugMode}
                  onCheckedChange={setDebugMode}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-gray-500">
                    Receive email notifications when comparisons are complete
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveSettings}
              className="bg-brand-primary hover:bg-brand-dark"
            >
              Save All Settings
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
