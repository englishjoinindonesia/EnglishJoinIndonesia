import React, { useState } from 'react';
import { UserRole } from '../../types';
import { Sidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';
import { OverviewTab } from './OverviewTab';
import { StudentRegistrationsTab } from './StudentRegistrationsTab';
import { ProgramsManagementTab } from './ProgramsManagementTab';
import { ScoreSettingsTab } from './ScoreSettingsTab';
import { ToeflQuestionsTab } from './ToeflQuestionsTab';
import { MentorsManagementTab } from './MentorsManagementTab';
import { CampusLogosManagementTab } from './CampusLogosManagementTab';
import { StudentTestSimulationTab } from './StudentTestSimulationTab';
import { StudentScoresAndCertificateTab } from './StudentScoresAndCertificateTab';
import { ProjectsTab } from './ProjectsTab';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface AdminDashboardProps {
  initialRole?: UserRole;
  onExit: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  initialRole = 'admin', 
  onExit 
}) => {
  const { isDark } = useTheme();
  const { tr } = useLanguage();
  const [currentRole] = useState<UserRole>(initialRole);
  const [activeTab, setActiveTab] = useState<string>(
    initialRole === 'student' ? 'student_test' : 'overview'
  );

  const getTabTitle = () => {
    switch (activeTab) {
      case 'overview':
        return tr('Ringkasan & Dashboard Utama', 'Overview & Main Dashboard');
      case 'projects':
        return tr('Proyek Saya', 'My Projects');
      case 'students':
        return tr('Tabel Data Pendaftar TOEFL Student', 'TOEFL Student Registration Data');
      case 'programs':
        return currentRole === 'admin' 
          ? tr('Program-Program di English Join Indonesia', 'Programs at English Join Indonesia')
          : tr('Pilihan Program Kursus', 'Available Course Programs');
      case 'mentors':
        return tr('Kelola Tim Mentor & Coach', 'Manage Mentors & Coaches Team');
      case 'campus_logos':
        return tr('Kelola Logo Kampus Alumni', 'Manage Alumni Campus Logos');
      case 'questions':
        return tr('Bank Soal-Soal Test TOEFL', 'TOEFL Test Question Bank');
      case 'score_settings':
        return tr('Pengaturan Score Test TOEFL', 'TOEFL Test Score Settings');
      case 'student_test':
        return tr('Simulasi Ujian TOEFL Online', 'Online TOEFL Exam Simulation');
      case 'student_scores':
        return tr('Riwayat Nilai & E-Certificate', 'Score History & E-Certificate');
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className={`dashboard-root font-['Poppins',sans-serif] flex h-screen w-screen overflow-hidden antialiased transition-colors duration-200 ${
      isDark ? 'bg-[#0B0B0B] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* LEFT SIDEBAR */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={currentRole}
        onExit={onExit}
      />

      {/* RIGHT CONTENT AREA */}
      <div className={`flex-1 flex flex-col overflow-y-auto transition-colors duration-200 ${
        isDark ? 'bg-[#0B0B0B]' : 'bg-slate-50'
      }`}>
        
        {/* TOP HEADER */}
        <DashboardHeader
          title={getTabTitle()}
          userRole={currentRole}
        />

        {/* MAIN BODY VIEW CONTAINER */}
        <main className={`p-1.5 sm:p-2.5 flex-1 transition-colors duration-200 ${
          isDark ? 'bg-[#0B0B0B]' : 'bg-slate-50'
        }`}>
          {activeTab === 'overview' && (
            <OverviewTab onNavigateTab={(tab) => setActiveTab(tab)} />
          )}

          {activeTab === 'projects' && (
            <ProjectsTab />
          )}

          {activeTab === 'students' && (
            <StudentRegistrationsTab />
          )}

          {activeTab === 'programs' && (
            <ProgramsManagementTab />
          )}

          {activeTab === 'mentors' && (
            <MentorsManagementTab />
          )}

          {activeTab === 'campus_logos' && (
            <CampusLogosManagementTab />
          )}

          {activeTab === 'questions' && (
            <ToeflQuestionsTab />
          )}

          {activeTab === 'score_settings' && (
            <ScoreSettingsTab />
          )}

          {activeTab === 'student_test' && (
            <StudentTestSimulationTab />
          )}

          {activeTab === 'student_scores' && (
            <StudentScoresAndCertificateTab />
          )}
        </main>

      </div>

    </div>
  );
};

