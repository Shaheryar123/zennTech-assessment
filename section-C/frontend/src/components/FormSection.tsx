import React from 'react';
import PropertyForm from './PropertyForm';
import { PropertyFormData } from '@/types';

interface FormSectionProps {
  onFormChange: (formData: PropertyFormData) => void;
}

export default function FormSection({ onFormChange }: FormSectionProps) {
  return (
    <div className="xl:col-span-2">
      <PropertyForm onFormChange={onFormChange} />
    </div>
  );
} 