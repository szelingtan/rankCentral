
/**
 * API module that consolidates all API-related functionality
 * This serves as a central export point for API features
 */

// Re-export all functionality from the individual modules
export * from './auth';
export * from './projects';
export * from './documents';
export * from './evaluations';

// Re-export the API client for direct access
export { default as apiClient, checkBackendHealth } from './api-client';

// Export additional API utilities here as needed
