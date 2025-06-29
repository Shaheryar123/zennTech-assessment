'use client';

import React, { useState, useEffect } from 'react';
import { PropertyFormData, Project } from '@/types';
import { formatDisplayDate } from '@/utils/dateUtils';
import { formatCurrency, formatNumber } from '@/utils/validation';
import { Building2, Calendar, DollarSign, Ruler } from 'lucide-react';

interface LivePreviewCardProps {
  formData: PropertyFormData;
  projects: Project[];
}

export const LivePreviewCard: React.FC<LivePreviewCardProps> = ({ formData, projects }) => {
  const [isClient, setIsClient] = useState(false);

  // Fix hydration issues by ensuring client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Find the selected project
  const selectedProject = projects.find(p => p.id === formData.projectId);
  
  // Check if form has any data
  const hasData = formData.projectId || formData.title || formData.size || formData.price || formData.handoverDate;

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 h-fit">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Preview</h3>
          <p className="text-sm text-gray-600">See how your property listing will look</p>
        </div>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading Preview...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 h-fit">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Preview</h3>
        <p className="text-sm text-gray-600">See how your property listing will look</p>
      </div>
      
      {!hasData ? (
        // Empty state
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Property Preview</p>
          <p className="text-gray-400 text-sm mt-1">Fill in the form to see a preview</p>
        </div>
      ) : (
        // Property card preview
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
            <h4 className="text-lg font-semibold truncate">
              {formData.title || 'Property Title'}
            </h4>
            <div className="flex items-center mt-1">
              <Building2 className="w-4 h-4 mr-2" />
              <span className="text-blue-100 text-sm">
                {selectedProject?.name || 'Select Project'}
              </span>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Price */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-600">
                <DollarSign className="w-5 h-5 mr-2" />
                <span className="font-medium">Price</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {formData.price ? formatCurrency(formData.price) : '$0'}
                </div>
              </div>
            </div>
            
            {/* Size */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-600">
                <Ruler className="w-5 h-5 mr-2" />
                <span className="font-medium">Size</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">
                  {formData.size ? `${formatNumber(formData.size)} sq ft` : '0 sq ft'}
                </div>
              </div>
            </div>
            
            {/* Handover Date */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-gray-600">
                <Calendar className="w-5 h-5 mr-2" />
                <span className="font-medium">Handover</span>
              </div>
                             <div className="text-right">
                 <div className="text-lg font-semibold text-gray-900" suppressHydrationWarning>
                   {formData.handoverDate ? formatDisplayDate(formData.handoverDate) : 'Select Date'}
                 </div>
               </div>
            </div>
            
            {/* Price per sq ft */}
            {formData.price && formData.size && (
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Price per sq ft</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(parseFloat(formData.price) / parseFloat(formData.size))}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="bg-gray-100 px-4 py-3 border-t">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Property Listing</span>
              <span>ZennTech Properties</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Preview Stats */}
      {hasData && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Quick Stats</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-blue-700">Form Completion:</span>
              <div className="font-semibold text-blue-900">
                {Math.round(
                  (Object.values(formData).filter(Boolean).length / 5) * 100
                )}%
              </div>
            </div>
            <div>
              <span className="text-blue-700">Ready to Save:</span>
              <div className="font-semibold text-blue-900">
                {Object.values(formData).every(Boolean) ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LivePreviewCard; 