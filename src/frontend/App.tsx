import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { UserInfo } from './pages/UserInfo';
import { Admin } from './pages/Admin';
import { loadAuthState, clearAuthState } from './utils/auth';

type PageType = 'landing' | 'login' | 'forgot' | 'reset-password' | 'user-info' | 'admin';

interface PageData {
  memberInfo?: any;
  token?: string;
}

interface RouteState {
  page: PageType;
  data?: PageData;
}

export function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('landing');
  const [pageData, setPageData] = useState<PageData>({});

  const navigate = (page: PageType, data?: PageData) => {
    setCurrentPage(page);
    setPageData(data || {});
    
    // Update URL and browser history
    const routes: Record<PageType, string> = {
      'landing': '/',
      'login': '/login',
      'forgot': '/forgot-password',
      'reset-password': '/reset-password',
      'user-info': '/user-info',
      'admin': '/admin'
    };

    const url = routes[page];
    const fullUrl = page === 'reset-password' && data?.token 
      ? `${url}?token=${data.token}` 
      : url;

    const state: RouteState = { page, data };
    window.history.pushState(state, '', fullUrl);
  };

  // Initialize routing from current URL
  useEffect(() => {
    const initializeFromURL = () => {
      const path = window.location.pathname;
      const urlParams = new URLSearchParams(window.location.search);
      
      // Check for existing authentication
      const authState = loadAuthState();
      
      // Parse current URL to determine page
      if (path === '/login') {
        // If already logged in, redirect to appropriate page
        if (authState?.isLoggedIn) {
          if (authState.userType === 'admin') {
            setCurrentPage('admin');
            setTimeout(() => navigate('admin'), 0);
          } else {
            setCurrentPage('user-info');
            setPageData({ memberInfo: authState.memberInfo });
            setTimeout(() => navigate('user-info', { memberInfo: authState.memberInfo }), 0);
          }
        } else {
          setCurrentPage('login');
        }
      } else if (path === '/forgot-password') {
        setCurrentPage('forgot');
      } else if (path === '/reset-password') {
        const token = urlParams.get('token');
        setCurrentPage('reset-password');
        setPageData({ token: token || undefined });
      } else if (path === '/user-info') {
        // Protected route - check authentication
        if (authState?.isLoggedIn && authState.userType === 'member') {
          setCurrentPage('user-info');
          setPageData({ memberInfo: authState.memberInfo });
        } else {
          setCurrentPage('login');
          setTimeout(() => navigate('login'), 0);
        }
      } else if (path === '/admin') {
        // Protected route - check admin authentication
        if (authState?.isLoggedIn && authState.userType === 'admin') {
          setCurrentPage('admin');
        } else {
          setCurrentPage('login');
          setTimeout(() => navigate('login'), 0);
        }
      } else {
        // Landing page
        if (authState?.isLoggedIn) {
          // Redirect logged-in users to their dashboard
          if (authState.userType === 'admin') {
            setCurrentPage('admin');
            setTimeout(() => navigate('admin'), 0);
          } else {
            setCurrentPage('user-info');
            setPageData({ memberInfo: authState.memberInfo });
            setTimeout(() => navigate('user-info', { memberInfo: authState.memberInfo }), 0);
          }
        } else {
          setCurrentPage('landing');
        }
      }
    };

    // Initialize on load
    initializeFromURL();

    // Handle browser back/forward
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as RouteState;
      if (state) {
        setCurrentPage(state.page);
        setPageData(state.data || {});
      } else {
        initializeFromURL();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
