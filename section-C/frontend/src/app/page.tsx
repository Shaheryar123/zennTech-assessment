'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MainLayout from '@/components/MainLayout';
import PageHeader from '@/components/PageHeader';
import PropertyGrid from '@/components/PropertyGrid';
import FormSection from '@/components/FormSection';
import PreviewSection from '@/components/PreviewSection';
import { PropertyFormData, Project } from '@/types';
import { fetchProjects } from '@/utils/api';

export default function PropertyManagementPage() {
  const [formData, setFormData] = useState<PropertyFormData>({
    projectId: '',
    title: '',
    size: '',
    price: '',
    handoverDate: ''
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects from API on component mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedProjects = await fetchProjects();
        setProjects(fetchedProjects);
      } catch (err) {
        console.error('Failed to fetch projects:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch projects');
        // Fallback to empty array if API fails
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const handleFormChange = (newFormData: PropertyFormData) => {
    setFormData(newFormData);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50" suppressHydrationWarning>
        <Header />
        
        <MainLayout>
          <PageHeader 
            title="Add New Property Listing"
            description="Create a new property listing with live preview. Fill in the form and watch the preview update in real-time."
          />
          
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading projects...</span>
          </div>
        </MainLayout>

        <Footer />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50" suppressHydrationWarning>
        <Header />
        
        <MainLayout>
          <PageHeader 
            title="Add New Property Listing"
            description="Create a new property listing with live preview. Fill in the form and watch the preview update in real-time."
          />
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-2">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Projects</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </MainLayout>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50" suppressHydrationWarning>
      <Header />
      
      <MainLayout>
        <PageHeader 
          title="Add New Property Listing"
          description="Create a new property listing with live preview. Fill in the form and watch the preview update in real-time."
        />

        <PropertyGrid>
          <FormSection onFormChange={handleFormChange} />
          <PreviewSection formData={formData} projects={projects} />
        </PropertyGrid>
      </MainLayout>

      <Footer />
    </div>
  );
}
