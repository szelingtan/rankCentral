
import axios from 'axios';
import { toast } from 'sonner';

// Create an axios instance for backend calls with proper error handling
const apiClient = axios.create({
  // Use environment variable with fallback
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5003',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor for better logging and error handling
apiClient.interceptors.request.use(
  (config) => {
    // Make sure API routes have /api prefix
    if (!config.url?.startsWith('/api/')) {
      config.url = `/api${config.url?.startsWith('/') ? config.url : `/${config.url}`}`;
    }
    
    console.log(`Making API request to: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('API request configuration error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor with better error handling
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses (can be disabled in production)
    console.log(`API response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    // Handle connection errors specially
    if (error.code === 'ERR_NETWORK') {
      console.error('Backend connection error:', error);
      
      // Add more detailed diagnostic information
      console.log('Current API URL:', apiClient.defaults.baseURL);
      console.log('Check if your backend server is running at this URL');
      console.log('If using a different port, update VITE_API_URL in your .env file');
      
      // Toast with unique ID to prevent duplicates
      toast.error('Backend server not available. Check if it is running.', {
        id: 'network-error',
        duration: 5000,
      });
      
      return Promise.reject({
        isConnectionError: true,
        message: 'Backend server not available',
        originalError: error
      });
    }
    
    // Handle other API errors
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    
    console.error(`API error (${status}):`, message);
    
    // Use error status and URL to create unique toast ID
    const toastId = `api-error-${status}-${error.config?.url?.replace(/\//g, '-')}`;
    
    toast.error(`API error: ${message}`, {
      id: toastId,
      duration: 5000,
    });
    
    return Promise.reject({
      status,
      message,
      originalError: error,
      isConnectionError: false
    });
  }
);

// Helper function to check if backend is running
export const checkBackendHealth = async () => {
  try {
    console.log('Checking backend health at:', apiClient.defaults.baseURL);
    const response = await apiClient.get('/health');
    console.log('Health check response:', response.data);
    
    // Verify that the response has the expected structure
    if (response.data && typeof response.data === 'object') {
      // Check for expected fields in health response
      if ('status' in response.data) {
        return {
          isHealthy: response.data?.status === 'healthy',
          message: response.data?.message || 'Backend is running',
          error: null,
          timestamp: response.data?.timestamp,
          version: response.data?.version
        };
      }
    }
    
    // If response structure is unexpected
    console.warn('Health endpoint response format is unexpected:', response.data);
    return {
      isHealthy: false,
      message: 'Backend returned an unexpected response format',
      error: 'Invalid response format',
      data: response.data
    };
  } catch (error: any) {
    console.error('Health check failed with error:', error);
    return {
      isHealthy: false,
      message: 'Backend connection failed',
      error
    };
  }
};

export default apiClient;
