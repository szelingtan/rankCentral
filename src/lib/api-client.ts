
import axios from 'axios';
import { toast } from 'sonner';

// Track shown errors to prevent duplicates
const shownErrors = new Set();

// Create an axios instance for backend calls with proper error handling
const apiClient = axios.create({
  // Use environment variable with fallback
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5003',
  timeout: 300000, // 300 seconds timeout
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

// Helper function to show toast without duplicates
const showUniqueToast = (message, options) => {
  const errorKey = `${options.id || ''}:${message}`;
  
  // Skip if already shown recently
  if (shownErrors.has(errorKey)) {
    return;
  }
  
  // Add to tracking set and show toast
  shownErrors.add(errorKey);
  toast.error(message, options);
  
  // Remove from tracking after toast duration + buffer
  setTimeout(() => {
    shownErrors.delete(errorKey);
  }, (options.duration || 5000) + 1000);
};

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
      showUniqueToast('Backend server not available. Check if it is running.', {
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
    const endpoint = error.config?.url?.replace(/\//g, '-') || 'unknown';
    
    console.error(`API error (${status}):`, message);
    
    // Use error status and URL to create unique toast ID
    const toastId = `api-error-${status}-${endpoint}`;
    
    showUniqueToast(`API error: ${message}`, {
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
      // Return detailed health information
      return {
        isHealthy: response.data?.status === 'healthy',
        message: response.data?.message || 'Backend is running',
        error: null,
        timestamp: response.data?.timestamp,
        version: response.data?.version,
        diagnostics: response.data?.diagnostics || {}
      };
    }
    
    // If response structure is unexpected
    console.warn('Health endpoint response format is unexpected:', response.data);
    return {
      isHealthy: false,
      message: 'Backend returned an unexpected response format',
      error: 'Invalid response format',
      data: response.data
    };
  } catch (error) {
    console.error('Health check failed with error:', error);
    
    // Extract more detailed error info
    const errorMsg = error.originalError?.response?.data?.message || error.message || 'Unknown error';
    
    return {
      isHealthy: false,
      message: `Backend connection failed: ${errorMsg}`,
      error,
      diagnostics: {
        apiUrl: apiClient.defaults.baseURL,
        errorCode: error.originalError?.code || 'unknown'
      }
    };
  }
};

export default apiClient;
