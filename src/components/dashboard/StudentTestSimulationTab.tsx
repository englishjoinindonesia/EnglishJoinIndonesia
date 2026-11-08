import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  CheckCircle2, Clock, Award, RotateCcw, 
  ArrowRight, ArrowLeft, Volume2, Download,
  Filter, PlayCircle, ShieldAlert, Check, Headphones, FileText,
  AlertTriangle, Monitor, Sparkles, HelpCircle, BookOpen,
  Lock, Shield, Maximize, Minimize, AlertCircle, CheckSquare, X, Loader2, Eye, Layers
} from 'lucide-react';
import { SAMPLE_TOEFL_QUESTIONS } from '../../data/toeflData';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { loadQuestionBanks, loadToeflQuestions } from '../../lib/supabaseService';
import { renderWrittenExpressionText, SECTION_DIRECTIONS_DATA, SectionDirectionsInfo } from './ToeflQuestionsTab';
import { downloadCertificatePdf } from '../../utils/certificatePdfGenerator';

export const normalizeSection = (sec?: string): 'Listening' | 'Structure' | 'Reading' => {
  if (!sec) return 'Listening';
  const lower = sec.toLowerCase();
  if (lower.includes('listen')) return 'Listening';
  if (lower.includes('read')) return 'Reading';
  return 'Structure';
};

interface TestItem {
  id: string;
  title: string;
  type: 'TOEFL ITP' | 'TOEFL iBT';
  category: 'ITP' | 'iBT';
  status: 'IN PROGRESS' | 'NOT STARTED' | 'COMPLETED';
  description: string;
  score?: string;
  duration: string;
  questionsCount: number;
  isFullscreen?: boolean;
}

