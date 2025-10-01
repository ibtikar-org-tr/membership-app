import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Select } from '../components/Select';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

interface ForgotInfoProps {
  onNavigate: (page: string) => void;
}

export function ForgotInfo({ onNavigate }: ForgotInfoProps) {
  const [type, setType] = useState('');
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const typeOptions = [
    { value: 'email', label: 'البريد الإلكتروني' },
    { value: 'phone', label: 'رقم الهاتف' },
    { value: 'membership_number', label: 'رقم العضوية' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          value,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Request failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPlaceholder = () => {
    switch (type) {
      case 'email':
        return 'أدخل البريد الإلكتروني';
      case 'phone':
        return 'أدخل رقم الهاتف';
      case 'membership_number':
        return 'أدخل رقم العضوية';
      default:
        return 'اختر النوع أولاً';
    }
  };

  const getInputType = () => {
    switch (type) {
      case 'email':
        return 'email';
      case 'phone':
        return 'tel';
      default:
        return 'text';
    }
  };

  return (
    <Layout title="طلب معلومات العضوية">
      <div className="max-w-md mx-auto">
        <Card title="نسيت معلومات العضوية">
          {success ? (
            <div className="text-center">
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                <h3 className="font-medium mb-2">تم إرسال الطلب</h3>
                <p className="text-sm">
                  إذا كانت المعلومات المقدمة صحيحة، سيتم إرسال تفاصيل العضوية إلى عنوان بريدك الإلكتروني.
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
                <p className="text-sm text-gray-600 mb-4">
                  اختر كيف تريد الحصول على معلومات العضوية:
                </p>
              </div>

              <Select
                label="طريقة التعريف"
                value={type}
                onChange={setType}
                options={typeOptions}
                placeholder="اختر طريقة التعريف"
                required
              />

              <Input
                label="أدخل المعلومات"
                type={getInputType()}
                value={value}
                onChange={setValue}
                placeholder={getPlaceholder()}
                required
                disabled={!type}
              />

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={isLoading || !type || !value}
                  className="w-full"
                >
                  {isLoading ? 'Sending Request...' : 'Send Membership Information'}
                </Button>

                {/* <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onNavigate('login')}
                  className="w-full"
                >
                  Back to Login
                </Button> */}

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onNavigate('landing')}
                  className="w-full"
                >
                  Back to Home
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </Layout>
  );
}
