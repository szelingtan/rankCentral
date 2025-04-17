
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { checkBackendHealth } from '@/lib/api-client';
import { toast } from 'sonner';

// Define a type for status to prevent TypeScript comparison errors
type StatusType = 'online' | 'offline' | 'checking' | 'error';

interface BackendStatusProps {
  onStatusChange?: (status: StatusType) => void;
  className?: string;
}

// Track shown toast ids to prevent duplicates
const shownToasts = new Set<string>();

const BackendStatus: React.FC<BackendStatusProps> = ({ onStatusChange, className = '' }) => {
  const [status, setStatus] = useState<StatusType>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'https://rankcentral.onrender.com';

  // Helper function to show toast without duplicates
  const showUniqueToast = (message: string, options: { id: string, duration?: number }) => {
    if (shownToasts.has(options.id)) {
      return;
    }
    
    shownToasts.add(options.id);
    toast.error(message, options);
    
    setTimeout(() => {
      shownToasts.delete(options.id);
    }, (options.duration || 4000) + 1000);
  };

  const checkStatus = async () => {
    // Prevent multiple simultaneous health checks
    if (isCheckingHealth) return;
    
    setIsCheckingHealth(true);
    setStatus('checking');
    if (onStatusChange) onStatusChange('checking');
    
    try {
      console.log('Checking backend health at:', apiUrl);
      const health = await checkBackendHealth();
      console.log('Health check result:', health);
      
      if (health.isHealthy) {
        setStatus('online');
        setErrorDetails(null);
        if (onStatusChange) onStatusChange('online');
      } else {
        setStatus('offline');
        
        // Store detailed error info
        const errorMsg = health.message || 'Unknown error';
        setErrorDetails(errorMsg);
        
        if (onStatusChange) onStatusChange('offline');
        
        // Show toast with unique ID
        showUniqueToast('Backend server is not responding properly.', {
          id: 'backend-health-error',
          duration: 4000,
        });
        
        // Log diagnostics if available
        if (health.diagnostics) {
          console.log('Backend diagnostics:', health.diagnostics);
        }
      }
    } catch (error: any) {
      console.error('Backend connection error:', error);
      setStatus('error');
      
      const errorMsg = error.message || 'Connection failed';
      setErrorDetails(errorMsg);
      
      if (onStatusChange) onStatusChange('offline');
      
      showUniqueToast('Backend server is not available.', {
        id: 'backend-connection-error',
        duration: 4000,
      });
    } finally {
      setIsCheckingHealth(false);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Set up periodic checking every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Render based on status state
  if (status === 'online') {
    return (
      <div className={`flex items-center gap-2 text-sm text-green-600 ${className}`}>
        <CheckCircle2 className="h-4 w-4" />
        <span>Backend connected</span>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-6 w-6" 
          onClick={checkStatus}
          disabled={isCheckingHealth}
        >
          <RefreshCw className={`h-3 w-3 ${isCheckingHealth ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    );
  }

  if (status === 'offline' || status === 'error') {
    return (
      <div className={`${className}`}>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            <strong className="font-bold">Backend not connected</strong>
          </div>
          <p className="mt-2">Please start the backend server to use this application:</p>
          {errorDetails && (
            <p className="text-sm mt-1 bg-red-50 p-2 rounded border border-red-300">
              Error: {errorDetails}
            </p>
          )}
          <ol className="list-decimal ml-5 mt-2 space-y-1">
            <li>Run <code className="bg-gray-200 px-1 py-0.5 rounded">./run_backend.sh</code> in your terminal</li>
            <li>Backend should run at: <code className="bg-gray-200 px-1 py-0.5 rounded">{apiUrl}</code></li>
            <li>Check your MongoDB connection string in backend/.env</li>
          </ol>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 flex items-center gap-1" 
            onClick={checkStatus}
            disabled={isCheckingHealth}
          >
            <RefreshCw className={`h-3 w-3 ${isCheckingHealth ? 'animate-spin' : ''}`} />
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  // Must be checking status
  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2 text-sm text-amber-600">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Checking backend connection...</span>
      </div>
    </div>
  );
};

export default BackendStatus;
