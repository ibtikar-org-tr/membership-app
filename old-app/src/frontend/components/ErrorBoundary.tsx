import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from './Card';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <Card title="حدث خطأ ما" className="max-w-md w-full">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                حدث خطأ غير متوقع. يرجى إعادة تحميل الصفحة.
              </p>
              
              {this.state.error && (
                <details className="mb-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 mb-2">
                    تفاصيل الخطأ
                  </summary>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              
              <Button onClick={this.handleReload} className="w-full">
                إعادة تحميل الصفحة
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
