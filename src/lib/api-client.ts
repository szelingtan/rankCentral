
import axios from 'axios';

// Create an axios instance for backend calls
const apiClient = axios.create({
  // Use the current window location to dynamically determine the backend URL
  // This works for both local development and production deployments
  baseURL: `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`,
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
