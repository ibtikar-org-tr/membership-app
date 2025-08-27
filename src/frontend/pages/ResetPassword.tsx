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
        setError('Invalid or missing reset token');
        setIsValidToken(false);
      }
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
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
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <Layout title="Reset Password">
        <div className="max-w-md mx-auto">
          <Card title="Invalid Token">
            <div className="text-center">
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                <p>The password reset link is invalid or has expired.</p>
              </div>
              
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => onNavigate('forgot')}
                  className="w-full"
                >
                  Request New Reset Link
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
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Reset Password">
      <div className="max-w-md mx-auto">
        <Card title="Reset Your Password">
          {success ? (
            <div className="text-center">
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                <h3 className="font-medium mb-2">Password Updated Successfully</h3>
                <p className="text-sm">
                  Your password has been updated for both the membership system and Moodle LMS.
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
                <p className="text-sm text-gray-600">
                  Please enter your new password below.
                </p>
              </div>

              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Enter your new password"
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Confirm your new password"
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
                  {isLoading ? 'Updating Password...' : 'Update Password'}
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
