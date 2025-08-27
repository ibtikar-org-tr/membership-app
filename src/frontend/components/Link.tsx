import React from 'react';

interface LinkProps {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  data?: any;
}

export function Link({ href, children, onClick, className = '', data }: LinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (onClick) {
      onClick();
    }
    
    // Parse the href to determine navigation
    const url = new URL(href, window.location.origin);
    const path = url.pathname;
    const searchParams = url.searchParams;
    
    // Determine page type from path
    let page: 'landing' | 'login' | 'forgot' | 'reset-password' | 'user-info' | 'admin' = 'landing';
    
    if (path === '/login') page = 'login';
    else if (path === '/forgot-password') page = 'forgot';
    else if (path === '/reset-password') page = 'reset-password';
    else if (path === '/user-info') page = 'user-info';
    else if (path === '/admin') page = 'admin';
    
    // Build page data
    const pageData: any = { ...data };
    if (page === 'reset-password' && searchParams.get('token')) {
      pageData.token = searchParams.get('token');
    }
    
    // Trigger navigation through custom event
    window.dispatchEvent(new CustomEvent('navigate', {
      detail: { page, data: pageData }
    }));
  };
  
  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
