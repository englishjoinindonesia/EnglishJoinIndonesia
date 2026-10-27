import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  HelpCircle, Plus, Search, CheckCircle2, 
  Trash2, Edit3, Filter, BookOpen, Volume2, 
  X, ArrowLeft, ChevronRight, ChevronDown, Layers, Clock, 
  Award, Eye, FolderOpen, ArrowUpRight, Sparkles,
  Settings, Check, FolderPlus, Sliders, ToggleLeft, ToggleRight,
  Headphones, FileEdit, PenTool, LayoutGrid, Table2, Upload, Play, Pause, Music, FileAudio
} from 'lucide-react';
import { ToeflQuestion, ToeflTestProgram } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { usePrograms } from '../../context/ProgramsContext';
import { CustomDropdown } from '../common/CustomDropdown';
import { TOEFL_PROGRAMS } from '../../data/toeflData';
import { 
  loadQuestionBanks, 
  createQuestionBank, 
  updateQuestionBank, 
  deleteQuestionBank, 
  loadToeflQuestions, 
  createToeflQuestion, 
  updateToeflQuestion, 
  deleteToeflQuestion 
} from '../../lib/supabaseService';
import { supabase } from '../../lib/supabase';

export interface SectionStructureItem {
  id: string;
  name: string;
  questionCount: number;
  durationMinutes: number;
}

const DEFAULT_TOEFL_SECTIONS: SectionStructureItem[] = [
  { id: 'sec-1', name: 'Section 1: Listening Comprehension', questionCount: 50, durationMinutes: 35 },
  { id: 'sec-2', name: 'Section 2: Structure & Written Expression', questionCount: 40, durationMinutes: 25 },
  { id: 'sec-3', name: 'Section 3: Reading Comprehension', questionCount: 50, durationMinutes: 55 },
];

const IBT_TOEFL_SECTIONS: SectionStructureItem[] = [
  { id: 'sec-1', name: 'Section 1: Reading Academic', questionCount: 20, durationMinutes: 35 },
  { id: 'sec-2', name: 'Section 2: Listening Academic', questionCount: 28, durationMinutes: 36 },
  { id: 'sec-3', name: 'Section 3: Speaking Section', questionCount: 4, durationMinutes: 16 },
  { id: 'sec-4', name: 'Section 4: Writing Section', questionCount: 2, durationMinutes: 29 },
];

// List of Available Test Programs (matching the test simulations available in student role)
const AVAILABLE_PROGRAMS: ToeflTestProgram[] = [
  {
    id: 'toefl-pred-1',
    title: 'TOEFL ITP — Prediction Test 02',
    tag: 'Simulasi Resmi',
    category: 'TOEFL ITP',
    duration: '115 Menit',
    questionCount: '140 Soal (L, S, R)',
    scoreTarget: 'Skala 310 - 677',
    benefits: [
      'Section 1: Listening Comprehension (50 Soal • 35 Menit)',
      'Section 2: Structure & Written Expression (40 Soal • 25 Menit)',
      'Section 3: Reading Comprehension (50 Soal • 55 Menit)'
    ],
    isActive: true
  }
];

// Initial questions tagged with programId
const INITIAL_QUESTIONS: ToeflQuestion[] = [
  // --- Program: TOEFL ITP — Prediction Test 02 [toefl-pred-1] ---
  {
    id: 'q1',
    programId: 'toefl-pred-1',
    section: 'Structure',
    part: 'Part A (Sentence Completion)',
    questionText: 'The North Platte River ______ from Wyoming into Nebraska.',
    options: {
      A: 'it flowed',
      B: 'flows',
      C: 'flowing',
      D: 'with flowing water'
    },
    correctAnswer: 'B',
    explanation: 'Kalimat membutuhkan kata kerja utama (main verb) bentuk simple present "flows" untuk melengkapi subjek "The North Platte River".'
  },
  {
    id: 'q2',
    programId: 'toefl-pred-1',
    section: 'Structure',
    part: 'Part A (Sentence Completion)',
    questionText: '______ Biloxi received its name from a Sioux word meaning "first people".',
    options: {
      A: 'The city of',
      B: 'Located in',
      C: 'It is in',
      D: 'The tour of'
    },
    correctAnswer: 'A',
    explanation: 'Kalimat membutuhkan subjek berupa noun phrase "The city of Biloxi" sebelum main verb "received".'
  },
  {
    id: 'q3',
    programId: 'toefl-pred-1',
    section: 'Structure',
    part: 'Part B (Written Expression)',
    questionText: 'Guppies are sometimes call (A) rainbow fish because of (B) the males’ (C) bright colors (D).',
    options: {
      A: 'call -> called (Passive voice)',
      B: 'because of',
      C: 'the males’',
      D: 'bright colors'
    },
    correctAnswer: 'A',
    explanation: 'Passive voice membutuhkan past participle (Verb-3). Kata "call" harus diubah menjadi "called" setelah to be "are".'
  },
  {
    id: 'q4',
    programId: 'toefl-pred-1',
    section: 'Listening',
    part: 'Part A (Short Dialogue)',
    questionText: '(Man): Did you get to the post office today?\n(Woman): I was planning on it, but my afternoon was completely booked.\n(Narrator): What does the woman mean?',
    options: {
      A: 'She went to the post office early.',
      B: 'She was too busy to go to the post office.',
      C: 'She booked a ticket at the post office.',
      D: 'She bought some books in the afternoon.'
    },
    correctAnswer: 'B',
    explanation: 'Idiom "completely booked" bermakna sangat sibuk dan jadwal penuh, sehingga pembicara wanita tidak sempat ke kantor pos.'
  },
  {
    id: 'q5',
    programId: 'toefl-pred-1',
    section: 'Reading',
    part: 'Academic Reading Comprehension',
    questionText: 'Based on the passage, what is the primary factor that causes the formation of coastal sand dunes?',
    options: {
      A: 'Rapid ocean currents eroding coral reefs',
      B: 'Steady onshore winds transporting dry sand particles',
      C: 'Tectonic plate activity along coastal faults',
      D: 'Excessive seasonal rainfall in tropical regions'
    },
    correctAnswer: 'B',
    explanation: 'Teks menyatakan pembentukan bukit pasir pantai diakibatkan oleh angin pantai konstan yang membawa butiran pasir kering.'
  },

  // --- Program: TOEFL Preparation & Test (Garansi 500+) [toefl-guarantee] ---
  {
    id: 'q6',
    programId: 'toefl-guarantee',
    section: 'Structure',
    part: 'Part A (Inversion & Advanced Grammar)',
    questionText: 'Not until the seventeenth century ______ to measure the speed of light with any accuracy.',
    options: {
      A: 'scientists were able',
      B: 'were scientists able',
      C: 'scientists able were',
      D: 'did scientists able'
    },
    correctAnswer: 'B',
    explanation: 'Frasa negatif di awal kalimat "Not until..." mewajibkan struktur inversi (auxiliary verb mendahului subjek): "were scientists able".'
  },
  {
    id: 'q7',
    programId: 'toefl-guarantee',
    section: 'Structure',
    part: 'Part B (Subject-Verb Agreement)',
    questionText: 'Each of the modern (A) laboratory computers are (B) connected to (C) the centralized mainframe server (D).',
    options: {
      A: 'modern',
      B: 'are -> is (Singular agreement)',
      C: 'connected to',
      D: 'centralized mainframe server'
    },
    correctAnswer: 'B',
    explanation: 'Subjek kalimat diawali dengan "Each of...", yang bernilai singular, sehingga auxiliary verb yang tepat adalah "is", bukan "are".'
  },
  {
    id: 'q8',
    programId: 'toefl-guarantee',
    section: 'Listening',
    part: 'Part C (Academic Lecture)',
    questionText: '(Professor): Today we explore how desert flora adapt to extreme diurnal temperature swings...\n(Narrator): What is the main purpose of the professor’s lecture?',
    options: {
      A: 'To compare nocturnal desert predators',
      B: 'To illustrate plant physiological adaptations in arid environments',
      C: 'To explain water evaporation rates in rainforests',
      D: 'To summarize agricultural advancements in irrigation'
    },
    correctAnswer: 'B',
    explanation: 'Topik utama kuliah adalah adaptasi fisiologis tumbuhan gurun terhadap perubahan suhu ekstrem.'
  },
  {
    id: 'q9',
    programId: 'toefl-guarantee',
    section: 'Reading',
    part: 'Inference & Vocabulary',
    questionText: 'The author uses the word "resilient" in line 14 to imply that the community:',
    options: {
      A: 'succumbed quickly to external economic pressures',
      B: 'was capable of recovering readily from adversity',
      C: 'remained resistant to adopting modern technology',
      D: 'isolated itself from neighboring populations'
    },
    correctAnswer: 'B',
    explanation: 'Kata "resilient" berarti tangguh dan mampu bangkit kembali dengan cepat dari kesulitan (recovering from adversity).'
  },

  // --- Program: TOEFL Fast-Track Weekend Bootcamp [toefl-fasttrack] ---
  {
    id: 'q10',
    programId: 'toefl-fasttrack',
    section: 'Structure',
    part: 'Part A (Noun Clauses)',
    questionText: '______ is essential for maintaining strong cardiovascular health has been proven repeatedly.',
    options: {
      A: 'That regular aerobic exercise',
      B: 'Regular aerobic exercise',
      C: 'Because regular aerobic exercise',
      D: 'It is regular aerobic exercise'
    },
    correctAnswer: 'A',
    explanation: 'Kalimat membutuhkan noun clause yang diawali dengan konjungsi "That" untuk berfungsi sebagai subjek utama kalimat.'
  },
  {
    id: 'q11',
    programId: 'toefl-fasttrack',
    section: 'Listening',
    part: 'Part A (Idiomatic Expressions)',
    questionText: '(Woman): Are you going to take the advanced linguistics seminar next term?\n(Man): I’m on the fence about it.\n(Narrator): What does the man mean?',
    options: {
      A: 'He definitely plans to register.',
      B: 'He is undecided about taking the course.',
      C: 'He will watch the seminar from outside.',
      D: 'He dropped the course last week.'
    },
    correctAnswer: 'B',
    explanation: 'Idiom "on the fence" berarti belum bisa memutuskan atau masih ragu-ragu (undecided).'
  },
  {
    id: 'q12',
    programId: 'toefl-fasttrack',
    section: 'Reading',
    part: 'Main Idea & Details',
    questionText: 'What is the passage primarily concerned with?',
    options: {
      A: 'The economic impact of the transcontinental railroad',
      B: 'The architectural flaws of early steam locomotives',
      C: 'The biography of George Stephenson',
      D: 'The decline of riverboat transport in the Midwest'
    },
    correctAnswer: 'A',
    explanation: 'Paragraf awal dan tesis teks berfokus pada dampak ekonomi dari pembangunan jalur kereta api lintas benua.'
  },

  // --- Additional Practice Items [toefl-pred-1] ---
  {
    id: 'q13',
    programId: 'toefl-pred-1',
    section: 'Reading',
    part: 'Part C (Academic Reading Comprehension)',
    questionText: 'According to paragraph 2, which of the following is TRUE about hydrothermal vents?',
    options: {
      A: 'They are solely supported by sunlight penetration',
      B: 'They host chemosynthetic ecosystems independent of photosynthesis',
      C: 'They were discovered prior to the eighteenth century',
      D: 'They cool down the surrounding abyssal water temperature'
    },
    correctAnswer: 'B',
    explanation: 'Paragraf menjelaskan ekosistem ventilasi hidrotermal bergantung pada bakteri kemosintetik tanpa memerlukan fotosintesis sinar matahari.'
  },
  {
    id: 'q14',
    programId: 'toefl-pred-1',
    section: 'Listening',
    part: 'Part A (Short Dialogue)',
    questionText: '(Student): Could I possibly hand in the term paper by Monday noon instead?\n(Professor): Monday noon? Let’s just say my grading deadline is Monday 9 AM.\n(Narrator): What does the professor imply?',
    options: {
      A: 'The student can submit the paper on Tuesday.',
      B: 'The professor will not accept submissions after Monday 9 AM.',
      C: 'The professor is not available to grade on Monday.',
      D: 'The deadline has been moved forward to Friday.'
    },
    correctAnswer: 'B',
    explanation: 'Profesor mengindikasikan batas akhir pengumpulan nilai adalah Senin pukul 09.00 pagi, sehingga permintaan perpanjangan ke siang hari ditolak secara implisit.'
  }
];

