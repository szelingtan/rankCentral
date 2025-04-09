
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
      toast.error('Backend server not available. Please ensure the backend is running.');
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
    const response = await apiClient.get('/health');
    return {
      isHealthy: response.data?.status === 'healthy',
      message: response.data?.message || 'Backend is running',
      error: null
    };
  } catch (error: any) {
    return {
      isHealthy: false,
      message: 'Backend connection failed',
      error
    };
  }
};

export default apiClient;
