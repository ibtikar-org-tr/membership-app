import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Select } from '../components/Select';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

interface ForgotPasswordProps {
  onNavigate: (page: string) => void;
}

export function ForgotPassword({ onNavigate }: ForgotPasswordProps) {
  const [type, setType] = useState('');
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const typeOptions = [
    { value: 'email', label: 'Email Address' },
    { value: 'phone', label: 'Phone Number' },
    { value: 'membership_number', label: 'Membership Number' }
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
        return 'Enter your email address';
      case 'phone':
        return 'Enter your phone number';
      case 'membership_number':
        return 'Enter your membership number';
      default:
        return 'Select a type first';
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
    <Layout title="Reset Password">
      <div className="max-w-md mx-auto">
        <Card title="Forgot Password">
          {success ? (
            <div className="text-center">
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                <h3 className="font-medium mb-2">Request Submitted</h3>
                <p className="text-sm">
                  If the provided information is valid, a reset link will be sent to your email address.
                </p>
              </div>
              
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => onNavigate('login')}
                  className="w-full"
                >
                  Go to Login
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => onNavigate('landing')}
                  className="w-full"
                >
                  Back to Home
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  Choose how you'd like to reset your password:
                </p>
              </div>

              <Select
                label="Reset Method"
                value={type}
                onChange={setType}
                options={typeOptions}
                placeholder="Select reset method"
                required
              />

              <Input
                label="Enter Information"
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
                  {isLoading ? 'Sending Request...' : 'Send Reset Link'}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onNavigate('login')}
                  className="w-full"
                >
                  Back to Login
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
          )}
        </Card>
      </div>
    </Layout>
  );
}
