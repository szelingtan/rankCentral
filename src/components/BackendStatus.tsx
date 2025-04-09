
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { checkBackendHealth } from '@/lib/api-client';
import { toast } from 'sonner';

interface BackendStatusProps {
  onStatusChange?: (status: StatusType) => void;
  className?: string;
}

// Define a type for status to prevent TypeScript comparison errors
type StatusType = 'online' | 'offline' | 'checking';

const BackendStatus: React.FC<BackendStatusProps> = ({ onStatusChange, className = '' }) => {
  const [status, setStatus] = useState<StatusType>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5003';

  const checkStatus = async () => {
    setStatus('checking');
    if (onStatusChange) onStatusChange('checking');
    
    try {
      const health = await checkBackendHealth();
      
      const newStatus: StatusType = health.isHealthy ? 'online' : 'offline';
      setStatus(newStatus);
      if (onStatusChange) onStatusChange(newStatus);
      
      if (!health.isHealthy) {
        toast.error('Backend server is not responding.');
      }
    } catch (error) {
      const newStatus: StatusType = 'offline';
      setStatus(newStatus);
      if (onStatusChange) onStatusChange(newStatus);
      toast.error('Backend server is not available.');
    }
    
    setLastChecked(new Date());
  };

  useEffect(() => {
    checkStatus();
    
    // Set up periodic checking every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

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
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  // Using type guards to fix the TypeScript comparison issues
  return (
    <div className={`${className}`}>
      {status === 'offline' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            <strong className="font-bold">Backend not connected</strong>
          </div>
          <p className="mt-2">Please start the backend server to use this application:</p>
          <ol className="list-decimal ml-5 mt-2 space-y-1">
            <li>Run <code className="bg-gray-200 px-1 py-0.5 rounded">./run_backend.sh</code> in your terminal</li>
            <li>Backend should run at: <code className="bg-gray-200 px-1 py-0.5 rounded">{apiUrl}</code></li>
          </ol>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 flex items-center gap-1" 
            onClick={checkStatus}
          >
            <RefreshCw className={`h-3 w-3 ${status === 'checking' ? 'animate-spin' : ''}`} />
            {status === 'checking' ? 'Checking...' : 'Retry Connection'}
          </Button>
        </div>
      )}
      
      {status === 'checking' && (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Checking backend connection...</span>
        </div>
      )}
    </div>
  );
};

export default BackendStatus;
