import React, { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

interface OAuthClient {
  id: string;
  client_id: string;
  name: string;
  allowed_ips: string | null;
  created_at: string;
  updated_at: string;
}

interface OAuthClientWithSecret extends OAuthClient {
  client_secret?: string;
}

interface OAuthClientsProps {
  setSuccess: (msg: string) => void;
  setError: (msg: string) => void;
}

export function OAuthClients({ setSuccess, setError }: OAuthClientsProps) {
  const [clients, setClients] = useState<OAuthClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientIPs, setNewClientIPs] = useState('');
  const [createdClient, setCreatedClient] = useState<OAuthClientWithSecret | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/oauth-clients');
      const data = await response.json();
      
      if (data.success) {
        setClients(data.clients);
      } else {
        setError(data.error || 'فشل تحميل OAuth Clients');
      }
    } catch (error) {
      console.error('Error loading OAuth clients:', error);
      setError('فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newClientName.trim()) {
      setError('الرجاء إدخال اسم الخدمة');
      return;
    }

    try {
      const response = await fetch('/api/admin/oauth-clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newClientName.trim(),
          allowed_ips: newClientIPs.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCreatedClient(data.client);
        setSuccess('تم إنشاء OAuth Client بنجاح');
        setNewClientName('');
        setNewClientIPs('');
        setShowCreateForm(false);
        loadClients();
      } else {
        setError(data.error || 'فشل إنشاء OAuth Client');
      }
    } catch (error) {
      console.error('Error creating OAuth client:', error);
      setError('فشل الاتصال بالخادم');
    }
  };

  const handleDeleteClient = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف OAuth Client "${name}"؟`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/oauth-clients/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('تم حذف OAuth Client بنجاح');
        loadClients();
      } else {
        setError(data.error || 'فشل حذف OAuth Client');
      }
    } catch (error) {
      console.error('Error deleting OAuth client:', error);
      setError('فشل الاتصال بالخادم');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('تم النسخ إلى الحافظة');
  };

  if (loading) {
    return (
      <Card>
        <div className="text-center py-8">جاري التحميل...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Created Client Modal */}
      {createdClient && (
        <Card className="border-2 border-green-500 bg-green-50">
          <h3 className="text-lg font-semibold mb-4 text-green-800">
            ✓ تم إنشاء OAuth Client بنجاح
          </h3>
          
          <div className="bg-yellow-100 border-2 border-yellow-500 p-4 rounded mb-4">
            <p className="font-bold text-yellow-800 mb-2">⚠️ تحذير مهم:</p>
            <p className="text-yellow-800">
              احفظ الـ client_secret بشكل آمن. لن يتم عرضه مرة أخرى!
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Client ID:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={createdClient.client_id}
                  readOnly
                  title="Client ID"
                  className="flex-1 px-3 py-2 border rounded bg-white font-mono text-sm"
                />
                <Button
                  onClick={() => copyToClipboard(createdClient.client_id)}
                  variant="secondary"
                  size="sm"
                >
                  نسخ
                </Button>
              </div>
            </div>

            {createdClient.client_secret && (
              <div>
                <label className="block text-sm font-medium mb-1">Client Secret:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={createdClient.client_secret}
                    readOnly
                    title="Client Secret"
                    className="flex-1 px-3 py-2 border rounded bg-white font-mono text-sm"
                  />
                  <Button
                    onClick={() => copyToClipboard(createdClient.client_secret!)}
                    variant="secondary"
                    size="sm"
                  >
                    نسخ
                  </Button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Service Name:</label>
              <p className="px-3 py-2 border rounded bg-white">{createdClient.name}</p>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={() => setCreatedClient(null)} variant="secondary">
              إغلاق
            </Button>
          </div>
        </Card>
      )}

      {/* Header */}
      <Card>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">OAuth Clients</h3>
            <p className="text-sm text-gray-600 mt-1">
              إدارة OAuth clients للخدمات الخارجية (Chatbots، تطبيقات أخرى)
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? 'إلغاء' : '+ إنشاء Client جديد'}
          </Button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <form onSubmit={handleCreateClient} className="mt-6 pt-6 border-t space-y-4">
            <Input
              label="اسم الخدمة"
              value={newClientName}
              onChange={setNewClientName}
              placeholder="مثال: Chatbot Service"
              required
            />

            <div>
              <label className="block text-sm font-medium mb-2">
                عناوين IP المسموحة (اختياري)
              </label>
              <textarea
                value={newClientIPs}
                onChange={(e) => setNewClientIPs(e.target.value)}
                placeholder='مثال: ["192.168.1.0/24", "10.0.0.1"]'
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                JSON array من عناوين IP أو CIDR ranges. اتركه فارغاً للسماح لجميع العناوين.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowCreateForm(false)}>
                إلغاء
              </Button>
              <Button type="submit">إنشاء Client</Button>
            </div>
          </form>
        )}
      </Card>

      {/* Clients List */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">OAuth Clients المسجلة</h3>

        {clients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            لا توجد OAuth clients مسجلة
          </div>
        ) : (
          <div className="space-y-4">
            {clients.map((client) => (
              <div
                key={client.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{client.name}</h4>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Client ID:</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                          {client.client_id}
                        </code>
                        <button
                          onClick={() => copyToClipboard(client.client_id)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          نسخ
                        </button>
                      </div>
                      {client.allowed_ips && (
                        <div>
                          <span className="text-gray-600">Allowed IPs:</span>
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono ml-2">
                            {client.allowed_ips}
                          </code>
                        </div>
                      )}
                      <div className="text-gray-500">
                        تم الإنشاء: {new Date(client.created_at).toLocaleString('ar-SA')}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDeleteClient(client.id, client.name)}
                  >
                    حذف
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Integration Guide */}
      <Card className="bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold mb-2">📖 دليل التكامل</h3>
        <p className="text-sm text-gray-700 mb-3">
          للحصول على دليل التكامل الكامل مع أمثلة الكود، راجع:
        </p>
        <ul className="text-sm space-y-1 text-blue-600">
          <li>• <strong>API_INTEGRATION.md</strong> - دليل شامل مع أمثلة</li>
          <li>• <strong>openapi.yaml</strong> - مواصفات OpenAPI</li>
        </ul>
      </Card>
    </div>
  );
}
