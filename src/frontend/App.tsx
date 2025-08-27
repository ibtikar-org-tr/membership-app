import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { UserInfo } from './pages/UserInfo';
import { Admin } from './pages/Admin';

type PageType = 'landing' | 'login' | 'forgot' | 'reset-password' | 'user-info' | 'admin';

interface PageData {
  memberInfo?: any;
  token?: string;
}

export function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('landing');
  const [pageData, setPageData] = useState<PageData>({});

  useEffect(() => {
    // Check URL for reset password token
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setCurrentPage('reset-password');
      setPageData({ token });
    }
  }, []);

  const navigate = (page: PageType, data?: PageData) => {
    setCurrentPage(page);
    if (data) {
      setPageData(data);
    }
    
    // Update URL for reset password page
    if (page === 'reset-password' && data?.token) {
      window.history.pushState({}, '', `?token=${data.token}`);
    } else if (page !== 'reset-password') {
      window.history.pushState({}, '', '/');
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <Login onNavigate={navigate} />;
      case 'forgot':
        return <ForgotPassword onNavigate={navigate} />;
      case 'reset-password':
        return <ResetPassword onNavigate={navigate} token={pageData.token} />;
      case 'user-info':
        return <UserInfo onNavigate={navigate} initialMemberInfo={pageData.memberInfo} />;
      case 'admin':
        return <Admin onNavigate={navigate} />;
      default:
        return <Landing onNavigate={navigate} />;
    }
  };

  return (
    <ErrorBoundary>
      {renderPage()}
    </ErrorBoundary>
  );
}
