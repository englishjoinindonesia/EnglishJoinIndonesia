import React from 'react';
import { UserRole } from '../../types';
import { AuthPage, AuthMode } from './AuthPage';

interface LoginPageProps {
  onLoginSuccess?: (role: UserRole) => void;
  onBackToLanding?: () => void;
  initialMode?: AuthMode;
  onNavigate?: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ 
  onLoginSuccess, 
  onBackToLanding,
  initialMode = 'sign-in',
  onNavigate
}) => {
  return (
    <AuthPage
      initialMode={initialMode}
      onNavigate={(path) => {
        if (path === '/' && onBackToLanding) {
          onBackToLanding();
        } else if (onNavigate) {
          onNavigate(path);
        } else if (typeof window !== 'undefined') {
          const target = path.startsWith('/') ? path : '/' + path;
          if (target === '/') {
            window.history.replaceState(null, '', window.location.pathname);
          } else {
            window.location.hash = '#' + target;
          }
          window.dispatchEvent(new Event('hashchange'));
        }
      }}
      onSuccessRedirect={() => {
        if (onLoginSuccess) {
          onLoginSuccess('student');
        }
      }}
    />
  );
};
