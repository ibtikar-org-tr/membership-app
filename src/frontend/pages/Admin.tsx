import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { AdminConfig } from './admin/AdminConfig';
import { MemberManagement } from './admin/MemberManagement';
import { ApplicationLogs } from './admin/ApplicationLogs';
import { clearAuthState } from '../utils/auth';

interface AdminProps {
  onNavigate: (page: string) => void;
}

export function Admin({ onNavigate }: AdminProps) {
  const [activeTab, setActiveTab] = useState<'config' | 'members' | 'logs'>('config');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const tabs = [
    { id: 'config', label: 'Configuration', component: AdminConfig },
    { id: 'members', label: 'Member Management', component: MemberManagement },
    { id: 'logs', label: 'Application Logs', component: ApplicationLogs },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || AdminConfig;

  return (
    <Layout title="Admin Panel">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Administration Dashboard</h2>
          <Button
            onClick={() => {
              clearAuthState();
              onNavigate('landing');
            }}
            variant="secondary"
          >
            Logout
          </Button>
        </div>

        {/* Global Messages */}
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors
                  ${activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Active Tab Content */}
        <ActiveComponent 
          setSuccess={setSuccess}
          setError={setError}
        />
      </div>
    </Layout>
  );
}