export const ToeflQuestionsTab: React.FC = () => {
  const { isDark } = useTheme();
  const { tr } = useLanguage();
  const { toeflPrograms, deleteProgram: deleteContextProgram, toggleProgramActive } = usePrograms();

  // Navigation state: null means showing the Available Programs Table
  const [selectedProgram, setSelectedProgram] = useState<ToeflTestProgram | null>(null);

  // Question bank state with localStorage persistence
  const [questions, setQuestions] = useState<ToeflQuestion[]>(() => {
    try {
      const saved = localStorage.getItem('ej_toefl_questions_bank');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading questions from localStorage', e);
    }
    return INITIAL_QUESTIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('ej_toefl_questions_bank', JSON.stringify(questions));
    } catch (e) {
      console.warn('Error saving questions to localStorage', e);
    }
  }, [questions]);

  // Helper: check if program matches tests available in student role (ITP / Prediction simulations, no courses/bootcamps, no iBT)
  const isStudentTestProgram = (p: ToeflTestProgram) => {
    const id = (p.id || '').toLowerCase();
    const title = (p.title || '').toLowerCase();
    const cat = (p.category || '').toLowerCase();
    if (id === 'toefl-guarantee' || id === 'toefl-fasttrack' || id === 'prog-beginners' || id === 'prog-conversation') return false;
    if (cat.includes('intensif') || cat.includes('bootcamp') || cat.includes('short course')) return false;
    if (id.includes('ibt') || title.includes('ibt') || cat.includes('ibt')) return false;
    return true;
  };

  // Available programs state with localStorage persistence (strictly synchronized with student role tests)
  const [programsList, setProgramsList] = useState<ToeflTestProgram[]>(() => {
    try {
      const saved = localStorage.getItem('ej_toefl_test_programs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.filter(isStudentTestProgram);
          if (sanitized.length > 0) return sanitized;
        }
      }
    } catch (e) {
      console.warn('Error reading programs from localStorage', e);
    }
    return AVAILABLE_PROGRAMS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('ej_toefl_test_programs', JSON.stringify(programsList));
    } catch (e) {
      console.warn('Error saving programs to localStorage', e);
    }
  }, [programsList]);

  // Synchronize Bank Soal & Questions with Supabase on mount
  useEffect(() => {
    let isSubscribed = true;

    const syncWithSupabase = async () => {
      try {
        // 1. Load Question Banks from Supabase
        const { data: dbBanks, error: banksErr } = await loadQuestionBanks();
        if (!banksErr && dbBanks && dbBanks.length > 0 && isSubscribed) {
          const mappedPrograms: ToeflTestProgram[] = dbBanks.map((b) => ({
            id: b.id,
            title: b.title,
            tag: b.tag || 'Resmi',
            category: b.category,
            duration: b.duration,
            questionCount: b.question_count,
            scoreTarget: b.score_target || 'Skala 310 - 677',
            benefits: b.benefits || [],
            isActive: b.is_active,
          }));
          const sanitized = mappedPrograms.filter(isStudentTestProgram);
          if (sanitized.length > 0) {
            setProgramsList(sanitized);
            localStorage.setItem('ej_toefl_test_programs', JSON.stringify(sanitized));
          }
        } else if (!banksErr && dbBanks && dbBanks.length === 0) {
          // Seed default programs to Supabase
          for (const prog of AVAILABLE_PROGRAMS) {
            await createQuestionBank({
              id: prog.id,
              title: prog.title,
              category: prog.category,
              tag: prog.tag || 'Resmi',
              duration: prog.duration,
              question_count: prog.questionCount,
              score_target: prog.scoreTarget,
              benefits: prog.benefits || [],
              is_active: prog.isActive !== false,
            });
          }
        }

        // 2. Load Questions from Supabase
        const { data: dbQuestions, error: qErr } = await loadToeflQuestions();
        if (!qErr && dbQuestions && dbQuestions.length > 0 && isSubscribed) {
          const mappedQuestions: ToeflQuestion[] = dbQuestions.map((q) => ({
            id: q.id,
            programId: q.program_id,
            section: q.section as any,
            part: q.part,
            questionText: q.question_text,
            audioUrl: q.audio_url || undefined,
            options: q.options,
            correctAnswer: (q.correct_answer || 'A') as 'A' | 'B' | 'C' | 'D',
            explanation: q.explanation || '',
          }));
          setQuestions(mappedQuestions);
          localStorage.setItem('ej_toefl_questions_bank', JSON.stringify(mappedQuestions));
        } else if (!qErr && dbQuestions && dbQuestions.length === 0) {
          // Seed initial questions to Supabase
          for (const q of INITIAL_QUESTIONS) {
            await createToeflQuestion({
              id: q.id,
              program_id: q.programId,
              section: q.section,
              part: q.part,
              question_text: q.questionText,
              audio_url: q.audioUrl || null,
              options: q.options,
              correct_answer: q.correctAnswer,
              explanation: q.explanation || '',
            });
          }
        }
      } catch (err) {
        console.warn('Supabase sync notice:', err);
      }
    };

    syncWithSupabase();

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Quick Add Dropdown state & ref
  const [isProgramDropdownOpen, setIsProgramDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProgramDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter ONLY test programs that match tests available in the student role
  const testBasedPrograms = useMemo(() => {
    const map = new Map<string, ToeflTestProgram>();

    // Add base test programs from programsList (only if matching student role test)
    programsList.filter(isStudentTestProgram).forEach(p => {
      map.set(p.id, p);
    });

    return Array.from(map.values());
  }, [programsList]);

  // Automatically open program if navigated with an active program ID from Overview tab
  useEffect(() => {
    try {
      const activeProgId = sessionStorage.getItem('ej_active_manage_program_id');
      if (activeProgId && testBasedPrograms.length > 0) {
        const foundProg = testBasedPrograms.find(p => p.id === activeProgId);
        if (foundProg) {
          setSelectedProgram(foundProg);
          sessionStorage.removeItem('ej_active_manage_program_id');
        }
      }
    } catch (e) {
      console.warn('Error reading active program from sessionStorage', e);
    }
  }, [testBasedPrograms]);

  // Program table search & filter
  const [programSearchTerm, setProgramSearchTerm] = useState('');
  const [selectedProgramCategory, setSelectedProgramCategory] = useState<string>('all');

  // Question editor search & filter (when inside a program)
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [questionSearchTerm, setQuestionSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ToeflQuestion | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  // Program Modal state (Tambah Bank Soal Baru / Edit Bank Soal)
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [programModalMode, setProgramModalMode] = useState<'create' | 'edit'>('create');
  const [programFormData, setProgramFormData] = useState<{
    id: string;
    title: string;
    category: string;
    customCategory: string;
    tag: string;
    duration: string;
    scoreTarget: string;
    sections: SectionStructureItem[];
    isActive: boolean;
  }>({
    id: '',
    title: '',
    category: 'TOEFL ITP',
    customCategory: '',
    tag: 'Simulasi Baru',
    duration: '115 Menit',
    scoreTarget: 'Skala 310 - 677',
    sections: DEFAULT_TOEFL_SECTIONS,
    isActive: true,
  });

  // Delete Program Modal state
  const [deletingProgram, setDeletingProgram] = useState<ToeflTestProgram | null>(null);

  // Delete Question Modal state
  const [deletingQuestion, setDeletingQuestion] = useState<ToeflQuestion | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleToggleProgramStatus = async (programId: string) => {
    const target = programsList.find(p => p.id === programId);
    const newActiveState = target ? !(target.isActive !== false) : true;

    setProgramsList(prev => prev.map(p => {
      if (p.id === programId) {
        return { ...p, isActive: newActiveState };
      }
      return p;
    }));
    if (toggleProgramActive) {
      toggleProgramActive(programId);
    }

    try {
      await updateQuestionBank({ id: programId, is_active: newActiveState });
      setActionNotice(tr(
        newActiveState ? 'Bank Soal aktif di Supabase.' : 'Bank Soal dinonaktifkan di Supabase.',
        newActiveState ? 'Question bank enabled in Supabase.' : 'Question bank disabled in Supabase.'
      ));
      setTimeout(() => setActionNotice(null), 3000);
    } catch (e) {
      console.warn('Error updating status in Supabase', e);
    }
  };

  const handleConfirmDeleteProgram = async () => {
    if (!deletingProgram) return;
    const targetId = deletingProgram.id;
    const targetTitle = deletingProgram.title;

    setProgramsList(prev => prev.filter(p => p.id !== targetId));
    setQuestions(prev => prev.filter(q => q.programId !== targetId));
    if (selectedProgram && selectedProgram.id === targetId) {
      setSelectedProgram(null);
    }
    if (deleteContextProgram) {
      deleteContextProgram(targetId);
    }
    setDeletingProgram(null);

    try {
      await deleteQuestionBank(targetId);
      setActionNotice(tr(`Bank Soal "${targetTitle}" berhasil dihapus dari Supabase.`, `Question bank "${targetTitle}" deleted from Supabase.`));
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      console.warn('Error deleting question bank from Supabase', err);
    }
  };

  // Styling helper
  const cardBg = isDark ? 'bg-[#141414] border-white/10 text-white shadow-xl' : 'bg-white border-slate-200/90 text-slate-900 shadow-sm';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';

  // Helper to count questions per program
  const getQuestionCountForProgram = (programId: string) => {
    return questions.filter(q => q.programId === programId).length;
  };

  // Filter available test programs matching tests in student role
  const filteredPrograms = testBasedPrograms.filter(prog => {
    const catLower = prog.category.toLowerCase();
    const matchesCategory = selectedProgramCategory === 'all' || 
      (selectedProgramCategory === 'structure' && (catLower.includes('structure') || catLower.includes('tata bahasa'))) ||
      (selectedProgramCategory === 'listening' && (catLower.includes('listening') || catLower.includes('percakapan'))) ||
      (selectedProgramCategory === 'reading' && (catLower.includes('reading') || catLower.includes('bacaan'))) ||
      (selectedProgramCategory === 'simulasi' && (catLower.includes('simulasi') || catLower.includes('itp') || catLower.includes('resmi')));
    
    const matchesSearch = prog.title.toLowerCase().includes(programSearchTerm.toLowerCase()) ||
      prog.category.toLowerCase().includes(programSearchTerm.toLowerCase()) ||
      prog.id.toLowerCase().includes(programSearchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Filter questions for the selected program
  const activeProgramQuestions = selectedProgram 
    ? questions.filter(q => q.programId === selectedProgram.id)
    : [];

  const filteredQuestions = activeProgramQuestions.filter(q => {
    const matchSec = selectedSection === 'all' || q.section.toLowerCase() === selectedSection.toLowerCase();
    const matchSearch = q.questionText.toLowerCase().includes(questionSearchTerm.toLowerCase()) ||
      q.explanation.toLowerCase().includes(questionSearchTerm.toLowerCase());
    return matchSec && matchSearch;
  });

  const handleDelete = (target: string | ToeflQuestion) => {
    if (typeof target === 'string') {
      const found = questions.find(q => q.id === target);
      if (found) {
        setDeletingQuestion(found);
      } else {
        setQuestions(prev => {
          const updated = prev.filter(q => q.id !== target);
          try {
            localStorage.setItem('ej_toefl_questions_bank', JSON.stringify(updated));
            window.dispatchEvent(new Event('storage'));
          } catch (e) {
            console.warn(e);
          }
          return updated;
        });
      }
    } else {
      setDeletingQuestion(target);
    }
  };

  const handleConfirmDeleteQuestion = async () => {
    if (!deletingQuestion) return;
    const targetId = deletingQuestion.id;
    setQuestions(prev => {
      const next = prev.filter(q => q.id !== targetId);
      try {
        localStorage.setItem('ej_toefl_questions_bank', JSON.stringify(next));
        window.dispatchEvent(new Event('storage'));
      } catch (err) {
        console.warn('Error saving questions to localStorage', err);
      }
      return next;
    });
    setDeletingQuestion(null);

    try {
      await deleteToeflQuestion(targetId);
      setActionNotice(tr('Butir soal berhasil dihapus dari Supabase.', 'Question item deleted from Supabase.'));
      setTimeout(() => {
        setActionNotice(null);
      }, 3000);
    } catch (err) {
      console.warn('Error deleting question from Supabase', err);
    }
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|ogg|aac|flac)$/i)) {
      setActionNotice(tr('Format tidak didukung. Harap upload file audio (MP3, WAV, M4A, OGG).', 'Unsupported format. Please upload an audio file (MP3, WAV, M4A, OGG).'));
      setTimeout(() => setActionNotice(null), 3500);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setActionNotice(tr('Ukuran file audio terlalu besar (maksimal 25MB).', 'Audio file is too large (max 25MB).'));
      setTimeout(() => setActionNotice(null), 3500);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setEditingQuestion(prev => {
        if (!prev) return null;
        return {
          ...prev,
          audioUrl: result,
          audioFileName: file.name,
          questionText: prev.questionText && prev.questionText.trim().length > 0 
            ? prev.questionText 
            : tr(`Dengarkan rekaman audio "${file.name}" untuk menjawab soal ini.`, `Listen to the audio recording "${file.name}" to answer this question.`)
        };
      });
      setActionNotice(tr(`File audio "${file.name}" berhasil diunggah!`, `Audio file "${file.name}" uploaded successfully!`));
      setTimeout(() => setActionNotice(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleUseSampleAudio = () => {
    // Standard educational sample listening recording (short dialogue / audio prompt)
    const sampleAudioUrl = 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg';
    setEditingQuestion(prev => {
      if (!prev) return null;
      return {
        ...prev,
        audioUrl: sampleAudioUrl,
        audioFileName: 'sample_toefl_dialogue_part_a.mp3',
        questionText: prev.questionText && prev.questionText.trim().length > 0
          ? prev.questionText
          : '(Narrator): Listen to a short conversation between two students on campus.\n(Woman): Did you already register for the advanced syntax seminar?\n(Man): I haven’t made up my mind yet.'
      };
    });
    setActionNotice(tr('Audio sampel TOEFL percakapan berhasil dimuat.', 'Sample TOEFL listening audio loaded.'));
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;
    const targetProgramId = editingQuestion.programId || selectedProgram?.id || testBasedPrograms[0]?.id;
    if (!targetProgramId) return;

    // For listening comprehension:
    let finalQuestionText = (editingQuestion.questionText || '').trim();
    if (editingQuestion.section === 'Listening') {
      if (!editingQuestion.audioUrl && !finalQuestionText) {
        setActionNotice(tr('Harap upload file audio untuk soal Listening Comprehension.', 'Please upload an audio file for the Listening Comprehension question.'));
        setTimeout(() => setActionNotice(null), 3500);
        return;
      }
      if (!finalQuestionText) {
        finalQuestionText = tr('Dengarkan rekaman audio untuk menjawab pertanyaan berikut.', 'Listen to the audio recording to answer the question.');
      }
    } else if (!finalQuestionText) {
      setActionNotice(tr('Teks pertanyaan / soal wajib diisi.', 'Question text prompt is required.'));
      setTimeout(() => setActionNotice(null), 3500);
      return;
    }

    const questionToSave: ToeflQuestion = {
      ...editingQuestion,
      programId: targetProgramId,
      questionText: finalQuestionText
    };

    if (editingQuestion.id) {
      const updatedQuestion = questionToSave;
      setQuestions(questions.map(q => q.id === editingQuestion.id ? updatedQuestion : q));
      setIsAddModalOpen(false);
      setEditingQuestion(null);

      try {
        await updateToeflQuestion({
          id: updatedQuestion.id,
          program_id: targetProgramId,
          section: updatedQuestion.section,
          part: updatedQuestion.part,
          question_text: updatedQuestion.questionText,
          audio_url: updatedQuestion.audioUrl || null,
          options: updatedQuestion.options,
          correct_answer: updatedQuestion.correctAnswer,
          explanation: updatedQuestion.explanation || '',
        });
        setActionNotice(tr('Butir soal berhasil diperbarui di Supabase.', 'Question updated in Supabase.'));
        setTimeout(() => setActionNotice(null), 3000);
      } catch (err) {
        console.warn('Error updating question in Supabase', err);
      }
    } else {
      const newId = `q${Date.now()}`;
      const newQuestion = { ...questionToSave, id: newId };
      setQuestions([...questions, newQuestion]);
      setIsAddModalOpen(false);
      setEditingQuestion(null);

      try {
        await createToeflQuestion({
          id: newId,
          program_id: targetProgramId,
          section: newQuestion.section,
          part: newQuestion.part,
          question_text: newQuestion.questionText,
          audio_url: newQuestion.audioUrl || null,
          options: newQuestion.options,
          correct_answer: newQuestion.correctAnswer,
          explanation: newQuestion.explanation || '',
        });
        setActionNotice(tr('Butir soal baru berhasil ditambahkan ke Supabase.', 'New question added to Supabase.'));
        setTimeout(() => setActionNotice(null), 3000);
      } catch (err) {
        console.warn('Error creating question in Supabase', err);
      }
    }
  };

  const handleOpenAddQuestionWithProgram = (targetProg?: ToeflTestProgram) => {
    const prog = targetProg || selectedProgram || testBasedPrograms[0];
    const isListeningProg = (prog?.category || '').toLowerCase().includes('listening') || selectedSection === 'listening';
    setEditingQuestion({
      id: '',
      programId: prog ? prog.id : (testBasedPrograms[0]?.id || 'toefl-pred-1'),
      section: isListeningProg ? 'Listening' : 'Structure',
      part: isListeningProg ? 'Part A (Short Conversations)' : 'Part A (Sentence Completion)',
      questionText: '',
      audioUrl: undefined,
      audioFileName: undefined,
      options: { A: '', B: '', C: '', D: '' },
      correctAnswer: 'A',
      explanation: ''
    });
    setIsAddModalOpen(true);
  };

  const handleOpenAddQuestion = () => {
    handleOpenAddQuestionWithProgram(selectedProgram || undefined);
  };

  const handleOpenCreateProgram = () => {
    setProgramModalMode('create');
    setProgramFormData({
      id: `toefl-bank-${Date.now()}`,
      title: '',
      category: 'Structure (tata bahasa & ekspresi tertulis)',
      customCategory: '',
      tag: 'Structure Test',
      duration: '25 Menit',
      scoreTarget: 'Skala 310 - 677',
      sections: [
        { id: 'sec-structure', name: 'Section 2: Structure & Written Expression', questionCount: 40, durationMinutes: 25 },
      ],
      isActive: true,
    });
    setIsProgramModalOpen(true);
  };

  const handleOpenEditProgram = (prog?: ToeflTestProgram) => {
    const target = prog || selectedProgram;
    if (!target) return;
    setProgramModalMode('edit');

    let initialSections: SectionStructureItem[] = [];
    if (target.benefits && target.benefits.length > 0) {
      initialSections = target.benefits.map((b, idx) => {
        const countMatch = b.match(/(\d+)\s*Soal/i);
        const durationMatch = b.match(/(\d+)\s*Menit|\b(\d+)m\b/i);
        const count = countMatch ? parseInt(countMatch[1], 10) : (idx === 1 ? 40 : 50);
        const duration = durationMatch ? parseInt(durationMatch[1] || durationMatch[2], 10) : (idx === 0 ? 35 : idx === 1 ? 25 : 55);
        const cleanName = b.split('(')[0].trim() || b;
        return {
          id: `sec-${idx + 1}`,
          name: cleanName,
          questionCount: count,
          durationMinutes: duration
        };
      });
    }
    if (initialSections.length === 0) {
      initialSections = [
        { id: 'sec-1', name: 'Section 1: Listening Comprehension', questionCount: 50, durationMinutes: 35 },
        { id: 'sec-2', name: 'Section 2: Structure & Written Expression', questionCount: 40, durationMinutes: 25 },
        { id: 'sec-3', name: 'Section 3: Reading Comprehension', questionCount: 50, durationMinutes: 55 },
      ];
    }

    const standardCats = ['TOEFL ITP', 'TOEFL iBT', 'TOEFL PBT', 'Simulasi Mandiri'];
    const isStandard = standardCats.includes(target.category);

    setProgramFormData({
      id: target.id,
      title: target.title,
      category: isStandard ? target.category : 'Lainnya',
      customCategory: isStandard ? '' : target.category,
      tag: target.tag || 'Resmi',
      duration: target.duration || '115 Menit',
      scoreTarget: target.scoreTarget || 'Skala 310 - 677',
      sections: initialSections,
      isActive: target.isActive !== false,
    });
    setIsProgramModalOpen(true);
  };

  const handleUpdateSection = (index: number, field: keyof SectionStructureItem, value: any) => {
    setProgramFormData(prev => {
      const updated = [...prev.sections];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, sections: updated };
    });
  };

  const handleAddSection = () => {
    setProgramFormData(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: `sec-${Date.now()}`,
          name: `Section ${prev.sections.length + 1}: General Section`,
          questionCount: 40,
          durationMinutes: 30
        }
      ]
    }));
  };

  const handleRemoveSection = (index: number) => {
    if (programFormData.sections.length <= 1) return;
    setProgramFormData(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }));
  };

  const handleLoadSectionPreset = (preset: 'itp' = 'itp') => {
    setProgramFormData(prev => ({
      ...prev,
      category: 'TOEFL ITP',
      duration: '115 Menit',
      scoreTarget: 'Skala 310 - 677',
      sections: [
        { id: 'sec-1', name: 'Section 1: Listening Comprehension', questionCount: 50, durationMinutes: 35 },
        { id: 'sec-2', name: 'Section 2: Structure & Written Expression', questionCount: 40, durationMinutes: 25 },
        { id: 'sec-3', name: 'Section 3: Reading Comprehension', questionCount: 50, durationMinutes: 55 },
      ]
    }));
  };

  const handleSaveProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!programFormData.title.trim()) return;

    const totalQuestions = programFormData.sections.reduce((acc, s) => acc + (Number(s.questionCount) || 0), 0);
    const totalMinutes = programFormData.sections.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0);
    
    const finalCategory = programFormData.category === 'Lainnya'
      ? (programFormData.customCategory.trim() || 'Simulasi Mandiri')
      : programFormData.category;

    const finalBenefits = programFormData.sections.map(s =>
      `${s.name} (${s.questionCount} Soal • ${s.durationMinutes} Menit)`
    );

    const durationString = programFormData.duration.trim() || `${totalMinutes} Menit`;
    const questionCountString = `${totalQuestions} Soal (${programFormData.sections.map(s => s.name.split(':')[0]).join(', ')})`;

    if (programModalMode === 'create') {
      const newProgram: ToeflTestProgram = {
        id: programFormData.id || `toefl-bank-${Date.now()}`,
        title: programFormData.title.trim(),
        tag: programFormData.tag.trim() || 'Bank Baru',
        category: finalCategory,
        duration: durationString,
        questionCount: questionCountString,
        scoreTarget: programFormData.scoreTarget.trim() || 'Skala 310 - 677',
        benefits: finalBenefits,
        isActive: programFormData.isActive,
      };

      // Seed starter questions for this program
      const initialSeedQuestions: ToeflQuestion[] = [
        {
          id: `q-${Date.now()}-1`,
          programId: newProgram.id,
          section: 'Structure',
          part: 'Part A (Sentence Completion)',
          questionText: 'The academic evaluation board requested that all curriculum materials ______ updated before the semester starts.',
          options: {
            A: 'be',
            B: 'are',
            C: 'will be',
            D: 'have been'
          },
          correctAnswer: 'A',
          explanation: 'Subjunctive mood setelah kata kerja "requested that ... be updated".'
        },
        {
          id: `q-${Date.now()}-2`,
          programId: newProgram.id,
          section: 'Listening',
          part: 'Part A (Short Dialogue)',
          questionText: '(Man): Do you know where Professor Anderson\'s office is located?\n(Woman): Third floor of the humanities building, right next to the language lab.\n(Narrator): What does the woman imply?',
          options: {
            A: 'The professor moved to another campus.',
            B: 'She knows the exact location of the professor\'s office.',
            C: 'The language lab is currently closed.',
            D: 'She has never met Professor Anderson.'
          },
          correctAnswer: 'B',
          explanation: 'Pembicara wanita memberikan rute dan lokasi persis kantor profesor.'
        }
      ];

      setProgramsList(prev => [newProgram, ...prev]);
      setQuestions(prev => [...initialSeedQuestions, ...prev]);
      setIsProgramModalOpen(false);

      // Async save to Supabase
      (async () => {
        try {
          await createQuestionBank({
            id: newProgram.id,
            title: newProgram.title,
            category: newProgram.category,
            tag: newProgram.tag,
            duration: newProgram.duration,
            question_count: newProgram.questionCount,
            score_target: newProgram.scoreTarget,
            benefits: newProgram.benefits,
            sections_data: programFormData.sections,
            is_active: newProgram.isActive,
          });

          for (const sq of initialSeedQuestions) {
            await createToeflQuestion({
              id: sq.id,
              program_id: sq.programId,
              section: sq.section,
              part: sq.part,
              question_text: sq.questionText,
              audio_url: sq.audioUrl || null,
              options: sq.options,
              correct_answer: sq.correctAnswer,
              explanation: sq.explanation || '',
            });
          }

          setActionNotice(tr('Bank Soal baru berhasil disimpan ke Supabase.', 'New question bank successfully saved to Supabase.'));
          setTimeout(() => setActionNotice(null), 3500);
        } catch (err) {
          console.warn('Error saving question bank to Supabase', err);
        }
      })();
    } else {
      const updatedProgram: ToeflTestProgram = {
        id: programFormData.id,
        title: programFormData.title.trim(),
        tag: programFormData.tag.trim() || 'Resmi',
        category: finalCategory,
        duration: durationString,
        questionCount: questionCountString,
        scoreTarget: programFormData.scoreTarget.trim() || 'Skala 310 - 677',
        benefits: finalBenefits,
        isActive: programFormData.isActive,
      };

      setProgramsList(prev => prev.map(p => p.id === updatedProgram.id ? updatedProgram : p));
      if (selectedProgram && selectedProgram.id === updatedProgram.id) {
        setSelectedProgram(updatedProgram);
      }
      setIsProgramModalOpen(false);

      // Async update to Supabase
      (async () => {
        try {
          await updateQuestionBank({
            id: updatedProgram.id,
            title: updatedProgram.title,
            category: updatedProgram.category,
            tag: updatedProgram.tag,
            duration: updatedProgram.duration,
            question_count: updatedProgram.questionCount,
            score_target: updatedProgram.scoreTarget,
            benefits: updatedProgram.benefits,
            sections_data: programFormData.sections,
            is_active: updatedProgram.isActive,
          });

          setActionNotice(tr('Perubahan Bank Soal berhasil disimpan ke Supabase.', 'Question bank changes saved to Supabase.'));
          setTimeout(() => setActionNotice(null), 3500);
        } catch (err) {
          console.warn('Error updating question bank in Supabase', err);
        }
      })();
    }
  };

  // =========================================================================
  // UNIFIED RENDER: Both Views have full access to all Modals
  // =========================================================================
  return (
    <div className="w-full">
      {!selectedProgram ? (
        /* VIEW 1: TABLE OF AVAILABLE PROGRAMS */
        <div id="toefl-question-bank-programs-view" className="space-y-2 sm:space-y-2.5">
        
        {/* Top Action Header Banner */}
        <div className={`p-2 sm:px-3 sm:py-2 rounded-2xl border ${cardBg} flex flex-col md:flex-row md:items-center justify-between gap-2`}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#F7B425]/15 flex items-center justify-center text-[#F7B425] font-bold shrink-0">
              <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className={`text-base font-bold font-['Poppins',sans-serif] tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {tr('Bank Soal TOEFL per Program Tersedia', 'TOEFL Question Bank by Available Program')}
                </h1>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Supabase Database
                </span>
              </div>
              <p className={`text-[11px] font-['Poppins',sans-serif] mt-0.2 leading-tight max-w-2xl ${subText}`}>
                {tr(
                  'Struktur bank soal TOEFL dikelompokkan berdasarkan program kursus & simulasi ujian.',
                  'TOEFL question bank organized by courses and exam simulations. Click "Manage Questions" to manage question items.'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            {/* Button Tambah Bank Soal Baru (Form Lengkap) */}
            <div className="relative" ref={dropdownRef}>
              <div className="inline-flex rounded-lg shadow-xs overflow-hidden border border-[#F7B425]/30">
                <button
                  id="btn-add-test-question-bank"
                  type="button"
                  onClick={() => handleOpenCreateProgram()}
                  className="px-2.5 py-1 bg-[#F7B425] hover:bg-amber-400 text-black font-extrabold text-[11px] inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer font-['Poppins',sans-serif]"
                  title={tr('Tambah bank soal baru lengkap dengan konfigurasi', 'Add new question bank with full configurations')}
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                  <span className="text-xs leading-4 font-bold">{tr('Tambah Bank Soal Baru', 'Add New Question Bank')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsProgramDropdownOpen(!isProgramDropdownOpen)}
                  className="px-1.5 py-1 bg-[#F7B425] hover:bg-amber-400 text-black border-l border-black/10 transition-all cursor-pointer flex items-center justify-center active:scale-95"
                  title={tr('Menu opsi tambah bank soal', 'Question bank addition options')}
                  aria-label="Menu opsi tambah bank soal"
                >
                  <ChevronDown className={`w-2.5 h-2.5 transition-transform duration-200 ${isProgramDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Dropdown Menu */}
              {isProgramDropdownOpen && (
                <div className={`absolute right-0 mt-1 w-72 rounded-xl border shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 ${
                  isDark ? 'bg-[#181818] border-white/15 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
                }`}>
                  {/* Option 1: Buka Formulir Tambah Bank Soal Baru */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProgramDropdownOpen(false);
                      handleOpenCreateProgram();
                    }}
                    className="w-full text-left p-2 rounded-lg bg-[#F7B425]/15 hover:bg-[#F7B425]/25 border border-[#F7B425]/30 text-xs flex items-center gap-2 transition-colors cursor-pointer group mb-1"
                  >
                    <div className="w-6 h-6 rounded-md bg-[#F7B425] flex items-center justify-center text-black shrink-0 font-bold group-hover:scale-105 transition-transform">
                      <FolderPlus className="w-3 h-3 stroke-[2.5]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold font-['Poppins',sans-serif] text-[#F7B425] flex items-center justify-between text-[11px]">
                        <span>{tr('Tambah Bank Soal Baru', 'Add New Question Bank')}</span>
                        <Sparkles className="w-2.5 h-2.5" />
                      </div>
                      <div className={`text-[9.5px] mt-0.2 ${subText} line-clamp-1`}>
                        {tr('Nama, format, durasi & target skor, struktur bagian, status', 'Name, format, duration & target score, structure, status')}
                      </div>
                    </div>
                  </button>

                  <div className="px-2 py-0.5 border-t border-white/10 mb-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 block font-['Poppins',sans-serif]">
                        {tr('Atau Tambah Butir Soal Langsung:', 'Or Add Question Directly:')}
                      </span>
                      <span className="px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-[#F7B425]/15 text-[#F7B425] border border-[#F7B425]/30">
                        {testBasedPrograms.length} {tr('Paket', 'Packages')}
                      </span>
                    </div>
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-0.5 py-0.5">
                    {testBasedPrograms.map((prog) => (
                      <button
                        key={prog.id}
                        type="button"
                        onClick={() => {
                          setIsProgramDropdownOpen(false);
                          handleOpenAddQuestionWithProgram(prog);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-md text-xs flex items-center justify-between gap-1.5 transition-colors cursor-pointer group ${
                          isDark ? 'hover:bg-white/10 text-slate-200' : 'hover:bg-amber-50 text-slate-800'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold truncate text-[10.5px] group-hover:text-[#F7B425] transition-colors">
                            {prog.title}
                          </p>
                          <div className="flex items-center gap-1 mt-0.2 text-[9px] text-slate-400">
                            <span className="font-semibold text-[#F7B425]/90">{prog.category}</span>
                            <span>•</span>
                            <span className="font-mono">{getQuestionCountForProgram(prog.id)} soal</span>
                          </div>
                        </div>
                        <Plus className="w-2.5 h-2.5 text-[#F7B425] shrink-0 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className={`w-3 h-3 ${subText}`} />
            <div className={`flex items-center gap-0.5 p-0.5 rounded-lg border text-xs overflow-x-auto max-w-full ${
              isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-slate-200'
            }`}>
              {[
                { id: 'all', label: tr('Semua', 'All') },
                { id: 'structure', label: 'Structure' },
                { id: 'listening', label: 'Listening' },
                { id: 'reading', label: 'Reading' },
                { id: 'simulasi', label: tr('Simulasi Resmi', 'Simulations') },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedProgramCategory(tab.id)}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer whitespace-nowrap text-[11px] ${
                    selectedProgramCategory === tab.id
                      ? 'bg-[#F7B425] text-black font-extrabold shadow-xs'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder={tr('Cari nama program ujian...', 'Search program title or code...')}
              value={programSearchTerm}
              onChange={(e) => setProgramSearchTerm(e.target.value)}
              className={`w-full sm:w-60 pl-7 pr-2.5 py-1 rounded-lg text-[11px] transition-colors focus:outline-none focus:border-[#F7B425] border ${
                isDark 
                  ? 'bg-[#141414] border-white/10 text-white placeholder:text-slate-500' 
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 shadow-xs'
              }`}
            />
            <Search className={`w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 ${subText}`} />
          </div>
        </div>

        {/* Structured Table: Bank Soal Berdasarkan Available Program */}
        <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b text-[11px] uppercase tracking-wider ${
                isDark 
                  ? 'border-white/10 text-slate-400 bg-white/5' 
                  : 'border-slate-200 text-slate-500 bg-slate-50/80'
              }`}>
                <tr>
                  <th className="py-1.5 px-3 font-bold text-center">{tr('Program Tersedia', 'Available Program')}</th>
                  <th className="py-1.5 px-2.5 font-bold text-center">{tr('Kategori & Format', 'Category & Format')}</th>
                  <th className="py-1.5 px-2.5 font-bold text-center">{tr('Durasi & Target', 'Duration & Target')}</th>
                  <th className="py-1.5 px-2.5 font-bold text-center">{tr('Struktur Bagian', 'Section Structure')}</th>
                  <th className="py-1.5 px-2.5 font-bold text-center">{tr('Bank Soal', 'Registered Qs')}</th>
                  <th className="py-1.5 px-2.5 font-bold text-center">{tr('Status', 'Status')}</th>
                  <th className="py-1.5 px-3 font-bold text-center">{tr('Aksi', 'Action')}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
                {filteredPrograms.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      <HelpCircle className="w-6 h-6 mx-auto mb-1 opacity-30" />
                      <p className="font-semibold text-xs">{tr('Tidak ada program yang sesuai dengan pencarian.', 'No programs matched your search.')}</p>
                    </td>
                  </tr>
                ) : (
                  filteredPrograms.map((prog) => {
                    const qCount = getQuestionCountForProgram(prog.id);
                    return (
                      <tr 
                        key={prog.id}
                        className={`transition-colors duration-150 ${
                          isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Program Name & Code */}
                        <td className="py-1.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-[#F7B425]/15 text-[#F7B425] flex items-center justify-center font-bold shrink-0">
                              <BookOpen className="w-3 h-3" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1">
                                <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  {prog.title}
                                </span>
                              </div>
                              <span className="font-mono text-[8.5px] text-slate-400 block">
                                ID: #{prog.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-1.5 px-2.5 text-center">
                          <span className={`px-1.5 py-0.2 rounded text-[11px] font-bold ${
                            isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {prog.category}
                          </span>
                        </td>

                        {/* Duration & Target Score */}
                        <td className="py-1.5 px-2.5 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-[11px] flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5 text-[#F7B425]" />
                              {prog.duration}
                            </span>
                            <span className="text-[11px] text-[#F7B425] font-semibold">
                              {prog.scoreTarget}
                            </span>
                          </div>
                        </td>

                        {/* Structure */}
                        <td className="py-1.5 px-2.5 text-center">
                          <span className={`text-[11px] font-medium block truncate max-w-[130px] mx-auto ${subText}`}>
                            {prog.benefits[0] || 'Listening, Structure, Reading'}
                          </span>
                        </td>

                        {/* Questions Count Badge */}
                        <td className="py-1.5 px-2.5 text-center">
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono font-bold text-[11px]">
                            <Layers className="w-2.5 h-2.5" />
                            <span className="text-[11px]">{qCount} {tr('Soal', 'Qs')}</span>
                          </div>
                        </td>

                        {/* Status (Button On - Off) */}
                        <td className="py-1.5 px-2.5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleProgramStatus(prog.id)}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[11px] font-bold transition-all cursor-pointer select-none border ${
                              prog.isActive !== false
                                ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-rose-500/15 text-rose-500 border-rose-500/30 hover:bg-rose-500/25'
                            }`}
                            title={prog.isActive !== false ? tr('Klik untuk matikan status (OFF)', 'Click to turn off') : tr('Klik untuk aktifkan status (ON)', 'Click to turn on')}
                          >
                            <div className={`w-4.5 h-2.5 rounded-full transition-colors flex items-center px-0.5 ${
                              prog.isActive !== false ? 'bg-emerald-500 justify-end' : 'bg-slate-400 dark:bg-slate-600 justify-start'
                            }`}>
                              <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                            </div>
                            <span className="font-extrabold tracking-wide font-['Poppins',sans-serif] text-[11px]">
                              {prog.isActive !== false ? 'ON' : 'OFF'}
                            </span>
                          </button>
                        </td>

                        {/* Action: Open Question Editor & Delete */}
                        <td className="py-1.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              id={`btn-edit-program-${prog.id}`}
                              type="button"
                              onClick={() => handleOpenEditProgram(prog)}
                              className={`px-1.5 py-0.5 rounded-md font-bold text-[11px] inline-flex items-center gap-0.5 transition-all border cursor-pointer active:scale-95 shadow-xs ${
                                isDark 
                                  ? 'bg-blue-500/15 border-blue-500/30 text-blue-400 hover:bg-blue-500/25 hover:text-white' 
                                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                              }`}
                              title={tr(`Edit Data ${prog.title}`, `Edit Data for ${prog.title}`)}
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span className="text-[11px]">{tr('Edit', 'Edit')}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProgram(prog);
                                setSelectedSection('all');
                                setQuestionSearchTerm('');
                              }}
                              className="px-2 py-0.5 rounded-md bg-[#F7B425] hover:bg-amber-400 text-black font-extrabold text-[11px] inline-flex items-center gap-0.5 transition-all shadow-xs cursor-pointer active:scale-95"
                              title={tr('Buka & Kelola Soal', 'Manage Questions')}
                            >
                              <span className="text-[11px] font-bold">{tr('Buka & Kelola Soal', 'Manage Questions')}</span>
                              <ChevronRight className="w-2.5 h-2.5" />
                            </button>

                            <button
                              id={`btn-delete-program-${prog.id}`}
                              type="button"
                              onClick={() => setDeletingProgram(prog)}
                              className="p-1 rounded-md text-rose-500 hover:bg-rose-500/15 border border-rose-500/20 hover:border-rose-500/40 transition-all cursor-pointer active:scale-95 flex items-center justify-center shadow-xs"
                              title={tr(`Hapus Program Bank Soal ${prog.title}`, `Delete Question Bank Program ${prog.title}`)}
                              aria-label={tr(`Hapus Program Bank Soal ${prog.title}`, `Delete Question Bank Program ${prog.title}`)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className={`p-2 border-t flex flex-col sm:flex-row items-center justify-between gap-1.5 text-xs ${
            isDark ? 'border-white/10 text-slate-400 bg-white/[0.02]' : 'border-slate-200 text-slate-500 bg-slate-50/50'
          }`}>
            <span className="text-[10px]">
              {tr(
                `Menampilkan ${filteredPrograms.length} dari ${programsList.length} Program Tersedia`,
                `Showing ${filteredPrograms.length} of ${programsList.length} Available Programs`
              )}
            </span>
            <span className="text-[9.5px] text-[#F7B425] font-semibold flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              {tr('Pilih salah satu program untuk mulai merevisi butir soal', 'Select a program above to begin editing question items')}
            </span>
          </div>
        </div>

      </div>
      ) : (
        /* =========================================================================
           VIEW 2: QUESTION BANK MANAGEMENT & EDITOR FOR THE SELECTED PROGRAM
           ========================================================================= */
        <div id="toefl-program-questions-editor-view" className="space-y-2 sm:space-y-2.5">
      
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setSelectedProgram(null)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10.5px] font-bold transition-all cursor-pointer ${
            isDark 
              ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white' 
              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-xs'
          }`}
        >
          <ArrowLeft className="w-3 h-3 text-[#F7B425]" />
          <span>{tr('Kembali ke Daftar Program', 'Back to Available Programs')}</span>
        </button>
      </div>

      {/* Selected Program Banner */}
      <div className={`p-2 sm:px-3 sm:py-2 rounded-xl border ${cardBg} flex flex-col md:flex-row md:items-center justify-between gap-2`}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#F7B425]/15 flex items-center justify-center text-[#F7B425] font-bold shrink-0">
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase bg-[#F7B425]/15 text-[#F7B425] border border-[#F7B425]/30">
                {selectedProgram.category}
              </span>
              <h2 className={`text-xs sm:text-sm font-bold font-heading tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {selectedProgram.title}
              </h2>
              <button
                type="button"
                onClick={() => handleOpenEditProgram(selectedProgram)}
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md border text-[9.5px] font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
                  isDark 
                    ? 'bg-white/5 border-white/10 text-slate-300 hover:text-[#F7B425] hover:border-[#F7B425]/40 hover:bg-[#F7B425]/10' 
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-amber-700 hover:border-amber-300 hover:bg-amber-50'
                }`}
                title={tr('Edit Judul & Data Program Ini', 'Edit Title & Info of this Program')}
              >
                <Edit3 className="w-2.5 h-2.5 text-[#F7B425]" />
                <span>{tr('Edit Program', 'Edit Program')}</span>
              </button>
            </div>
            <p className={`text-[10px] leading-tight mt-0.5 ${subText}`}>
              {tr(
                `Durasi: ${selectedProgram.duration} • Target: ${selectedProgram.scoreTarget} • Total ${activeProgramQuestions.length} butir soal terdaftar`,
                `Duration: ${selectedProgram.duration} • Target: ${selectedProgram.scoreTarget} • Total ${activeProgramQuestions.length} registered questions`
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAddQuestion}
          className="px-2.5 py-1 bg-[#F7B425] hover:bg-amber-400 text-black font-extrabold text-[11px] rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer self-start md:self-center active:scale-95"
        >
          <Plus className="w-3 h-3" />
          <span>{tr('Tambah Soal ke Program Ini', 'Add Question to This Program')}</span>
        </button>
      </div>

      {/* Section Filter & Search for Questions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className={`w-3 h-3 ${subText}`} />
          <div className={`flex items-center gap-0.5 p-0.5 rounded-lg border text-xs ${
            isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-slate-200'
          }`}>
            {[
              { id: 'all', label: tr('Semua Section', 'All Sections') },
              { id: 'Structure', label: 'Structure & Written' },
              { id: 'Listening', label: 'Listening' },
              { id: 'Reading', label: 'Reading' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedSection(tab.id)}
                className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer text-[10px] ${
                  selectedSection === tab.id
                    ? 'bg-[#F7B425] text-black font-extrabold shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:w-60">
            <input
              type="text"
              placeholder={tr('Cari teks soal / kata kunci...', 'Search question text or explanation...')}
              value={questionSearchTerm}
              onChange={(e) => setQuestionSearchTerm(e.target.value)}
              className={`w-full pl-7 pr-2.5 py-1 rounded-lg text-[11px] transition-colors focus:outline-none focus:border-[#F7B425] border ${
                isDark 
                  ? 'bg-[#141414] border-white/10 text-white placeholder:text-slate-500' 
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 shadow-xs'
              }`}
            />
            <Search className={`w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 ${subText}`} />
          </div>

          {/* Grid / Tabel View Switcher matching user's reference */}
          <div 
            id="questions-viewmode-segmented-toggle"
            className={`flex items-center p-0.5 rounded-lg border text-xs shrink-0 transition-all ${
              isDark ? 'bg-[#0f0f10] border-white/15' : 'bg-slate-100 border-slate-300/80 shadow-xs'
            }`}
          >
            <button
              id="btn-view-mode-grid"
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10.5px] transition-all cursor-pointer active:scale-95 ${
                viewMode === 'cards'
                  ? 'bg-[#F7B425] text-black shadow-xs font-black'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Grid</span>
            </button>
            <button
              id="btn-view-mode-table"
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10.5px] transition-all cursor-pointer active:scale-95 ${
                viewMode === 'table'
                  ? 'bg-[#F7B425] text-black shadow-xs font-black'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table2 className="w-3 h-3" />
              <span>Tabel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Questions Content: Cards or Compact Table */}
      {filteredQuestions.length === 0 ? (
        <div className={`p-5 rounded-xl border text-center ${cardBg}`}>
          <HelpCircle className="w-6 h-6 mx-auto mb-1.5 opacity-30 text-[#F7B425]" />
          <h3 className={`text-xs sm:text-sm font-bold font-heading ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {tr('Belum ada butir soal yang sesuai', 'No matching questions found')}
          </h3>
          <p className={`text-[10.5px] mt-0.5 max-w-md mx-auto ${subText}`}>
            {tr(
              'Belum ada butir soal dalam filter ini atau pencarian tidak menemukan hasil. Klik tombol di bawah untuk menambahkan butir soal pertama.',
              'No questions in this section or search match. Click below to add the first question to this program.'
            )}
          </p>
          <button
            type="button"
            onClick={handleOpenAddQuestion}
            className="mt-2.5 px-2.5 py-1 bg-[#F7B425] text-black font-extrabold text-[11px] rounded-lg hover:bg-amber-400 transition-all cursor-pointer inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>{tr('Tambah Soal Sekarang', 'Add Question Now')}</span>
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* Cards View - Rendered as responsive Grid */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
          {filteredQuestions.map((item, idx) => (
            <div 
              key={item.id}
              className={`rounded-xl p-2.5 sm:p-3 border transition-colors duration-150 space-y-2 ${cardBg} ${
                isDark ? 'hover:border-[#F7B425]/40' : 'hover:border-[#F7B425]'
              }`}
            >
              {/* Header Tag */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-4.5 h-4.5 rounded-full bg-[#F7B425] text-black text-[9.5px] font-black flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-[#F7B425]/15 text-[#F7B425] border border-[#F7B425]/30 text-[8.5px] font-black uppercase">
                    {item.section}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[8.5px] font-semibold ${
                    isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {item.part}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingQuestion(item);
                      setIsAddModalOpen(true);
                    }}
                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                      isDark 
                        ? 'bg-white/10 hover:bg-[#F7B425] text-white hover:text-black' 
                        : 'bg-slate-100 hover:bg-[#F7B425] text-slate-700 hover:text-black'
                    }`}
                    title={tr('Edit Soal', 'Edit Question')}
                  >
                    <Edit3 className="w-2.5 h-2.5" />
                  </button>
                  <button
                    id={`btn-delete-card-question-${item.id}`}
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="p-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer"
                    title={tr('Hapus Soal', 'Delete Question')}
                    aria-label={tr('Hapus Soal', 'Delete Question')}
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>

              {/* Question Text & Audio Player */}
              <div className={`p-2 rounded-lg border text-[11px] font-medium leading-relaxed ${
                isDark 
                  ? 'bg-white/5 border-white/5 text-slate-200' 
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                {item.audioUrl && (
                  <div className="mb-2 p-2 rounded-lg bg-[#F7B425]/10 border border-[#F7B425]/30">
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Volume2 className="w-3.5 h-3.5 text-[#F7B425] shrink-0" />
                        <span className="text-[10px] font-bold text-[#F7B425]">
                          {tr('Audio Soal Listening:', 'Listening Question Audio:')}
                        </span>
                        {item.audioFileName && (
                          <span className="text-[9.5px] opacity-80 truncate">{item.audioFileName}</span>
                        )}
                      </div>
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#F7B425]/20 text-[#F7B425] font-bold">
                        AUDIO
                      </span>
                    </div>
                    <audio controls src={item.audioUrl} className="w-full h-7 rounded" />
                  </div>
                )}
                {item.questionText ? (
                  <div className="whitespace-pre-line">{item.questionText}</div>
                ) : (
                  <div className="text-slate-400 italic text-[10.5px]">
                    {tr('Dengarkan rekaman audio di atas untuk menjawab soal.', 'Listen to the audio recording above to answer the question.')}
                  </div>
                )}
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                  const isCorrect = item.correctAnswer === optKey;
                  return (
                    <div
                      key={optKey}
                      className={`p-1.5 rounded-md border flex items-center gap-1.5 transition-colors ${
                        isCorrect 
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-bold' 
                          : isDark 
                            ? 'bg-white/5 border-white/5 text-slate-300' 
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8.5px] font-black shrink-0 ${
                        isCorrect ? 'bg-emerald-500 text-black' : isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {optKey}
                      </span>
                      <span className="flex-1 text-[10.5px] leading-tight">{item.options[optKey]}</span>
                      {isCorrect && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {/* Explanation Box */}
              <div className="p-2 bg-[#F7B425]/10 rounded-lg border border-[#F7B425]/20 text-[10.5px] text-[#F7B425] flex items-start gap-1.5">
                <BookOpen className="w-3 h-3 text-[#F7B425] shrink-0 mt-0.5" />
                <div className="text-[10px] sm:text-[10.5px] leading-snug">
                  <strong className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {tr('Kunci & Analisis Soal:', 'Key & Explanation:')}
                  </strong>{' '}
                  <span className={isDark ? 'text-slate-300' : 'text-slate-800'}>
                    {item.explanation}
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      ) : (
        /* Compact Table View of Questions */
        <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b text-[9.5px] uppercase tracking-wider ${
                isDark ? 'border-white/10 text-slate-400 bg-white/5' : 'border-slate-200 text-slate-500 bg-slate-50/80'
              }`}>
                <tr>
                  <th className="py-1.5 px-2.5 font-bold text-center w-10">No</th>
                  <th className="py-1.5 px-2.5 font-bold w-32">{tr('Bagian (Section)', 'Section')}</th>
                  <th className="py-1.5 px-2.5 font-bold">{tr('Cuplikan Teks Soal', 'Question Snippet')}</th>
                  <th className="py-1.5 px-2.5 font-bold text-center w-14">{tr('Kunci', 'Key')}</th>
                  <th className="py-1.5 px-2.5 font-bold">{tr('Analisis Pembahasan', 'Explanation')}</th>
                  <th className="py-1.5 px-2.5 font-bold text-right w-16">{tr('Aksi', 'Action')}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
                {filteredQuestions.map((q, idx) => (
                  <tr key={q.id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}>
                    <td className="py-1 px-2.5 font-bold text-center font-mono text-[#F7B425] text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-1 px-2.5">
                      <span className="px-1.5 py-0.2 rounded text-[8.5px] font-black bg-[#F7B425]/15 text-[#F7B425] border border-[#F7B425]/30">
                        {q.section}
                      </span>
                      <span className={`block text-[9px] mt-0.2 ${subText}`}>{q.part}</span>
                    </td>
                    <td className="py-1 px-2.5 max-w-xs truncate font-medium text-[11px]">
                      {q.audioUrl && (
                        <span className="inline-flex items-center gap-1 mr-1.5 px-1.5 py-0.2 rounded bg-[#F7B425]/15 text-[#F7B425] border border-[#F7B425]/30 text-[9px] font-bold">
                          <Volume2 className="w-2.5 h-2.5" />
                          Audio
                        </span>
                      )}
                      <span>{q.questionText}</span>
                    </td>
                    <td className="py-1 px-2.5 text-center">
                      <span className="w-4.5 h-4.5 rounded-full inline-flex items-center justify-center text-[9.5px] font-black bg-emerald-500 text-black">
                        {q.correctAnswer}
                      </span>
                    </td>
                    <td className="py-1 px-2.5 max-w-sm truncate text-slate-400 text-[10.5px]">
                      {q.explanation}
                    </td>
                    <td className="py-1 px-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingQuestion(q);
                            setIsAddModalOpen(true);
                          }}
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            isDark 
                              ? 'bg-white/10 hover:bg-[#F7B425] text-white hover:text-black' 
                              : 'bg-slate-100 hover:bg-[#F7B425] text-slate-700 hover:text-black'
                          }`}
                          title={tr('Edit Soal', 'Edit Question')}
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                        </button>
                        <button
                          id={`btn-delete-table-question-${q.id}`}
                          type="button"
                          onClick={() => handleDelete(q)}
                          className="p-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer"
                          title={tr('Hapus Soal', 'Delete Question')}
                          aria-label={tr('Hapus Soal', 'Delete Question')}
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </div>
      )}

      {/* Edit / Add Modal */}
      {isAddModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className={`rounded-xl w-full max-w-2xl p-3 sm:p-4 shadow-xl border max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="px-1.5 py-0.2 rounded-full text-[8.5px] font-black uppercase bg-[#F7B425]/15 text-[#F7B425] border border-[#F7B425]/30">
                  {selectedProgram?.title || testBasedPrograms.find(p => p.id === editingQuestion.programId)?.title || tr('Program Berbasis Tes', 'Test-Based Program')}
                </span>
                <h3 className={`text-xs sm:text-sm font-bold font-heading mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {editingQuestion.id 
                    ? tr('Edit Butir Soal TOEFL', 'Edit TOEFL Question') 
                    : tr('Tambah Butir Soal Baru (Program Berbasis Tes)', 'Add New Question (Test-Based Program)')}
                </h3>
                <p className={`text-[10px] mt-0.2 ${subText}`}>
                  {tr(
                    'Lengkapi teks pertanyaan, opsi jawaban A/B/C/D, kunci jawaban benar, dan pembahasan mendalam.',
                    'Fill in the question prompt, answer options A/B/C/D, correct key, and grammar analysis.'
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingQuestion(null);
                }}
                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  isDark ? 'bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
                aria-label="Tutup modal"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-2 text-xs">
              {/* Program Berbasis Tes Selection */}
              <div>
                <CustomDropdown
                  label={tr('Pilih Program Berbasis Tes *', 'Select Test-Based Program *')}
                  value={editingQuestion.programId || testBasedPrograms[0]?.id || ''}
                  onChange={(val) => setEditingQuestion({ ...editingQuestion, programId: val })}
                  buttonClassName={isDark ? '!border-[#3a3a3a] !bg-[#1e1e1e] !py-1.5 !px-2.5 !rounded-lg !text-xs' : '!border-slate-300 !bg-slate-50 !py-1.5 !px-2.5 !rounded-lg !text-xs'}
                  options={testBasedPrograms.map(p => ({
                    value: p.id,
                    label: p.title,
                    badge: `${p.category} (${getQuestionCountForProgram(p.id)} soal)`
                  }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <CustomDropdown
                    label={tr('Section *', 'Section *')}
                    value={editingQuestion.section}
                    onChange={(val) => {
                      const newSection = val as 'Listening' | 'Structure' | 'Reading';
                      let defaultPart = editingQuestion.part;
                      if (newSection === 'Listening' && (!defaultPart || defaultPart.includes('Sentence') || defaultPart.includes('Passage'))) {
                        defaultPart = 'Part A (Short Conversations)';
                      } else if (newSection === 'Structure' && (!defaultPart || defaultPart.includes('Conversations') || defaultPart.includes('Passage'))) {
                        defaultPart = 'Part A (Sentence Completion)';
                      } else if (newSection === 'Reading' && (!defaultPart || defaultPart.includes('Sentence') || defaultPart.includes('Conversations'))) {
                        defaultPart = 'Passage 1 (Reading Comprehension)';
                      }
                      setEditingQuestion({
                        ...editingQuestion,
                        section: newSection,
                        part: defaultPart,
                      });
                    }}
                    buttonClassName={isDark ? '!border-[#3a3a3a] !bg-[#1e1e1e] !py-1.5 !px-2.5 !rounded-lg !text-xs' : '!border-slate-300 !bg-slate-50 !py-1.5 !px-2.5 !rounded-lg !text-xs'}
                    options={[
                      { value: 'Structure', label: 'Structure & Written Expression', badge: 'Section 2' },
                      { value: 'Listening', label: 'Listening Comprehension', badge: 'Section 1' },
                      { value: 'Reading', label: 'Reading Comprehension', badge: 'Section 3' },
                    ]}
                  />
                </div>

                <div>
                  <label className={`block font-bold mb-1 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {tr('Part / Bagian Spesifik', 'Specific Part / Skill')}
                  </label>
                  <input
                    type="text"
                    value={editingQuestion.part}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, part: e.target.value })}
                    placeholder={editingQuestion.section === 'Listening' ? 'Contoh: Part A (Short Conversations)' : 'Contoh: Part A (Sentence Completion)'}
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-[#F7B425] ${
                      isDark 
                        ? 'bg-[#1e1e1e] border-[#4b4b4b] text-white' 
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Teks Pertanyaan / Soal OR Upload File Audio Soal Listening */}
              {editingQuestion.section === 'Listening' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={`block font-bold text-[11px] flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      <Headphones className="w-3.5 h-3.5 text-[#F7B425]" />
                      <span>{tr('Upload File Audio Soal Listening', 'Upload Listening Audio Question File')}</span>
                      <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <span className="text-[9.5px] font-mono text-[#F7B425] bg-[#F7B425]/10 px-1.5 py-0.2 rounded border border-[#F7B425]/20 font-bold">
                      Format: MP3, WAV, M4A, OGG
                    </span>
                  </div>

                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={audioFileInputRef}
                    accept="audio/mp3,audio/wav,audio/m4a,audio/ogg,audio/mpeg,audio/*"
                    onChange={handleAudioFileUpload}
                    className="hidden"
                  />

                  {/* Audio Upload Box / Dropzone */}
                  {!editingQuestion.audioUrl ? (
                    <div 
                      onClick={() => audioFileInputRef.current?.click()}
                      className={`p-3.5 sm:p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center group flex flex-col items-center justify-center gap-1.5 ${
                        isDark 
                          ? 'border-[#F7B425]/40 bg-[#F7B425]/5 hover:bg-[#F7B425]/10 hover:border-[#F7B425]' 
                          : 'border-[#F7B425]/50 bg-amber-50/50 hover:bg-amber-50 hover:border-[#F7B425]'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-[#F7B425]/20 text-[#F7B425] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div className="space-y-0.5">
                        <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {tr('Klik untuk Upload File Audio Soal Listening', 'Click to Upload Listening Audio File')}
                        </p>
                        <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {tr('Pilih rekaman suara audio soal (.mp3, .wav, .m4a, .ogg maks. 25MB)', 'Choose audio recording file (.mp3, .wav, .m4a, .ogg max 25MB)')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-lg bg-[#F7B425] text-black font-extrabold text-[10.5px] shadow-xs hover:bg-amber-400 transition-colors pointer-events-none"
                        >
                          {tr('Pilih File Audio', 'Select Audio File')}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUseSampleAudio();
                          }}
                          className={`px-2.5 py-1 rounded-lg border text-[10.5px] font-bold transition-all cursor-pointer pointer-events-auto ${
                            isDark 
                              ? 'bg-white/10 hover:bg-white/20 border-white/15 text-slate-200' 
                              : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                          }`}
                        >
                          ⚡ {tr('Gunakan Sampel Percakapan', 'Use Sample Dialogue')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`p-3 rounded-xl border space-y-2 ${
                      isDark ? 'bg-white/5 border-[#F7B425]/30' : 'bg-amber-50/70 border-amber-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-[#F7B425] text-black flex items-center justify-center shrink-0 font-bold">
                            <Volume2 className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                {tr('Audio Siap Diujikan', 'Audio Ready')}
                              </span>
                            </div>
                            <p className={`text-[11px] font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                              {editingQuestion.audioFileName || tr('File Audio Soal Listening', 'Listening Question Audio File')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => audioFileInputRef.current?.click()}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#F7B425]/15 text-[#F7B425] hover:bg-[#F7B425]/25 border border-[#F7B425]/30 transition-colors cursor-pointer"
                          >
                            {tr('Ganti File Audio', 'Change Audio')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingQuestion(prev => prev ? { ...prev, audioUrl: undefined, audioFileName: undefined } : null);
                              if (audioFileInputRef.current) audioFileInputRef.current.value = '';
                            }}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/15 border border-rose-500/20 transition-colors cursor-pointer"
                            title={tr('Hapus Audio', 'Remove Audio')}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Native HTML5 Audio Player */}
                      <div className="pt-0.5">
                        <audio 
                          controls 
                          src={editingQuestion.audioUrl} 
                          className="w-full h-8 rounded-lg outline-none" 
                        />
                      </div>
                    </div>
                  )}

                  {/* Optional transcript or question instruction note */}
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className={`block font-semibold text-[10px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {tr('Transkrip Percakapan / Pertanyaan Narator (Opsional)', 'Conversation Transcript / Narrator Prompt (Optional)')}
                      </label>
                      <span className={`text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {tr('Opsional • Teks pendukung bagi penguji/peserta', 'Optional • Supporting prompt')}
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={editingQuestion.questionText}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })}
                      placeholder={tr('Contoh: (Narrator): What does the man imply? (Atau ketik transkrip percakapan)', 'Example: (Narrator): What does the man imply? (Or enter conversation transcript)')}
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-[#F7B425] ${
                        isDark 
                          ? 'bg-[#1e1e1e] border-white/10 text-white' 
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className={`block font-bold mb-1 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {tr('Teks Pertanyaan / Soal *', 'Question Prompt / Text *')}
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={editingQuestion.questionText}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })}
                    placeholder={tr('Ketik kalimat soal TOEFL di sini...', 'Type the TOEFL question here...')}
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-[#F7B425] ${
                      isDark 
                        ? 'bg-[#1e1e1e] border-white/10 text-white' 
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className={`block font-bold text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {tr('Pilihan Jawaban (Options A - D) *', 'Answer Options (A - D) *')}
                </label>
                {(['A', 'B', 'C', 'D'] as const).map((key) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className="w-5 font-bold text-[#F7B425] text-center text-xs">{key}:</span>
                    <input
                      type="text"
                      required
                      value={editingQuestion.options[key]}
                      onChange={(e) => setEditingQuestion({
                        ...editingQuestion,
                        options: { ...editingQuestion.options, [key]: e.target.value }
                      })}
                      className={`flex-1 px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-[#F7B425] ${
                        isDark 
                          ? 'bg-[#1e1e1e] border-white/10 text-white' 
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                ))}
              </div>

              <div>
                <CustomDropdown
                  label={tr('Kunci Jawaban Benar *', 'Correct Answer Key *')}
                  value={editingQuestion.correctAnswer}
                  onChange={(val) => setEditingQuestion({ ...editingQuestion, correctAnswer: val as any })}
                  buttonClassName={isDark ? '!border-[#2d2d2d] !bg-[#1e1e1e] !py-1.5 !px-2.5 !rounded-lg !text-xs' : '!border-slate-300 !bg-slate-50 !py-1.5 !px-2.5 !rounded-lg !text-xs'}
                  options={[
                    { value: 'A', label: 'Opsi A' },
                    { value: 'B', label: 'Opsi B' },
                    { value: 'C', label: 'Opsi C' },
                    { value: 'D', label: 'Opsi D' },
                  ]}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {tr('Penjelasan / Pembahasan Grammar & Jawaban', 'Grammar Analysis & Explanation')}
                </label>
                <textarea
                  rows={2}
                  value={editingQuestion.explanation}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  placeholder={tr('Jelaskan alasan mengapa opsi tersebut benar...', 'Explain why the selected option is correct...')}
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-[#F7B425] ${
                    isDark 
                      ? 'bg-[#1e1e1e] border-white/10 text-white' 
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`flex-1 py-1.5 rounded-lg border font-bold text-xs transition-colors cursor-pointer ${
                    isDark 
                      ? 'border-white/10 text-slate-300 hover:bg-white/5' 
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {tr('Batal', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 rounded-lg bg-[#F7B425] font-extrabold text-black hover:bg-amber-400 cursor-pointer shadow-md shadow-[#F7B425]/20 transition-all active:scale-98 text-xs"
                >
                  {tr('Simpan Butir Soal', 'Save Question')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah Bank Soal Baru / Edit Bank Soal TOEFL */}
      {isProgramModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-3 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className={`w-full max-w-lg rounded-xl border p-3.5 sm:p-4 shadow-xl relative my-3 max-h-[90vh] overflow-y-auto ${cardBg}`}>
            <button
              onClick={() => setIsProgramModalOpen(false)}
              className="absolute top-3 right-3 p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-2 mb-3 border-b pb-2.5 border-white/10">
              <div className="w-7 h-7 rounded-lg bg-[#F7B425]/20 flex items-center justify-center text-[#F7B425] shrink-0">
                {programModalMode === 'create' ? <FolderPlus className="w-3.5 h-3.5 stroke-[2.5]" /> : <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs sm:text-sm font-bold font-['Poppins',sans-serif] tracking-tight">
                  {programModalMode === 'create' 
                    ? tr('Tambah Bank Soal Baru', 'Add New Question Bank') 
                    : tr('Edit Konfigurasi Bank Soal', 'Edit Question Bank Configuration')}
                </h3>
                <p className={`text-[10px] mt-0.2 ${subText}`}>
                  {programModalMode === 'create'
                    ? tr('Konfigurasikan nama, format kategori, durasi, target skor, struktur bagian, dan status.', 'Configure name, format category, duration, target score, section structure, and status.')
                    : tr(`Perbarui konfigurasi paket bank soal #${programFormData.id}`, `Update configuration for question bank #${programFormData.id}`)}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProgram} className="space-y-3 text-xs">
              {/* 1. NAMA BANK SOAL */}
              <div className="space-y-1">
                <label className={`block font-bold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  1. {tr('Nama Bank Soal', 'Question Bank Name')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus={programModalMode === 'create'}
                  value={programFormData.title}
                  onChange={(e) => setProgramFormData({ ...programFormData, title: e.target.value })}
                  placeholder={tr('Contoh: TOEFL ITP Prediction Test - Paket 02 (Simulasi Lengkap)', 'e.g. TOEFL ITP Prediction Test - Package 02 (Full Simulation)')}
                  className={`w-full px-3 py-1.5 rounded-lg border focus:outline-none focus:border-[#F7B425] font-semibold text-xs transition-all ${
                    isDark 
                      ? 'bg-[#1e1e1e] border-white/10 text-white placeholder:text-slate-500' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
                <p className={`text-[10px] ${subText}`}>
                  {tr('Nama resmi paket tes yang akan dilihat peserta pada daftar simulasi dan sertifikat kelulusan.', 'Official test package title displayed to students in test lists and certificates.')}
                </p>
              </div>

              {/* 2. KATEGORI / FORMAT */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={`block font-bold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    2. {tr('Kategori / Format Ujian', 'Category / Exam Format')} <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-mono font-bold text-[#F7B425] bg-[#F7B425]/10 px-1.5 py-0.2 rounded-md border border-[#F7B425]/20">
                    {programFormData.category}
                  </span>
                </div>

                {/* Category Preset Cards: Structure, Listening, Reading with Icons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      id: 'structure',
                      name: 'Structure',
                      desc: 'tata bahasa & ekspresi tertulis',
                      fullCategory: 'Structure (tata bahasa & ekspresi tertulis)',
                      icon: FileEdit,
                      defaultDuration: '25 Menit',
                      defaultTag: 'Structure Test',
                      presetSections: [
                        { id: 'sec-structure', name: 'Section 2: Structure & Written Expression', questionCount: 40, durationMinutes: 25 },
                      ]
                    },
                    {
                      id: 'listening',
                      name: 'Listening',
                      desc: 'memahami percakapan',
                      fullCategory: 'Listening (memahami percakapan)',
                      icon: Headphones,
                      defaultDuration: '35 Menit',
                      defaultTag: 'Listening Test',
                      presetSections: [
                        { id: 'sec-listening', name: 'Section 1: Listening Comprehension', questionCount: 50, durationMinutes: 35 },
                      ]
                    },
                    {
                      id: 'reading',
                      name: 'Reading',
                      desc: 'memahami bacaan akademik',
                      fullCategory: 'Reading (memahami bacaan akademik)',
                      icon: BookOpen,
                      defaultDuration: '55 Menit',
                      defaultTag: 'Reading Test',
                      presetSections: [
                        { id: 'sec-reading', name: 'Section 3: Reading Comprehension', questionCount: 50, durationMinutes: 55 },
                      ]
                    }
                  ].map((catItem) => {
                    const isSelected = 
                      programFormData.category === catItem.fullCategory || 
                      programFormData.category === catItem.name ||
                      programFormData.category.toLowerCase().startsWith(catItem.name.toLowerCase());
                    const CatIcon = catItem.icon;
                    return (
                      <button
                        key={catItem.id}
                        type="button"
                        onClick={() => {
                          setProgramFormData(prev => ({
                            ...prev,
                            category: catItem.fullCategory,
                            customCategory: '',
                            duration: prev.duration === '115 Menit' || prev.duration === '25 Menit' || prev.duration === '35 Menit' || prev.duration === '55 Menit' 
                              ? catItem.defaultDuration 
                              : prev.duration,
                            tag: prev.tag === 'Simulasi Baru' || prev.tag.includes('Test') 
                              ? catItem.defaultTag 
                              : prev.tag,
                            sections: catItem.presetSections
                          }));
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98] ${
                          isSelected
                            ? 'bg-[#F7B425]/15 border-[#F7B425] shadow-xs ring-1 ring-[#F7B425]/40'
                            : isDark
                              ? 'bg-white/5 border-white/10 hover:border-white/25 hover:bg-white/10 text-slate-300'
                              : 'bg-slate-50 border-slate-200 hover:border-amber-300 hover:bg-white text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
                            isSelected
                              ? 'bg-[#F7B425] text-black shadow-xs font-bold'
                              : isDark
                                ? 'bg-white/10 text-[#F7B425]'
                                : 'bg-slate-200 text-slate-800'
                          }`}>
                            <CatIcon className="w-3.5 h-3.5 stroke-[2.2]" />
                          </div>
                          {isSelected ? (
                            <span className="w-4 h-4 rounded-full bg-[#F7B425] text-black flex items-center justify-center shadow-xs">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="w-3.5 h-3.5 rounded-full border border-white/15 opacity-0 group-hover:opacity-60 transition-opacity" />
                          )}
                        </div>

                        <div>
                          <div className={`font-black font-heading text-[12px] flex items-center gap-1 ${
                            isSelected 
                              ? isDark ? 'text-white font-extrabold' : 'text-slate-900 font-extrabold' 
                              : isDark ? 'text-slate-200' : 'text-slate-800'
                          }`}>
                            <span style={{ fontSize: '12px' }} className="text-[12px]">{catItem.name}</span>
                          </div>
                          <p className={`text-[9.5px] mt-0.2 leading-tight ${
                            isSelected ? 'text-[#F7B425] font-semibold' : subText
                          }`}>
                            ({catItem.desc})
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Optional Full Simulation preset shortcut */}
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setProgramFormData(prev => ({
                        ...prev,
                        category: 'Simulasi Lengkap (Full Test ITP)',
                        customCategory: '',
                        duration: '115 Menit',
                        tag: 'Full Simulation',
                        sections: DEFAULT_TOEFL_SECTIONS
                      }));
                    }}
                    className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                      programFormData.category.includes('Simulasi Lengkap') || programFormData.category === 'TOEFL ITP'
                        ? 'bg-[#F7B425]/20 border-[#F7B425] text-[#F7B425]'
                        : isDark
                          ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    <span>{tr('Simulasi Lengkap (Listening, Structure & Reading • 140 Soal)', 'Full Simulation (Listening, Structure & Reading • 140 Qs)')}</span>
                  </button>
                </div>

                {/* Custom Category Input & Badge/Tag */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                  <div>
                    <label className={`block font-semibold mb-0.5 text-[10px] ${subText}`}>
                      {tr('Format Kustom (Opsional)', 'Custom Format (Optional)')}
                    </label>
                    <input
                      type="text"
                      value={
                        !['Structure (tata bahasa & ekspresi tertulis)', 'Listening (memahami percakapan)', 'Reading (memahami bacaan akademik)', 'Simulasi Lengkap (Full Test ITP)', 'TOEFL ITP', 'TOEFL iBT'].includes(programFormData.category)
                          ? (programFormData.customCategory || programFormData.category)
                          : ''
                      }
                      placeholder={tr('Atau ketik format kustom...', 'Or type custom format...')}
                      onChange={(e) => setProgramFormData({ 
                        ...programFormData, 
                        category: e.target.value || 'Kustom', 
                        customCategory: e.target.value 
                      })}
                      className={`w-full px-2.5 py-1.5 rounded-lg border focus:outline-none focus:border-[#F7B425] text-xs ${
                        isDark 
                          ? 'bg-[#1e1e1e] border-white/10 text-white' 
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block font-semibold mb-0.5 text-[10px] ${subText}`}>
                      {tr('Badge / Tag Singkat', 'Short Badge / Tag')}
                    </label>
                    <input
                      type="text"
                      value={programFormData.tag}
                      onChange={(e) => setProgramFormData({ ...programFormData, tag: e.target.value })}
                      placeholder="Contoh: Structure Test, Paling Populer, Official"
                      className={`w-full px-2.5 py-1.5 rounded-lg border focus:outline-none focus:border-[#F7B425] text-xs font-semibold ${
                        isDark 
                          ? 'bg-[#1e1e1e] border-white/10 text-white' 
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* 3. DURASI & TARGET SKOR */}
              <div className="space-y-1.5">
                <label className={`block font-bold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  3. {tr('Durasi Pengerjaan & Target Skor', 'Duration & Target Score')} <span className="text-rose-500">*</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Durasi */}
                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#F7B425]" />
                        {tr('Durasi Pengerjaan', 'Test Duration')}
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={programFormData.duration}
                      onChange={(e) => setProgramFormData({ ...programFormData, duration: e.target.value })}
                      placeholder="Contoh: 115 Menit"
                      className={`w-full px-2.5 py-1 rounded-lg border focus:outline-none focus:border-[#F7B425] text-xs font-semibold mb-1.5 ${
                        isDark 
                          ? 'bg-[#181818] border-white/10 text-white' 
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    {/* Quick chips for duration */}
                    <div className="flex items-center gap-1 flex-wrap">
                      {['115 Menit', '120 Menit', '140 Menit', '60 Menit'].map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setProgramFormData({ ...programFormData, duration: d })}
                          className={`text-[9.5px] px-1.5 py-0.2 rounded-md border transition-colors cursor-pointer ${
                            programFormData.duration === d
                              ? 'bg-[#F7B425]/20 text-[#F7B425] border-[#F7B425]/40 font-bold'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Skor */}
                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[11px] flex items-center gap-1">
                        <Award className="w-3 h-3 text-[#F7B425]" />
                        {tr('Target / Skala Skor', 'Target / Score Scale')}
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={programFormData.scoreTarget}
                      onChange={(e) => setProgramFormData({ ...programFormData, scoreTarget: e.target.value })}
                      placeholder="Contoh: Skala 310 - 677"
                      className={`w-full px-2.5 py-1 rounded-lg border focus:outline-none focus:border-[#F7B425] text-xs font-semibold mb-1.5 ${
                        isDark 
                          ? 'bg-[#181818] border-white/10 text-white' 
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    {/* Quick chips for score */}
                    <div className="flex items-center gap-1 flex-wrap">
                      {['Skala 310 - 677', 'Target Skor 500+', 'Skala 0 - 120 (iBT)'].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setProgramFormData({ ...programFormData, scoreTarget: s })}
                          className={`text-[9.5px] px-1.5 py-0.2 rounded-md border transition-colors cursor-pointer ${
                            programFormData.scoreTarget === s
                              ? 'bg-[#F7B425]/20 text-[#F7B425] border-[#F7B425]/40 font-bold'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. STRUKTUR BAGIAN */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div>
                    <label className={`block font-bold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      4. {tr('Struktur Bagian Ujian', 'Exam Section Structure')} <span className="text-rose-500">*</span>
                    </label>
                    <p className={`text-[10px] ${subText}`}>
                      {tr('Rincian bagian/seksi tes, kuota butir soal, dan alokasi waktu tiap bagian.', 'Breakdown of sections, question quota, and time allocation.')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-lg text-[9.5px] font-mono font-bold bg-[#F7B425]/15 text-[#F7B425] border border-[#F7B425]/30">
                      Total: {programFormData.sections.reduce((acc, s) => acc + (Number(s.questionCount) || 0), 0)} Soal • {programFormData.sections.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0)}m
                    </span>
                  </div>
                </div>

                {/* Presets loader */}
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className={`text-[9.5px] font-bold ${subText}`}>{tr('Muat Standar:', 'Load Preset:')}</span>
                  <button
                    type="button"
                    onClick={() => handleLoadSectionPreset('itp')}
                    className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold cursor-pointer active:scale-95 transition-colors text-[10px]"
                  >
                    ⚡ TOEFL ITP (Listening, Structure, Reading)
                  </button>
                </div>

                {/* Section Items */}
                <div className="space-y-1.5">
                  {programFormData.sections.map((section, idx) => (
                    <div 
                      key={section.id || idx}
                      className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center gap-2 transition-all ${
                        isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50/80 border-slate-200'
                      }`}
                    >
                      {/* Section order badge */}
                      <div className="w-5 h-5 rounded-md bg-[#F7B425] text-black font-black flex items-center justify-center text-[10px] shrink-0">
                        {idx + 1}
                      </div>

                      {/* Section Name */}
                      <div className="flex-1 min-w-[160px]">
                        <label className={`block text-[9.5px] font-bold mb-0.5 ${subText}`}>
                          {tr('Nama Bagian / Subtes', 'Section Name')}
                        </label>
                        <input
                          type="text"
                          required
                          value={section.name}
                          onChange={(e) => handleUpdateSection(idx, 'name', e.target.value)}
                          placeholder="Contoh: Section 1: Listening Comprehension"
                          className={`w-full px-2.5 py-1 rounded-lg border focus:outline-none focus:border-[#F7B425] text-xs font-semibold ${
                            isDark ? 'bg-[#181818] border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>

                      {/* Question Count */}
                      <div className="w-full sm:w-24 shrink-0">
                        <label className={`block text-[9.5px] font-bold mb-0.5 ${subText}`}>
                          {tr('Jumlah Soal', 'Questions')}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="200"
                            required
                            value={section.questionCount}
                            onChange={(e) => handleUpdateSection(idx, 'questionCount', parseInt(e.target.value, 10) || 0)}
                            className={`w-full px-2 py-1 rounded-lg border focus:outline-none focus:border-[#F7B425] text-xs font-mono font-bold ${
                              isDark ? 'bg-[#181818] border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                          <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[9px] pointer-events-none ${subText}`}>
                            soal
                          </span>
                        </div>
                      </div>

                      {/* Duration in Minutes */}
                      <div className="w-full sm:w-24 shrink-0">
                        <label className={`block text-[9.5px] font-bold mb-0.5 ${subText}`}>
                          {tr('Alokasi Waktu', 'Duration')}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="300"
                            required
                            value={section.durationMinutes}
                            onChange={(e) => handleUpdateSection(idx, 'durationMinutes', parseInt(e.target.value, 10) || 0)}
                            className={`w-full px-2 py-1 rounded-lg border focus:outline-none focus:border-[#F7B425] text-xs font-mono font-bold ${
                              isDark ? 'bg-[#181818] border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                          <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-[9px] pointer-events-none ${subText}`}>
                            menit
                          </span>
                        </div>
                      </div>

                      {/* Delete Section Button */}
                      {programFormData.sections.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSection(idx)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/15 border border-rose-500/20 hover:border-rose-500/40 transition-colors cursor-pointer self-end sm:self-center shrink-0"
                          title={tr('Hapus bagian ini', 'Remove this section')}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Section Button */}
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="w-full py-1.5 px-2.5 rounded-lg border border-dashed border-[#F7B425]/40 hover:border-[#F7B425] bg-[#F7B425]/5 hover:bg-[#F7B425]/10 text-[#F7B425] font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer active:scale-99"
                >
                  <Plus className="w-3 h-3" />
                  <span>{tr('+ Tambah Bagian Baru ke Struktur Ujian', '+ Add New Section to Structure')}</span>
                </button>
              </div>

              {/* 5. STATUS BANK SOAL */}
              <div className="space-y-1.5">
                <label className={`block font-bold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  5. {tr('Status Publikasi Bank Soal', 'Question Bank Status')} <span className="text-rose-500">*</span>
                </label>

                <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                  programFormData.isActive 
                    ? isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50/80 border-emerald-200'
                    : isDark ? 'bg-slate-800/40 border-white/10' : 'bg-slate-100 border-slate-200'
                }`}>
                  <div className="flex items-start gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      programFormData.isActive 
                        ? 'bg-emerald-500 text-white shadow-xs' 
                        : 'bg-slate-400 dark:bg-slate-700 text-white'
                    }`}>
                      {programFormData.isActive ? <CheckCircle2 className="w-4 h-4 stroke-[2.5]" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-extrabold text-[11px] tracking-wide ${
                          programFormData.isActive ? 'text-emerald-500' : 'text-slate-400'
                        }`}>
                          {programFormData.isActive ? tr('AKTIF (Siap Diujikan)', 'ACTIVE (Ready for Test)') : tr('NONAKTIF (Draf)', 'INACTIVE (Draft)')}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[8.5px] font-bold uppercase ${
                          programFormData.isActive 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                        }`}>
                          {programFormData.isActive ? 'Live' : 'Hidden'}
                        </span>
                      </div>
                      <p className={`text-[10px] mt-0.2 leading-tight ${subText}`}>
                        {programFormData.isActive 
                          ? tr('Bank soal aktif dan langsung dapat diakses peserta ujian untuk simulasi.', 'Question bank is active and immediately accessible to students for simulation.') 
                          : tr('Bank soal tersimpan sebagai draf, tidak tampil pada daftar ujian peserta.', 'Question bank is saved as draft, hidden from the student exam catalog.')}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setProgramFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer flex items-center shadow-inner shrink-0 ${
                      programFormData.isActive ? 'bg-emerald-500 justify-end' : 'bg-slate-400 dark:bg-slate-600 justify-start'
                    }`}
                    aria-label={tr('Ubah status aktif bank soal', 'Toggle question bank active status')}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-xs flex items-center justify-center font-black text-[8.5px] text-slate-800">
                      {programFormData.isActive ? 'ON' : 'OFF'}
                    </div>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsProgramModalOpen(false)}
                  className={`flex-1 py-1.5 rounded-lg border font-bold text-xs transition-colors cursor-pointer ${
                    isDark 
                      ? 'border-white/10 text-slate-300 hover:bg-white/5' 
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {tr('Batal', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 rounded-lg bg-[#F7B425] font-extrabold text-black hover:bg-amber-400 cursor-pointer shadow-md shadow-[#F7B425]/25 transition-all active:scale-98 flex items-center justify-center gap-1.5 text-xs"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>
                    {programModalMode === 'create' 
                      ? tr('Simpan Bank Soal', 'Save Question Bank') 
                      : tr('Simpan Perubahan', 'Save Changes')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Program Confirmation Modal */}
      {deletingProgram && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className={`w-full max-w-sm rounded-xl p-3.5 sm:p-4 border shadow-xl ${
            isDark ? 'bg-[#181818] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold font-['Poppins',sans-serif] mb-0.5">
                  {tr('Hapus Bank Soal Program?', 'Delete Program Question Bank?')}
                </h3>
                <p className={`text-[11px] leading-snug ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {tr(
                    `Apakah Anda yakin ingin menghapus bank soal "${deletingProgram.title}"? Semua butir soal (${getQuestionCountForProgram(deletingProgram.id)} soal) akan ikut dihapus.`,
                    `Are you sure you want to delete "${deletingProgram.title}"? All question items (${getQuestionCountForProgram(deletingProgram.id)} questions) will be deleted.`
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setDeletingProgram(null)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                  isDark ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {tr('Batal', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProgram}
                className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-md shadow-rose-500/25 cursor-pointer active:scale-95 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>{tr('Ya, Hapus Bank Soal', 'Yes, Delete Bank')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Question Confirmation Modal */}
      {deletingQuestion && (
        <div 
          id="delete-question-confirmation-modal" 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
        >
          <div className={`w-full max-w-sm rounded-xl p-3.5 sm:p-4 border shadow-xl ${
            isDark ? 'bg-[#181818] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className="px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase bg-[#F7B425]/15 text-[#F7B425] border border-[#F7B425]/30">
                    {deletingQuestion.section}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    #{deletingQuestion.id}
                  </span>
                </div>
                <h3 className="text-xs sm:text-sm font-bold font-['Poppins',sans-serif] mb-0.5">
                  {tr('Hapus Butir Soal TOEFL?', 'Delete TOEFL Question?')}
                </h3>
                <div className={`p-2 rounded-lg border text-[11px] leading-snug line-clamp-3 mb-1.5 font-medium ${
                  isDark ? 'bg-white/5 border-white/5 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  "{deletingQuestion.questionText}"
                </div>
                <p className={`text-[10px] leading-snug ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {tr(
                    'Soal ini akan dihapus secara permanen dari daftar bank soal.',
                    'This question item will be permanently deleted from the question bank.'
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                id="btn-cancel-delete-question"
                type="button"
                onClick={() => setDeletingQuestion(null)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                  isDark ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {tr('Batal', 'Cancel')}
              </button>
              <button
                id="btn-confirm-delete-question"
                type="button"
                onClick={handleConfirmDeleteQuestion}
                className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-md shadow-rose-500/25 cursor-pointer active:scale-95 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>{tr('Ya, Hapus Soal', 'Yes, Delete Question')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="px-4 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-2xl shadow-emerald-600/30 flex items-center gap-2 border border-emerald-400/30">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        </div>
      )}

    </div>
  );
};
