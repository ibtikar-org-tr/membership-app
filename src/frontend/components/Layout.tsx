import React from 'react';
import { GitHubButton } from './GitHubButton';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function Layout({ children, title }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with logo and GitHub button */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/logo-blue.svg" 
              alt="Ibtikar Logo" 
              className="w-24 h-8 mr-3"
              onClick={() => window.location.href = '/'}
              style={{ cursor: 'pointer' }}
            />
          </div>
          
          {/* GitHub button */}
          <GitHubButton url="https://github.com/ibtikar-org-tr/membership-app" />
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-none">
        {title && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 text-center">{title}</h1>
          </div>
        )}
        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
