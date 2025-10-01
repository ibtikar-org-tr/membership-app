import React from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

interface LandingProps {
  onNavigate: (page: string) => void;
}

export function Landing({ onNavigate }: LandingProps) {
  return (
    <Layout title="Membership App">
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Card title="Member Login">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Access your member account and manage your information
            </p>
            <Button 
              onClick={() => onNavigate('login')}
              className="w-full"
            >
              Login
            </Button>
          </div>
        </Card>

        <Card title="Forgot Password">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Reset your password using your email, phone, or membership number
            </p>
            <Button 
              onClick={() => onNavigate('forgot')}
              variant="secondary"
              className="w-full"
            >
              Reset Information
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Need help? Contact our support team for assistance.
        </p>
      </div>
    </Layout>
  );
}
