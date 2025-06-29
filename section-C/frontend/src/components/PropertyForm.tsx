'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PropertyFormData, ValidationErrors, Project } from '@/types';
import { validateField, validateForm, isFormValid } from '@/utils/validation';
import { fetchProjects, createProperty } from '@/utils/api';
import { getTomorrowInputFormat } from '@/utils/dateUtils';
import { ChevronDown, AlertCircle, CheckCircle, Loader2, Save } from 'lucide-react';

interface PropertyFormProps {
  onFormChange: (formData: PropertyFormData) => void;
}

export const PropertyForm: React.FC<PropertyFormProps> = ({ onFormChange }) => {
  const [formData, setFormData] = useState<PropertyFormData>({
    projectId: '',
    title: '',
    size: '',
    price: '',
    handoverDate: ''
  });
  
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState({
    projects: true,
    submit: false
  });
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | null;
    text: string;
  }>({ type: null, text: '' });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    loadProjects();
    setIsClient(true);
  }, []);

  useEffect(() => {
    onFormChange(formData);
  }, [formData, onFormChange]);

  const loadProjects = async () => {
    try {
      setLoading(prev => ({ ...prev, projects: true }));
      const projectsData = await fetchProjects();
      setProjects(projectsData);
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Failed to load projects: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setLoading(prev => ({ ...prev, projects: false }));
    }
  };

  const handleInputChange = useCallback((name: keyof PropertyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
    
    const fieldError = validateField(name, value);
    if (fieldError) {
      setErrors(prev => ({ ...prev, [name]: fieldError }));
    }
    
    if (message.type) {
      setMessage({ type: null, text: '' });
    }
  }, [message.type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formErrors = validateForm(formData);
    setErrors(formErrors);
    
    if (!isFormValid(formErrors)) {
      setMessage({
        type: 'error',
        text: 'Please fix all validation errors before submitting.'
      });
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, submit: true }));
      setMessage({ type: null, text: '' });
      
      const propertyData = {
        projectId: formData.projectId,
        title: formData.title.trim(),
        size: parseFloat(formData.size),
        price: parseFloat(formData.price),
        handoverDate: formData.handoverDate
      };
      
      const newProperty = await createProperty(propertyData);
      
      setMessage({
        type: 'success',
        text: `Property "${newProperty.title}" created successfully! ID: ${newProperty.id}`
      });
      
      setFormData({
        projectId: '',
        title: '',
        size: '',
        price: '',
        handoverDate: ''
      });
      setErrors({});
      
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Failed to create property: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  const isSubmitDisabled = !isFormValid(errors) || loading.submit || !Object.values(formData).every(Boolean);

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Add New Property</h2>
        <p className="text-gray-600">Fill in the details to create a new property listing</p>
      </div>

      {message.type && (
        <div className={`mb-6 p-4 rounded-lg border flex items-start space-x-3 ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          )}
          <div>
            <p className="font-medium">
              {message.type === 'success' ? 'Success!' : 'Error'}
            </p>
            <p className="text-sm mt-1">{message.text}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-2">
            Project <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="projectId"
              value={formData.projectId}
              onChange={(e) => handleInputChange('projectId', e.target.value)}
              disabled={loading.projects}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-gray-900 ${
                errors.projectId ? 'border-red-500' : 'border-gray-300'
              } ${loading.projects ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <option value="" className="text-gray-900">
                {loading.projects ? 'Loading projects...' : 'Select a project'}
              </option>
              {projects.map((project) => (
                <option key={project.id} value={project.id} className="text-gray-900">
                  {project.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
          {errors.projectId && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.projectId}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Property Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="e.g., Luxury 3BR Apartment with Sea View"
            maxLength={100}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.title ? (
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.title}
              </p>
            ) : (
              <p className="text-sm text-gray-500">Enter a descriptive title for the property</p>
            )}
            <span className="text-xs text-gray-400">
              {formData.title.length}/100
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-2">
              Size (sq. ft.) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="size"
              value={formData.size}
              onChange={(e) => handleInputChange('size', e.target.value)}
              placeholder="e.g., 1250"
              min="1"
              step="1"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
                errors.size ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.size ? (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.size}
              </p>
            ) : (
              <p className="mt-1 text-sm text-gray-500">Property size in square feet</p>
            )}
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              Price (USD) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="price"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              placeholder="e.g., 850000"
              min="1"
              step="1"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 ${
                errors.price ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.price ? (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.price}
              </p>
            ) : (
              <p className="mt-1 text-sm text-gray-500">Property price in US Dollars</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="handoverDate" className="block text-sm font-medium text-gray-700 mb-2">
            Handover Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="handoverDate"
            value={formData.handoverDate}
            onChange={(e) => handleInputChange('handoverDate', e.target.value)}
            min={isClient ? getTomorrowInputFormat() : undefined}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
              errors.handoverDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.handoverDate ? (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.handoverDate}
            </p>
          ) : (
            <p className="mt-1 text-sm text-gray-500">Expected property handover date</p>
          )}
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`w-full flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-colors ${
              isSubmitDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {loading.submit ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating Property...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Property
              </>
            )}
          </button>
          
          {isSubmitDisabled && !loading.submit && (
            <p className="mt-2 text-sm text-gray-500 text-center">
              Complete all fields to enable saving
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default PropertyForm; 