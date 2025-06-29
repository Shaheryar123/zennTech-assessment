import React from 'react';
import LivePreviewCard from './LivePreviewCard';
import { PropertyFormData, Project } from '@/types';

interface PreviewSectionProps {
  formData: PropertyFormData;
  projects: Project[];
}

export default function PreviewSection({ formData, projects }: PreviewSectionProps) {
  return (
    <div className="xl:col-span-1">
      <div className="sticky top-8">
        <LivePreviewCard formData={formData} projects={projects} />
      </div>
    </div>
  );
} 