export const StudentTestSimulationTab: React.FC = () => {
  const { isDark } = useTheme();
  const { tr, language } = useLanguage();
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'ITP'>('All');
  const [testState, setTestState] = useState<'list' | 'preparation' | 'running' | 'completed'>('list');
  const [activeTest, setActiveTest] = useState<TestItem | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [doubtfulQuestions, setDoubtfulQuestions] = useState<Record<string, boolean>>({});
  const [audioTested, setAudioTested] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(115 * 60); // 115 minutes
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [fullscreenEnabled, setFullscreenEnabled] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [activeDirectionSection, setActiveDirectionSection] = useState<'Listening' | 'Structure' | 'Reading' | null>(null);
  const [seenSectionDirections, setSeenSectionDirections] = useState<Record<string, boolean>>({});
  const [directionsThemeMode, setDirectionsThemeMode] = useState<'cbt' | 'paper'>('cbt');
  const [prepPreviewSection, setPrepPreviewSection] = useState<'Listening' | 'Structure' | 'Reading' | null>(null);

  const cardBg = isDark ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-slate-200/90 text-slate-900 shadow-2xs';
  const innerCardBg = isDark ? 'bg-[#181818] border-white/5' : 'bg-slate-50/70 border-slate-100';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';

  const [availableTests, setAvailableTests] = useState<TestItem[]>(() => {
    try {
      const saved = localStorage.getItem('ej_toefl_test_programs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(p => !['toefl-pred-1', 'toefl-guarantee', 'toefl-fasttrack'].includes(p.id) && p.isActive !== false).map(p => ({
            id: p.id,
            title: p.title,
            type: (p.category === 'TOEFL iBT' ? 'TOEFL iBT' : 'TOEFL ITP') as 'TOEFL ITP' | 'TOEFL iBT',
            category: (p.category === 'TOEFL iBT' ? 'iBT' : 'ITP') as 'ITP' | 'iBT',
            status: 'NOT STARTED' as const,
            description: p.benefits && p.benefits.length > 0 ? p.benefits.join(' • ') : 'Diagnostic Practice Test with complete Structure, Written Expression, and Reading Comprehension.',
            score: '—',
            duration: p.duration || '115 Menit',
            questionsCount: parseInt(p.questionCount) || 140,
            isFullscreen: p.isFullscreen !== false,
          }));
        }
      }
    } catch (e) {
      console.warn('Error loading student tests from localStorage', e);
    }
    return [];
  });

  const [isLoadingTests, setIsLoadingTests] = useState(false);
  const [dbQuestions, setDbQuestions] = useState<any[]>([]);

  // Load question banks strictly from Supabase database
  useEffect(() => {
    let isMounted = true;
    const fetchProgramsFromDatabase = async () => {
      setIsLoadingTests(true);
      try {
        const { data: dbBanks, error } = await loadQuestionBanks();
        if (!error && dbBanks && isMounted) {
          // Filter ONLY programs that are actually stored in the database and active
          const validDbPrograms = dbBanks.filter(p => !['toefl-pred-1', 'toefl-guarantee', 'toefl-fasttrack'].includes(p.id) && p.is_active !== false);
          const mapped: TestItem[] = validDbPrograms.map(p => ({
            id: p.id,
            title: p.title,
            type: (p.category === 'TOEFL iBT' ? 'TOEFL iBT' : 'TOEFL ITP') as 'TOEFL ITP' | 'TOEFL iBT',
            category: (p.category === 'TOEFL iBT' ? 'iBT' : 'ITP') as 'ITP' | 'iBT',
            status: 'NOT STARTED' as const,
            description: p.benefits && p.benefits.length > 0 
              ? p.benefits.join(' • ') 
              : 'Diagnostic Practice Test with complete Structure, Written Expression, and Reading Comprehension.',
            score: '—',
            duration: p.duration || '115 Menit',
            questionsCount: parseInt(p.question_count) || 140,
            isFullscreen: (p as any).is_fullscreen !== false && (p as any).isFullscreen !== false,
          }));

          setAvailableTests(mapped);

          // Overwrite localStorage with ONLY valid database programs so old/deleted test data is purged
          const sanitizedForStorage = validDbPrograms.map(p => ({
            id: p.id,
            title: p.title,
            tag: p.tag || 'Resmi',
            category: p.category,
            duration: p.duration,
            questionCount: p.question_count,
            scoreTarget: p.score_target || 'Skala 310 - 677',
            benefits: p.benefits || [],
            isActive: p.is_active,
            isFullscreen: (p as any).is_fullscreen !== false && (p as any).isFullscreen !== false,
          }));
          localStorage.setItem('ej_toefl_test_programs', JSON.stringify(sanitizedForStorage));
        }
      } catch (err) {
        console.warn('Error fetching question banks from Supabase:', err);
      } finally {
        if (isMounted) setIsLoadingTests(false);
      }
    };

    fetchProgramsFromDatabase();
    return () => { isMounted = false; };
  }, []);

  // Sync when storage event is fired from other tabs
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('ej_toefl_test_programs');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const mapped: TestItem[] = parsed.filter(p => p.isActive !== false).map(p => ({
              id: p.id,
              title: p.title,
              type: (p.category === 'TOEFL iBT' ? 'TOEFL iBT' : 'TOEFL ITP') as 'TOEFL ITP' | 'TOEFL iBT',
              category: (p.category === 'TOEFL iBT' ? 'iBT' : 'ITP') as 'ITP' | 'iBT',
              status: 'NOT STARTED' as const,
              description: p.benefits && p.benefits.length > 0 ? p.benefits.join(' • ') : 'Diagnostic Practice Test with complete Structure, Written Expression, and Reading Comprehension.',
              score: '—',
              duration: p.duration || '115 Menit',
              questionsCount: parseInt(p.questionCount) || 140,
              isFullscreen: p.isFullscreen !== false,
            }));
            setAvailableTests(mapped);
          }
        }
      } catch (e) {
        console.warn('Error reading storage in StudentTestSimulationTab', e);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Fetch real questions from Supabase for the active test program
  useEffect(() => {
    if (!activeTest?.id) return;
    let isMounted = true;
    const fetchQuestions = async () => {
      try {
        const { data, error } = await loadToeflQuestions(activeTest.id);
        if (!error && data && data.length > 0 && isMounted) {
          const mapped = data.map(q => {
            let passageText: string | undefined = (q as any).passage_text || (q as any).passageText;
            let cleanQuestionText = q.question_text || '';
            const passageMatch = cleanQuestionText.match(/\[PASSAGE\]([\s\S]*?)\[\/PASSAGE\]\s*([\s\S]*)/);
            if (passageMatch) {
              passageText = passageMatch[1].trim();
              cleanQuestionText = passageMatch[2].trim();
            }
            return {
              id: q.id,
              section: q.section,
              part: q.part,
              questionText: cleanQuestionText,
              passageText: passageText,
              audioUrl: q.audio_url || undefined,
              options: q.options,
              correctAnswer: q.correct_answer,
              explanation: q.explanation || '',
            };
          });
          setDbQuestions(mapped);
        }
      } catch (e) {
        console.warn('Error fetching questions from Supabase:', e);
      }
    };
    fetchQuestions();
    return () => { isMounted = false; };
  }, [activeTest?.id]);

  const filteredTests = availableTests.filter((test) => {
    if (selectedFilter === 'All') return true;
    return test.category === selectedFilter;
  });

  const fallbackQuestions = [
    ...SAMPLE_TOEFL_QUESTIONS,
    {
      id: 'q3',
      section: 'Structure',
      part: 'Part B (Written Expression)',
      questionText: 'Guppies are sometimes call (A) rainbow fish because of (B) the males’ (C) bright colors (D).',
      options: {
        A: 'call',
        B: 'because of',
        C: 'the males’',
        D: 'bright colors'
      },
      correctAnswer: 'A',
      explanation: 'Pilihan (A) salah karena setelah "are" harus menggunakan past participle "called" (passive voice).'
    },
    {
      id: 'q4',
      section: 'Listening',
      part: 'Part A',
      questionText: '(Audio Dialogue)\nMan: Did you manage to attend the morning seminar?\nWoman: I was stuck in heavy traffic for two hours.\nNarrator: What does the woman mean?',
      options: {
        A: 'She attended the seminar on time.',
        B: 'She missed the seminar due to traffic.',
        C: 'She drove the man to the seminar.',
        D: 'She enjoyed the morning traffic.'
      },
      correctAnswer: 'B',
      explanation: 'Pembicara wanita menjelaskan bahwa ia terjebak macet selama dua jam sehingga tidak bisa menghadiri seminar.'
    }
  ];

  const questions = dbQuestions.length > 0 ? dbQuestions : fallbackQuestions;

  const sectionQuestionsCount = useMemo(() => {
    const counts: Record<'Listening' | 'Structure' | 'Reading', number> = {
      Listening: 0,
      Structure: 0,
      Reading: 0,
    };
    questions.forEach(q => {
      const s = normalizeSection(q.section);
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [questions]);

  const sectionFirstIndex = useMemo(() => {
    const indices: Record<'Listening' | 'Structure' | 'Reading', number> = {
      Listening: -1,
      Structure: -1,
      Reading: -1,
    };
    questions.forEach((q, idx) => {
      const s = normalizeSection(q.section);
      if (indices[s] === -1) {
        indices[s] = idx;
      }
    });
    return indices;
  }, [questions]);

  // Request browser fullscreen mode with fallback
  const requestBrowserFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      }
      setFullscreenEnabled(true);
      setShowFullscreenWarning(false);
    } catch {
      // Fallback
      setFullscreenEnabled(true);
      setShowFullscreenWarning(false);
    }
  };

  const exitBrowserFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch {
      // ignore
    }
    setFullscreenEnabled(false);
  };

  // Monitor fullscreen change, prevent window closing, and block reload/back shortcuts during test
  useEffect(() => {
    if (testState !== 'running') return;

    const handleFullscreenChange = () => {
      // Only warn if fullscreen is strictly required for this test program
      if (activeTest?.isFullscreen !== false && !document.fullscreenElement && fullscreenEnabled) {
        setShowFullscreenWarning(true);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Ujian TOEFL resmi sedang berlangsung! Anda tidak diperkenankan keluar atau me-refresh halaman.';
      return e.returnValue;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F5' ||
        ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R')) ||
        (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight'))
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [testState, fullscreenEnabled]);

  // Exam Countdown Timer
  useEffect(() => {
    if (testState !== 'running') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testState]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleDoubtful = (qId: string) => {
    setDoubtfulQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  // When clicking on a test, open the Preparation screen first
  const handleOpenPreparation = (test: TestItem) => {
    setActiveTest(test);
    setAudioTested(false);
    setAgreementChecked(false);
    setTestState('preparation');
  };

  // Start the actual exam after preparation
  const handleStartExam = () => {
    const isFullscreenRequired = activeTest?.isFullscreen !== false;
    if (isFullscreenRequired) {
      requestBrowserFullscreen();
    } else {
      setFullscreenEnabled(false);
      setShowFullscreenWarning(false);
    }
    setTestState('running');
    setCurrentIdx(0);
    setUserAnswers({});
    setDoubtfulQuestions({});
    setTimeLeft(115 * 60);
    setShowFullscreenWarning(false);
    setShowSubmitConfirm(false);

    // Present Preview Petunjuk (Direction) for the first section before starting questions
    const firstSection = normalizeSection(questions[0]?.section);
    setActiveDirectionSection(firstSection);
    setSeenSectionDirections({});
  };

  const handleGoToQuestion = (targetIdx: number) => {
    if (targetIdx < 0 || targetIdx >= questions.length) return;
    const currentSec = normalizeSection(questions[currentIdx]?.section);
    const targetSec = normalizeSection(questions[targetIdx]?.section);

    if (targetSec !== currentSec && !seenSectionDirections[targetSec]) {
      // First time entering this new section! Show its Direction Guide first
      setCurrentIdx(targetIdx);
      setActiveDirectionSection(targetSec);
    } else {
      setCurrentIdx(targetIdx);
      setActiveDirectionSection(null);
    }
  };

  const handleStartOrDismissDirection = () => {
    if (activeDirectionSection) {
      setSeenSectionDirections(prev => ({ ...prev, [activeDirectionSection]: true }));
      const targetFirstIdx = sectionFirstIndex[activeDirectionSection];
      if (targetFirstIdx >= 0 && normalizeSection(questions[currentIdx]?.section) !== activeDirectionSection) {
        setCurrentIdx(targetFirstIdx);
      }
    }
    setActiveDirectionSection(null);
  };

  const handleTestAudioSample = () => {
    setAudioPlaying(true);
    setAudioTested(true);
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
    } catch {
      // Audio fallback
    }
    setTimeout(() => {
      setAudioPlaying(false);
    }, 1500);
  };

  const handleSelectOption = (opt: string) => {
    setUserAnswers({ ...userAnswers, [questions[currentIdx].id]: opt });
  };

  const handleFinish = async () => {
    exitBrowserFullscreen();
    setShowSubmitConfirm(false);
    setShowFullscreenWarning(false);
    setTestState('completed');

    if (user) {
      try {
        const studentDisplayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student';
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const certNumber = `EJI/TOEFL-ITP/${new Date().getFullYear()}/${randomNum}`;
        const dateFormatted = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
        const listeningScore = Math.min(68, Math.max(31, Math.round(50 + (correctCount * 3))));
        const structureScore = Math.min(68, Math.max(31, Math.round(52 + (correctCount * 3))));
        const readingScore = Math.min(67, Math.max(31, Math.round(48 + (correctCount * 3))));

        // 1. Insert into test_history_records
        await supabase.from('test_history_records').insert([
          {
            user_id: user.id,
            test_title: activeTest?.title || 'TOEFL ITP — Official Prediction Test',
            test_type: 'TOEFL ITP',
            date: dateFormatted,
            listening_score: listeningScore,
            structure_score: structureScore,
            reading_score: readingScore,
            total_score: scaledScore,
            max_score: 677,
            status: scaledScore >= 500 ? 'LULUS' : 'MEMENUHI TARGET',
            cert_number: certNumber,
            cert_issue_date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
            level_category: scaledScore >= 600 ? 'C1 — Advanced' : scaledScore >= 550 ? 'B2 — High Intermediate' : 'B1 — Intermediate',
            student_name: studentDisplayName
          }
        ]);

        // 2. Also sync to student_registrations table for student management directory
        const studentRecordPayload = {
          id: `STD-${user.id.slice(0, 8).toUpperCase()}`,
          user_id: user.id,
          name: studentDisplayName,
          whatsapp: user.user_metadata?.whatsapp || '081298765432',
          email: user.email || 'student@englishjoin.com',
          program_name: activeTest?.title || 'TOEFL ITP — Official Prediction Test',
          registration_date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
          test_score: scaledScore,
          listening_score: listeningScore,
          structure_score: structureScore,
          reading_score: readingScore,
          payment_status: 'Paid',
          status: scaledScore >= 500 ? 'Lulus (500+)' : 'Selesai (<500)',
          certificate_number: certNumber,
        };

        await supabase.from('student_registrations').upsert([studentRecordPayload]);

        // 3. Update localStorage so StudentRegistrationsTab immediately shows it
        try {
          const formattedRecord = {
            id: studentRecordPayload.id,
            name: studentRecordPayload.name,
            whatsapp: studentRecordPayload.whatsapp,
            email: studentRecordPayload.email,
            programName: studentRecordPayload.program_name,
            program_name: studentRecordPayload.program_name,
            registrationDate: studentRecordPayload.registration_date,
            registration_date: studentRecordPayload.registration_date,
            testScore: studentRecordPayload.test_score,
            test_score: studentRecordPayload.test_score,
            listeningScore: studentRecordPayload.listening_score,
            listening_score: studentRecordPayload.listening_score,
            structureScore: studentRecordPayload.structure_score,
            structure_score: studentRecordPayload.structure_score,
            readingScore: studentRecordPayload.reading_score,
            reading_score: studentRecordPayload.reading_score,
            paymentStatus: studentRecordPayload.payment_status,
            payment_status: studentRecordPayload.payment_status,
            status: studentRecordPayload.status,
            certificateNumber: studentRecordPayload.certificate_number,
            certificate_number: studentRecordPayload.certificate_number,
          };

          const raw = localStorage.getItem('ej_all_students_records');
          const currentList = raw ? JSON.parse(raw) : [];
          const withoutMe = currentList.filter((s: any) => s.id !== studentRecordPayload.id && s.email !== user.email);
          localStorage.setItem('ej_all_students_records', JSON.stringify([formattedRecord, ...withoutMe]));
          window.dispatchEvent(new Event('storage'));
        } catch (e) {
          console.warn('Error updating local student record:', e);
        }
      } catch (err) {
        console.warn('Could not save test history to Supabase:', err);
      }
    }
  };

  // Calculate score
  const correctCount = questions.filter(q => userAnswers[q.id] === q.correctAnswer).length;
  const rawPercentage = Math.round((correctCount / questions.length) * 100);
  const scaledScore = Math.round(310 + ((677 - 310) * (correctCount / questions.length)));

  const renderSectionDirectionContent = (
    sectionKey: 'Listening' | 'Structure' | 'Reading',
    themeMode: 'cbt' | 'paper',
    isReview: boolean,
    onStartOrResumeAction: () => void,
    onSwitchSectionAction: (sec: 'Listening' | 'Structure' | 'Reading') => void,
    onCloseAction?: () => void
  ) => {
    const sec = SECTION_DIRECTIONS_DATA[sectionKey];
    if (!sec) return null;

    const isStructure = sectionKey === 'Structure';
    const isListening = sectionKey === 'Listening';
    const isReading = sectionKey === 'Reading';

    const themeBorder = isStructure 
      ? 'border-amber-500/30' 
      : isListening 
        ? 'border-blue-500/30' 
        : 'border-emerald-500/30';

    const themeBg = isStructure 
      ? 'bg-amber-500/10' 
      : isListening 
        ? 'bg-blue-500/10' 
        : 'bg-emerald-500/10';

    return (
      <div className="space-y-4 max-w-4xl mx-auto w-full animate-fadeIn pb-6">
        {/* Top Bar: Section Switcher & Format Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-white/10">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 flex-wrap">
            {(['Listening', 'Structure', 'Reading'] as const).map((sKey) => {
              const sInfo = SECTION_DIRECTIONS_DATA[sKey];
              const isSelected = sectionKey === sKey;
              return (
                <button
                  key={sKey}
                  type="button"
                  onClick={() => onSwitchSectionAction(sKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#F7B425] text-black shadow-xs font-black'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>Section {sInfo.number}: {sKey}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Format Toggle: CBT vs Paper */}
            <div className="flex items-center p-0.5 rounded-lg bg-white/5 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setDirectionsThemeMode('cbt')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  themeMode === 'cbt'
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mode CBT
              </button>
              <button
                type="button"
                onClick={() => setDirectionsThemeMode('paper')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  themeMode === 'paper'
                    ? 'bg-amber-100 text-stone-900 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Buku Soal (Paper)
              </button>
            </div>

            {onCloseAction && (
              <button
                type="button"
                onClick={onCloseAction}
                className="p-1 rounded-lg border border-white/10 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                title="Tutup Petunjuk"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Main Content: CBT or Paper */}
        {themeMode === 'paper' ? (
          /* Authentic ETS Paper Booklet Format */
          <div className="bg-[#faf8f5] text-stone-900 border border-stone-300 rounded-2xl p-5 sm:p-9 shadow-2xl font-serif leading-relaxed">
            <h1 className="text-xl sm:text-2xl font-bold tracking-wider text-center uppercase mb-3 text-black font-serif">
              {sec.title}
            </h1>

            <div className="text-center font-bold text-xs sm:text-sm text-stone-800 mb-6 leading-snug font-sans">
              {(sec.timeHeading || '').split('\n').map((line, idx) => (
                <div key={idx} className={idx === 0 ? 'text-sm sm:text-base font-extrabold text-black mb-0.5' : ''}>
                  {line}
                </div>
              ))}
            </div>

            <p className="text-xs sm:text-sm text-justify text-stone-800 mb-6">
              {sec.introText}
            </p>

            <div className="border-t border-stone-300 pt-5 space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-center text-black uppercase tracking-wide">
                {sec.subpartTitle}
              </h2>

              <div className="text-xs sm:text-sm text-justify text-stone-800 whitespace-pre-line leading-relaxed">
                {sec.directionsText}
              </div>

              {/* Examples in Paper format */}
              <div className="space-y-4 pt-3">
                {sec.examples.map((ex, exIdx) => (
                  <div key={exIdx} className="p-4 bg-white rounded-xl border border-stone-300 shadow-xs space-y-2">
                    <div className="font-bold font-sans text-xs uppercase tracking-wider text-amber-700">
                      {ex.title}
                    </div>
                    <div className="text-xs sm:text-sm text-black font-medium whitespace-pre-line">
                      {renderWrittenExpressionText(ex.prompt, false)}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-xs">
                      {(['A', 'B', 'C', 'D'] as const).map((letter) => (
                        <div
                          key={letter}
                          className={`p-1.5 rounded-lg flex items-center gap-2 border ${
                            ex.correctAnswer === letter
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                              : 'bg-stone-50 border-stone-200 text-stone-800'
                          }`}
                        >
                          <span className="font-bold font-sans">{letter}.</span>
                          <span>{ex.options[letter]}</span>
                          {ex.correctAnswer === letter && (
                            <span className="ml-auto text-[10px] font-sans font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                              Jawaban Benar
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="text-[11px] text-stone-700 italic pt-1 border-t border-stone-200 leading-relaxed font-sans">
                      <strong>Penjelasan:</strong> {ex.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Modern Interactive CBT Format */
          <div className="space-y-3.5">
            {/* Hero Banner Card */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${themeBorder} ${themeBg} relative overflow-hidden`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border shadow-md ${
                    isStructure
                      ? 'bg-amber-500/20 border-amber-500/40 text-[#F7B425]'
                      : isListening
                        ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                        : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  }`}>
                    {isStructure ? (
                      <FileText className="w-6 h-6" />
                    ) : isListening ? (
                      <Headphones className="w-6 h-6" />
                    ) : (
                      <BookOpen className="w-6 h-6" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-mono text-[10px] font-black uppercase tracking-wider border border-white/10">
                        {sec.badge}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#F7B425]/20 text-[#F7B425] text-[10px] font-black uppercase tracking-wider border border-[#F7B425]/40">
                        PETUNJUK RESMI SECTION
                      </span>
                    </div>
                    <h2 className="text-base sm:text-xl font-black font-heading tracking-tight text-white">
                      {sec.title}
                    </h2>
                  </div>
                </div>

                {/* Time & Count Badges */}
                <div className="flex sm:flex-col items-center sm:items-end gap-1.5 self-start sm:self-center shrink-0">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-white font-mono text-xs font-bold shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-[#F7B425]" />
                    <span>{sec.durationText}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-slate-300 font-mono text-xs font-bold">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>{sectionQuestionsCount[sectionKey] || sec.questionCount} Soal</span>
                  </div>
                </div>
              </div>

              {/* Time Heading Callout */}
              <div className="mt-3.5 pt-3 border-t border-white/10 flex items-start gap-2 text-xs text-slate-300">
                <Clock className="w-4 h-4 text-[#F7B425] shrink-0 mt-0.5" />
                <div className="whitespace-pre-line leading-relaxed text-[11px] sm:text-xs font-medium">
                  {sec.timeHeading}
                </div>
              </div>
            </div>

            {/* Section Description Card */}
            <div className="p-4 rounded-xl border border-white/10 bg-[#0E1524] space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#F7B425] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#F7B425]" />
                <span>Deskripsi &amp; Tujuan Bagian Ujian</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {sec.introText}
              </p>
            </div>

            {/* Subparts Breakdown */}
            <div className="p-4 rounded-xl border border-white/10 bg-[#0E1524] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>{sec.subpartTitle} &amp; Pembagian Bagian Soal</span>
              </h3>

              <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-black/30 p-3 rounded-lg border border-white/5">
                {sec.directionsText}
              </div>

              {/* Structure special highlight: Part A vs Part B */}
              {isStructure && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-1">
                    <div className="font-extrabold text-xs text-[#F7B425] flex items-center justify-between">
                      <span>Part A: Structure (Soal 1–15)</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-[#F7B425]">15 Soal</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Kalimat tidak lengkap (incomplete sentences). Pilih 1 kata/frasa dari (A), (B), (C), atau (D) yang paling tepat melengkapi kalimat sesuai tata bahasa standar.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 space-y-1">
                    <div className="font-extrabold text-xs text-purple-300 flex items-center justify-between">
                      <span>Part B: Written Expression (Soal 16–40)</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">25 Soal</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Kalimat dengan 4 bagian bergaris bawah (A, B, C, D). Cari 1 bagian yang <strong>salah</strong> atau harus diubah agar kalimat menjadi benar secara gramatikal.
                    </p>
                  </div>
                </div>
              )}

              {/* Listening special highlight: Part A, B, C */}
              {isListening && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-1">
                    <div className="font-extrabold text-xs text-blue-300">Part A (Short)</div>
                    <p className="text-[10.5px] text-slate-300 leading-relaxed">30 Percakapan pendek antara 2 orang + 1 pertanyaan.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-1">
                    <div className="font-extrabold text-xs text-blue-300">Part B (Longer)</div>
                    <p className="text-[10.5px] text-slate-300 leading-relaxed">2 Percakapan panjang seputar akademik/kampus (8 soal).</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-1">
                    <div className="font-extrabold text-xs text-blue-300">Part C (Talks)</div>
                    <p className="text-[10.5px] text-slate-300 leading-relaxed">3 Ceramah/kuliah ilmiah dari 1 pembicara (12 soal).</p>
                  </div>
                </div>
              )}

              {/* Reading special highlight: 5 passages */}
              {isReading && (
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
                  <div className="font-extrabold text-xs text-emerald-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>5 Wacana Teks Akademik • 10 Soal Per Teks</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Topik mencakup sejarah, sains, seni, dan biografi. Anda bebas membaca ulang wacana dan melompat ke nomor soal mana pun dalam bagian ini.
                  </p>
                </div>
              )}
            </div>

            {/* Official ETS Examples & Solutions */}
            <div className="p-4 rounded-xl border border-white/10 bg-[#0E1524] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Contoh Soal &amp; Cara Menjawab (Official Examples)</span>
              </h3>

              <div className="space-y-3">
                {sec.examples.map((ex, exIdx) => (
                  <div key={exIdx} className="p-3.5 rounded-xl border border-white/10 bg-[#0B101D] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#F7B425]">
                        {ex.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                        Kunci: ({ex.correctAnswer})
                      </span>
                    </div>

                    {/* Problem text */}
                    <div className="text-xs sm:text-sm text-white font-medium whitespace-pre-line leading-relaxed p-2.5 rounded-lg bg-white/5 border border-white/5">
                      {renderWrittenExpressionText(ex.prompt, true)}
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                      {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                        const isCorrect = ex.correctAnswer === letter;
                        return (
                          <div
                            key={letter}
                            className={`p-2 rounded-lg border flex items-center gap-2 transition-all ${
                              isCorrect
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-white font-bold shadow-xs'
                                : 'bg-white/5 border-white/10 text-slate-300'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[11px] shrink-0 ${
                              isCorrect ? 'bg-emerald-500 text-black' : 'bg-white/10 text-slate-300'
                            }`}>
                              {letter}
                            </span>
                            <span className="flex-1 truncate">{ex.options[letter]}</span>
                            {isCorrect && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-auto" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-[11px] text-emerald-300/90 leading-relaxed">
                      <strong className="text-emerald-200">Penjelasan Resmi: </strong>
                      {ex.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes and Rules */}
            {sec.additionalNotes && sec.additionalNotes.length > 0 && (
              <div className="p-3.5 rounded-xl border border-white/10 bg-[#0E1524] space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ketentuan Penting Section Ini</span>
                </h4>
                <ul className="space-y-1 text-xs text-slate-300">
                  {sec.additionalNotes.map((note, nIdx) => (
                    <li key={nIdx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F7B425] mt-1.5 shrink-0" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Action Footer CTA */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            {isReview ? (
              <span>{tr('Anda sedang melihat kembali petunjuk. Waktu tes tetap berjalan.', 'Viewing directions review. Timer is still counting down.')}</span>
            ) : (
              <span>{tr('Waktu pengerjaan berjalan otomatis. Klik tombol di kanan untuk mulai menjawab soal.', 'Timer counts down automatically. Click button to start answering.')}</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isReview ? (
              <button
                type="button"
                onClick={onStartOrResumeAction}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{tr(`Kembali ke Soal ${currentIdx + 1}`, `Return to Question ${currentIdx + 1}`)}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onStartOrResumeAction}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm text-black bg-[#F7B425] hover:bg-[#e5a41c] shadow-lg shadow-[#F7B425]/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <PlayCircle className="w-4 h-4" />
                <span>{tr(`Mulai Mengerjakan Section ${sec.number}: ${sec.id}`, `Start Section ${sec.number}: ${sec.id}`)}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2.5 sm:space-y-3 max-w-7xl mx-auto">
      
      {/* 1. LIST VIEW: AVAILABLE TESTS */}
      {testState === 'list' && (
        <div className="space-y-2.5 sm:space-y-3 animate-fadeIn">
          {/* Top Banner Header & Filter */}
          <div 
            style={{ borderRadius: '12px', marginBottom: '10px' }}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border ${cardBg} flex flex-col md:flex-row md:items-center justify-between gap-2`}
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#2563EB]/15 text-[#2563EB] flex items-center justify-center shrink-0">
                <PlayCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold font-heading leading-tight">
                  {tr('Simulasi Tes TOEFL Online CBT', 'TOEFL Online CBT Test Simulation')}
                </h1>
              </div>
            </div>

            {/* Filter Pills */}
            <div className={`flex items-center p-0.5 rounded-lg border self-start sm:self-auto ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
            }`}>
              {(['All', 'ITP'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                    selectedFilter === filter
                      ? 'bg-[#2563EB] text-white shadow-2xs font-black'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  {filter === 'All' ? tr('Semua Tes', 'All Tests') : filter}
                </button>
              ))}
            </div>
          </div>

          {/* Test Cards Grid */}
          {isLoadingTests ? (
            <div className={`p-8 text-center rounded-xl border ${cardBg}`}>
              <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-400">{tr('Memuat daftar program tes dari database...', 'Loading test programs from database...')}</p>
            </div>
          ) : filteredTests.length === 0 ? (
            <div className={`p-8 text-center rounded-xl border ${cardBg}`}>
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#2563EB]" />
              <h3 className="text-xs sm:text-sm font-bold">{tr('Belum Ada Program Tes yang Tersedia di Database', 'No Test Programs Available in Database')}</h3>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">{tr('Hanya program ujian resmi yang terdaftar di database Supabase yang akan ditampilkan di sini.', 'Only official exam programs registered in Supabase database will appear here.')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
              {filteredTests.map((test) => (
                <div
                  key={test.id}
                  className={`rounded-xl p-3 sm:p-3.5 border flex flex-col justify-between transition-all duration-200 hover:border-[#2563EB]/40 ${cardBg}`}
                >
                  <div className="space-y-2">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-bold tracking-wide uppercase ${
                          test.type === 'TOEFL ITP'
                            ? 'bg-blue-500/15 text-blue-500 border border-blue-500/30'
                            : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                        }`}>
                          {test.type}
                        </span>
                      </div>

                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase ${
                        test.status === 'IN PROGRESS'
                          ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                          : isDark
                            ? 'bg-white/5 text-slate-400 border border-white/10'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {test.status === 'IN PROGRESS' ? tr('BERJALAN', 'IN PROGRESS') : tr('BELUM MULAI', 'NOT STARTED')}
                      </span>
                    </div>

                    {/* Test Title */}
                    <h3 className="text-xs sm:text-sm font-bold tracking-tight">
                      {test.title}
                    </h3>

                    {/* Description */}
                    <p className={`text-[10.5px] sm:text-[11px] leading-relaxed line-clamp-2 ${subText}`}>
                      {test.description}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-[#F7B425]" />
                        {test.duration}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-blue-400" />
                        {test.questionsCount} Soal
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-3 mt-auto">
                    <button
                      type="button"
                      onClick={() => handleOpenPreparation(test)}
                      className="w-full py-1.5 sm:py-2 px-3 rounded-lg font-bold text-xs text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-all shadow-xs active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>{test.status === 'IN PROGRESS' ? tr('Lanjutkan Tes', 'Resume test') : tr('Mulai Tes Sekarang', 'Start Test Now')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. PREPARATION & INSTRUCTION SCREEN */}
      {testState === 'preparation' && activeTest && (
        <div className="space-y-2.5 sm:space-y-3 max-w-4xl mx-auto animate-fadeIn pb-4">
          
          {/* Top Return Button & Status */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setTestState('list')}
              className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark ? 'border-white/10 hover:bg-white/10 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{tr('Kembali ke Daftar Tes', 'Back to Test List')}</span>
            </button>

            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
              activeTest.type === 'TOEFL ITP'
                ? 'bg-blue-500/15 text-blue-500 border border-blue-500/30'
                : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
            }`}>
              {activeTest.type} PREPARATION
            </span>
          </div>

          {/* Main Card: Test Details & Structure */}
          <div className={`p-3 sm:p-4 rounded-xl border ${cardBg}`}>
            <div className="space-y-1.5 pb-3 border-b border-inherit">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-[#F7B425]/15 text-[#F7B425] font-black text-[10px]">
                  OFFICIAL SIMULATION
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-400">
                  {tr(`Durasi: ${activeTest.duration} • Total ${activeTest.questionsCount} Soal`, `Duration: ${activeTest.duration} • Total ${activeTest.questionsCount} Questions`)}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold font-heading tracking-tight">
                {activeTest.title}
              </h1>
              <p className={`text-xs leading-relaxed ${subText}`}>
                {activeTest.description}
              </p>
            </div>

            {/* Test Sections Breakdown */}
            <div className="py-2.5 sm:py-3 border-b border-inherit space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#F7B425]">
                {tr('Struktur & Pembagian Bagian Ujian', 'Exam Structure & Sections Breakdown')}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className={`p-2.5 rounded-lg border flex flex-col justify-between ${innerCardBg}`}>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[11px]">Section 1</span>
                      <Headphones className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div className="font-bold text-xs">Listening Comprehension</div>
                    <p className={`text-[10px] mt-0.5 ${subText}`}>
                      {tr('50 Soal • 35 Menit', '50 Questions • 35 Mins')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPrepPreviewSection('Listening')}
                    className="mt-2 w-full py-1 px-2 rounded-md border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    <span>{tr('Lihat Petunjuk (Direction)', 'Preview Directions')}</span>
                  </button>
                </div>

                <div className={`p-2.5 rounded-lg border flex flex-col justify-between ${innerCardBg}`}>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[11px]">Section 2</span>
                      <FileText className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <div className="font-bold text-xs">Structure &amp; Written Exp.</div>
                    <p className={`text-[10px] mt-0.5 ${subText}`}>
                      {tr('40 Soal • 25 Menit', '40 Questions • 25 Mins')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPrepPreviewSection('Structure')}
                    className="mt-2 w-full py-1 px-2 rounded-md border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    <span>{tr('Lihat Petunjuk (Direction)', 'Preview Directions')}</span>
                  </button>
                </div>

                <div className={`p-2.5 rounded-lg border flex flex-col justify-between ${innerCardBg}`}>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[11px]">Section 3</span>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="font-bold text-xs">Reading Comprehension</div>
                    <p className={`text-[10px] mt-0.5 ${subText}`}>
                      {tr('50 Soal • 55 Menit', '50 Questions • 55 Mins')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPrepPreviewSection('Reading')}
                    className="mt-2 w-full py-1 px-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    <span>{tr('Lihat Petunjuk (Direction)', 'Preview Directions')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Checklist Persiapan Sistem & Perangkat */}
            <div className="py-2.5 sm:py-3 border-b border-inherit space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#F7B425]">
                {tr('Pengecekan Perangkat & Audio (Wajib)', 'Device & Audio Check (Mandatory)')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* Audio Check Box */}
                <div className={`p-2.5 sm:p-3 rounded-lg border flex flex-col justify-between ${innerCardBg}`}>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Headphones className="w-4 h-4 text-blue-500" />
                      <span className="font-bold text-xs">{tr('Tes Suara / Audio Headset', 'Audio / Headset Test')}</span>
                    </div>
                    <p className={`text-[10.5px] mt-0.5 leading-relaxed ${subText}`}>
                      {tr('Pastikan volume headset atau speaker terdengar jelas untuk sesi Listening.', 'Ensure your headset volume is audible for the Listening section.')}
                    </p>
                  </div>

                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestAudioSample}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        audioPlaying 
                          ? 'bg-amber-500 text-black animate-pulse' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{audioPlaying ? tr('Memutar...', 'Playing...') : tr('Uji Audio', 'Test Audio')}</span>
                    </button>

                    {audioTested && (
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {tr('Audio Berfungsi', 'Audio Working')}
                      </span>
                    )}
                  </div>
                </div>

                {/* System & Connection Box */}
                <div className={`p-2.5 sm:p-3 rounded-lg border flex flex-col justify-between ${innerCardBg}`}>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-emerald-500" />
                      <span className="font-bold text-xs">{tr('Mode Isolasi Layar Penuh CBT', 'Fullscreen CBT Lockdown')}</span>
                    </div>
                    <p className={`text-[10.5px] mt-0.5 leading-relaxed ${subText}`}>
                      {tr(
                        'Sistem mengunci layar ke fullscreen lockdown agar ujian terlindungi dan tidak dibatalkan di tengah jalan.',
                        'The system locks into fullscreen mode upon starting so exams cannot be cancelled midway.'
                      )}
                    </p>
                  </div>

                  <div className="mt-2.5 flex items-center gap-1 text-[11px] font-bold text-emerald-500">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{tr('Sistem Isolasi Siap', 'Isolation Ready')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tata Tertib & Peraturan Ujian */}
            <div className="py-2.5 space-y-2">
              <div className="flex items-center gap-1.5 text-[#F7B425]">
                <AlertTriangle className="w-4 h-4 text-[#F7B425]" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#F7B425]">
                  {tr('Tata Tertib & Ketentuan Ujian Online', 'Online Examination Rules & Guidelines')}
                </h3>
              </div>

              <ul className={`text-[11px] space-y-1 leading-relaxed ${subText}`}>
                <li className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F7B425] mt-1 shrink-0" />
                  <span>{tr('Layar ujian otomatis masuk ke Mode Layar Penuh (Fullscreen) terisolasi.', 'Exam automatically enters Fullscreen Mode.')}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F7B425] mt-1 shrink-0" />
                  <span>{tr('Peserta tidak dapat keluar dari ujian hingga seluruh jawaban dikumpulkan.', 'Candidates cannot exit until answers are submitted.')}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F7B425] mt-1 shrink-0" />
                  <span>{tr('Waktu ujian berjalan mundur dan jawaban tersimpan otomatis.', 'Timer counts down automatically and answers are autosaved.')}</span>
                </li>
              </ul>

              {/* Mode Fullscreen Status Notice */}
              {activeTest?.isFullscreen === false ? (
                <div className="mt-2 p-2 sm:p-2.5 rounded-lg border bg-amber-500/10 border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
                  <Minimize className="w-4 h-4 shrink-0 text-amber-400" />
                  <div className="min-w-0">
                    <div className="font-extrabold text-[11px] text-amber-300 flex items-center gap-1">
                      <span>{tr('Mode Fullscreen Dinonaktifkan (Mode Windowed / Edit UI Aktif)', 'Fullscreen Mode Disabled (Windowed / UI Edit Mode)')}</span>
                    </div>
                    <div className="text-[10px] text-amber-400/90 leading-tight mt-0.5">
                      {tr(
                        'Program tes ini diatur tanpa isolasi layar penuh, sehingga Anda leluasa menginspeksi atau mengedit tampilan UI tes tanpa terkunci.',
                        'This test program runs without fullscreen isolation, allowing you to freely inspect or edit test UI.'
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-2 p-2 sm:p-2.5 rounded-lg border bg-blue-500/10 border-blue-500/25 text-blue-400 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-blue-400" />
                  <div className="text-[10.5px] leading-tight">
                    {tr(
                      'Mode Fullscreen CBT Aktif: Ujian resmi akan berjalan dalam mode layar penuh (isolasi CBT).',
                      'CBT Fullscreen Mode Active: Official exam will run in fullscreen isolation.'
                    )}
                  </div>
                </div>
              )}

              {/* Agreement Checkbox */}
              <div className="pt-2">
                <label className={`flex items-center gap-2.5 p-2 sm:p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                  agreementChecked 
                    ? 'border-[#2563EB] bg-[#2563EB]/10 text-inherit' 
                    : isDark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}>
                  <input
                    type="checkbox"
                    checked={agreementChecked}
                    onChange={(e) => setAgreementChecked(e.target.checked)}
                    className="w-3.5 h-3.5 accent-[#2563EB] rounded cursor-pointer"
                  />
                  <span className="text-[11px] font-bold">
                    {activeTest?.isFullscreen === false
                      ? tr(
                          'Saya telah membaca instruksi dan siap memulai simulasi ujian (Mode Windowed / Preview Aktif).',
                          'I have read the instructions and am ready to start the test (Windowed / Preview Mode Active).'
                        )
                      : tr(
                          'Saya telah membaca instruksi dan siap memulai ujian dalam mode layar penuh.',
                          'I have read the instructions and am ready to start the exam in fullscreen mode.'
                        )
                    }
                  </span>
                </label>
              </div>
            </div>

            {/* Final CTA Buttons */}
            <div className="pt-3 border-t border-inherit flex flex-col sm:flex-row items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setTestState('list')}
                className={`w-full sm:w-auto px-3.5 py-1.5 rounded-lg border font-bold text-xs transition-all cursor-pointer ${
                  isDark ? 'border-white/15 hover:bg-white/10 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
              >
                {tr('Kembali ke Daftar Tes', 'Back to Test List')}
              </button>

              <button
                type="button"
                disabled={!agreementChecked}
                onClick={handleStartExam}
                className={`w-full sm:w-auto px-4 py-1.5 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                  agreementChecked
                    ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white cursor-pointer active:scale-98'
                    : 'bg-slate-500/30 text-slate-400 cursor-not-allowed border border-transparent'
                }`}
              >
                {activeTest?.isFullscreen === false ? (
                  <>
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>{tr('Mulai Ujian (Mode Windowed / Edit UI)', 'Start Exam (Windowed / UI Edit Mode)')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <Maximize className="w-3.5 h-3.5" />
                    <span>{tr('Masuk Layar Penuh & Mulai Ujian', 'Enter Fullscreen & Start Exam')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Prep Screen Directions Preview Modal */}
          {prepPreviewSection && (
            <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
              <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0E1524] border border-white/20 p-4 sm:p-6 shadow-2xl text-white">
                {renderSectionDirectionContent(
                  prepPreviewSection,
                  directionsThemeMode,
                  false,
                  () => setPrepPreviewSection(null),
                  (s) => setPrepPreviewSection(s),
                  () => setPrepPreviewSection(null)
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. RUNNING STATE - CBT FULLSCREEN LOCKDOWN SYSTEM */}
      {testState === 'running' && (
        <div 
          className="fixed inset-0 z-[99999] bg-[#0A0E17] text-slate-100 flex flex-col w-screen h-screen overflow-hidden select-none font-sans"
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Top CBT Header Bar */}
          <header className="h-11 sm:h-12 px-3 sm:px-4 bg-[#0E1526] border-b border-white/10 flex items-center justify-between shrink-0 shadow-md z-20">
            {/* Left */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white text-xs shadow-xs">
                EJI
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-white">
                    ENGLISH JOIN INDONESIA
                  </span>
                  {activeTest?.isFullscreen === false ? (
                    <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 font-mono text-[9px] font-bold border border-amber-500/30">
                      <Minimize className="w-2.5 h-2.5" />
                      WINDOWED (EDIT UI)
                    </span>
                  ) : (
                    <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-400 font-mono text-[9px] font-bold border border-blue-500/30">
                      <Shield className="w-2.5 h-2.5" />
                      CBT LOCKDOWN
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[180px] sm:max-w-xs">
                  {activeTest?.title || 'TOEFL ITP Prediction'}
                </div>
              </div>
            </div>

            {/* Center: Badge */}
            {activeTest?.isFullscreen === false ? (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold font-mono">
                <Minimize className="w-2.5 h-2.5" />
                <span>MODE WINDOWED / EDIT UI AKTIF</span>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold font-mono">
                <Lock className="w-2.5 h-2.5 animate-pulse" />
                <span>ISOLASI TERKUNCI</span>
              </div>
            )}

            {/* Right: Timer, Live Fullscreen Switch & Submit */}
            <div className="flex items-center gap-2">
              {/* Live Fullscreen Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  if (document.fullscreenElement) {
                    exitBrowserFullscreen();
                  } else {
                    requestBrowserFullscreen();
                  }
                }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-bold border border-white/20 bg-white/10 hover:bg-white/20 transition-all text-slate-200 cursor-pointer"
                title={tr('Klik untuk toggle layar penuh', 'Toggle fullscreen')}
              >
                {fullscreenEnabled ? <Minimize className="w-3 h-3 text-amber-400" /> : <Maximize className="w-3 h-3 text-blue-400" />}
                <span className="hidden md:inline">{fullscreenEnabled ? tr('Layar Penuh: ON', 'Fullscreen: ON') : tr('Layar Penuh: OFF', 'Fullscreen: OFF')}</span>
              </button>

              {/* Close / Return Button when in windowed / edit mode */}
              {activeTest?.isFullscreen === false && (
                <button
                  type="button"
                  onClick={() => {
                    exitBrowserFullscreen();
                    setTestState('list');
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-bold border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 transition-all text-rose-300 cursor-pointer"
                  title={tr('Tutup & Kembali ke Daftar Tes (Mode Preview Edit)', 'Exit to Test List (Preview Edit Mode)')}
                >
                  <X className="w-3 h-3" />
                  <span className="hidden sm:inline">{tr('Tutup Preview', 'Exit Preview')}</span>
                </button>
              )}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 font-mono font-black text-amber-400 text-xs shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="tracking-wider">{formatTime(timeLeft)}</span>
              </div>

              <button
                type="button"
                onClick={() => setShowSubmitConfirm(true)}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-2xs cursor-pointer active:scale-98"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tr('Kumpulkan Ujian', 'Submit Exam')}</span>
                <span className="sm:hidden">{tr('Kumpul', 'Submit')}</span>
              </button>
            </div>
          </header>

          {/* Sub-Header Navigation */}
          <div className="h-9 sm:h-10 px-3 sm:px-4 bg-[#0B101D] border-b border-white/10 flex items-center justify-between text-xs shrink-0 z-10">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#2563EB] text-white font-bold text-[10px] sm:text-[11px]">
                {tr(`Soal ${currentIdx + 1} / ${questions.length}`, `Q ${currentIdx + 1} / ${questions.length}`)}
              </span>
              <span className="text-slate-300 font-semibold text-[11px] truncate max-w-[180px] sm:max-w-md">
                {questions[currentIdx].section} — {questions[currentIdx].part || 'Comprehension'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const currentSec = normalizeSection(questions[currentIdx]?.section);
                  setActiveDirectionSection(currentSec);
                }}
                className={`px-2 py-0.5 rounded-md border text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                  activeDirectionSection
                    ? 'bg-[#F7B425] text-black border-[#F7B425]'
                    : 'bg-[#F7B425]/15 text-[#F7B425] hover:bg-[#F7B425]/25 border-[#F7B425]/40'
                }`}
                title={tr('Buka Petunjuk & Panduan Section (Direction)', 'Open Section Directions Guide')}
              >
                <BookOpen className="w-3 h-3" />
                <span>{tr('Petunjuk (Direction)', 'Directions')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleDoubtful(questions[currentIdx].id)}
                className={`px-2 py-0.5 rounded-md border text-[10px] sm:text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  doubtfulQuestions[questions[currentIdx].id]
                    ? 'bg-amber-500 text-black border-amber-500'
                    : 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>{tr('Ragu-ragu', 'Doubtful')}</span>
              </button>

              <button
                type="button"
                onClick={requestBrowserFullscreen}
                className="p-1 rounded-md border border-white/15 hover:bg-white/10 text-slate-300 cursor-pointer hidden sm:flex items-center gap-1"
                title={tr('Kunci Ulang Layar Penuh', 'Re-lock Fullscreen')}
              >
                <Maximize className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Middle Body */}
          <div className="flex-1 flex overflow-hidden">
            {activeDirectionSection ? (
              /* Section Direction Guide / Preview Screen */
              <main className="flex-1 overflow-y-auto p-3 sm:p-5 max-w-4xl mx-auto w-full">
                {renderSectionDirectionContent(
                  activeDirectionSection,
                  directionsThemeMode,
                  !!seenSectionDirections[activeDirectionSection],
                  handleStartOrDismissDirection,
                  (secKey) => setActiveDirectionSection(secKey),
                  seenSectionDirections[activeDirectionSection] ? () => setActiveDirectionSection(null) : undefined
                )}
              </main>
            ) : (
              /* Main Question Box */
              <main className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col justify-between max-w-4xl mx-auto w-full">
                <div className="space-y-3 sm:space-y-4">
                  {/* Audio Narration Player if Listening */}
                  {questions[currentIdx].section === 'Listening' && (
                    <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-950/30 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center">
                            <Headphones className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-white">Audio Narration Player</div>
                            <div className="text-[10px] text-blue-300">{questions[currentIdx].part || 'Listening Comprehension'}</div>
                          </div>
                        </div>
                        {!(questions[currentIdx] as any).audioUrl && (
                          <button
                            type="button"
                            onClick={handleTestAudioSample}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>{audioPlaying ? 'Memutar...' : 'Putar Audio'}</span>
                          </button>
                        )}
                      </div>
                      {(questions[currentIdx] as any).audioUrl && (
                        <audio controls src={(questions[currentIdx] as any).audioUrl} className="w-full h-8 rounded" />
                      )}
                    </div>
                  )}

                  {/* Reading Passage Card if present */}
                  {((questions[currentIdx] as any).passageText || questions[currentIdx].questionText.includes('[PASSAGE]')) && (
                    <div className="p-3.5 sm:p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-slate-100 text-xs sm:text-sm font-serif leading-relaxed whitespace-pre-line shadow-inner">
                      <div className="text-[10.5px] font-sans font-bold uppercase tracking-wider text-[#F7B425] mb-2 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Reading Passage / Teks Paragraf Cerita</span>
                      </div>
                      {(questions[currentIdx] as any).passageText || (
                        questions[currentIdx].questionText.match(/\[PASSAGE\]([\s\S]*?)\[\/PASSAGE\]/)?.[1]?.trim()
                      )}
                    </div>
                  )}

                  {/* Question Prompt */}
                  <div className="p-3.5 sm:p-4 rounded-xl border border-white/10 bg-[#0E1524] text-white text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-line shadow-inner">
                    {renderWrittenExpressionText(questions[currentIdx].questionText.replace(/\[PASSAGE\][\s\S]*?\[\/PASSAGE\]\s*/, ''), isDark)}
                  </div>

                  {/* Multiple Choice Options */}
                  <div className="space-y-2">
                    {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                      const isSelected = userAnswers[questions[currentIdx].id] === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => handleSelectOption(opt)}
                          className={`w-full text-left p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center gap-2.5 cursor-pointer ${
                            isSelected
                              ? 'bg-[#2563EB] border-[#2563EB] text-white shadow-md shadow-blue-600/25'
                              : 'bg-[#0E1524] hover:bg-white/10 border-white/10 text-slate-200'
                          }`}
                        >
                          <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 transition-colors ${
                            isSelected 
                              ? 'bg-white text-[#2563EB]' 
                              : 'bg-white/10 text-slate-300 border border-white/10'
                          }`}>
                            {opt}
                          </span>
                          <span className="flex-1 leading-relaxed">{questions[currentIdx].options[opt]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Navigation Bar */}
                <div className="pt-4 mt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={currentIdx === 0}
                    onClick={() => handleGoToQuestion(currentIdx - 1)}
                    className="px-3.5 py-1.5 rounded-lg border border-white/15 text-xs font-bold disabled:opacity-30 disabled:pointer-events-none hover:bg-white/5 text-slate-200 flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{tr('Sebelumnya', 'Previous')}</span>
                  </button>

                  <div className="text-center text-[10px] text-slate-400 hidden sm:block">
                    <span>{Object.keys(userAnswers).length} dari {questions.length} terjawab</span>
                  </div>

                  {currentIdx < questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => handleGoToQuestion(currentIdx + 1)}
                      className="px-4 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8] flex items-center gap-1 cursor-pointer shadow-xs active:scale-98 transition-all"
                    >
                      <span>{tr('Berikutnya', 'Next')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSubmitConfirm(true)}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-extrabold hover:bg-emerald-500 shadow-xs flex items-center gap-1 cursor-pointer active:scale-98 transition-all"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>{tr('Kumpulkan Ujian', 'Submit Exam')}</span>
                    </button>
                  )}
                </div>
              </main>
            )}

            {/* Right Question Palette */}
            <aside className="w-64 border-l border-white/10 bg-[#0B101D] p-3 hidden xl:flex flex-col justify-between shrink-0">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                      {tr('Navigasi Lembar Soal', 'Question Navigation Palette')}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        const curSec = normalizeSection(questions[currentIdx]?.section);
                        setActiveDirectionSection(curSec);
                      }}
                      className="text-[10px] text-[#F7B425] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      title={tr('Lihat Petunjuk Section', 'View Section Directions')}
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>{tr('Petunjuk', 'Guide')}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {tr('Klik nomor untuk melompat antar soal', 'Click number to jump')}
                  </p>
                </div>

                {/* Legend */}
                <div className="space-y-1 text-[10px] p-2 rounded-lg bg-white/5 border border-white/10 font-medium">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      <span>{tr('Sudah Dijawab', 'Answered')}</span>
                    </span>
                    <span className="font-bold text-emerald-400">{Object.keys(userAnswers).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                      <span>{tr('Ragu-ragu', 'Doubtful')}</span>
                    </span>
                    <span className="font-bold text-amber-400">{Object.values(doubtfulQuestions).filter(Boolean).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />
                      <span>{tr('Belum Dijawab', 'Unanswered')}</span>
                    </span>
                    <span className="font-bold text-slate-400">{questions.length - Object.keys(userAnswers).length}</span>
                  </div>
                </div>

                {/* Grid of question pills */}
                <div className="grid grid-cols-4 gap-1.5 pt-1 max-h-[300px] overflow-y-auto pr-0.5">
                  {questions.map((q, idx) => {
                    const isAnswered = !!userAnswers[q.id];
                    const isDoubt = !!doubtfulQuestions[q.id];
                    const isCurrent = idx === currentIdx;

                    let bgClass = 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10';
                    if (isAnswered) {
                      bgClass = 'bg-emerald-600 text-white border-emerald-500';
                    }
                    if (isDoubt) {
                      bgClass = 'bg-amber-500 text-black border-amber-400 font-black';
                    }

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => handleGoToQuestion(idx)}
                        className={`h-8 rounded-lg font-bold text-xs border transition-all flex items-center justify-center cursor-pointer ${bgClass} ${
                          isCurrent ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-[#0B101D] scale-105' : ''
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Isolation note */}
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 space-y-1 text-[10px] text-slate-400">
                <div className="flex items-center gap-1 text-emerald-400 font-bold">
                  <Lock className="w-3 h-3" />
                  <span>Isolasi CBT Aktif</span>
                </div>
                <p className="leading-tight">
                  Peserta terisolasi dalam mode ujian resmi hingga lembar jawaban dikumpulkan.
                </p>
              </div>
            </aside>
          </div>

          {/* Fullscreen Warning Modal */}
          {showFullscreenWarning && (
            <div className="fixed inset-0 z-[100000] bg-black/90 backdrop-blur-md flex items-center justify-center p-3">
              <div className="max-w-md w-full rounded-2xl bg-[#141A28] border-2 border-red-500/50 p-4 text-center shadow-2xl space-y-3 text-white">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/40 animate-pulse">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-red-400">
                    {tr('PERINGATAN SISTEM CBT LOCKDOWN', 'CBT LOCKDOWN SECURITY WARNING')}
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    {tr(
                      'Layar penuh terdeteksi keluar. Sesuai regulasi ujian, peserta diisolasi dalam layar penuh.',
                      'Fullscreen has been exited. Per regulations, candidates are isolated in fullscreen.'
                    )}
                  </p>
                </div>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={requestBrowserFullscreen}
                    className="w-full py-2 px-3 rounded-lg font-bold text-xs bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <Maximize className="w-3.5 h-3.5" />
                    <span>{tr('KEMBALIKAN KE LAYAR PENUH', 'RESTORE FULLSCREEN')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Submit Confirmation Modal */}
          {showSubmitConfirm && (
            <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
              <div className="max-w-md w-full rounded-2xl bg-[#141A28] border border-white/15 p-4 space-y-3 text-white shadow-2xl">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-bold">
                    {tr('Konfirmasi Pengumpulan Lembar Ujian', 'Confirm Exam Submission')}
                  </h3>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {tr(
                      `Anda telah menjawab ${Object.keys(userAnswers).length} dari ${questions.length} butir soal. Apakah Anda yakin ingin mengumpulkan ujian sekarang?`,
                      `You answered ${Object.keys(userAnswers).length} of ${questions.length} questions. Are you sure you want to submit now?`
                    )}
                  </p>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowSubmitConfirm(false)}
                    className="flex-1 py-1.5 rounded-lg border border-white/15 hover:bg-white/10 font-bold text-xs text-slate-300 cursor-pointer"
                  >
                    {tr('Periksa Kembali', 'Review Answers')}
                  </button>
                  <button
                    type="button"
                    onClick={handleFinish}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs cursor-pointer active:scale-98"
                  >
                    {tr('Ya, Kumpulkan', 'Yes, Submit')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. COMPLETED STATE - CERTIFICATE & SCORECARD */}
      {testState === 'completed' && (
        <div className={`rounded-xl p-4 sm:p-5 border shadow-xl space-y-3.5 max-w-xl mx-auto text-center animate-fadeIn ${cardBg}`}>
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[10.5px] font-bold uppercase">
              {tr('Tes TOEFL Selesai', 'Test Completed')}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-heading mt-2">
              {tr('Skor TOEFL ITP Kamu:', 'Your TOEFL ITP Score:')} <span className="text-[#F7B425]">{scaledScore}</span>
            </h2>
            <p className={`text-[11px] mt-0.5 ${subText}`}>
              {tr(`Jawaban Benar: ${correctCount} dari ${questions.length} butir (${rawPercentage}%)`, `Correct: ${correctCount} of ${questions.length} (${rawPercentage}%)`)}
            </p>
          </div>

          {/* Certificate Card */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#0B0B0B] text-white text-left space-y-2.5 border border-[#F7B425]/40 relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#F7B425] block">
                  ENGLISH JOIN INDONESIA
                </span>
                <span className="text-[11px] font-bold text-slate-200">
                  OFFICIAL TOEFL PREDICTION CERTIFICATE
                </span>
              </div>
              <Award className="w-5 h-5 text-[#F7B425]" />
            </div>

            <div className="space-y-0.5">
              <span className="text-[9px] text-slate-400">{tr('Diberikan kepada:', 'Awarded to:')}</span>
              <h3 className="text-base sm:text-lg font-bold text-white font-heading">
                {user?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'}
              </h3>
              <p className="text-[10px] text-slate-400">{tr('Sebagai Peserta Ujian TOEFL Prediction Online Terverifikasi', 'As a Verified Online TOEFL Prediction Candidate')}</p>
            </div>

            <div className="grid grid-cols-3 gap-1.5 p-2 bg-white/5 rounded-lg text-xs font-mono text-center">
              <div>
                <span className="text-[8.5px] text-slate-400 block">LISTENING</span>
                <span className="font-bold text-white">56</span>
              </div>
              <div>
                <span className="text-[8.5px] text-slate-400 block">STRUCTURE</span>
                <span className="font-bold text-white">58</span>
              </div>
              <div>
                <span className="text-[8.5px] text-slate-400 block">READING</span>
                <span className="font-bold text-white">58</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-[9.5px] text-slate-400">
              <span className="text-emerald-400 font-semibold">{tr('Status: Selesai Diujikan', 'Status: Completed')}</span>
              <span className="text-[#F7B425] font-mono font-bold">Total: {scaledScore}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setTestState('list')}
              className={`flex-1 py-1.5 sm:py-2 rounded-lg border font-bold text-xs flex items-center justify-center gap-1 cursor-pointer ${
                isDark ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <RotateCcw className="w-3 h-3" />
              <span>{tr('Daftar Tes', 'Test List')}</span>
            </button>
            <button
              onClick={async () => {
                try {
                  setIsDownloadingPdf(true);
                  const studentName = user?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';
                  const todayStr = new Date().toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  });
                  await downloadCertificatePdf({
                    studentName,
                    testTitle: activeTest?.title || 'TOEFL ITP Prediction Test #01',
                    testType: 'TOEFL ITP',
                    certNumber: `EJI/TOEFL-ITP/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
                    certIssueDate: todayStr,
                    listeningScore: 56,
                    structureScore: 58,
                    readingScore: 58,
                    totalScore: Number(scaledScore) || 573,
                    maxScore: 677,
                    levelCategory: Number(scaledScore) >= 550 ? 'C1 - Advanced High' : 'B2 - Independent'
                  });
                } catch (err) {
                  console.error('Error downloading certificate PDF:', err);
                } finally {
                  setIsDownloadingPdf(false);
                }
              }}
              disabled={isDownloadingPdf}
              className="flex-1 py-1.5 sm:py-2 rounded-lg bg-[#F7B425] font-bold text-xs text-black hover:bg-amber-400 flex items-center justify-center gap-1 shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                  <span>{tr('Mengunduh PDF...', 'Downloading PDF...')}</span>
                </>
              ) : (
                <>
                  <Download className="w-3 h-3" />
                  <span>{tr('Unduh E-Certificate', 'Download Certificate')}</span>
                </>
              )}
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
