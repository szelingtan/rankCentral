
import axios from 'axios';
import { toast } from 'sonner';

/**
 * Set of already shown errors to prevent duplicate toasts
 * This improves user experience by avoiding error message spam
 */
const shownErrors = new Set();

/**
 * API client configuration
 * Creates an axios instance with proper error handling and logging
 */
const apiClient = axios.create({
  // Use environment variable with fallback
  baseURL: import.meta.env.VITE_API_URL || 'https://rankcentral.onrender.com/',
  timeout: 300000, // 5 minute timeout for longer operations
  headers: {
    'Content-Type': 'application/json',
  }
});

/**
 * Request interceptor
 * Ensures proper API URL formatting and logs outgoing requests
 */
apiClient.interceptors.request.use(
  (config) => {
    // Ensure API routes have /api prefix
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

/**
 * Helper function to show unique toast messages
 * Prevents duplicate error messages from appearing
 */
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

/**
 * Response interceptor
 * Provides detailed error handling and logging for API responses
 */
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
      
      const baseUrl = apiClient.defaults.baseURL || 'Unknown URL';
      
      // Show helpful error message for connection issues
      showUniqueToast(`Backend server not available at ${baseUrl}. Please check server status.`, {
        id: 'backend-connection-error',
        duration: 8000,
      });
      
      return Promise.reject({
        isConnectionError: true,
        message: 'Backend server not available',
        originalError: error
      });
    }
    
    // Handle authorization errors (typically API key issues)
    if (error.response?.status === 401) {
      console.error('API authorization error:', error.response?.data);
      
      showUniqueToast(`Authorization error: API key may be invalid or not properly configured on the server.`, {
        id: 'api-auth-error',
        duration: 8000,
      });
      
      return Promise.reject({
        status: 401,
        message: 'API key authorization failed',
        originalError: error,
        isConnectionError: false
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

/**
 * Helper function to check if backend is running and configured properly
 * Provides detailed diagnostics about the backend status
 */
export const checkBackendHealth = async () => {
  try {
    console.log('Checking backend health at:', apiClient.defaults.baseURL);
    const response = await apiClient.get('/health');
    console.log('Health check response:', response.data);
    
    // Verify that the response has the expected structure
    if (response.data && typeof response.data === 'object') {
      // Check if OpenAI API key is configured
      const openaiApiConfigured = response.data?.diagnostics?.openai_api === 'configured';
      
      // Return detailed health information
      return {
        isHealthy: response.data?.status === 'healthy',
        message: response.data?.message || 'Backend is running',
        error: null,
        timestamp: response.data?.timestamp,
        version: response.data?.version,
        diagnostics: {
          ...response.data?.diagnostics || {},
          openaiApiConfigured
        }
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
    const statusCode = error.originalError?.response?.status || 'unknown';
    
    return {
      isHealthy: false,
      message: `Backend connection failed: ${errorMsg}`,
      error,
      diagnostics: {
        apiUrl: apiClient.defaults.baseURL,
        errorCode: error.originalError?.code || 'unknown',
        statusCode
      }
    };
  }
};

export default apiClient;
