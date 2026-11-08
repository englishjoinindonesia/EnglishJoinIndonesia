/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HeroSection } from './components/landing/HeroSection';
import { CampusCarouselSection } from './components/landing/CampusCarouselSection';
import { WhyChooseUs } from './components/landing/WhyChooseUs';
import { ProgramsSection } from './components/landing/ProgramsSection';
import { MotivationQuote } from './components/landing/MotivationQuote';
import { LearningProcess } from './components/landing/LearningProcess';
import { MentorsSection } from './components/landing/MentorsSection';
import { StudentTestimonials } from './components/landing/StudentTestimonials';
import { FaqSection } from './components/landing/FaqSection';
import { CtaSection } from './components/landing/CtaSection';
import { LevelQuizModal } from './components/modals/LevelQuizModal';
import { FloatingWhatsApp } from './components/common/FloatingWhatsApp';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { AuthPage, AuthMode } from './components/auth/AuthPage';
import { ProgramsProvider } from './context/ProgramsContext';
import { MentorsProvider } from './context/MentorsContext';
import { CampusLogosProvider } from './context/CampusLogosContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';

const getPathFromUrl = (): string => {
  if (typeof window === 'undefined') return '/';
  const hash = window.location.hash;
  if (hash && hash.length > 1) {
    const clean = hash.replace(/^#\/?/, '/');
    return clean.startsWith('/') ? clean : '/' + clean;
  }
  const pathname = window.location.pathname;
  if (pathname && pathname !== '/' && pathname !== '/index.html') {
    try {
      const cleanPath = pathname.startsWith('/') ? pathname : '/' + pathname;
      window.history.replaceState(null, '', '/#' + cleanPath);
      return cleanPath;
    } catch {
      // Ignore fallback
    }
    return pathname;
  }
  return '/';
};

function AppContent() {
  const { user, role, loading, signOut } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => getPathFromUrl());
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(getPathFromUrl());
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);

    // Ensure state matches current URL on mount
    setCurrentPath(getPathFromUrl());

    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      const normalized = path.startsWith('/') ? path : '/' + path;
      const targetHash = normalized === '/' ? '' : '#' + normalized;

      if (normalized === '/') {
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      } else {
        if (window.location.hash !== targetHash) {
          window.location.hash = targetHash;
        }
      }
      setCurrentPath(normalized);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenRegister = () => {
    navigate('/sign-up');
  };

  const handleOpenLogin = () => {
    navigate('/sign-in');
  };

  const handleOpenQuiz = () => {
    setIsQuizOpen(true);
  };

  const handleSelectFromQuiz = () => {
    setIsQuizOpen(false);
    navigate('/sign-up');
  };

  const handleSignOutAndExit = async () => {
    await signOut();
    navigate('/');
  };

  // 1. Loading state while Supabase session initialises (prevents signed-out flash)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-slate-100">
        <div className="w-9 h-9 border-3 border-[#F7B425] border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
          English Join Indonesia
        </span>
      </div>
    );
  }

  // 2. Specific Auth Routes
  if (currentPath === '/sign-in') {
    if (user) {
      navigate('/dashboard');
      return null;
    }
    return (
      <AuthPage 
        initialMode="sign-in" 
        onNavigate={navigate} 
        onSuccessRedirect={() => navigate('/dashboard')}
      />
    );
  }

  if (currentPath === '/sign-up') {
    if (user) {
      navigate('/dashboard');
      return null;
    }
    return (
      <AuthPage 
        initialMode="sign-up" 
        onNavigate={navigate} 
        onSuccessRedirect={() => navigate('/dashboard')}
      />
    );
  }

  if (currentPath === '/forgot-password') {
    return (
      <AuthPage 
        initialMode="forgot-password" 
        onNavigate={navigate}
      />
    );
  }

  if (currentPath === '/update-password') {
    return (
      <AuthPage 
        initialMode="update-password" 
        onNavigate={navigate}
        onSuccessRedirect={() => navigate('/dashboard')}
      />
    );
  }

  // 3. Protected Dashboard Area
  if (currentPath === '/dashboard') {
    if (!user) {
      navigate('/sign-in');
      return null;
    }
    return (
      <AdminDashboard 
        initialRole={role}
        onExit={handleSignOutAndExit} 
      />
    );
  }

  // 4. Public Landing Site (Default)
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-100 font-sans selection:bg-[#F7B425] selection:text-black">
      {/* Sticky Navigation Bar */}
      <Navbar
        onOpenRegister={handleOpenRegister}
        onOpenQuiz={handleOpenQuiz}
        onOpenLogin={user ? () => navigate('/dashboard') : handleOpenLogin}
      />

      <main>
        {/* 2. Hero Section */}
        <HeroSection
          onOpenRegister={handleOpenRegister}
          onOpenQuiz={handleOpenQuiz}
          onOpenLogin={user ? () => navigate('/dashboard') : handleOpenLogin}
        />

        {/* Carousel Logo Kampus Alumni */}
        <CampusCarouselSection />

        {/* 3. Why Choose English Join Indonesia */}
        <WhyChooseUs
          onOpenRegister={handleOpenRegister}
        />

        {/* 4. Programs Section */}
        <ProgramsSection
          onOpenRegister={handleOpenRegister}
        />

        {/* 5. Motivation / Quote Section */}
        <MotivationQuote />

        {/* 6. Learning Process Section */}
        <LearningProcess
          onOpenRegister={handleOpenRegister}
        />

        {/* Dedicated Mentors & Instructors Section */}
        <MentorsSection
          onOpenRegister={handleOpenRegister}
        />

        {/* 7. Student Testimonials */}
        <StudentTestimonials />

        {/* FAQ Section */}
        <FaqSection />

        {/* 8. Call to Action (CTA) Section */}
        <CtaSection
          onOpenRegister={handleOpenRegister}
          onOpenQuiz={handleOpenQuiz}
        />
      </main>

      {/* 9. Footer */}
      <Footer 
        onOpenRegister={handleOpenRegister} 
        onOpenLogin={user ? () => navigate('/dashboard') : handleOpenLogin}
      />

      {/* Floating WhatsApp Quick Action */}
      <FloatingWhatsApp />

      {/* Interactive Level Placement & Goal Quiz Modal */}
      <LevelQuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        onSelectProgram={handleSelectFromQuiz}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <ProgramsProvider>
            <MentorsProvider>
              <CampusLogosProvider>
                <AppContent />
              </CampusLogosProvider>
            </MentorsProvider>
          </ProgramsProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
