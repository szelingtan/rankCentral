
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
    console.log('Checking backend health at:', apiClient.defaults.baseURL);
    const response = await apiClient.get('/health');
    console.log('Health check response:', response.data);
    
    return {
      isHealthy: response.data?.status === 'healthy',
      message: response.data?.message || 'Backend is running',
      error: null
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
