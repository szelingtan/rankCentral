
import axios from 'axios';

// Create an axios instance for backend calls
const apiClient = axios.create({
  // Use a configurable API URL that defaults to localhost:5003
  baseURL: import.meta.env.VITE_API_URL || `http://localhost:5003`,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor to handle common request logic
apiClient.interceptors.request.use(
  (config) => {
    // Ensure all API routes have /api prefix
    if (!config.url?.startsWith('/api/')) {
      config.url = `/api${config.url?.startsWith('/') ? config.url : `/${config.url}`}`;
    }
    
    console.log(`Making request to: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for common error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API request failed:', error);
    return Promise.reject(error);
  }
);

export default apiClient;
