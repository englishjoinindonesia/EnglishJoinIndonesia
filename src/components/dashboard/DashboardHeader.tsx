import React from 'react';
import { ShieldCheck, User, Sun, Moon } from 'lucide-react';
import { UserRole } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { LanguageToggle } from '../common/LanguageToggle';

interface DashboardHeaderProps {
  title: string;
  userRole: UserRole;
  onExit?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  userRole
}) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const displayName = user?.user_metadata?.full_name 
    || (userRole === 'admin' 
        ? 'Sir Alwi (Admin)' 
        : (user?.email 
            ? user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1) 
            : 'Muhammad Ihsan'));

  return (
    <header className={`px-6 sm:px-8 py-3 sm:py-3.5 flex items-center justify-end gap-4 sticky top-0 z-10 transition-colors duration-200 backdrop-blur-md ${
      isDark 
        ? 'bg-[#0E0E0E]/95 border-b border-white/10 text-white' 
        : 'bg-white/95 border-b border-slate-200 text-slate-900 shadow-xs'
    }`}>
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Language Toggle ID - EN (Matching screenshot) */}
        <LanguageToggle size="sm" />

        {/* Light-Mode / Dark-Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          title={isDark ? (language === 'id' ? 'Beralih ke Light Mode' : 'Switch to Light Mode') : (language === 'id' ? 'Beralih ke Dark Mode' : 'Switch to Dark Mode')}
          aria-label={isDark ? 'Light Mode' : 'Dark Mode'}
          className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs ${
            isDark
              ? 'bg-[#181818] border border-white/10 text-slate-300 hover:text-[#F7B425] hover:border-[#F7B425]/40'
              : 'bg-slate-100 border border-slate-200 text-slate-700 hover:text-amber-700 hover:border-amber-400'
          }`}
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-[#F7B425]" />
              <span className="hidden md:inline font-bold text-[#F7B425]">{t.dashboard.header.lightMode}</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-700" />
              <span className="hidden md:inline font-bold text-slate-800">{t.dashboard.header.darkMode}</span>
            </>
          )}
        </button>

        {/* Profile Tag */}
        <div className={`flex items-center gap-2.5 pl-2 py-1.5 px-3 rounded-2xl transition-colors ${
          isDark 
            ? 'bg-[#181818] border border-white/10 shadow-sm' 
            : 'bg-slate-100 border border-slate-200 shadow-xs'
        }`}>
          <div className="w-8 h-8 rounded-xl bg-[#F7B425] text-black flex items-center justify-center font-black text-xs shadow-sm flex-shrink-0">
            {userRole === 'admin' ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
          </div>
          <div className="hidden sm:block text-left">
            <span className={`block text-xs font-bold leading-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {displayName}
            </span>
            <span className={`block text-[10px] font-medium font-sans ${
              isDark ? 'text-[#F7B425]' : 'text-amber-700 font-bold'
            }`}>
              {userRole === 'admin' ? t.dashboard.header.academicAdmin : t.dashboard.header.toeflStudent}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};


