import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { saveAuthState } from '../utils/auth';

interface LoginProps {
  onNavigate: (page: string, data?: any) => void;
}

export function Login({ onNavigate }: LoginProps) {
  const [field1, setField1] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          field1,
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Save authentication state
        saveAuthState({
          isLoggedIn: true,
          userType: data.userType,
          memberInfo: data.memberInfo
        });

        if (data.userType === 'admin') {
          onNavigate('admin');
        } else {
          onNavigate('user-info', { memberInfo: data.memberInfo });
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="تسجيل الدخول">
      <div className="max-w-md mx-auto">
        <Card title="دخول الأعضاء">
          <form onSubmit={handleSubmit}>
            <Input
              label="البريد الإلكتروني أو رقم العضوية أو المدير"
              value={field1}
              onChange={setField1}
              placeholder="أدخل البريد الإلكتروني أو رقم العضوية أو 'admin'"
              required
              error={error && !field1 ? 'هذا الحقل مطلوب' : ''}
            />

            <Input
              label="كلمة المرور"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="أدخل كلمة المرور"
              required
              error={error && !password ? 'هذا الحقل مطلوب' : ''}
            />

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3 items-center">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full hover:cursor-pointer"
              >
                {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => onNavigate('forgot')}
                className="w-1/2 hover:cursor-pointer"
              >
                نسيت كلمة المرور؟
              </Button>

              <button
              type="button"
              onClick={() => onNavigate('landing')}
              className="w-full hover:cursor-pointer text-gray-600 hover:text-gray-800 bg-transparent border-none"
              >
              العودة للرئيسية
              </button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
