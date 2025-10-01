import React from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

interface LandingProps {
  onNavigate: (page: string) => void;
}

export function Landing({ onNavigate }: LandingProps) {
  return (
    <Layout title="تطبيق العضوية">
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Card title="دخول الأعضاء">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              الوصول إلى حساب العضوية وإدارة معلوماتك
            </p>
            <Button 
              onClick={() => onNavigate('login')}
              className="w-full"
            >
              تسجيل الدخول
            </Button>
          </div>
        </Card>

        <Card title="نسيت معلوماتك">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              احصل على معلومات العضوية باستخدام البريد الإلكتروني أو الهاتف أو رقم العضوية
            </p>
            <Button 
              onClick={() => onNavigate('forgot')}
              variant="secondary"
              className="w-full"
            >
              طلب المعلومات
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          تحتاج مساعدة؟ اتصل بفريق الدعم للمساعدة.
        </p>
      </div>
    </Layout>
  );
}
