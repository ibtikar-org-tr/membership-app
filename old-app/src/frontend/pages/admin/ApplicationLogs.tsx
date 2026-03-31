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
    { value: '', label: 'جميع الحالات' },
    { value: 'success', label: 'نجح' },
    { value: 'failed', label: 'فشل' },
    { value: 'pending', label: 'معلق' },
  ];

  const actionOptions = [
    { value: '', label: 'جميع الإجراءات' },
    { value: 'login_attempt', label: 'محاولة تسجيل دخول' },
    { value: 'admin_login', label: 'تسجيل دخول المدير' },
    { value: 'member_login', label: 'تسجيل دخول العضو' },
    { value: 'password_reset_request', label: 'طلب إعادة تعيين كلمة المرور' },
    { value: 'password_reset_completed', label: 'إكمال إعادة تعيين كلمة المرور' },
    { value: 'view_profile', label: 'عرض الملف الشخصي' },
    { value: 'update_profile', label: 'تحديث الملف الشخصي' },
    { value: 'change_password', label: 'تغيير كلمة المرور' },
    { value: 'cron_process_registrations', label: 'معالجة التسجيلات (المهام التلقائية)' },
    { value: 'cron_new_registration_processed', label: 'تم معالجة تسجيل جديد' },
    { value: 'update_google_form_config', label: 'تحديث إعدادات نموذج جوجل' },
    { value: 'update_google_sheet_config', label: 'تحديث إعدادات جدول جوجل' },
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
        setError(data.error || 'فشل في تحميل السجلات');
      }
    } catch (error) {
      setError('خطأ في الشبكة. يرجى المحاولة مرة أخرى.');
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
        <LoadingSpinner size="lg" text="جاري تحميل سجلات التطبيق..." className="py-12" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card title="تصفية السجلات">
        <div className="grid lg:grid-cols-4 gap-4">
          <Input
            placeholder="البحث بالمستخدم أو الإجراء..."
            value={searchTerm}
            onChange={setSearchTerm}
          />

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            placeholder="تصفية حسب الحالة"
          />

          <Select
            value={actionFilter}
            onChange={setActionFilter}
            options={actionOptions}
            placeholder="تصفية حسب الإجراء"
          />

          <Select
            value={limit.toString()}
            onChange={(value) => setLimit(parseInt(value))}
            options={[
              { value: '50', label: '50 سجل' },
              { value: '100', label: '100 سجل' },
              { value: '200', label: '200 سجل' },
              { value: '500', label: '500 سجل' },
            ]}
          />
        </div>

        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            عرض {filteredLogs.length} من {logs.length} سجل
          </p>
          <Button onClick={loadLogs} variant="secondary" size="sm">
            تحديث
          </Button>
        </div>
      </Card>

      {/* Logs Table */}
      <Card title="سجلات التطبيق">
        {filteredLogs.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            لم يتم العثور على سجلات مطابقة للتصفية.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التاريخ والوقت
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المستخدم
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراء
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الحالة
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
