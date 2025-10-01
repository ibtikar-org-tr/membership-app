import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

interface ResetPasswordProps {
  onNavigate: (page: string) => void;
  token?: string;
}

export function ResetPassword({ onNavigate, token }: ResetPasswordProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isValidToken, setIsValidToken] = useState(true);

  useEffect(() => {
    // Get token from URL if not provided as prop
    if (!token) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      if (!urlToken) {
        setError('رمز إعادة التعيين غير صالح أو مفقود');
        setIsValidToken(false);
      }
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    if (newPassword.length < 6) {
      setError('يجب أن تكون كلمة المرور 6 أحرف على الأقل');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const resetToken = token || new URLSearchParams(window.location.search).get('token');
      
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: resetToken,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Password reset failed');
      }
    } catch (error) {
      setError('خطأ في الشبكة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <Layout title="إعادة تعيين المعلومات">
        <div className="max-w-md mx-auto">
          <Card title="رمز غير صالح">
            <div className="text-center">
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                <p>رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية.</p>
              </div>
              
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => onNavigate('forgot')}
                  className="w-full"
                >
                  طلب رابط إعادة تعيين جديد
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => onNavigate('landing')}
                  className="w-full"
                >
                  العودة للرئيسية
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="إعادة تعيين المعلومات">
      <div className="max-w-md mx-auto">
        <Card title="إعادة تعيين كلمة المرور">
          {success ? (
            <div className="text-center">
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                <h3 className="font-medium mb-2">تم تحديث كلمة المرور بنجاح</h3>
                <p className="text-sm">
                  تم تحديث كلمة المرور الخاصة بك في نظام العضوية ومنصة التعلم.
                </p>
              </div>
              
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => onNavigate('login')}
                  className="w-full"
                >
                  الذهاب لتسجيل الدخول
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => onNavigate('landing')}
                  className="w-full"
                >
                  العودة للرئيسية
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  يرجى إدخال كلمة المرور الجديدة أدناه.
                </p>
              </div>

              <Input
                label="كلمة المرور الجديدة"
                type="password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="أدخل كلمة المرور الجديدة"
                required
              />

              <Input
                label="تأكيد كلمة المرور الجديدة"
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="أكد كلمة المرور الجديدة"
                required
              />

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={isLoading || !newPassword || !confirmPassword}
                  className="w-full"
                >
                  {isLoading ? 'جاري تحديث كلمة المرور...' : 'تحديث كلمة المرور'}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onNavigate('landing')}
                  className="w-full"
                >
                  العودة للرئيسية
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </Layout>
  );
}
