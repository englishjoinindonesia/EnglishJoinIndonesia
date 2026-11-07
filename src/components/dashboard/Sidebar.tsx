import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, Users, BookOpen, Settings2, HelpCircle, 
  PlayCircle, Award, LogOut, ShieldCheck, User, GraduationCap, Building2,
  PanelLeftClose, PanelLeftOpen, UserCheck
} from 'lucide-react';
import { UserRole } from '../../types';
import { Logo } from '../common/Logo';
import logoSymbolImg from '../../assets/images/logo_symbol.png';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { getPendingAccountRequestsCount } from '../../lib/accountAccessService';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
  onRoleChange?: (role: UserRole) => void;
  onExit: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  onExit,
  isCollapsed: propIsCollapsed,
  onToggleCollapse
}) => {
  const { isDark } = useTheme();
  const { t, language } = useLanguage();
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);

  useEffect(() => {
    const updateCount = () => {
      setPendingApprovalsCount(getPendingAccountRequestsCount());
    };
    updateCount();

    window.addEventListener('ej_account_requests_updated', updateCount);
    window.addEventListener('storage', updateCount);
    return () => {
      window.removeEventListener('ej_account_requests_updated', updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, []);

  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dashboard_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : internalCollapsed;

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('dashboard_sidebar_collapsed', String(next));
        } catch {
          // ignore
        }
        return next;
      });
    }
  };

  const adminNavItems = [
    { id: 'overview', label: t.dashboard.sidebar.overview, icon: LayoutGrid },
    { 
      id: 'account_access', 
      label: language === 'id' ? 'Akses Akun' : 'Account Access', 
      icon: UserCheck,
      badge: pendingApprovalsCount
    },
    { id: 'students', label: t.dashboard.sidebar.students, icon: Users },
    { id: 'programs', label: t.dashboard.sidebar.programs, icon: BookOpen },
    { id: 'mentors', label: t.dashboard.sidebar.mentors, icon: GraduationCap },
    { id: 'campus_logos', label: language === 'id' ? 'Logo Kampus Alumni' : 'Alumni Campus Logos', icon: Building2 },
    { id: 'questions', label: t.dashboard.sidebar.questions, icon: HelpCircle },
    { id: 'score_settings', label: t.dashboard.sidebar.scoreSettings, icon: Settings2 },
  ];

  const studentNavItems = [
    { id: 'student_test', label: t.dashboard.sidebar.studentTest, icon: PlayCircle },
    { id: 'student_scores', label: t.dashboard.sidebar.studentScores, icon: Award },
  ];

  const navItems = userRole === 'admin' ? adminNavItems : studentNavItems;

  return (
    <aside 
      style={{
        transitionProperty: 'width, padding',
        transitionDuration: '300ms',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'width'
      }}
      className={`${
        isCollapsed ? 'w-20 px-3 py-4' : 'w-64 p-5'
      } flex-shrink-0 flex flex-col justify-between select-none z-20 overflow-x-hidden transition-all duration-300 ease-in-out ${
        isDark 
          ? 'bg-[#0E0E0E] text-white border-r border-white/10 shadow-2xl' 
          : 'bg-white text-slate-900 border-r border-slate-200 shadow-md'
      }`}
    >
      <div>
        {/* Brand Logo Display & Minimizer Button */}
        <div className={`flex items-center mb-6 pt-1 pb-2 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'flex-col gap-3 justify-center' : 'justify-between'
        }`}>
          {isCollapsed ? (
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-300 select-none"
              title="English Join Indonesia"
              onClick={handleToggle}
            >
              <img 
                src={logoSymbolImg} 
                alt="English Join Indonesia" 
                style={{
                  transitionDuration: '300ms',
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                className="w-9 h-9 object-contain drop-shadow-md transition-all duration-300 ease-in-out" 
              />
            </div>
          ) : (
            <div className="flex items-center overflow-hidden transition-opacity duration-300 ease-in-out">
              <Logo size="md" className="h-10 w-auto" />
            </div>
          )}

          {/* Sidebar Minimizer Button */}
          <button
            type="button"
            onClick={handleToggle}
            style={{
              transitionDuration: '300ms',
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            className={`p-2 rounded-xl transition-all duration-300 ease-in-out cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 ${
              isDark 
                ? 'bg-white/5 hover:bg-[#F7B425] hover:text-black text-slate-300 border border-white/10 shadow-xs' 
                : 'bg-slate-100 hover:bg-[#F7B425] hover:text-black text-slate-700 border border-slate-200 shadow-xs'
            }`}
            title={isCollapsed 
              ? (language === 'id' ? 'Perluas Sidebar' : 'Expand Sidebar') 
              : (language === 'id' ? 'Perkecil Sidebar' : 'Minimize Sidebar')
            }
            aria-label="Toggle Sidebar Minimizer"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 transition-transform duration-300" />
            ) : (
              <PanelLeftClose className="w-4 h-4 transition-transform duration-300" />
            )}
          </button>
        </div>

        {/* Dedicated Active Role Badge Card */}
        <div 
          style={{ borderRadius: '12px' }}
          className={`mb-6 p-2.5 rounded-xl flex items-center transition-all duration-300 ease-in-out overflow-hidden ${
            isCollapsed ? 'justify-center' : 'gap-2.5'
          } ${
            isDark 
              ? 'bg-[#181818] border border-white/10 shadow-inner' 
              : 'bg-slate-100/90 border border-slate-200/90 shadow-xs'
          }`}
          title={`${userRole === 'admin' ? t.dashboard.sidebar.administrator : t.dashboard.sidebar.student} (${t.dashboard.sidebar.portalAccess})`}
        >
          <div className="w-8 h-8 rounded-xl bg-[#F7B425] text-black flex items-center justify-center flex-shrink-0 shadow-sm font-black transition-transform duration-300">
            {userRole === 'admin' ? (
              <ShieldCheck className="w-4 h-4" />
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
          <div className={`min-w-0 transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden ${
            isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[180px] opacity-100 ml-1'
          }`}>
            <span className={`text-[9px] font-extrabold uppercase tracking-wider block ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              {t.dashboard.sidebar.portalAccess}
            </span>
            <span className={`text-xs font-bold block truncate font-heading ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {userRole === 'admin' ? t.dashboard.sidebar.administrator : t.dashboard.sidebar.student}
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const hasBadge = 'badge' in item && typeof item.badge === 'number' && item.badge > 0;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={item.label}
                style={{ borderRadius: '12px' }}
                className={`w-full flex items-center relative overflow-hidden ${
                  isCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3.5 py-3'
                } rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 ease-in-out text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#F7B425] text-black font-black shadow-lg shadow-[#F7B425]/25 scale-[1.02]'
                    : isDark
                      ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <div className="relative shrink-0 flex items-center justify-center">
                  <Icon className={`w-4 h-4 flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-black' : isDark ? 'text-[#F7B425]' : 'text-[#D97706]'}`} />
                  {isCollapsed && hasBadge && (
                    <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-amber-500 border-2 border-black rounded-full animate-ping" />
                  )}
                  {isCollapsed && hasBadge && (
                    <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-amber-500 border-2 border-black rounded-full" />
                  )}
                </div>
                
                <span className={`truncate text-[12px] flex-1 whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
                  isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[160px] opacity-100'
                }`}>
                  {item.label}
                </span>

                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isCollapsed || !hasBadge ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[60px] opacity-100'
                }`}>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider transition-colors ${
                    isActive 
                      ? 'bg-black text-[#F7B425]' 
                      : 'bg-[#F7B425] text-black shadow-xs'
                  }`}>
                    {'badge' in item ? (item as any).badge : null}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Info & Exit */}
      <div className={`pt-4 border-t transition-colors duration-300 ${
        isDark ? 'border-white/10' : 'border-slate-200'
      }`}>
        <button
          onClick={onExit}
          title={t.dashboard.sidebar.exitToHome}
          className={`w-full flex items-center overflow-hidden ${
            isCollapsed ? 'justify-center px-0' : 'gap-3 px-3.5'
          } py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-300 ease-in-out cursor-pointer ${
            isDark 
              ? 'text-slate-400 hover:text-[#F7B425] hover:bg-white/5' 
              : 'text-slate-500 hover:text-slate-950 hover:bg-slate-100'
          }`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0 transition-colors duration-200" />
          <span 
            className={`text-[12px] font-bold whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${
              isCollapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[160px] opacity-100'
            }`}
            style={{ fontSize: '12px', fontWeight: 'bold' }}
          >
            {t.dashboard.sidebar.exitToHome}
          </span>
        </button>
      </div>
    </aside>
  );
};


