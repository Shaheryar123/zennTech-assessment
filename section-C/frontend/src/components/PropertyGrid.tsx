import React from 'react';

interface PropertyGridProps {
  children: React.ReactNode;
}

export default function PropertyGrid({ children }: PropertyGridProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {children}
    </div>
  );
} 