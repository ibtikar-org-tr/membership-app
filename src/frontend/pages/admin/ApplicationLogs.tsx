import React, { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';

interface ApplicationLogsProps {
  setSuccess: (message: string) => void;
  setError: (message: string) => void;
}

interface Log {
  id: string;
  user: string;
  action: string;
  status: string;
  created_at: string;
}

export function ApplicationLogs({ setSuccess, setError }: ApplicationLogsProps) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [limit, setLimit] = useState(100);

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'success', label: 'Success' },
    { value: 'failed', label: 'Failed' },
    { value: 'pending', label: 'Pending' },
  ];

  const actionOptions = [
    { value: '', label: 'All Actions' },
    { value: 'login_attempt', label: 'Login Attempt' },
    { value: 'admin_login', label: 'Admin Login' },
    { value: 'member_login', label: 'Member Login' },
    { value: 'password_reset_request', label: 'Password Reset Request' },
    { value: 'password_reset_completed', label: 'Password Reset Completed' },
    { value: 'view_profile', label: 'View Profile' },
    { value: 'update_profile', label: 'Update Profile' },
    { value: 'change_password', label: 'Change Password' },
    { value: 'cron_process_registrations', label: 'Process Registrations (Cron)' },
    { value: 'cron_new_registration_processed', label: 'New Registration Processed' },
    { value: 'update_google_form_config', label: 'Update Google Form Config' },
    { value: 'update_google_sheet_config', label: 'Update Google Sheet Config' },
  ];

  useEffect(() => {
    loadLogs();
  }, [limit]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/logs?limit=${limit}&offset=0`);
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.logs);
      } else {
        setError(data.error || 'Failed to load logs');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || log.status === statusFilter;
    const matchesAction = !actionFilter || log.action === actionFilter;
    
    return matchesSearch && matchesStatus && matchesAction;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <LoadingSpinner size="lg" text="Loading application logs..." className="py-12" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card title="Filter Logs">
        <div className="grid lg:grid-cols-4 gap-4">
          <Input
            placeholder="Search by user or action..."
            value={searchTerm}
            onChange={setSearchTerm}
          />

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            placeholder="Filter by status"
          />

          <Select
            value={actionFilter}
            onChange={setActionFilter}
            options={actionOptions}
            placeholder="Filter by action"
          />

          <Select
            value={limit.toString()}
            onChange={(value) => setLimit(parseInt(value))}
            options={[
              { value: '50', label: '50 logs' },
              { value: '100', label: '100 logs' },
              { value: '200', label: '200 logs' },
              { value: '500', label: '500 logs' },
            ]}
          />
        </div>

        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {filteredLogs.length} of {logs.length} logs
          </p>
          <Button onClick={loadLogs} variant="secondary" size="sm">
            Refresh
          </Button>
        </div>
      </Card>

      {/* Logs Table */}
      <Card title="Application Logs">
        {filteredLogs.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No logs found matching your filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {log.user}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
