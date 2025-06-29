// Project types
export interface Project {
  id: string;
  name: string;
}

// Property types
export interface Property {
  id?: string;
  projectId: string;
  projectName?: string;
  title: string;
  size: number;
  price: number;
  handoverDate: string;
  createdAt?: string;
  updatedAt?: string;
}

// Form data type
export interface PropertyFormData {
  projectId: string;
  title: string;
  size: string;
  price: string;
  handoverDate: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: string[];
  count?: number;
}

// Validation error type
export interface ValidationErrors {
  projectId?: string;
  title?: string;
  size?: string;
  price?: string;
  handoverDate?: string;
}

// Form state type
export interface FormState {
  data: PropertyFormData;
  errors: ValidationErrors;
  isValid: boolean;
  isSubmitting: boolean;
} 