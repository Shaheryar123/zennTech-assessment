import { PropertyFormData, ValidationErrors } from '@/types';
import { isFutureDate, isValidDateString } from './dateUtils';

/**
 * Validate individual form fields
 */
export const validateField = (name: keyof PropertyFormData, value: string): string => {
  switch (name) {
    case 'projectId':
      return validateProjectId(value);
    case 'title':
      return validateTitle(value);
    case 'size':
      return validateSize(value);
    case 'price':
      return validatePrice(value);
    case 'handoverDate':
      return validateHandoverDate(value);
    default:
      return '';
  }
};

/**
 * Validate project ID
 */
export const validateProjectId = (projectId: string): string => {
  if (!projectId || projectId.trim() === '') {
    return 'Project is required';
  }
  return '';
};

/**
 * Validate property title
 */
export const validateTitle = (title: string): string => {
  if (!title || title.trim() === '') {
    return 'Title is required';
  }
  if (title.trim().length < 3) {
    return 'Title must be at least 3 characters long';
  }
  if (title.trim().length > 100) {
    return 'Title must be less than 100 characters';
  }
  return '';
};

/**
 * Validate property size
 */
export const validateSize = (size: string): string => {
  if (!size || size.trim() === '') {
    return 'Size is required';
  }
  
  const numericValue = parseFloat(size);
  
  if (isNaN(numericValue)) {
    return 'Size must be a valid number';
  }
  
  if (numericValue <= 0) {
    return 'Size must be a positive number';
  }
  
  if (numericValue > 100000) {
    return 'Size seems unreasonably large (max 100,000 sq ft)';
  }
  
  return '';
};

/**
 * Validate property price
 */
export const validatePrice = (price: string): string => {
  if (!price || price.trim() === '') {
    return 'Price is required';
  }
  
  const numericValue = parseFloat(price);
  
  if (isNaN(numericValue)) {
    return 'Price must be a valid number';
  }
  
  if (numericValue <= 0) {
    return 'Price must be a positive number';
  }
  
  if (numericValue > 1000000000) {
    return 'Price seems unreasonably high (max $1B)';
  }
  
  return '';
};

/**
 * Validate handover date
 */
export const validateHandoverDate = (handoverDate: string): string => {
  if (!handoverDate || handoverDate.trim() === '') {
    return 'Handover date is required';
  }
  
  if (!isValidDateString(handoverDate)) {
    return 'Please enter a valid date';
  }
  
  if (!isFutureDate(handoverDate)) {
    return 'Handover date must be in the future';
  }
  
  return '';
};

/**
 * Validate entire form and return all errors
 */
export const validateForm = (formData: PropertyFormData): ValidationErrors => {
  const errors: ValidationErrors = {};
  
  // Validate each field
  const projectIdError = validateProjectId(formData.projectId);
  if (projectIdError) errors.projectId = projectIdError;
  
  const titleError = validateTitle(formData.title);
  if (titleError) errors.title = titleError;
  
  const sizeError = validateSize(formData.size);
  if (sizeError) errors.size = sizeError;
  
  const priceError = validatePrice(formData.price);
  if (priceError) errors.price = priceError;
  
  const handoverDateError = validateHandoverDate(formData.handoverDate);
  if (handoverDateError) errors.handoverDate = handoverDateError;
  
  return errors;
};

/**
 * Check if form is valid (no errors)
 */
export const isFormValid = (errors: ValidationErrors): boolean => {
  return Object.keys(errors).length === 0;
};

/**
 * Check if form has any data
 */
export const hasFormData = (formData: PropertyFormData): boolean => {
  return !!(
    formData.projectId ||
    formData.title ||
    formData.size ||
    formData.price ||
    formData.handoverDate
  );
};

/**
 * Format number for display with commas
 */
export const formatNumber = (value: string | number): string => {
  if (!value) return '';
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numericValue)) return '';
  return numericValue.toLocaleString();
};

/**
 * Format currency for display
 */
export const formatCurrency = (value: string | number): string => {
  if (!value) return '';
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numericValue)) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numericValue);
}; 