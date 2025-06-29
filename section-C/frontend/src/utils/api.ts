import axios, { AxiosResponse } from 'axios';
import { ApiResponse, Project, Property } from '@/types';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'zenntech-property-api-key-2025';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API functions

/**
 * Fetch all projects from the backend
 */
export const fetchProjects = async (): Promise<Project[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Project[]>>('/api/projects');
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch projects');
    }
    
    return response.data.data || [];
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    throw new Error(
      error.response?.data?.error || 
      error.message || 
      'Failed to fetch projects'
    );
  }
};

/**
 * Create a new property
 */
export const createProperty = async (propertyData: Omit<Property, 'id' | 'createdAt' | 'updatedAt' | 'projectName'>): Promise<Property> => {
  try {
    const response = await apiClient.post<ApiResponse<Property>>('/api/properties', propertyData);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to create property');
    }
    
    return response.data.data as Property;
  } catch (error: any) {
    console.error('Error creating property:', error);
    
    // Handle validation errors
    if (error.response?.status === 400 && error.response?.data?.details) {
      throw new Error(error.response.data.details.join(', '));
    }
    
    throw new Error(
      error.response?.data?.error || 
      error.message || 
      'Failed to create property'
    );
  }
};

/**
 * Fetch all properties (bonus endpoint)
 */
export const fetchProperties = async (): Promise<Property[]> => {
  try {
    const response = await apiClient.get<ApiResponse<Property[]>>('/api/properties');
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch properties');
    }
    
    return response.data.data || [];
  } catch (error: any) {
    console.error('Error fetching properties:', error);
    throw new Error(
      error.response?.data?.error || 
      error.message || 
      'Failed to fetch properties'
    );
  }
};

/**
 * Delete a property (bonus endpoint)
 */
export const deleteProperty = async (propertyId: string): Promise<Property> => {
  try {
    const response = await apiClient.delete<ApiResponse<Property>>(`/api/properties/${propertyId}`);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete property');
    }
    
    return response.data.data as Property;
  } catch (error: any) {
    console.error('Error deleting property:', error);
    throw new Error(
      error.response?.data?.error || 
      error.message || 
      'Failed to delete property'
    );
  }
};

/**
 * Test API connection
 */
export const testApiConnection = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get('/health');
    return response.data.success === true;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
}; 