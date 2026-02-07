import React, { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

interface PendingSignup {
  id: string;
  email: string;
  requested_membership_number: string | null;
  data: {
    ar_name: string;
    latin_name: string;
    whatsapp: string;
    phone: string;
    sex?: string;
    birth_date?: string;
    country?: string;
    city?: string;
    district?: string;
    university?: string;
    major?: string;
    graduation_year?: string;
    blood_type?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface SignupApprovalProps {
  setSuccess: (msg: string) => void;
  setError: (msg: string) => void;
}

export function SignupApproval({ setSuccess, setError }: SignupApprovalProps) {
  const [signups, setSignups] = useState<PendingSignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSignup, setSelectedSignup] = useState<PendingSignup | null>(null);
  const [membershipNumber, setMembershipNumber] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadSignups();
  }, []);

  const loadSignups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/pending-signups');
      const data = await response.json();

      if (data.success) {
        setSignups(data.signups);
      } else {
        setError(data.error || 'فشل تحميل طلبات التسجيل');
      }
    } catch (error) {
      console.error('Error loading signups:', error);
      setError('فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (signupId: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/pending-signups/${signupId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membership_number: membershipNumber.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`تمت الموافقة على طلب التسجيل. رقم العضوية: ${data.user.membership_number}`);
        setSelectedSignup(null);
        setMembershipNumber('');
        loadSignups();
      } else {
        setError(data.error || 'فشلت الموافقة على الطلب');
      }
    } catch (error) {
      console.error('Error approving signup:', error);
      setError('فشل الاتصال بالخادم');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (signupId: string) => {
    if (!confirm('هل أنت متأكد من رفض هذا الطلب؟')) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/pending-signups/${signupId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: rejectionReason.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('تم رفض طلب التسجيل');
        setSelectedSignup(null);
        setRejectionReason('');
        loadSignups();
      } else {
        setError(data.error || 'فشل رفض الطلب');
      }
    } catch (error) {
      console.error('Error rejecting signup:', error);
      setError('فشل الاتصال بالخادم');
    } finally {
      setActionLoading(false);
    }
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
      {/* Header */}
      <Card>
        <h3 className="text-lg font-semibold">طلبات التسجيل المعلقة</h3>
        <p className="text-sm text-gray-600 mt-1">
          مراجعة والموافقة أو رفض طلبات العضوية الجديدة
        </p>
      </Card>

      {/* Signups List */}
      {signups.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-gray-500">
            لا توجد طلبات تسجيل معلقة
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {signups.map((signup) => (
            <Card key={signup.id} className="hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  {/* Main Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">👤</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">
                        {signup.data.latin_name}
                        {signup.data.ar_name && (
                          <span className="text-gray-600 mr-2">({signup.data.ar_name})</span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600">{signup.email}</p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {signup.requested_membership_number && (
                      <div>
                        <span className="text-gray-600">رقم العضوية المطلوب:</span>
                        <span className="font-medium mr-2">{signup.requested_membership_number}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">الهاتف:</span>
                      <span className="font-medium mr-2">{signup.data.phone}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">واتساب:</span>
                      <span className="font-medium mr-2">{signup.data.whatsapp}</span>
                    </div>
                    {signup.data.university && (
                      <div>
                        <span className="text-gray-600">الجامعة:</span>
                        <span className="font-medium mr-2">{signup.data.university}</span>
                      </div>
                    )}
                    {signup.data.major && (
                      <div>
                        <span className="text-gray-600">التخصص:</span>
                        <span className="font-medium mr-2">{signup.data.major}</span>
                      </div>
                    )}
                    {signup.data.country && (
                      <div>
                        <span className="text-gray-600">الدولة:</span>
                        <span className="font-medium mr-2">{signup.data.country}</span>
                      </div>
                    )}
                    {signup.data.city && (
                      <div>
                        <span className="text-gray-600">المدينة:</span>
                        <span className="font-medium mr-2">{signup.data.city}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 text-xs text-gray-500">
                    تاريخ الطلب: {new Date(signup.created_at).toLocaleString('ar-SA')}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => setSelectedSignup(signup)}
                    size="sm"
                  >
                    مراجعة
                  </Button>
                  <Button
                    onClick={() => handleReject(signup.id)}
                    variant="secondary"
                    size="sm"
                    disabled={actionLoading}
                  >
                    رفض
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedSignup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">مراجعة طلب التسجيل</h3>

              {/* Full Details */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">الاسم باللاتينية</label>
                    <p className="mt-1 text-gray-900">{selectedSignup.data.latin_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">الاسم بالعربية</label>
                    <p className="mt-1 text-gray-900">{selectedSignup.data.ar_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                    <p className="mt-1 text-gray-900">{selectedSignup.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">رقم الهاتف</label>
                    <p className="mt-1 text-gray-900">{selectedSignup.data.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">واتساب</label>
                    <p className="mt-1 text-gray-900">{selectedSignup.data.whatsapp}</p>
                  </div>
                  {selectedSignup.data.sex && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">الجنس</label>
                      <p className="mt-1 text-gray-900">{selectedSignup.data.sex}</p>
                    </div>
                  )}
                  {selectedSignup.data.birth_date && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">تاريخ الميلاد</label>
                      <p className="mt-1 text-gray-900">{selectedSignup.data.birth_date}</p>
                    </div>
                  )}
                  {selectedSignup.data.country && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">الدولة</label>
                      <p className="mt-1 text-gray-900">{selectedSignup.data.country}</p>
                    </div>
                  )}
                  {selectedSignup.data.city && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">المدينة</label>
                      <p className="mt-1 text-gray-900">{selectedSignup.data.city}</p>
                    </div>
                  )}
                  {selectedSignup.data.district && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">الحي</label>
                      <p className="mt-1 text-gray-900">{selectedSignup.data.district}</p>
                    </div>
                  )}
                  {selectedSignup.data.university && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">الجامعة</label>
                      <p className="mt-1 text-gray-900">{selectedSignup.data.university}</p>
                    </div>
                  )}
                  {selectedSignup.data.major && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">التخصص</label>
                      <p className="mt-1 text-gray-900">{selectedSignup.data.major}</p>
                    </div>
                  )}
                  {selectedSignup.data.graduation_year && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">سنة التخرج</label>
                      <p className="mt-1 text-gray-900">{selectedSignup.data.graduation_year}</p>
                    </div>
                  )}
                  {selectedSignup.data.blood_type && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">فصيلة الدم</label>
                      <p className="mt-1 text-gray-900">{selectedSignup.data.blood_type}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Membership Number Input */}
              <div className="mb-6">
                <Input
                  label="رقم العضوية (اختياري)"
                  value={membershipNumber}
                  onChange={setMembershipNumber}
                  placeholder={
                    selectedSignup.requested_membership_number ||
                    'سيتم إنشاؤه تلقائياً إذا تُرك فارغاً'
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  اترك فارغاً لإنشاء رقم عضوية تلقائي
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedSignup(null);
                    setMembershipNumber('');
                  }}
                  disabled={actionLoading}
                >
                  إلغاء
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleReject(selectedSignup.id)}
                  disabled={actionLoading}
                >
                  رفض
                </Button>
                <Button
                  onClick={() => handleApprove(selectedSignup.id)}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'جاري المعالجة...' : 'موافقة'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
