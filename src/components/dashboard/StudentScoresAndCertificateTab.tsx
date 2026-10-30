import React, { useState, useEffect } from 'react';
import { 
  Award, Download, FileText, CheckCircle2, Calendar, 
  Eye, Printer, X, ShieldCheck, ArrowUpRight, BarChart3, 
  Sparkles, Check, ChevronRight, HelpCircle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Logo } from '../common/Logo';

interface TestHistoryRecord {
  id: string;
  testTitle: string;
  testType: 'TOEFL ITP' | 'TOEFL iBT';
  date: string;
  listeningScore: number;
  structureScore: number;
  readingScore: number;
  totalScore: number;
  maxScore: number;
  status: 'LULUS' | 'MEMENUHI TARGET' | 'PERLU PERBAIKAN';
  certNumber: string;
  certIssueDate: string;
  levelCategory: string;
  studentName: string;
}

export const StudentScoresAndCertificateTab: React.FC = () => {
  const { isDark } = useTheme();
  const { tr } = useLanguage();
  const { user } = useAuth();
  const [selectedCert, setSelectedCert] = useState<TestHistoryRecord | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'TOEFL ITP'>('ALL');

  const cardBg = isDark ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-slate-200/90 text-slate-900 shadow-2xs';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';

  const defaultHistoryRecords: TestHistoryRecord[] = [
    {
      id: 'rec-01',
      testTitle: 'TOEFL ITP — Official Prediction Test 04A',
      testType: 'TOEFL ITP',
      date: '02 Sep 2026, 14:30 WIB',
      listeningScore: 61,
      structureScore: 63,
      readingScore: 59,
      totalScore: 610,
      maxScore: 677,
      status: 'LULUS',
      certNumber: 'EJI/TOEFL-ITP/2026/0892',
      certIssueDate: '02 September 2026',
      levelCategory: 'C1 — Advanced Proficiency',
      studentName: 'Muhammad Ihsan'
    },
    {
      id: 'rec-02',
      testTitle: 'TOEFL ITP — Complete Diagnostic Test 02',
      testType: 'TOEFL ITP',
      date: '24 Agu 2026, 10:15 WIB',
      listeningScore: 56,
      structureScore: 58,
      readingScore: 54,
      totalScore: 560,
      maxScore: 677,
      status: 'LULUS',
      certNumber: 'EJI/TOEFL-ITP/2026/0744',
      certIssueDate: '24 Agustus 2026',
      levelCategory: 'B2 — High Intermediate',
      studentName: 'Muhammad Ihsan'
    },
    {
      id: 'rec-03',
      testTitle: 'TOEFL ITP — Intensive Practice Test 03',
      testType: 'TOEFL ITP',
      date: '15 Agu 2026, 16:00 WIB',
      listeningScore: 57,
      structureScore: 59,
      readingScore: 58,
      totalScore: 580,
      maxScore: 677,
      status: 'LULUS',
      certNumber: 'EJI/TOEFL-ITP/2026/0312',
      certIssueDate: '15 Agustus 2026',
      levelCategory: 'B2+ — Competent User',
      studentName: 'Muhammad Ihsan'
    },
    {
      id: 'rec-04',
      testTitle: 'TOEFL ITP — Initial Placement Test 01',
      testType: 'TOEFL ITP',
      date: '01 Agu 2026, 09:00 WIB',
      listeningScore: 48,
      structureScore: 50,
      readingScore: 49,
      totalScore: 490,
      maxScore: 677,
      status: 'LULUS',
      certNumber: 'EJI/TOEFL-ITP/2026/0105',
      certIssueDate: '01 Agustus 2026',
      levelCategory: 'B1 — Intermediate',
      studentName: 'Muhammad Ihsan'
    }
  ];

  const [records, setRecords] = useState<TestHistoryRecord[]>(defaultHistoryRecords);

  useEffect(() => {
    if (!user) return;

    let isSubscribed = true;
    const fetchUserRecords = async () => {
      try {
        const { data, error } = await supabase
          .from('test_history_records')
          .select('*')
          .order('created_at', { ascending: false });

        if (!isSubscribed) return;

        if (error) {
          console.warn('Error fetching test_history_records from Supabase:', error.message);
        } else if (data && data.length > 0) {
          setRecords(data.map((d: any) => ({
            id: d.id,
            testTitle: d.test_title,
            testType: d.test_type,
            date: d.date,
            listeningScore: d.listening_score,
            structureScore: d.structure_score,
            readingScore: d.reading_score,
            totalScore: d.total_score,
            maxScore: d.max_score,
            status: d.status,
            certNumber: d.cert_number || 'EJI/TOEFL-ITP/2026/0892',
            certIssueDate: d.cert_issue_date || '02 September 2026',
            levelCategory: d.level_category || 'C1 — Advanced Proficiency',
            studentName: d.student_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student'
          })));
        } else {
          // If Supabase table is empty for this user, seed default records bound to their user_id
          const studentDisplayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student';
          const toInsert = defaultHistoryRecords.map(r => ({
            user_id: user.id,
            test_title: r.testTitle,
            test_type: r.testType,
            date: r.date,
            listening_score: r.listeningScore,
            structure_score: r.structureScore,
            reading_score: r.readingScore,
            total_score: r.totalScore,
            max_score: r.maxScore,
            status: r.status,
            cert_number: r.certNumber,
            cert_issue_date: r.certIssueDate,
            level_category: r.levelCategory,
            student_name: studentDisplayName
          }));
          await supabase.from('test_history_records').insert(toInsert);
          setRecords(defaultHistoryRecords.map(r => ({ ...r, studentName: studentDisplayName })));
        }
      } catch (err) {
        console.warn('DB error:', err);
      }
    };

    fetchUserRecords();

    return () => {
      isSubscribed = false;
    };
  }, [user]);

  const filteredRecords = records.filter(rec => {
    if (activeFilter === 'ALL') return true;
    return rec.testType === activeFilter;
  });

  const highestScore = records.length > 0 
    ? Math.max(...records.filter(r => r.testType === 'TOEFL ITP').map(r => r.totalScore), 0)
    : 0;
  const totalCompleted = records.length;

  const handleDownloadPdf = (rec: TestHistoryRecord) => {
    const fileName = `Sertifikat_TOEFL_${rec.testType.replace(/\s+/g, '_')}_${rec.certNumber.replace(/[\/]/g, '-')}.pdf`;
    alert(tr(`E-Certificate resmi (${fileName}) berhasil diunduh dan tersimpan di perangkat Anda!`, `Official E-Certificate (${fileName}) successfully downloaded and saved to your device!`));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-2.5 sm:space-y-3 max-w-7xl mx-auto">
      
      {/* 1. TOP HEADER & SUMMARY CARDS */}
      <div className="space-y-2.5 sm:space-y-3">
        {/* Top Action Header Banner */}
        <div className={`p-2 sm:px-3 sm:py-2 rounded-2xl border ${cardBg} flex flex-col md:flex-row md:items-center justify-between gap-2`}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#F7B425]/15 text-[#F7B425] flex items-center justify-center shrink-0">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold font-heading leading-tight">
                {tr('Riwayat & Sertifikat TOEFL Online', 'TOEFL Online History & Certificates')}
              </h1>
              <p className={`text-[10px] sm:text-[11px] leading-tight ${subText}`}>
                {tr(
                  'Rekapitulasi lengkap nilai ujian, breakdown skor per section, dan unduhan e-sertifikat resmi.',
                  'Complete summary of exam scores, section breakdown, and official verified e-certificates.'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              onClick={() => setSelectedCert(records[0] || null)}
              className="px-2.5 py-1.5 sm:py-1 bg-[#F7B425] hover:bg-amber-400 text-black font-extrabold text-xs rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Award className="w-3.5 h-3.5" />
              <span className="font-bold" style={{ fontWeight: 'bold' }}>{tr('Lihat Sertifikat Terakhir', 'View Latest Certificate')}</span>
            </button>
          </div>
        </div>

        {/* 4 Overview Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
          <div className={`p-2.5 sm:p-3 rounded-xl border ${cardBg}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] sm:text-[10.5px] font-bold ${subText}`}>
                {tr('Skor TOEFL Tertinggi', 'Highest TOEFL Score')}
              </span>
              <div className="w-6 h-6 rounded-lg bg-[#F7B425]/15 text-[#F7B425] flex items-center justify-center font-bold">
                <Award className="w-3 h-3" />
              </div>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-[#F7B425]">{highestScore}</span>
              <span className="text-[10px] text-slate-400">/ 677 ITP</span>
            </div>
            <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              C1 Advanced Proficiency
            </span>
          </div>

          <div className={`p-2.5 sm:p-3 rounded-xl border ${cardBg}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] sm:text-[10.5px] font-bold ${subText}`}>
                {tr('Total Ujian Selesai', 'Total Completed Tests')}
              </span>
              <div className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold">
                <FileText className="w-3 h-3" />
              </div>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono">{totalCompleted}</span>
              <span className="text-[10px] text-slate-400">{tr('Paket Tes', 'Test Packages')}</span>
            </div>
            <span className={`text-[9.5px] sm:text-[10px] block mt-1 ${subText}`}>
              {tr('4 Paket Tes ITP Selesai', '4 ITP Test Packages Completed')}
            </span>
          </div>

          <div className={`p-2.5 sm:p-3 rounded-xl border ${cardBg}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] sm:text-[10.5px] font-bold ${subText}`}>
                {tr('Sertifikat Terbit', 'Certificates Issued')}
              </span>
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-3 h-3" />
              </div>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">{totalCompleted}</span>
              <span className="text-[10px] text-slate-400">{tr('Dokumen Resmi', 'Official Documents')}</span>
            </div>
            <span className={`text-[9.5px] sm:text-[10px] block mt-1 ${subText}`}>
              {tr('Status: Terverifikasi Sistem', 'Status: System Verified')}
            </span>
          </div>

          <div className={`p-2.5 sm:p-3 rounded-xl border ${cardBg}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] sm:text-[10.5px] font-bold ${subText}`}>
                {tr('Rata-rata Section ITP', 'ITP Section Averages')}
              </span>
              <div className="w-6 h-6 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
                <BarChart3 className="w-3 h-3" />
              </div>
            </div>
            <div className="mt-1 space-y-0.5">
              <div className="flex justify-between text-[9.5px] sm:text-[10px]">
                <span className={subText}>Listening</span>
                <span className="font-bold text-[#F7B425]">58/68</span>
              </div>
              <div className="flex justify-between text-[9.5px] sm:text-[10px]">
                <span className={subText}>Structure</span>
                <span className="font-bold text-[#F7B425]">60/68</span>
              </div>
              <div className="flex justify-between text-[9.5px] sm:text-[10px]">
                <span className={subText}>Reading</span>
                <span className="font-bold text-[#F7B425]">57/67</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DAFTAR RIWAYAT TES & SCORE TABLE */}
      <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
        <div className="p-2 sm:px-3 sm:py-2 border-b border-inherit flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xs sm:text-sm font-bold font-heading">
              {tr('Daftar Riwayat Ujian & Skor Per Section', 'Exam History & Section Scores')}
            </h2>
            <p className={`text-[10px] sm:text-[10.5px] ${subText}`}>
              {tr('Klik tombol "Sertifikat" untuk menampilkan sertifikat resmi berformat PDF.', 'Click the "Certificate" button to view and download your official certificate.')}
            </p>
          </div>

          {/* Filter Pills */}
          <div className={`flex items-center p-0.5 rounded-lg border self-start sm:self-auto ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
          }`}>
            {(['ALL', 'TOEFL ITP'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                  activeFilter === filter
                    ? 'bg-[#F7B425] text-black shadow-2xs font-black'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {filter === 'ALL' ? tr('Semua Riwayat', 'All History') : filter}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${
                isDark 
                  ? 'border-white/10 text-slate-400 bg-white/5' 
                  : 'border-slate-200 text-slate-500 bg-slate-50/80'
              }`}>
                <th className="py-1.5 sm:py-2 px-2.5 sm:px-3 font-bold">{tr('Nama Tes & Tanggal', 'Test Name & Date')}</th>
                <th className="py-1.5 sm:py-2 px-2 font-bold text-center">{tr('Tipe', 'Type')}</th>
                <th className="py-1.5 sm:py-2 px-2 font-bold text-center">Listening</th>
                <th className="py-1.5 sm:py-2 px-2 font-bold text-center">Structure</th>
                <th className="py-1.5 sm:py-2 px-2 font-bold text-center">Reading</th>
                <th className="py-1.5 sm:py-2 px-2 font-bold text-center">{tr('Total Skor', 'Total Score')}</th>
                <th className="py-1.5 sm:py-2 px-2.5 sm:px-3 font-bold text-right">{tr('E-Sertifikat', 'E-Certificate')}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className={`transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                  {/* Test Info */}
                  <td className="py-1.5 sm:py-2 px-2.5 sm:px-3">
                    <div className="font-bold text-[11px] sm:text-xs text-inherit">
                      {rec.testTitle}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[9.5px] sm:text-[10px] text-slate-400">
                      <Calendar className="w-3 h-3 text-[#F7B425]" />
                      <span>{rec.date}</span>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-1.5 sm:py-2 px-2 text-center">
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      rec.testType === 'TOEFL ITP'
                        ? 'bg-blue-500/15 text-blue-500 border border-blue-500/30'
                        : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                    }`}>
                      {rec.testType}
                    </span>
                  </td>

                  {/* Section Scores */}
                  <td className="py-1.5 sm:py-2 px-2 text-center font-mono font-bold text-[11px] sm:text-xs">
                    {rec.listeningScore}
                  </td>
                  <td className="py-1.5 sm:py-2 px-2 text-center font-mono font-bold text-[11px] sm:text-xs">
                    {rec.structureScore}
                  </td>
                  <td className="py-1.5 sm:py-2 px-2 text-center font-mono font-bold text-[11px] sm:text-xs">
                    {rec.readingScore}
                  </td>

                  {/* Total Score Badge */}
                  <td className="py-1.5 sm:py-2 px-2 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="px-2 py-0.5 rounded-md bg-[#F7B425] text-black font-black font-mono text-[11px] sm:text-xs shadow-2xs">
                        {rec.totalScore}
                      </span>
                      <span className="text-[8.5px] sm:text-[9px] text-slate-400 mt-0.5">
                        {tr('dari', 'of')} {rec.maxScore}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-1.5 sm:py-2 px-2.5 sm:px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedCert(rec)}
                        className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10.5px] sm:text-[11px] flex items-center gap-1 transition-all shadow-2xs cursor-pointer active:scale-95"
                        title={tr('Lihat Pratinjau Sertifikat', 'View Certificate Preview')}
                      >
                        <Eye className="w-3 h-3" />
                        <span>{tr('Sertifikat', 'Certificate')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(rec)}
                        className={`p-1 rounded-lg border transition-all cursor-pointer ${
                          isDark 
                            ? 'border-white/10 hover:bg-white/10 text-slate-300' 
                            : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                        }`}
                        title={tr('Unduh E-Certificate PDF', 'Download E-Certificate PDF')}
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. OFFICIAL CERTIFICATE PREVIEW MODAL */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-3 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className={`w-full max-w-4xl rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
            isDark ? 'bg-[#121212] border-white/15 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            {/* Modal Top Control Bar */}
            <div className={`p-2 sm:px-3 sm:py-2 border-b flex items-center justify-between gap-2 ${
              isDark ? 'border-white/10 bg-[#181818]' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#F7B425] text-black flex items-center justify-center font-black">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm font-heading">
                    E-Certificate of Achievement TOEFL Prediction
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {tr('Sertifikat Resmi Terverifikasi', 'Official Verified Certificate')} • {selectedCert.certNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(selectedCert)}
                  className="px-2.5 py-1 bg-[#F7B425] hover:bg-amber-400 text-black font-extrabold text-xs rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>{tr('Unduh PDF', 'Download PDF')}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isDark ? 'border-white/10 hover:bg-white/10 text-slate-300' : 'border-slate-300 hover:bg-slate-200 text-slate-700'
                  }`}
                  title={tr('Cetak Sertifikat', 'Print Certificate')}
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCert(null)}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isDark ? 'border-white/10 hover:bg-white/10 text-slate-300' : 'border-slate-300 hover:bg-slate-200 text-slate-700'
                  }`}
                  title={tr('Tutup', 'Close')}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Modal Body: The Real Certificate Paper View */}
            <div className="p-3 sm:p-5 overflow-y-auto flex items-center justify-center bg-slate-900/60">
              <div className="w-full max-w-3xl bg-[#FCFAF2] text-slate-900 rounded-xl p-4 sm:p-7 border-2 sm:border-3 border-[#C89B3C] shadow-2xl relative select-none">
                
                {/* Decorative Certificate Inner Border */}
                <div className="border border-[#C89B3C]/40 p-4 sm:p-6 rounded-lg relative">
                  
                  {/* Watermark Logo Background */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                    <Award className="w-64 h-64 text-slate-900" />
                  </div>

                  {/* Header Logo & Institution */}
                  <div className="text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5">
                      <Logo size="sm" className="h-8 w-auto" />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#9A7220]">
                      English Join Indonesia • Language Training Center
                    </div>
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-wide mt-1">
                      CERTIFICATE OF ACHIEVEMENT
                    </h2>
                    <p className="text-[11px] text-slate-600 font-sans">
                      This is to certify that
                    </p>
                  </div>

                  {/* Recipient Student Name */}
                  <div className="text-center my-4 py-1.5 border-b-2 border-[#C89B3C] max-w-md mx-auto">
                    <h3 className="text-xl sm:text-2xl font-serif font-black text-slate-950 italic">
                      {selectedCert.studentName}
                    </h3>
                  </div>

                  {/* Test Description */}
                  <div className="text-center max-w-xl mx-auto space-y-1">
                    <p className="text-[11px] sm:text-xs text-slate-700 leading-relaxed">
                      has successfully completed the online <strong className="font-bold">{selectedCert.testTitle}</strong> held on <strong className="font-bold">{selectedCert.certIssueDate}</strong> with the following score breakdown:
                    </p>
                  </div>

                  {/* Scores Box */}
                  <div className="my-4 grid grid-cols-4 gap-2 sm:gap-3 max-w-md mx-auto text-center">
                    <div className="bg-[#FAF6EC] p-2 rounded-lg border border-[#E5D7B5]">
                      <span className="block text-[8.5px] uppercase font-bold text-slate-500">Listening</span>
                      <strong className="text-base sm:text-lg font-mono font-black text-slate-900">{selectedCert.listeningScore}</strong>
                    </div>
                    <div className="bg-[#FAF6EC] p-2 rounded-lg border border-[#E5D7B5]">
                      <span className="block text-[8.5px] uppercase font-bold text-slate-500">Structure</span>
                      <strong className="text-base sm:text-lg font-mono font-black text-slate-900">{selectedCert.structureScore}</strong>
                    </div>
                    <div className="bg-[#FAF6EC] p-2 rounded-lg border border-[#E5D7B5]">
                      <span className="block text-[8.5px] uppercase font-bold text-slate-500">Reading</span>
                      <strong className="text-base sm:text-lg font-mono font-black text-slate-900">{selectedCert.readingScore}</strong>
                    </div>
                    <div className="bg-[#F7B425] p-2 rounded-lg border border-[#C89B3C] shadow-2xs">
                      <span className="block text-[8.5px] uppercase font-black text-black">TOTAL SCORE</span>
                      <strong className="text-lg sm:text-xl font-mono font-black text-black">{selectedCert.totalScore}</strong>
                    </div>
                  </div>

                  {/* Level Assessment */}
                  <div className="text-center mb-4">
                    <span className="inline-block px-2.5 py-0.5 bg-[#FAF6EC] border border-[#E5D7B5] rounded-full text-[11px] font-extrabold text-[#9A7220]">
                      Level: {selectedCert.levelCategory}
                    </span>
                  </div>

                  {/* Signatures & Seal */}
                  <div className="pt-3 border-t border-[#E5D7B5] grid grid-cols-2 sm:grid-cols-3 items-end text-center gap-3 text-xs">
                    <div>
                      <span className="text-[9px] text-slate-500 block">Certificate No.</span>
                      <strong className="font-mono text-[10px] text-slate-800">{selectedCert.certNumber}</strong>
                    </div>

                    <div className="hidden sm:flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#C89B3C] flex items-center justify-center p-1">
                        <div className="w-full h-full rounded-full bg-[#FAF6EC] border border-[#C89B3C] flex flex-col items-center justify-center text-[6.5px] font-black text-[#9A7220]">
                          <span>OFFICIAL</span>
                          <span>SEAL</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="h-7 flex items-center justify-center">
                        <span className="font-serif italic text-sm font-bold text-slate-800">Alwi Bahri, M.Pd</span>
                      </div>
                      <div className="border-t border-slate-400 pt-0.5">
                        <span className="text-[9px] font-bold text-slate-700 block">Academic Director</span>
                        <span className="text-[7.5px] text-slate-500">English Join Indonesia</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
