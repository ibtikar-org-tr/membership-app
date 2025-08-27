import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

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
    <Layout title="Login">
      <div className="max-w-md mx-auto">
        <Card title="Member Login">
          <form onSubmit={handleSubmit}>
            <Input
              label="Email, Membership Number, or Admin"
              value={field1}
              onChange={setField1}
              placeholder="Enter your email, membership number, or 'admin'"
              required
              error={error && !field1 ? 'This field is required' : ''}
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Enter your password"
              required
              error={error && !password ? 'This field is required' : ''}
            />

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => onNavigate('forgot')}
                className="w-full"
              >
                Forgot Password?
              </Button>

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
        </Card>
      </div>
    </Layout>
  );
}
