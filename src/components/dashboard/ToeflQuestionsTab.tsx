import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  HelpCircle, Plus, Search, CheckCircle2, 
  Trash2, Edit3, Filter, BookOpen, Volume2, 
  X, ArrowLeft, ChevronRight, ChevronDown, Layers, Clock, 
  Award, Eye, FolderOpen, ArrowUpRight, Sparkles,
  Settings, Check, FolderPlus, Sliders, ToggleLeft, ToggleRight,
  Headphones, FileEdit, PenTool, LayoutGrid, Table2, Upload, Play, Pause, Music, FileAudio,
  Maximize, Minimize, FileText, ChevronUp, Underline
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

export interface SectionDirectionsInfo {
  id: 'Structure' | 'Listening' | 'Reading';
  title: string;
  badge: string;
  number: number;
  durationText: string;
  questionCount: number;
  subtitle: string;
  timeHeading: string;
  introText: string;
  subpartTitle: string;
  directionsText: string;
  examples: Array<{
    title: string;
    prompt: string;
    options: { A: string; B: string; C: string; D: string };
    correctAnswer: string;
    explanation: string;
  }>;
  additionalNotes?: string[];
}

export const SECTION_DIRECTIONS_DATA: Record<'Structure' | 'Listening' | 'Reading', SectionDirectionsInfo> = {
  Structure: {
    id: 'Structure',
    title: 'STRUCTURE AND WRITTEN EXPRESION',
    badge: 'Section 2',
    number: 2,
    durationText: '25 Menit',
    questionCount: 40,
    subtitle: 'Section 2: Structure & Written Expression',
    timeHeading: 'Time – 25 minutes\n(including the reading of the directions)\nNow set your clock for 25 minutes.',
    introText: 'This section is designed to measure your ability to recognize language that is appropriate for standard written English. There are two types of questions in this section, with special directions for each type.',
    subpartTitle: 'Structure',
    directionsText: 'Directions: These questions are incomplete sentences. Beneath each sentence you will see four words or phrases, marked (A), (B), (C), and (D). Choose the one word or phrase that best completes the sentence. Then, on your answer sheet, find the number of the question and fill in the space that corresponds to the letter of the answer you have chosen.\n\nLook at the following examples.',
    examples: [
      {
        title: 'Example 1',
        prompt: 'The president ______ the election by a landslide.',
        options: {
          A: 'won',
          B: 'he won',
          C: 'yesterday',
          D: 'fortunately'
        },
        correctAnswer: 'A',
        explanation: 'The sentence should read, “The president won the election by a landslide.” Therefore, you should choose answer (A).'
      },
      {
        title: 'Example 2 (Written Expression)',
        prompt: 'The (A) musical instrument called (B) banjo is made of (C) wood and skin (D).',
        options: {
          A: 'The',
          B: 'called',
          C: 'is made of',
          D: 'skin'
        },
        correctAnswer: 'A',
        explanation: 'The sentence should read, “The musical instrument called a banjo is made of wood and skin.” Therefore, you should choose answer (A).'
      }
    ],
    additionalNotes: [
      'Questions 1–15: Structure (Sentence completion)',
      'Questions 16–40: Written Expression (Error identification)',
      'Waktu pengerjaan 25 menit untuk total 40 butir soal.'
    ]
  },
  Listening: {
    id: 'Listening',
    title: 'SECTION 1: LISTENING COMPREHENSION',
    badge: 'Section 1',
    number: 1,
    durationText: '35 Menit',
    questionCount: 50,
    subtitle: 'Section 1: Listening Comprehension',
    timeHeading: 'Time – approximately 35 minutes\n(including the reading of the directions)\n50 Questions',
    introText: 'In this section of the test, you will have an opportunity to demonstrate your ability to understand conversations and talks in English. There are three parts to this section, with special directions for each part.',
    subpartTitle: 'Part A: Short Conversations',
    directionsText: 'Directions: In Part A, you will hear short conversations between two people. After each conversation, you will hear a question about the conversation. The conversations and questions will not be repeated. After you hear a question, read the four possible answers in your test book and choose the best answer.\n\nLook at the following example.',
    examples: [
      {
        title: 'Example 1',
        prompt: '(Man): Are you going to the seminar this afternoon?\n(Woman): I’d love to, but I have to finish my chemistry lab report.\n(Narrator): What does the woman imply?',
        options: {
          A: 'She will definitely attend the seminar.',
          B: 'She cannot attend because she has other academic work.',
          C: 'She prefers chemistry over the seminar.',
          D: 'She has already finished her lab report.'
        },
        correctAnswer: 'B',
        explanation: 'The woman implies that she would like to attend, but other academic duties prevent her. Therefore, you should choose answer (B).'
      }
    ],
    additionalNotes: [
      'Part A: 30 Short Conversations (Soal 1–30)',
      'Part B: 2 Longer Conversations (Soal 31–38)',
      'Part C: 3 Talks / Academic Lectures (Soal 39–50)',
      'Audio hanya diputar 1 kali sesuai standar resmi TOEFL ITP.'
    ]
  },
  Reading: {
    id: 'Reading',
    title: 'SECTION 3: READING COMPREHENSION',
    badge: 'Section 3',
    number: 3,
    durationText: '55 Menit',
    questionCount: 50,
    subtitle: 'Section 3: Reading Comprehension',
    timeHeading: 'Time – 55 minutes\n(including the reading of the directions)\nNow set your clock for 55 minutes.',
    introText: 'This section is designed to measure your ability to read and understand short passages similar in topic and style to those that students are likely to encounter in North American universities and colleges.',
    subpartTitle: 'Reading Passages & Comprehension',
    directionsText: 'Directions: In this section you will read several passages. Each one is followed by a number of questions about it. For questions 1–50, you are to choose the one best answer, (A), (B), (C), or (D), to each question. Then, on your answer sheet, find the number of the question and fill in the space that corresponds to the letter of the answer you have chosen.\n\nAnswer all questions about the information in a passage on the basis of what is stated or implied in that passage.',
    examples: [
      {
        title: 'Example Passage Snippet',
        prompt: 'The railroad was not the first institution to impose regularity on society, or to draw attention to the importance of precise timekeeping. For as long as humans have been social beings, they have sought to coordinate their activities.\n\nQuestion: What is the main topic of the passage?',
        options: {
          A: 'The rise of transportation technology.',
          B: 'The evolution of human social coordination and timekeeping regularity.',
          C: 'The construction of the first transcontinental railroad.',
          D: 'Ancient agricultural practices.'
        },
        correctAnswer: 'B',
        explanation: 'The author states that humans sought to coordinate their activities and timekeeping. Therefore, you should choose answer (B).'
      }
    ],
    additionalNotes: [
      'Terdiri dari 5 wacana/teks paragraf akademik (10 soal per wacana).',
      'Total 50 butir soal dengan durasi 55 menit.',
      'Dapat berpindah antar soal dan membaca kembali teks wacana.'
    ]
  }
};

/**
 * Ekstraksi kata-kata bergaris bawah (underline) dari teks soal Written Expression
 * Mendukung format:
 * 1. <u>kata</u> (otomatis urut A, B, C, D)
 * 2. <u>(A) kata</u> atau <u>A: kata</u> atau <u data-letter="A">kata</u>
 * 3. [A:kata] atau [A]kata[/A]
 */
export const extractUnderlinedOptions = (text: string): { A?: string; B?: string; C?: string; D?: string } => {
  if (!text) return {};
  const options: { A?: string; B?: string; C?: string; D?: string } = {};

  // 1. Ekstraksi tag eksplisit [A:kata] atau [A]kata[/A]
  const bracketRegex = /\[([A-D])\](.*?)\[\/\1\]|\[([A-D]):(.*?)\]/gi;
  let bMatch;
  while ((bMatch = bracketRegex.exec(text)) !== null) {
    const letter = (bMatch[1] || bMatch[3])?.toUpperCase() as 'A' | 'B' | 'C' | 'D';
    const word = (bMatch[2] || bMatch[4] || '').trim();
    if (word && letter) {
      options[letter] = word;
    }
  }

  // 2. Ekstraksi tag <u>kata</u>
  const uRegex = /<u(?:\s+data-(?:key|letter)=["']([A-D])["'])?>\s*(?:\(?([A-D])\)?[:\.\s]*)?(.*?)<\/u>/gi;
  let uMatch;
  const sequentialWords: string[] = [];
  while ((uMatch = uRegex.exec(text)) !== null) {
    const explicitLetter = (uMatch[1] || uMatch[2])?.toUpperCase() as 'A' | 'B' | 'C' | 'D' | undefined;
    const word = (uMatch[3] || '').trim();
    if (word) {
      if (explicitLetter) {
        options[explicitLetter] = word;
      } else {
        sequentialWords.push(word);
      }
    }
  }

  // Isi slot A, B, C, D yang masih kosong berdasarkan urutan kemunculan
  const letters: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  sequentialWords.forEach((word) => {
    const nextSlot = letters.find((l) => !options[l]);
    if (nextSlot) {
      options[nextSlot] = word;
    }
  });

  return options;
};

/**
 * Render teks soal Written Expression dengan format resmi TOEFL ITP
 * Kata bergaris bawah dengan huruf penanda (A, B, C, D) berada tepat di bawah kata yang digarisbawahi
 */
export const renderWrittenExpressionText = (text: string, isDarkTheme: boolean = true) => {
  if (!text) return null;

  const hasUTags = /<u>.*?<\/u>/i.test(text);
  const hasBracketTags = /\[([A-D]):.*?\]/i.test(text);
  const hasParenthesisTags = /\([A-D]\)/.test(text);

  if (hasUTags || hasBracketTags) {
    const regex = /<u(?:\s+data-(?:key|letter)=["']([A-D])["'])?>\s*(?:\(?([A-D])\)?[:\.\s]*)?(.*?)<\/u>|\[([A-D]):(.*?)\]/gi;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let autoIdx = 0;
    const defaultLetters: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const explicitLetter = (match[1] || match[2] || match[4])?.toUpperCase();
      const letter = explicitLetter || defaultLetters[autoIdx % 4];
      const word = (match[3] || match[5] || '').trim();

      parts.push(
        <span 
          key={`ue-${match.index}`} 
          className="inline-flex flex-col items-center mx-1 align-baseline relative group py-0.5"
        >
          <span className="font-semibold underline underline-offset-4 decoration-2 decoration-current">
            {word}
          </span>
          <span className="text-[10px] sm:text-xs font-black text-[#F7B425] font-mono mt-0.5 tracking-tight leading-none select-none">
            {letter}
          </span>
        </span>
      );

      autoIdx++;
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return <div className="leading-relaxed inline">{parts}</div>;
  }

  // Format soal lama dengan penanda "(A) word (B)..." atau "word (A)..."
  if (hasParenthesisTags && /\([A-D]\)/.test(text)) {
    const pRegex = /([A-Za-z0-9’'’\-]+(?:\s+[A-Za-z0-9’'’\-]+)*)\s*\(([A-D])\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = pRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const word = match[1].trim();
      const letter = match[2].toUpperCase();

      parts.push(
        <span 
          key={`p-${match.index}`} 
          className="inline-flex flex-col items-center mx-1 align-baseline relative group py-0.5"
        >
          <span className="font-semibold underline underline-offset-4 decoration-2 decoration-current">
            {word}
          </span>
          <span className="text-[10px] sm:text-xs font-black text-[#F7B425] font-mono mt-0.5 tracking-tight leading-none select-none">
            {letter}
          </span>
        </span>
      );
      lastIndex = pRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    if (parts.length > 0) {
      return <div className="leading-relaxed inline">{parts}</div>;
    }
  }

  return <div className="whitespace-pre-line inline">{text}</div>;
};

// List of Available Test Programs (strictly matching records in Supabase toefl_question_banks)
const AVAILABLE_PROGRAMS: ToeflTestProgram[] = [];
const INITIAL_QUESTIONS: ToeflQuestion[] = [];
export const SEED_PROGRAM_IDS = ['toefl-pred-1', 'toefl-guarantee', 'toefl-fasttrack'];

export const ToeflQuestionsTab: React.FC = () => {
  const { isDark } = useTheme();
  const { tr } = useLanguage();
  const { toeflPrograms, deleteProgram: deleteContextProgram, toggleProgramActive } = usePrograms();

  // Navigation state: null means showing the Available Programs Table
  const [selectedProgram, setSelectedProgram] = useState<ToeflTestProgram | null>(null);

  // Section directions preview modal & collapse state
  const [previewSectionDirections, setPreviewSectionDirections] = useState<'Structure' | 'Listening' | 'Reading' | null>(null);
  const [directionsThemeMode, setDirectionsThemeMode] = useState<'paper' | 'cbt'>('paper');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSectionCollapse = (secId: string) => {
    setCollapsedSections(prev => ({ ...prev, [secId]: !prev[secId] }));
  };

  const handleOpenAddQuestionForSection = (sec: 'Structure' | 'Listening' | 'Reading') => {
    const prog = selectedProgram || testBasedPrograms[0];
    const initialPart = 
      sec === 'Listening' 
        ? 'Part A (Short Conversations)' 
        : sec === 'Reading' 
          ? 'Passage 1 (Reading Comprehension)' 
          : 'Part A (Sentence Completion)';

    setEditingQuestion({
      id: '',
      programId: prog ? prog.id : (testBasedPrograms[0]?.id || 'toefl-pred-1'),
      section: sec,
      part: initialPart,
      questionText: '',
      audioUrl: undefined,
      audioFileName: undefined,
      options: { A: '', B: '', C: '', D: '' },
      correctAnswer: 'A',
      explanation: ''
    });
    setReadingPassage('');
    setReadingQuestions([
      {
        questionText: '',
        options: { A: '', B: '', C: '', D: '' },
        correctAnswer: 'A',
        explanation: ''
      }
    ]);
    setIsAddModalOpen(true);
  };

  // Question bank state with localStorage persistence
  const [questions, setQuestions] = useState<ToeflQuestion[]>(() => {
    try {
      const saved = localStorage.getItem('ej_toefl_questions_bank');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(q => !SEED_PROGRAM_IDS.includes(q.programId || '') && !q.id.startsWith('q1') && !q.id.startsWith('q2') && !q.id.startsWith('q3') && !q.id.startsWith('q4') && !q.id.startsWith('q5') && !q.id.startsWith('q-adams'));
        }
      }
    } catch (e) {
      console.warn('Error reading questions from localStorage', e);
    }
    return [];
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
          const sanitized = parsed.filter(p => !SEED_PROGRAM_IDS.includes(p.id) && isStudentTestProgram(p));
          return sanitized;
        }
      }
    } catch (e) {
      console.warn('Error reading programs from localStorage', e);
    }
    return [];
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
        // Permanently delete any seeded programs and their questions from Supabase
        try {
          await supabase.from('toefl_questions').delete().in('program_id', SEED_PROGRAM_IDS);
          await supabase.from('toefl_question_banks').delete().in('id', SEED_PROGRAM_IDS);
        } catch (cleanupErr) {
          console.warn('Cleaned seed data notice:', cleanupErr);
        }

        // 1. Load Question Banks from Supabase
        const { data: dbBanks, error: banksErr } = await loadQuestionBanks();
        if (!banksErr && dbBanks && isSubscribed) {
          const filteredBanks = dbBanks.filter(b => !SEED_PROGRAM_IDS.includes(b.id));
          const mappedPrograms: ToeflTestProgram[] = filteredBanks.map((b) => ({
            id: b.id,
            title: b.title,
            tag: b.tag || 'Resmi',
            category: b.category,
            duration: b.duration,
            questionCount: b.question_count,
            scoreTarget: b.score_target || 'Skala 310 - 677',
            benefits: b.benefits || [],
            isActive: b.is_active,
            isFullscreen: (b as any).is_fullscreen !== false && (b as any).isFullscreen !== false,
          }));
          const sanitized = mappedPrograms.filter(isStudentTestProgram);
          setProgramsList(sanitized);
          localStorage.setItem('ej_toefl_test_programs', JSON.stringify(sanitized));
        }

        // 2. Load Questions from Supabase
        const { data: dbQuestions, error: qErr } = await loadToeflQuestions();
        if (!qErr && dbQuestions && isSubscribed) {
          const filteredQuestions = dbQuestions.filter(q => !SEED_PROGRAM_IDS.includes(q.program_id));
          const mappedQuestions: ToeflQuestion[] = filteredQuestions.map((q) => {
            let passageText: string | undefined = (q as any).passage_text || (q as any).passageText;
            let cleanQuestionText = q.question_text || '';
            const passageMatch = cleanQuestionText.match(/\[PASSAGE\]([\s\S]*?)\[\/PASSAGE\]\s*([\s\S]*)/);
            if (passageMatch) {
              passageText = passageMatch[1].trim();
              cleanQuestionText = passageMatch[2].trim();
            }

            return {
              id: q.id,
              programId: q.program_id,
              section: q.section as any,
              part: q.part,
              questionText: cleanQuestionText,
              audioUrl: q.audio_url || undefined,
              passageText: passageText,
              options: q.options,
              correctAnswer: (q.correct_answer || 'A') as 'A' | 'B' | 'C' | 'D',
              explanation: q.explanation || '',
            };
          });
          setQuestions(mappedQuestions);
          localStorage.setItem('ej_toefl_questions_bank', JSON.stringify(mappedQuestions));
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
  const questionTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Fungsi untuk memberi garis bawah (underline) pada kata yang disorot atau posisi kursor
  const applyUnderlineTag = (targetLetter?: 'A' | 'B' | 'C' | 'D') => {
    if (!editingQuestion) return;
    const textarea = questionTextareaRef.current;
    const currentText = editingQuestion.questionText || '';

    let newText = currentText;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (start !== end) {
        const selectedWord = currentText.substring(start, end).trim();
        const replacement = targetLetter 
          ? `<u>(${targetLetter}) ${selectedWord}</u>`
          : `<u>${selectedWord}</u>`;
        newText = currentText.substring(0, start) + replacement + currentText.substring(end);
      } else {
        const placeholder = targetLetter ? `<u>(${targetLetter}) kata</u>` : `<u>kata</u>`;
        newText = currentText.substring(0, start) + placeholder + currentText.substring(start);
      }
    } else {
      newText = currentText + (targetLetter ? ` <u>(${targetLetter}) kata</u>` : ' <u>kata</u>');
    }

    // Ekstraksi otomatis kata yang di-underline ke opsi A, B, C, D
    const extracted = extractUnderlinedOptions(newText);
    const updatedOptions = { ...editingQuestion.options };
    let hasUpdatedOptions = false;

    (['A', 'B', 'C', 'D'] as const).forEach(key => {
      if (extracted[key]) {
        updatedOptions[key] = extracted[key]!;
        hasUpdatedOptions = true;
      }
    });

    setEditingQuestion({
      ...editingQuestion,
      questionText: newText,
      options: hasUpdatedOptions ? updatedOptions : editingQuestion.options
    });

    setTimeout(() => {
      if (textarea) {
        textarea.focus();
      }
    }, 50);
  };

  const handleSyncUnderlineOptions = () => {
    if (!editingQuestion) return;
    const extracted = extractUnderlinedOptions(editingQuestion.questionText);
    const updatedOptions = { ...editingQuestion.options };
    let count = 0;
    (['A', 'B', 'C', 'D'] as const).forEach(key => {
      if (extracted[key]) {
        updatedOptions[key] = extracted[key]!;
        count++;
      }
    });
    setEditingQuestion({
      ...editingQuestion,
      options: updatedOptions
    });
    setActionNotice(`${count} kata bergaris bawah berhasil disinkronkan ke opsi A-D`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleLoadWrittenExpressionTemplate = () => {
    if (!editingQuestion) return;
    const sampleText = '<u>The</u> four <u>string</u> on a violin <u>are</u> <u>tuned</u> in fifth.';
    const extracted = extractUnderlinedOptions(sampleText);
    setEditingQuestion({
      ...editingQuestion,
      part: 'Part B (Written Expression)',
      questionText: sampleText,
      options: {
        A: extracted.A || 'The',
        B: extracted.B || 'string',
        C: extracted.C || 'are',
        D: extracted.D || 'tuned'
      },
      correctAnswer: 'B',
      explanation: 'Pilihan (B) salah. Seharusnya berbentuk jamak "strings" karena didahului oleh numeral "four". Kalimat yang benar: "The four strings on a violin are tuned in fifth."'
    });
    setActionNotice('Contoh soal Written Expression standar TOEFL berhasil dimuat!');
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Reading Comprehension form state (Story Paragraph / Passage + Multiple questions)
  const [readingPassage, setReadingPassage] = useState('');
  const [readingQuestions, setReadingQuestions] = useState<Array<{
    id?: string;
    questionText: string;
    options: { A: string; B: string; C: string; D: string };
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    explanation: string;
  }>>([
    {
      questionText: '',
      options: { A: '', B: '', C: '', D: '' },
      correctAnswer: 'A',
      explanation: ''
    }
  ]);

  const handleAddReadingQuestion = () => {
    setReadingQuestions(prev => [
      ...prev,
      {
        questionText: '',
        options: { A: '', B: '', C: '', D: '' },
        correctAnswer: 'A',
        explanation: ''
      }
    ]);
  };

  const handleRemoveReadingQuestion = (index: number) => {
    if (readingQuestions.length <= 1) return;
    setReadingQuestions(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateReadingQuestion = (index: number, field: string, value: any) => {
    setReadingQuestions(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleUpdateReadingOption = (index: number, key: 'A' | 'B' | 'C' | 'D', value: string) => {
    setReadingQuestions(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        options: { ...copy[index].options, [key]: value }
      };
      return copy;
    });
  };

  const handleLoadSampleReadingPassage = () => {
    setReadingPassage(
      'John Quincy Adams, who served as the sixth president of the United States from 1825 to 1829, is today recognized for his masterful statesmanship and diplomacy. He dedicated his life to public service, both in the presidency and in the various other political offers that he held. Throughout his political career he demonstrated his unswerving belief in freedom of speech, the antislavery cause, and the right of Americans to be free from European and Asian domination.'
    );
    if (editingQuestion) {
      setEditingQuestion(prev => prev ? { ...prev, part: 'Passage 1 (Reading Comprehension)' } : null);
    }
    setReadingQuestions([
      {
        questionText: 'To what did John Quincy Adams devote his life?',
        options: {
          A: 'improving his personal life',
          B: 'Serving the public',
          C: 'increasing his fortune',
          D: 'Working on his private business',
        },
        correctAnswer: 'B',
        explanation: 'Paragraf menyatakan secara eksplisit: "He dedicated his life to public service, both in the presidency and in the various other political offers that he held."',
      },
      {
        questionText: 'In line 5, the word “unswerving” is closest in meaning to ….',
        options: {
          A: 'moveable',
          B: 'insignificant',
          C: 'unchanging',
          D: 'diplomatic',
        },
        correctAnswer: 'C',
        explanation: 'Kata "unswerving" bermakna teguh, tidak menyimpang, atau tidak berubah (unchanging).',
      },
    ]);
    setActionNotice(tr('Contoh teks wacana & 2 soal John Quincy Adams berhasil dimuat.', 'Sample John Quincy Adams passage & 2 questions loaded.'));
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleOpenEditQuestion = (q: ToeflQuestion) => {
    setEditingQuestion(q);
    if (q.section === 'Reading') {
      setReadingPassage(q.passageText || '');
      setReadingQuestions([
        {
          id: q.id,
          questionText: q.questionText,
          options: { ...q.options },
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
        }
      ]);
    } else {
      setReadingPassage('');
      setReadingQuestions([
        {
          questionText: '',
          options: { A: '', B: '', C: '', D: '' },
          correctAnswer: 'A',
          explanation: ''
        }
      ]);
    }
    setIsAddModalOpen(true);
  };

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
    isFullscreen: boolean;
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
    isFullscreen: true,
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

  const handleToggleProgramFullscreen = async (programId: string) => {
    const target = programsList.find(p => p.id === programId);
    const currentFullscreen = target?.isFullscreen !== false;
    const newFullscreenState = !currentFullscreen;

    const updated = programsList.map(p => {
      if (p.id === programId) {
        return { ...p, isFullscreen: newFullscreenState };
      }
      return p;
    });

    setProgramsList(updated);

    if (selectedProgram && selectedProgram.id === programId) {
      setSelectedProgram(prev => prev ? { ...prev, isFullscreen: newFullscreenState } : null);
    }

    try {
      localStorage.setItem('ej_toefl_test_programs', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn('Error saving to localStorage', e);
    }

    try {
      await updateQuestionBank({ 
        id: programId, 
        ...( { is_fullscreen: newFullscreenState } as any)
      });
      setActionNotice(tr(
        newFullscreenState ? 'Mode Fullscreen AKTIF (Peserta wajib layar penuh).' : 'Mode Fullscreen NONAKTIF (Mode Windowed / Edit UI Aktif).',
        newFullscreenState ? 'Fullscreen Mode ON (Full lockdown).' : 'Fullscreen Mode OFF (Windowed / UI Edit Mode).'
      ));
      setTimeout(() => setActionNotice(null), 3500);
    } catch (e) {
      console.warn('Error updating fullscreen status in Supabase', e);
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

  const handleClearAllPrograms = async () => {
    if (window.confirm(tr('Hapus semua program bank soal yang ada di tabel ini? Seluruh butir soal di dalamnya juga akan dibersihkan.', 'Delete all question banks in this table? All questions inside will also be cleared.'))) {
      const ids = programsList.map(p => p.id);
      setProgramsList([]);
      setQuestions([]);
      setSelectedProgram(null);
      localStorage.setItem('ej_toefl_test_programs', JSON.stringify([]));
      localStorage.setItem('ej_toefl_questions_bank', JSON.stringify([]));
      window.dispatchEvent(new Event('storage'));

      try {
        if (ids.length > 0) {
          await supabase.from('toefl_questions').delete().in('program_id', ids);
          await supabase.from('toefl_question_banks').delete().in('id', ids);
        }
        setActionNotice(tr('Semua program bank soal berhasil dibersihkan.', 'All question banks have been cleared.'));
        setTimeout(() => setActionNotice(null), 3500);
      } catch (err) {
        console.warn('Error clearing question banks:', err);
      }
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

    // Reading Comprehension: Multiple questions linked to a single passage
    if (editingQuestion.section === 'Reading') {
      const cleanPassage = readingPassage.trim();
      if (!cleanPassage) {
        setActionNotice(tr('Teks Paragraf Cerita / Wacana (Reading Passage) wajib diisi.', 'Reading passage text is required.'));
        setTimeout(() => setActionNotice(null), 3500);
        return;
      }
      if (readingQuestions.length === 0) {
        setActionNotice(tr('Minimal harus ada 1 butir pertanyaan untuk wacana ini.', 'At least 1 question is required for this passage.'));
        setTimeout(() => setActionNotice(null), 3500);
        return;
      }

      for (let i = 0; i < readingQuestions.length; i++) {
        const sq = readingQuestions[i];
        if (!sq.questionText.trim()) {
          setActionNotice(tr(`Teks pertanyaan ke-${i + 1} wajib diisi.`, `Question text #${i + 1} is required.`));
          setTimeout(() => setActionNotice(null), 3500);
          return;
        }
        if (!sq.options.A.trim() || !sq.options.B.trim() || !sq.options.C.trim() || !sq.options.D.trim()) {
          setActionNotice(tr(`Semua opsi A, B, C, D untuk pertanyaan ke-${i + 1} wajib diisi.`, `All options A, B, C, D for question #${i + 1} are required.`));
          setTimeout(() => setActionNotice(null), 3500);
          return;
        }
      }

      const defaultPart = editingQuestion.part || 'Passage 1 (Reading Comprehension)';

      if (editingQuestion.id) {
        // Updating existing question
        const firstSq = readingQuestions[0];
        const updatedQuestion: ToeflQuestion = {
          ...editingQuestion,
          programId: targetProgramId,
          section: 'Reading',
          part: defaultPart,
          passageText: cleanPassage,
          questionText: firstSq.questionText.trim(),
          options: { ...firstSq.options },
          correctAnswer: firstSq.correctAnswer,
          explanation: firstSq.explanation || '',
        };

        const extraQuestions: ToeflQuestion[] = readingQuestions.slice(1).map((sq, idx) => ({
          id: sq.id || `q${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          programId: targetProgramId,
          section: 'Reading',
          part: defaultPart,
          passageText: cleanPassage,
          questionText: sq.questionText.trim(),
          options: { ...sq.options },
          correctAnswer: sq.correctAnswer,
          explanation: sq.explanation || '',
        }));

        const newQuestionList = questions.map(q => q.id === editingQuestion.id ? updatedQuestion : q).concat(extraQuestions);
        setQuestions(newQuestionList);
        try {
          localStorage.setItem('ej_toefl_questions_bank', JSON.stringify(newQuestionList));
          window.dispatchEvent(new Event('storage'));
        } catch (e) {
          console.warn(e);
        }
        setIsAddModalOpen(false);
        setEditingQuestion(null);

        try {
          const encodedText = `[PASSAGE]\n${cleanPassage}\n[/PASSAGE]\n${updatedQuestion.questionText}`;
          await updateToeflQuestion({
            id: updatedQuestion.id,
            program_id: targetProgramId,
            section: 'Reading',
            part: updatedQuestion.part,
            question_text: encodedText,
            options: updatedQuestion.options,
            correct_answer: updatedQuestion.correctAnswer,
            explanation: updatedQuestion.explanation || '',
          });

          for (const eq of extraQuestions) {
            const eqEncoded = `[PASSAGE]\n${cleanPassage}\n[/PASSAGE]\n${eq.questionText}`;
            await createToeflQuestion({
              id: eq.id,
              program_id: targetProgramId,
              section: 'Reading',
              part: eq.part,
              question_text: eqEncoded,
              options: eq.options,
              correct_answer: eq.correctAnswer,
              explanation: eq.explanation || '',
            });
          }

          setActionNotice(tr('Data soal Reading Comprehension berhasil diperbarui.', 'Reading questions saved successfully.'));
          setTimeout(() => setActionNotice(null), 3000);
        } catch (err) {
          console.warn('Error saving reading questions to Supabase', err);
        }
      } else {
        // Creating new questions
        const newQuestions: ToeflQuestion[] = readingQuestions.map((sq, idx) => ({
          id: `q${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          programId: targetProgramId,
          section: 'Reading',
          part: defaultPart,
          passageText: cleanPassage,
          questionText: sq.questionText.trim(),
          options: { ...sq.options },
          correctAnswer: sq.correctAnswer,
          explanation: sq.explanation || '',
        }));

        const newQuestionList = [...questions, ...newQuestions];
        setQuestions(newQuestionList);
        try {
          localStorage.setItem('ej_toefl_questions_bank', JSON.stringify(newQuestionList));
          window.dispatchEvent(new Event('storage'));
        } catch (e) {
          console.warn(e);
        }
        setIsAddModalOpen(false);
        setEditingQuestion(null);

        try {
          for (const nq of newQuestions) {
            const encodedText = `[PASSAGE]\n${cleanPassage}\n[/PASSAGE]\n${nq.questionText}`;
            await createToeflQuestion({
              id: nq.id,
              program_id: targetProgramId,
              section: 'Reading',
              part: nq.part,
              question_text: encodedText,
              options: nq.options,
              correct_answer: nq.correctAnswer,
              explanation: nq.explanation || '',
            });
          }
          setActionNotice(tr(`${newQuestions.length} butir soal Reading Comprehension beserta wacana berhasil disimpan!`, `${newQuestions.length} Reading questions saved successfully!`));
          setTimeout(() => setActionNotice(null), 3000);
        } catch (err) {
          console.warn('Error creating reading questions in Supabase', err);
        }
      }
      return;
    }

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
          audio_file_name: updatedQuestion.audioFileName || null,
          passage_text: updatedQuestion.passageText || null,
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
          audio_file_name: newQuestion.audioFileName || null,
          passage_text: newQuestion.passageText || null,
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
    const isReadingProg = (prog?.category || '').toLowerCase().includes('reading') || selectedSection === 'reading';

    const initialSection = isListeningProg ? 'Listening' : isReadingProg ? 'Reading' : 'Structure';
    const initialPart = isListeningProg ? 'Part A (Short Conversations)' : isReadingProg ? 'Passage 1 (Reading Comprehension)' : 'Part A (Sentence Completion)';

    setEditingQuestion({
      id: '',
      programId: prog ? prog.id : (testBasedPrograms[0]?.id || 'toefl-pred-1'),
      section: initialSection,
      part: initialPart,
      questionText: '',
      audioUrl: undefined,
      audioFileName: undefined,
      options: { A: '', B: '', C: '', D: '' },
      correctAnswer: 'A',
      explanation: ''
    });
    setReadingPassage('');
    setReadingQuestions([
      {
        questionText: '',
        options: { A: '', B: '', C: '', D: '' },
        correctAnswer: 'A',
        explanation: ''
      }
    ]);
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
      isFullscreen: true,
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
        const cleanName = (typeof b === 'string' && b.split('(')[0]?.trim()) || (typeof b === 'string' ? b : `Section ${idx + 1}`);
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
      isFullscreen: target.isFullscreen !== false,
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
    const questionCountString = `${totalQuestions} Soal (${programFormData.sections.map(s => (s?.name ? s.name.split(':')[0] : '')).filter(Boolean).join(', ')})`;

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
        isFullscreen: programFormData.isFullscreen !== false,
      };

      setProgramsList(prev => [newProgram, ...prev]);
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
            is_fullscreen: newProgram.isFullscreen,
          });

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
        isFullscreen: programFormData.isFullscreen !== false,
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
            is_fullscreen: updatedProgram.isFullscreen,
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
        <div 
          style={{ borderRadius: '12px' }}
          className={`p-2 sm:px-3 sm:py-2 rounded-xl border ${cardBg} flex flex-col md:flex-row md:items-center justify-between gap-2`}
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#F7B425]/15 flex items-center justify-center text-[#F7B425] font-bold shrink-0">
              <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className={`text-base font-bold font-['Poppins',sans-serif] tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {tr('Bank Soal TOEFL Program Tersedia', 'TOEFL Question Bank by Available Program')}
                </h1>
              </div>
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

            {programsList.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllPrograms}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isDark 
                    ? 'border-white/10 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10' 
                    : 'border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                }`}
                title={tr('Bersihkan Semua Program Bank Soal', 'Clear All Question Banks')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
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
                  style={{ fontWeight: 'bold' }}
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
                  <th className="py-1.5 px-2.5 font-bold text-center">{tr('Bank Soal', 'Registered Qs')}</th>
                  <th className="py-1.5 px-2.5 font-bold text-center">{tr('Status', 'Status')}</th>
                  <th className="py-1.5 px-2.5 font-bold text-center">{tr('Mode Fullscreen', 'Fullscreen Mode')}</th>
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
                        <td className="h-[52px] py-1.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-[#F7B425]/15 text-[#F7B425] flex items-center justify-center font-bold shrink-0">
                              <BookOpen className="w-3 h-3" />
                            </div>
                            <div>
                              <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {prog.title}
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

                        {/* Mode Fullscreen (Toggle Button ON / OFF) */}
                        <td className="py-1.5 px-2.5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleProgramFullscreen(prog.id)}
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer select-none border ${
                              prog.isFullscreen !== false
                                ? 'bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/25'
                                : 'bg-amber-500/15 text-amber-500 border-amber-500/30 hover:bg-amber-500/25'
                            }`}
                            title={
                              prog.isFullscreen !== false
                                ? tr('Layar Penuh AKTIF (Peserta wajib fullscreen). Klik untuk nonaktifkan agar leluasa mengedit UI test.', 'Fullscreen ON. Click to disable for flexible test UI editing.')
                                : tr('Layar Penuh NONAKTIF (Mode Windowed / Edit UI). Klik untuk aktifkan kembali.', 'Fullscreen OFF (Windowed / UI Edit Mode). Click to enable.')
                            }
                          >
                            <div className={`w-4.5 h-2.5 rounded-full transition-colors flex items-center px-0.5 ${
                              prog.isFullscreen !== false ? 'bg-blue-500 justify-end' : 'bg-slate-400 dark:bg-slate-600 justify-start'
                            }`}>
                              <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                            </div>
                            <span className="font-extrabold tracking-wide font-['Poppins',sans-serif] text-[10.5px] flex items-center gap-1">
                              {prog.isFullscreen !== false ? (
                                <>
                                  <Maximize className="w-2.5 h-2.5" />
                                  <span>ON</span>
                                </>
                              ) : (
                                <>
                                  <Minimize className="w-2.5 h-2.5" />
                                  <span>OFF</span>
                                </>
                              )}
                            </span>
                          </button>
                        </td>

                        {/* Action: Open Question Editor & Delete */}
                        <td className="py-1.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProgram(prog);
                                setSelectedSection('all');
                                setQuestionSearchTerm('');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#F7B425] hover:bg-amber-400 text-black font-extrabold text-[11px] inline-flex items-center gap-0.5 transition-all shadow-xs cursor-pointer active:scale-95"
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
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAddQuestion}
          className="px-2.5 py-1 bg-[#F7B425] hover:bg-amber-400 text-black font-extrabold text-[11px] rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer self-start md:self-center active:scale-95"
        >
          <Plus className="w-3 h-3" />
          <span style={{ fontWeight: 'bold' }}>{tr('Tambah Soal ke Program Ini', 'Add Question to This Program')}</span>
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
                style={{ fontWeight: 'bold' }}
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

      {/* Questions Content: Wrapped by the 3 TOEFL Sections */}
      <div id="toefl-sections-wrapper" className="space-y-4">
        {(['Structure', 'Listening', 'Reading'] as const)
          .filter(secKey => selectedSection === 'all' || selectedSection === secKey)
          .map((secKey) => {
            const secInfo = SECTION_DIRECTIONS_DATA[secKey];
            const secQuestions = activeProgramQuestions.filter(q => {
              if (q.section !== secKey) return false;
              if (questionSearchTerm) {
                const term = questionSearchTerm.toLowerCase();
                const inText = q.questionText.toLowerCase().includes(term);
                const inExpl = (q.explanation || '').toLowerCase().includes(term);
                const inPassage = (q.passageText || '').toLowerCase().includes(term);
                return inText || inExpl || inPassage;
              }
              return true;
            });

            const isCollapsed = !!collapsedSections[secKey];

            return (
              <div 
                key={secKey}
                id={`section-wrapper-${secKey.toLowerCase()}`}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isDark ? 'bg-[#141416] border-white/10 shadow-lg' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                {/* Section Header Bar */}
                <div className={`p-3 sm:px-4 sm:py-3.5 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/70'
                }`}>
                  {/* Left info: Icon, Name, Badges */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      secKey === 'Structure'
                        ? 'bg-amber-500/15 border-amber-500/30 text-[#F7B425]'
                        : secKey === 'Listening'
                          ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                          : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    }`}>
                      {secKey === 'Structure' ? (
                        <FileText className="w-4 h-4" />
                      ) : secKey === 'Listening' ? (
                        <Headphones className="w-4 h-4" />
                      ) : (
                        <BookOpen className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <h3 className={`text-xs sm:text-sm font-extrabold font-heading ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {secInfo.subtitle}
                        </h3>
                        <span 
                          style={{ backgroundColor: '#f7b425', color: '#000000', fontWeight: 'bold' }}
                          className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#f7b425] text-black"
                        >
                          {secQuestions.length} {tr('Soal Terdaftar', 'Questions')}
                        </span>
                        <span 
                          style={{ color: '#00d492', fontWeight: 'bold' }}
                          className="text-[10px] text-[#00d492] font-bold hidden sm:inline"
                        >
                          • {secInfo.durationText}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right actions: Preview Directions, Add Question, Toggle Collapse */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => setPreviewSectionDirections(secKey)}
                      className="px-2.5 py-1 rounded-lg border text-[11px] font-bold bg-[#F7B425]/15 text-[#F7B425] hover:bg-[#F7B425]/25 border-[#F7B425]/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                      title={tr('Buka Layar Preview Petunjuk Resmi Ujian (Directions Screen)', 'Open Official Section Directions Preview Screen')}
                    >
                      <Eye className="w-3.5 h-3.5 text-[#F7B425]" />
                      <span>{tr('Preview Petunjuk (Directions)', 'Preview Directions')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenAddQuestionForSection(secKey)}
                      className="px-2.5 py-1 rounded-lg bg-[#F7B425] hover:bg-amber-400 text-black text-[11px] font-extrabold transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
                      title={tr(`Tambah butir soal ke ${secInfo.subtitle}`, `Add question to ${secInfo.subtitle}`)}
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                      <span style={{ fontWeight: 'bold' }} className="hidden sm:inline font-bold">{tr('Tambah Soal', 'Add Question')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleSectionCollapse(secKey)}
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                        isDark ? 'border-white/10 text-slate-400 hover:text-white hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                      title={isCollapsed ? 'Buka Section' : 'Ciutkan Section'}
                      aria-label="Toggle section"
                    >
                      {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Section Content (Expanded) */}
                {!isCollapsed && (
                  <div className="p-3 sm:p-4 space-y-3">
                    {/* Section Questions */}
                    {secQuestions.length === 0 ? (
                      <div className={`p-4 rounded-xl border text-center ${cardBg}`}>
                        <HelpCircle className="w-5 h-5 mx-auto mb-1 opacity-30 text-[#F7B425]" />
                        <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {tr(`Belum ada soal di ${secInfo.subtitle}`, `No questions in ${secInfo.subtitle}`)}
                        </h4>
                        <p className={`text-[10px] mt-0.5 ${subText}`}>
                          {tr('Klik tombol di bawah untuk menambahkan butir soal pertama ke bagian ini.', 'Click below to add the first question to this section.')}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleOpenAddQuestionForSection(secKey)}
                          className="mt-2 px-2.5 py-1 bg-[#F7B425] text-black font-extrabold text-[10.5px] rounded-lg hover:bg-amber-400 transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{tr('Tambah Soal ke Bagian Ini', 'Add Question to This Section')}</span>
                        </button>
                      </div>
                    ) : viewMode === 'cards' ? (
                      /* Grid of Question Cards */
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                        {secQuestions.map((item, idx) => (
                          <div 
                            key={item.id}
                            className={`rounded-xl p-2.5 sm:p-3 border transition-colors duration-150 space-y-2 ${cardBg} ${
                              isDark ? 'hover:border-[#F7B425]/40' : 'hover:border-[#F7B425]'
                            }`}
                          >
                            {/* Header Tag */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span 
                                  style={{ fontSize: '10px', fontWeight: 'bold', width: '20px', height: '20px' }}
                                  className="w-5 h-5 rounded-full bg-[#F7B425] text-black text-[10px] font-bold flex items-center justify-center shrink-0"
                                >
                                  {idx + 1}
                                </span>
                                <span 
                                  style={{ fontWeight: 'bold' }}
                                  className="px-1.5 py-0.2 rounded-full bg-[#F7B425]/15 text-[#F7B425] border border-[#F7B425]/30 text-[8.5px] font-bold uppercase"
                                >
                                  {item.section}
                                </span>
                                <span 
                                  style={{ backgroundColor: '#f7b425', color: '#000000', borderWidth: '1px', borderColor: '#f7b425', borderStyle: 'solid' }}
                                  className="px-1.5 py-0.2 rounded-full text-[8.5px] font-bold bg-[#f7b425] text-black border border-[#f7b425]"
                                >
                                  {item.part}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenEditQuestion(item)}
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
                              {item.passageText && (
                                <div className={`mb-2 p-2 rounded-lg border text-[11px] font-serif leading-relaxed ${
                                  isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-100' : 'bg-amber-50 border-amber-200 text-amber-950'
                                }`}>
                                  <div className="font-sans font-bold text-[9.5px] uppercase tracking-wider text-[#F7B425] flex items-center gap-1 mb-1">
                                    <BookOpen className="w-3 h-3" />
                                    <span>{tr('Paragraf Cerita (Reading Passage):', 'Reading Passage:')}</span>
                                  </div>
                                  <div className="whitespace-pre-line line-clamp-3 hover:line-clamp-none transition-all">
                                    {item.passageText}
                                  </div>
                                </div>
                              )}
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
                                <div className="leading-relaxed">
                                  {renderWrittenExpressionText(item.questionText, isDark)}
                                </div>
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
                                    <span 
                                      style={{ fontWeight: 'bold' }}
                                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8.5px] font-bold shrink-0 ${
                                        isCorrect ? 'bg-emerald-500 text-black' : isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-600'
                                      }`}
                                    >
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
                      /* Compact Table View for this Section */
                      <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className={`border-b text-[9.5px] uppercase tracking-wider ${
                              isDark ? 'border-white/10 text-slate-400 bg-white/5' : 'border-slate-200 text-slate-500 bg-slate-50/80'
                            }`}>
                              <tr>
                                <th className="py-1.5 px-2.5 font-bold text-center w-10">No</th>
                                <th className="py-1.5 px-2.5 font-bold w-32">{tr('Bagian (Part)', 'Part')}</th>
                                <th className="py-1.5 px-2.5 font-bold">{tr('Cuplikan Teks Soal', 'Question Snippet')}</th>
                                <th className="py-1.5 px-2.5 font-bold text-center w-14">{tr('Kunci', 'Key')}</th>
                                <th className="py-1.5 px-2.5 font-bold">{tr('Analisis Pembahasan', 'Explanation')}</th>
                                <th className="py-1.5 px-2.5 font-bold text-right w-16">{tr('Aksi', 'Action')}</th>
                              </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
                              {secQuestions.map((q, idx) => (
                                <tr key={q.id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}>
                                  <td className="py-1 px-2.5 font-bold text-center font-mono text-[#F7B425] text-[11px]">
                                    {idx + 1}
                                  </td>
                                  <td className="py-1 px-2.5">
                                    <span className="px-1.5 py-0.2 rounded text-[8.5px] font-black bg-[#F7B425]/15 text-[#F7B425] border border-[#F7B425]/30">
                                      {q.part}
                                    </span>
                                  </td>
                                  <td className="py-1 px-2.5 max-w-xs truncate font-medium text-[11px]">
                                    {q.passageText && (
                                      <span className="inline-flex items-center gap-1 mr-1.5 px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] font-bold">
                                        <BookOpen className="w-2.5 h-2.5" />
                                        Passage
                                      </span>
                                    )}
                                    {q.audioUrl && (
                                      <span className="inline-flex items-center gap-1 mr-1.5 px-1.5 py-0.2 rounded bg-[#F7B425]/15 text-[#F7B425] border border-[#F7B425]/30 text-[9px] font-bold">
                                        <Volume2 className="w-2.5 h-2.5" />
                                        Audio
                                      </span>
                                    )}
                                    <span className="leading-relaxed">{renderWrittenExpressionText(q.questionText, isDark)}</span>
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
                                        onClick={() => handleOpenEditQuestion(q)}
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
              </div>
            );
          })}
      </div>
        </div>
      )}

      {/* Edit / Add Modal */}
      {isAddModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className={`rounded-xl w-full max-w-2xl p-3 sm:p-4 shadow-xl border max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-[#141414] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 
                  style={{ fontSize: '16px' }}
                  className={`text-[16px] font-bold font-heading ${isDark ? 'text-white' : 'text-slate-900'}`}
                >
                  {editingQuestion.id 
                    ? tr('Edit Butir Soal TOEFL', 'Edit TOEFL Question') 
                    : tr('Tambah Butir Soal Baru', 'Add New Question')}
                </h3>
                <span 
                  style={{ paddingLeft: '8px', paddingRight: '8px', paddingTop: '2px', paddingBottom: '2px', borderRadius: '12px' }}
                  className="text-[9px] font-black uppercase bg-[#F7B425]/15 text-[#F7B425] border border-[#F7B425]/30 inline-block rounded-[12px]"
                >
                  {selectedProgram?.title || testBasedPrograms.find(p => p.id === editingQuestion.programId)?.title || tr('Program Berbasis Tes', 'Test-Based Program')}
                </span>
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
                    labelClassName="!mb-0"
                    labelStyle={{ marginBottom: '0px', lineHeight: '22px' }}
                    value={editingQuestion.section}
                    onChange={(val) => {
                      const newSection = val as 'Listening' | 'Structure' | 'Reading';
                      let defaultPart = editingQuestion.part;
                      if (newSection === 'Listening' && (!defaultPart || defaultPart.includes('Sentence') || defaultPart.includes('Passage') || defaultPart.includes('Written'))) {
                        defaultPart = 'Part A (Short Conversations)';
                      } else if (newSection === 'Structure' && (!defaultPart || defaultPart.includes('Conversations') || defaultPart.includes('Passage'))) {
                        defaultPart = 'Part A : Sentence Completion';
                      } else if (newSection === 'Reading' && (!defaultPart || defaultPart.includes('Sentence') || defaultPart.includes('Conversations') || defaultPart.includes('Written'))) {
                        defaultPart = 'Passage 1 (Reading Comprehension)';
                      }
                      if (newSection === 'Reading') {
                        if (readingQuestions.length === 0 || (!readingQuestions[0].questionText && editingQuestion.questionText)) {
                          setReadingQuestions([
                            {
                              questionText: editingQuestion.questionText || '',
                              options: { ...editingQuestion.options },
                              correctAnswer: editingQuestion.correctAnswer || 'A',
                              explanation: editingQuestion.explanation || '',
                            }
                          ]);
                        }
                        if (!readingPassage && editingQuestion.passageText) {
                          setReadingPassage(editingQuestion.passageText);
                        }
                      }
                      setEditingQuestion({
                        ...editingQuestion,
                        section: newSection,
                        part: defaultPart,
                      });
                    }}
                    buttonClassName={isDark ? '!border-[#3a3a3a] !bg-[#1e1e1e] !py-1.5 !px-2.5 !rounded-lg !text-xs' : '!border-slate-300 !bg-slate-50 !py-1.5 !px-2.5 !rounded-lg !text-xs'}
                    options={[
                      {
                        value: 'Structure',
                        label: 'Structure & Written Expression',
                        badge: 'Section 2',
                        style: { height: '34px' },
                        labelStyle: { fontSize: '12px' },
                      },
                      {
                        value: 'Listening',
                        label: 'Listening Comprehension',
                        badge: 'Section 1',
                        style: { height: '34px', backgroundColor: '#1e1e1e' },
                        labelStyle: { fontSize: '12px' },
                      },
                      {
                        value: 'Reading',
                        label: 'Reading Comprehension',
                        badge: 'Section 3',
                        style: { height: '34px', backgroundColor: '#1e1e1e' },
                        labelStyle: { fontSize: '12px' },
                      },
                    ]}
                  />
                </div>

                <div>
                  <CustomDropdown
                    label={tr('Part / Bagian Spesifik *', 'Specific Part / Skill *')}
                    labelClassName="!mb-0"
                    labelStyle={{ fontSize: '12px', lineHeight: '22px', marginBottom: '0px', fontWeight: 'bold' }}
                    value={
                      editingQuestion.section === 'Structure'
                        ? (editingQuestion.part && (editingQuestion.part.toLowerCase().includes('written') || editingQuestion.part.toLowerCase().includes('expression'))
                            ? 'Part B : Written Expression'
                            : 'Part A : Sentence Completion')
                        : editingQuestion.part
                    }
                    onChange={(val) => {
                      if (val.includes('Written')) {
                        const defaultText = editingQuestion.questionText || '<u>The</u> four <u>string</u> on a violin <u>are</u> <u>tuned</u> in fifth.';
                        const extracted = extractUnderlinedOptions(defaultText);
                        const newOptions = { ...editingQuestion.options };
                        if (extracted.A) {
                          (['A', 'B', 'C', 'D'] as const).forEach((key) => {
                            if (extracted[key]) newOptions[key] = extracted[key]!;
                          });
                        }
                        setEditingQuestion({
                          ...editingQuestion,
                          part: val,
                          questionText: defaultText,
                          options: newOptions
                        });
                      } else {
                        setEditingQuestion({ ...editingQuestion, part: val });
                      }
                    }}
                    buttonClassName={isDark ? '!border-[#3a3a3a] !bg-[#1e1e1e] !py-1.5 !px-2.5 !rounded-lg !text-xs' : '!border-slate-300 !bg-slate-50 !py-1.5 !px-2.5 !rounded-lg !text-xs'}
                    options={
                      editingQuestion.section === 'Structure'
                        ? [
                            {
                              value: 'Part A : Sentence Completion',
                              label: 'Part A : Sentence Completion',
                              badge: 'Part A',
                              style: { height: '34px' },
                              labelStyle: { fontSize: '12px' },
                            },
                            {
                              value: 'Part B : Written Expression',
                              label: 'Part B : Written Expression',
                              badge: 'Part B',
                              style: { height: '34px' },
                              labelStyle: { fontSize: '12px' },
                            },
                          ]
                        : editingQuestion.section === 'Listening'
                          ? [
                              {
                                value: 'Part A (Short Conversations)',
                                label: 'Part A (Short Conversations)',
                                badge: 'Part A',
                                style: { height: '34px' },
                                labelStyle: { fontSize: '12px' },
                              },
                              {
                                value: 'Part B (Longer Conversations)',
                                label: 'Part B (Longer Conversations)',
                                badge: 'Part B',
                                style: { height: '34px' },
                                labelStyle: { fontSize: '12px' },
                              },
                              {
                                value: 'Part C (Short Talks / Lectures)',
                                label: 'Part C (Short Talks / Lectures)',
                                badge: 'Part C',
                                style: { height: '34px' },
                                labelStyle: { fontSize: '12px' },
                              },
                            ]
                          : [
                              {
                                value: 'Passage 1 (Reading Comprehension)',
                                label: 'Passage 1 (Reading Comprehension)',
                                badge: 'Passage 1',
                                style: { height: '34px' },
                                labelStyle: { fontSize: '12px' },
                              },
                              {
                                value: 'Passage 2 (Reading Comprehension)',
                                label: 'Passage 2 (Reading Comprehension)',
                                badge: 'Passage 2',
                                style: { height: '34px' },
                                labelStyle: { fontSize: '12px' },
                              },
                              {
                                value: 'Passage 3 (Reading Comprehension)',
                                label: 'Passage 3 (Reading Comprehension)',
                                badge: 'Passage 3',
                                style: { height: '34px' },
                                labelStyle: { fontSize: '12px' },
                              },
                              {
                                value: 'Passage 4 (Reading Comprehension)',
                                label: 'Passage 4 (Reading Comprehension)',
                                badge: 'Passage 4',
                                style: { height: '34px' },
                                labelStyle: { fontSize: '12px' },
                              },
                              {
                                value: 'Passage 5 (Reading Comprehension)',
                                label: 'Passage 5 (Reading Comprehension)',
                                badge: 'Passage 5',
                                style: { height: '34px' },
                                labelStyle: { fontSize: '12px' },
                              },
                            ]
                    }
                  />
                </div>
              </div>

              {/* READING COMPREHENSION FORM: Paragraf Cerita + Beberapa Soal & Opsi Jawaban */}
              {editingQuestion.section === 'Reading' ? (
                <div className="space-y-3">
                  {/* 1. Teks Paragraf Cerita / Wacana (Reading Passage) */}
                  <div 
                    style={{ backgroundColor: '#141414', borderColor: '#5b5b5b' }}
                    className={`p-3 rounded-xl border ${
                      isDark ? 'bg-amber-500/5 border-amber-500/30' : 'bg-amber-50/70 border-amber-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                      <label className={`font-bold text-xs flex items-center gap-1.5 ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
                        <BookOpen className="w-4 h-4 text-[#F7B425]" />
                        <span 
                          style={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}
                          className="text-[11px] font-bold text-white"
                        >
                          {tr('Teks Paragraf Cerita / Wacana (Reading Passage) *', 'Story Paragraph / Reading Passage Text *')}
                        </span>
                      </label>
                    </div>

                    <textarea
                      rows={4}
                      required
                      value={readingPassage}
                      onChange={(e) => setReadingPassage(e.target.value)}
                      placeholder={tr(
                        'Masukkan Soal TOEFL...',
                        'Enter TOEFL Question...'
                      )}
                      className={`w-full px-3 py-2 rounded-lg border text-xs leading-relaxed focus:outline-none focus:border-[#F7B425] font-serif ${
                        isDark 
                          ? 'bg-[#181818] border-white/10 text-slate-100 placeholder:text-slate-500' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                      }`}
                    />
                  </div>

                  {/* 2. Daftar Pertanyaan & Opsi Jawaban untuk Wacana Ini */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <h4 className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {tr('Daftar Teks Pertanyaan & Opsi Jawaban', 'Questions & Answer Options')}
                        </h4>
                        <span 
                          style={{ paddingTop: '3px', paddingBottom: '3px', paddingLeft: '8px', paddingRight: '8px', fontWeight: 'bold' }}
                          className="px-2 py-[3px] rounded-full text-[9px] font-bold bg-[#F7B425] text-black"
                        >
                          {readingQuestions.length} {tr('Soal', 'Questions')}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddReadingQuestion}
                        style={{ height: '26px' }}
                        className="px-2 py-1 h-[26px] rounded-lg bg-[#F7B425] hover:bg-amber-400 text-black font-extrabold text-[10.5px] transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span 
                          style={{ fontWeight: 'bold', fontSize: '12px', lineHeight: '16px' }}
                          className="font-bold text-[12px] leading-4"
                        >
                          {tr('Tambah Soal untuk Wacana Ini', 'Add Question for this Passage')}
                        </span>
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[46vh] overflow-y-auto pr-1">
                      {readingQuestions.map((qItem, qIdx) => (
                        <div
                          key={qIdx}
                          className={`p-3 rounded-xl border relative transition-all ${
                            isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          {/* Question Header & Prompt Label Side-by-Side */}
                          <div className="flex items-center justify-between mb-1.5 gap-2">
                            <div className="flex items-center gap-2">
                              <span 
                                style={{ fontWeight: 'bold', borderRadius: '12px' }}
                                className="px-2 py-0.5 rounded-[12px] text-[10px] font-bold uppercase tracking-wider bg-[#F7B425]/15 text-[#F7B425] border border-[#F7B425]/30"
                              >
                                {tr(`Pertanyaan #${qIdx + 1}`, `Question #${qIdx + 1}`)}
                              </span>
                              <label 
                                style={{ color: '#ffffff' }}
                                className="font-bold text-[11px] text-white"
                              >
                                {tr('Teks Pertanyaan / Soal *', 'Question Prompt *')}
                              </label>
                            </div>

                            {readingQuestions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveReadingQuestion(qIdx)}
                                className="p-1 rounded-md text-rose-500 hover:bg-rose-500/15 border border-rose-500/20 transition-colors cursor-pointer"
                                title={tr('Hapus Pertanyaan Ini', 'Remove This Question')}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {/* Question Prompt Textarea */}
                          <div className="mb-2.5">
                            <textarea
                              rows={2}
                              required
                              value={qItem.questionText}
                              onChange={(e) => handleUpdateReadingQuestion(qIdx, 'questionText', e.target.value)}
                              placeholder={qIdx === 0 
                                ? tr('Contoh: To what did John Quincy Adams devote his life?', 'Example: To what did John Quincy Adams devote his life?')
                                : tr('Contoh: In line 5, the word “unswerving” is closest in meaning to ….', 'Example: In line 5, the word “unswerving” is closest in meaning to ….')}
                              className={`w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-[#F7B425] ${
                                isDark ? 'bg-[#181818] border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            />
                          </div>

                          {/* Answer Options A - D */}
                          <div className="space-y-1.5 mb-2.5">
                            <label className={`block font-bold text-[10.5px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              {tr('Pilihan Jawaban (Options A - D) *', 'Answer Options (A - D) *')}
                            </label>
                            {(['A', 'B', 'C', 'D'] as const).map((optKey) => (
                              <div key={optKey} className="flex items-center gap-1.5">
                                <span className={`w-5 text-center font-extrabold text-xs ${
                                  qItem.correctAnswer === optKey ? 'text-emerald-400 font-black' : 'text-[#F7B425]'
                                }`}>
                                  {optKey}:
                                </span>
                                <input
                                  type="text"
                                  required
                                  value={qItem.options[optKey]}
                                  onChange={(e) => handleUpdateReadingOption(qIdx, optKey, e.target.value)}
                                  placeholder={
                                    optKey === 'A' ? 'Pilihan A...' :
                                    optKey === 'B' ? 'Pilihan B...' :
                                    optKey === 'C' ? 'Pilihan C...' : 'Pilihan D...'
                                  }
                                  style={{ paddingTop: '6px', paddingBottom: '6px' }}
                                  className={`flex-1 px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-[#F7B425] ${
                                    isDark ? 'bg-[#181818] border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                                  }`}
                                />
                              </div>
                            ))}
                          </div>

                          {/* Correct Key & Explanation */}
                          <div className="space-y-2.5">
                            <div>
                              <label className={`block font-bold mb-1.5 text-xs ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                                {tr('Kunci Jawaban Benar *', 'Correct Answer Key *')}
                              </label>
                              <div className="flex gap-2">
                                {(['A', 'B', 'C', 'D'] as const).map((key) => {
                                  const isSelected = qItem.correctAnswer === key;
                                  return (
                                    <button
                                      key={key}
                                      type="button"
                                      onClick={() => handleUpdateReadingQuestion(qIdx, 'correctAnswer', key)}
                                      className={`flex-1 py-2 sm:py-2.5 rounded-xl text-sm font-black transition-all cursor-pointer border select-none ${
                                        isSelected
                                          ? 'bg-[#00c975] border-[#00c975] text-black shadow-md shadow-emerald-500/20'
                                          : isDark
                                            ? 'bg-[#222222] border-[#383838] text-slate-200 hover:bg-[#2b2b2b] hover:border-[#444]'
                                            : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                                      }`}
                                    >
                                      {key}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div>
                              <label className={`block font-bold mb-1 text-[10.5px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                {tr('Penjelasan / Analisis Kunci Jawaban', 'Explanation / Key Analysis')}
                              </label>
                              <input
                                type="text"
                                value={qItem.explanation}
                                onChange={(e) => handleUpdateReadingQuestion(qIdx, 'explanation', e.target.value)}
                                placeholder={tr('Jelaskan alasan bukti di teks wacana...', 'Explain the textual evidence...')}
                                className={`w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-[#F7B425] ${
                                  isDark ? 'bg-[#181818] border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleAddReadingQuestion}
                      style={{
                        backgroundColor: '#f7b425',
                        borderStyle: 'solid',
                        borderWidth: '1px',
                        color: '#000000',
                      }}
                      className="w-full py-2 rounded-xl border border-solid border-[#F7B425] bg-[#F7B425] hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{tr('Tambah Butir Pertanyaan untuk Wacana Ini', 'Add Another Question for this Passage')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Listening Audio Upload or Structure Question Prompt */}
                  {editingQuestion.section === 'Listening' ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className={`block font-bold text-[11px] flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          <Headphones className="w-3.5 h-3.5 text-[#F7B425]" />
                          <span>{tr('Upload File Audio Soal Listening', 'Upload Listening Audio Question File')}</span>
                          <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <span 
                          style={{ borderRadius: '8px' }}
                          className="text-[9.5px] font-mono text-[#F7B425] bg-[#F7B425]/10 px-1.5 py-0.2 rounded-lg border border-[#F7B425]/20 font-bold"
                        >
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
                          style={{ borderStyle: 'solid', borderWidth: '1px' }}
                          className={`p-3.5 sm:p-4 rounded-xl border border-solid transition-all cursor-pointer text-center group flex flex-col items-center justify-center gap-1.5 ${
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
                    <div className="space-y-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <label 
                          style={{ color: '#e2e8f0' }}
                          className={`block font-bold text-[11px] ${isDark ? 'text-[#e2e8f0]' : 'text-slate-700'}`}
                        >
                          {tr('Teks Pertanyaan / Soal *', 'Question Prompt / Text *')}
                        </label>
                        
                        {/* Toolbar Underline untuk Written Expression & Structure */}
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[10px] font-bold text-[#F7B425] mr-0.5">
                            Underline:
                          </span>
                          {(['A', 'B', 'C', 'D'] as const).map((letter) => (
                            <button
                              key={letter}
                              type="button"
                              style={{ borderRadius: '12px' }}
                              onClick={() => applyUnderlineTag(letter)}
                              className="px-2.5 py-0.5 rounded-[12px] bg-amber-500/15 hover:bg-amber-500/30 text-[#F7B425] border border-amber-500/30 text-[10px] font-black transition-all cursor-pointer shadow-xs active:scale-95"
                              title={`Beri garis bawah pada kata yang disorot untuk Pilihan (${letter})`}
                            >
                              <span>{letter}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <textarea
                        ref={questionTextareaRef}
                        rows={2}
                        required
                        value={editingQuestion.questionText}
                        onChange={(e) => {
                          const newText = e.target.value;
                          const extracted = extractUnderlinedOptions(newText);
                          const newOptions = { ...editingQuestion.options };
                          let hasAuto = false;
                          (['A', 'B', 'C', 'D'] as const).forEach((key) => {
                            if (extracted[key]) {
                              newOptions[key] = extracted[key]!;
                              hasAuto = true;
                            }
                          });
                          setEditingQuestion({
                            ...editingQuestion,
                            questionText: newText,
                            options: hasAuto ? newOptions : editingQuestion.options
                          });
                        }}
                        placeholder={tr(
                          'Ketik kalimat soal TOEFL di sini...',
                          'Type the TOEFL question here...'
                        )}
                        style={{ height: '60px' }}
                        className={`w-full h-[60px] px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-[#F7B425] font-mono sm:font-sans ${
                          isDark 
                            ? 'bg-[#1e1e1e] border-white/10 text-white placeholder:text-slate-500' 
                            : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                        }`}
                      />

                      {/* Live Preview Written Expression (Format Resmi TOEFL) */}
                      {editingQuestion.questionText && editingQuestion.questionText.includes('<u>') && (
                        <div 
                          style={{
                            backgroundColor: '#1e1e1e',
                            borderColor: '#363636',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                          }}
                          className="p-2.5 rounded-xl border mt-1 space-y-1 bg-[#1e1e1e] border-[#363636]"
                        >
                          <div 
                            style={{ borderWidth: '0px' }}
                            className={`p-2.5 rounded-lg text-xs sm:text-sm font-serif leading-loose ${
                              isDark ? 'bg-white/5 text-white' : 'bg-white/5 text-slate-100'
                            }`}
                          >
                            {renderWrittenExpressionText(editingQuestion.questionText, isDark)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label 
                        style={{ color: '#e2e8f0' }}
                        className={`block font-bold text-[11px] ${isDark ? 'text-[#e2e8f0]' : 'text-slate-700'}`}
                      >
                        {tr('Pilihan Jawaban (Options A - D) *', 'Answer Options (A - D) *')}
                      </label>
                      {editingQuestion.questionText.includes('<u>') && (
                        <button
                          type="button"
                          onClick={handleSyncUnderlineOptions}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Sinkronkan ulang opsi jawaban dari kata bergaris bawah di teks soal"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Otomatis Sinkron dari Underline</span>
                        </button>
                      )}
                    </div>
                    {(['A', 'B', 'C', 'D'] as const).map((key) => {
                      const isExtracted = editingQuestion.questionText.includes('<u>') && !!editingQuestion.options[key];
                      return (
                        <div key={key} className="flex items-center gap-1.5">
                          <span className="w-5 font-bold text-[#F7B425] text-center text-xs">{key}:</span>
                          <div className="relative flex-1">
                            <input
                              type="text"
                              required
                              value={editingQuestion.options[key]}
                              onChange={(e) => setEditingQuestion({
                                ...editingQuestion,
                                options: { ...editingQuestion.options, [key]: e.target.value }
                              })}
                              placeholder={`Pilihan ${key}...`}
                              className={`w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-[#F7B425] ${
                                isDark 
                                  ? 'bg-[#1e1e1e] border-white/10 text-white' 
                                  : 'bg-slate-50 border-slate-300 text-slate-900'
                              } ${isExtracted ? 'border-amber-500/40' : ''}`}
                            />
                            {isExtracted && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 text-[#F7B425] font-mono font-bold pointer-events-none">
                                Underline {key}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <label 
                      style={{ color: '#e2e8f0' }}
                      className={`block font-bold mb-1.5 text-xs ${isDark ? 'text-[#e2e8f0]' : 'text-slate-700'}`}
                    >
                      {tr('Kunci Jawaban Benar *', 'Correct Answer Key *')}
                    </label>
                    <div className="flex gap-2">
                      {(['A', 'B', 'C', 'D'] as const).map((key) => {
                        const isSelected = editingQuestion.correctAnswer === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            style={{ fontWeight: 'bold' }}
                            onClick={() => setEditingQuestion({ ...editingQuestion, correctAnswer: key })}
                            className={`flex-1 py-2 sm:py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer border select-none ${
                              isSelected
                                ? 'bg-[#00c975] border-[#00c975] text-black shadow-md shadow-emerald-500/20'
                                : isDark
                                  ? 'bg-[#222222] border-[#383838] text-slate-200 hover:bg-[#2b2b2b] hover:border-[#444]'
                                  : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                            }`}
                          >
                            {key}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label 
                      style={{ color: '#e2e8f0' }}
                      className={`block font-bold mb-1 text-[11px] ${isDark ? 'text-[#e2e8f0]' : 'text-slate-700'}`}
                    >
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
                </>
              )}

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
                  style={{ fontWeight: 'bold' }}
                  className="flex-1 py-1.5 rounded-lg bg-[#F7B425] font-bold text-black hover:bg-amber-400 cursor-pointer shadow-md shadow-[#F7B425]/20 transition-all active:scale-98 text-xs"
                >
                  {editingQuestion.section === 'Reading'
                    ? editingQuestion.id 
                      ? tr('Perbarui Soal Reading', 'Update Reading Question')
                      : tr(`Simpan ${readingQuestions.length} Butir Soal Reading`, `Save ${readingQuestions.length} Reading Questions`)
                    : tr('Simpan Butir Soal', 'Save Question')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah Bank Soal Baru / Edit Bank Soal TOEFL */}
      {isProgramModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className={`w-full max-w-xl rounded-2xl border p-5 sm:p-7 shadow-2xl relative my-6 max-h-[90vh] overflow-y-auto ${cardBg}`}>
            <button
              onClick={() => setIsProgramModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-5 border-b pb-3.5 border-white/10">
              <div className="w-8 h-8 rounded-xl bg-[#F7B425]/20 flex items-center justify-center text-[#F7B425] shrink-0">
                {programModalMode === 'create' ? <FolderPlus className="w-4 h-4 stroke-[2.5]" /> : <Edit3 className="w-4 h-4 stroke-[2.5]" />}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-bold font-['Poppins',sans-serif] tracking-tight">
                  {programModalMode === 'create' 
                    ? tr('Tambah Bank Soal Baru', 'Add New Question Bank') 
                    : tr('Edit Konfigurasi Bank Soal', 'Edit Question Bank Configuration')}
                </h3>
              </div>
            </div>

            <form onSubmit={handleSaveProgram} className="space-y-5 text-xs sm:text-sm">
              {/* 1. NAMA BANK SOAL */}
              <div className="space-y-1.5">
                <label className={`block font-bold text-xs sm:text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  1. {tr('Nama Bank Soal', 'Question Bank Name')} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus={programModalMode === 'create'}
                  value={programFormData.title}
                  onChange={(e) => setProgramFormData({ ...programFormData, title: e.target.value })}
                  placeholder={tr('Contoh: TOEFL ITP Prediction Test - Paket 02 (Simulasi Lengkap)', 'e.g. TOEFL ITP Prediction Test - Package 02 (Full Simulation)')}
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:border-[#F7B425] font-semibold text-xs sm:text-sm transition-all ${
                    isDark 
                      ? 'bg-[#1e1e1e] border-white/10 text-white placeholder:text-slate-500' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
              </div>

              {/* 2. KATEGORI / FORMAT */}
              <div className="space-y-3">
                <label className={`block font-bold text-xs sm:text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  2. {tr('Kategori / Format Ujian', 'Category / Exam Format')} <span className="text-rose-500">*</span>
                </label>

                {/* Category Preset Cards: Structure, Listening, Reading with Icons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      id: 'structure',
                      name: 'Structure',
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
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98] ${
                          isSelected
                            ? 'bg-[#F7B425]/15 border-[#F7B425] shadow-xs ring-1 ring-[#F7B425]/40'
                            : isDark
                              ? 'bg-white/5 border-white/10 hover:border-white/25 hover:bg-white/10 text-slate-300'
                              : 'bg-slate-50 border-slate-200 hover:border-amber-300 hover:bg-white text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
                            isSelected
                              ? 'bg-[#F7B425] text-black shadow-xs font-bold'
                              : isDark
                                ? 'bg-white/10 text-[#F7B425]'
                                : 'bg-slate-200 text-slate-800'
                          }`}>
                            <CatIcon className="w-4 h-4 stroke-[2.2]" />
                          </div>
                          {isSelected ? (
                            <span className="w-4 h-4 rounded-full bg-[#F7B425] text-black flex items-center justify-center shadow-xs">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-white/15 opacity-0 group-hover:opacity-60 transition-opacity" />
                          )}
                        </div>

                        <div>
                          <div className={`font-bold text-xs sm:text-sm flex items-center gap-1 ${
                            isSelected 
                              ? isDark ? 'text-white font-extrabold' : 'text-slate-900 font-extrabold' 
                              : isDark ? 'text-slate-200' : 'text-slate-800'
                          }`}>
                            {catItem.name}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Optional Full Simulation preset shortcut */}
                <div>
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
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                      programFormData.category.includes('Simulasi Lengkap') || programFormData.category === 'TOEFL ITP'
                        ? 'bg-[#F7B425]/20 border-[#F7B425] text-[#F7B425]'
                        : isDark
                          ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{tr('Simulasi Lengkap (Listening, Structure & Reading • 140 Soal)', 'Full Simulation (Listening, Structure & Reading • 140 Qs)')}</span>
                  </button>
                </div>

                {/* Custom Category Input & Badge/Tag */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className={`block font-semibold mb-1 text-[11px] ${subText}`}>
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
                      className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-[#F7B425] text-xs transition-all ${
                        isDark 
                          ? 'bg-[#1e1e1e] border-white/10 text-white' 
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block font-semibold mb-1 text-[11px] ${subText}`}>
                      {tr('Badge / Tag Singkat', 'Short Badge / Tag')}
                    </label>
                    <input
                      type="text"
                      value={programFormData.tag}
                      onChange={(e) => setProgramFormData({ ...programFormData, tag: e.target.value })}
                      placeholder="Contoh: Structure Test, Paling Populer, Official"
                      className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:border-[#F7B425] text-xs font-semibold transition-all ${
                        isDark 
                          ? 'bg-[#1e1e1e] border-white/10 text-white' 
                          : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* 3. DURASI & TARGET SKOR */}
              <div className="space-y-2">
                <label className={`block font-bold text-xs sm:text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  3. {tr('Durasi Pengerjaan & Target Skor', 'Duration & Target Score')} <span className="text-rose-500">*</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Durasi */}
                  <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#F7B425]" />
                        {tr('Durasi Pengerjaan', 'Test Duration')}
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={programFormData.duration}
                      onChange={(e) => setProgramFormData({ ...programFormData, duration: e.target.value })}
                      placeholder="Contoh: 115 Menit"
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-[#F7B425] text-xs font-semibold mb-2 ${
                        isDark 
                          ? 'bg-[#181818] border-white/10 text-white' 
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    {/* Quick chips for duration */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {['115 Menit', '120 Menit', '140 Menit', '60 Menit'].map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setProgramFormData({ ...programFormData, duration: d })}
                          className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
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
                  <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-[#F7B425]" />
                        {tr('Target / Skala Skor', 'Target / Score Scale')}
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={programFormData.scoreTarget}
                      onChange={(e) => setProgramFormData({ ...programFormData, scoreTarget: e.target.value })}
                      placeholder="Contoh: Skala 310 - 677"
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-[#F7B425] text-xs font-semibold mb-2 ${
                        isDark 
                          ? 'bg-[#181818] border-white/10 text-white' 
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    {/* Quick chips for score */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {['Skala 310 - 677', 'Target Skor 500+', 'Skala 0 - 120 (iBT)'].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setProgramFormData({ ...programFormData, scoreTarget: s })}
                          className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
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
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label className={`block font-bold text-xs sm:text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    4. {tr('Struktur Bagian Ujian', 'Exam Section Structure')} <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleLoadSectionPreset('itp')}
                      className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold cursor-pointer active:scale-95 transition-colors text-[10px]"
                    >
                      ⚡ Preset ITP
                    </button>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-[#F7B425]/15 text-[#F7B425] border border-[#F7B425]/30">
                      Total: {programFormData.sections.reduce((acc, s) => acc + (Number(s.questionCount) || 0), 0)} Soal • {programFormData.sections.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0)}m
                    </span>
                  </div>
                </div>

                {/* Section Items */}
                <div className="space-y-2.5">
                  {programFormData.sections.map((section, idx) => (
                    <div 
                      key={section.id || idx}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center gap-3 transition-all ${
                        isDark ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50/80 border-slate-200'
                      }`}
                    >
                      {/* Section order badge */}
                      <div className="w-6 h-6 rounded-lg bg-[#F7B425] text-black font-black flex items-center justify-center text-xs shrink-0">
                        {idx + 1}
                      </div>

                      {/* Section Name */}
                      <div className="flex-1 min-w-[160px]">
                        <label className={`block text-[10px] font-bold mb-1 ${subText}`}>
                          {tr('Nama Bagian / Subtes', 'Section Name')}
                        </label>
                        <input
                          type="text"
                          required
                          value={section.name}
                          onChange={(e) => handleUpdateSection(idx, 'name', e.target.value)}
                          placeholder="Contoh: Section 1: Listening Comprehension"
                          className={`w-full px-3 py-1.5 rounded-lg border focus:outline-none focus:border-[#F7B425] text-xs font-semibold ${
                            isDark ? 'bg-[#181818] border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>

                      {/* Question Count */}
                      <div className="w-full sm:w-28 shrink-0">
                        <label className={`block text-[10px] font-bold mb-1 ${subText}`}>
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
                            className={`w-full px-3 py-1.5 rounded-lg border focus:outline-none focus:border-[#F7B425] text-xs font-mono font-bold ${
                              isDark ? 'bg-[#181818] border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                          <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none ${subText}`}>
                            soal
                          </span>
                        </div>
                      </div>

                      {/* Duration in Minutes */}
                      <div className="w-full sm:w-28 shrink-0">
                        <label className={`block text-[10px] font-bold mb-1 ${subText}`}>
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
                            className={`w-full px-3 py-1.5 rounded-lg border focus:outline-none focus:border-[#F7B425] text-xs font-mono font-bold ${
                              isDark ? 'bg-[#181818] border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                          <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none ${subText}`}>
                            menit
                          </span>
                        </div>
                      </div>

                      {/* Delete Section Button */}
                      {programFormData.sections.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSection(idx)}
                          className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/15 border border-rose-500/20 hover:border-rose-500/40 transition-colors cursor-pointer self-end sm:self-center shrink-0"
                          title={tr('Hapus bagian ini', 'Remove this section')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Section Button */}
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="w-full py-2.5 px-3 rounded-xl border border-dashed border-[#F7B425]/40 hover:border-[#F7B425] bg-[#F7B425]/5 hover:bg-[#F7B425]/10 text-[#F7B425] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-99"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{tr('Tambah Bagian Baru ke Struktur Ujian', 'Add New Section to Structure')}</span>
                </button>
              </div>

              {/* 5. STATUS BANK SOAL */}
              <div className="space-y-2">
                <label className={`block font-bold text-xs sm:text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  5. {tr('Status Publikasi Bank Soal', 'Question Bank Status')} <span className="text-rose-500">*</span>
                </label>

                <div className={`p-3.5 sm:p-4 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                  programFormData.isActive 
                    ? isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50/80 border-emerald-200'
                    : isDark ? 'bg-slate-800/40 border-white/10' : 'bg-slate-100 border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      programFormData.isActive 
                        ? 'bg-emerald-500 text-white shadow-xs' 
                        : 'bg-slate-400 dark:bg-slate-700 text-white'
                    }`}>
                      {programFormData.isActive ? <CheckCircle2 className="w-4 h-4 stroke-[2.5]" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-extrabold text-xs sm:text-sm tracking-wide ${
                          programFormData.isActive ? 'text-emerald-500' : 'text-slate-400'
                        }`}>
                          {programFormData.isActive ? tr('AKTIF (Siap Diujikan)', 'ACTIVE (Ready for Test)') : tr('NONAKTIF (Draf)', 'INACTIVE (Draft)')}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          programFormData.isActive 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                        }`}>
                          {programFormData.isActive ? 'Live' : 'Hidden'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setProgramFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                    className={`w-12 h-6.5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center shadow-inner shrink-0 ${
                      programFormData.isActive ? 'bg-emerald-500 justify-end' : 'bg-slate-400 dark:bg-slate-600 justify-start'
                    }`}
                    aria-label={tr('Ubah status aktif bank soal', 'Toggle question bank active status')}
                  >
                    <div className="w-5.5 h-5.5 rounded-full bg-white shadow-xs flex items-center justify-center font-black text-[9px] text-slate-800">
                      {programFormData.isActive ? 'ON' : 'OFF'}
                    </div>
                  </button>
                </div>
              </div>

              {/* 6. MODE FULLSCREEN CBT (Layar Penuh / Windowed) */}
              <div className="space-y-2">
                <label className={`block font-bold text-xs sm:text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  6. {tr('Mode Layar Penuh (Fullscreen CBT)', 'Fullscreen CBT Mode')} <span className="text-rose-500">*</span>
                </label>

                <div className={`p-3.5 sm:p-4 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                  programFormData.isFullscreen !== false 
                    ? isDark ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50/80 border-blue-200'
                    : isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50/80 border-amber-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      programFormData.isFullscreen !== false 
                        ? 'bg-blue-500 text-white shadow-xs' 
                        : 'bg-amber-500 text-black font-bold shadow-xs'
                    }`}>
                      {programFormData.isFullscreen !== false ? <Maximize className="w-4 h-4" /> : <Minimize className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-extrabold text-xs sm:text-sm tracking-wide ${
                          programFormData.isFullscreen !== false ? 'text-blue-400' : 'text-amber-500'
                        }`}>
                          {programFormData.isFullscreen !== false ? tr('FULLSCREEN ON (Wajib Layar Penuh)', 'FULLSCREEN ON (Required)') : tr('FULLSCREEN OFF (Mode Windowed / Edit UI)', 'FULLSCREEN OFF (Windowed Mode)')}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          programFormData.isFullscreen !== false 
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                            : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                        }`}>
                          {programFormData.isFullscreen !== false ? 'CBT Lockdown' : 'Preview Edit'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setProgramFormData(prev => ({ ...prev, isFullscreen: prev.isFullscreen === false ? true : false }))}
                    className={`w-12 h-6.5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center shadow-inner shrink-0 ${
                      programFormData.isFullscreen !== false ? 'bg-blue-500 justify-end' : 'bg-slate-400 dark:bg-slate-600 justify-start'
                    }`}
                    aria-label={tr('Ubah mode layar penuh bank soal', 'Toggle question bank fullscreen mode')}
                  >
                    <div className="w-5.5 h-5.5 rounded-full bg-white shadow-xs flex items-center justify-center font-black text-[9px] text-slate-800">
                      {programFormData.isFullscreen !== false ? 'ON' : 'OFF'}
                    </div>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-6 border-t border-white/10 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsProgramModalOpen(false)}
                  className={`flex-1 py-2.5 rounded-xl border font-bold text-xs sm:text-sm transition-colors cursor-pointer ${
                    isDark 
                      ? 'border-white/10 text-slate-300 hover:bg-white/5' 
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {tr('Batal', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#F7B425] font-extrabold text-black hover:bg-amber-400 cursor-pointer shadow-lg shadow-[#F7B425]/25 transition-all active:scale-98 flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
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

      {/* TOEFL Official Section Directions Preview Modal */}
      {previewSectionDirections && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl flex flex-col my-auto max-h-[92vh] overflow-hidden">
            
            {/* Modal Top Control Bar */}
            <div className="px-5 py-4 border-b border-stone-800/80 bg-stone-950/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-extrabold text-amber-400">Preview Petunjuk Section</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">Official ETS Style</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    {SECTION_DIRECTIONS_DATA[previewSectionDirections]?.title}
                  </h3>
                </div>
              </div>

              {/* Section Tabs Switcher inside Modal */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-900 border border-stone-800">
                {(['Structure', 'Listening', 'Reading'] as const).map((sKey) => {
                  const sData = SECTION_DIRECTIONS_DATA[sKey];
                  const isActive = previewSectionDirections === sKey;
                  return (
                    <button
                      key={sKey}
                      type="button"
                      onClick={() => setPreviewSectionDirections(sKey)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#F7B425] text-stone-950 shadow-sm'
                          : 'text-stone-400 hover:text-white hover:bg-stone-800/60'
                      }`}
                    >
                      {sKey === 'Structure' ? 'Section 2: Structure' : sKey === 'Listening' ? 'Section 1: Listening' : 'Section 3: Reading'}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                {/* Theme Mode Toggle (Paper vs CBT) */}
                <div className="flex items-center p-0.5 rounded-lg bg-stone-800 border border-stone-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setDirectionsThemeMode('paper')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      directionsThemeMode === 'paper'
                        ? 'bg-amber-100 text-stone-950 shadow-sm'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    Buku Soal (Paper)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirectionsThemeMode('cbt')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      directionsThemeMode === 'cbt'
                        ? 'bg-[#F7B425] text-stone-950 shadow-sm'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    Mode CBT
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewSectionDirections(null)}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                  title="Tutup Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Scrollable Directions Document */}
            <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-stone-950/40">
              {(() => {
                const sec = previewSectionDirections ? SECTION_DIRECTIONS_DATA[previewSectionDirections] : null;
                if (!sec) return null;

                if (directionsThemeMode === 'paper') {
                  return (
                    /* Authentic Paper Booklet Document matching official TOEFL ITP screenshot */
                    <div className="max-w-2xl mx-auto bg-[#faf8f5] text-stone-900 border border-stone-300 rounded-xl p-6 sm:p-10 shadow-2xl font-serif leading-relaxed selection:bg-amber-200">
                      
                      {/* Section Title */}
                      <h1 className="text-xl sm:text-2xl font-bold tracking-wider text-center uppercase mb-3 text-black">
                        {sec.title}
                      </h1>

                      {/* Timing Box */}
                      <div className="text-center font-bold text-sm sm:text-base text-black mb-6 leading-snug">
                        {(sec.timeHeading || '').split('\n').map((line, idx) => (
                          <div key={idx} className={idx === 0 ? 'text-base sm:text-lg mb-0.5' : ''}>
                            {line}
                          </div>
                        ))}
                      </div>

                      {/* Introduction */}
                      <p className="text-sm sm:text-base text-justify text-stone-800 mb-6">
                        {sec.introText}
                      </p>

                      {/* Subpart & Directions */}
                      <div className="border-t border-stone-300/80 pt-6 space-y-4">
                        <h2 className="text-lg font-bold text-center text-black">
                          {sec.subpartTitle}
                        </h2>

                        <div className="text-sm sm:text-base text-justify text-stone-800 whitespace-pre-line leading-relaxed">
                          {sec.directionsText}
                        </div>

                        {/* Examples */}
                        <div className="space-y-5 pt-2">
                          {(sec.examples || []).map((ex, exIdx) => (
                            <div key={exIdx} className="bg-white/90 p-4 sm:p-5 rounded-lg border border-stone-300/80 shadow-sm">
                              <div className="font-bold text-sm text-black mb-2">{ex.title}</div>
                              <div className="text-sm sm:text-base mb-3 text-stone-900 whitespace-pre-line font-medium">{ex.prompt}</div>

                              <div className="pl-6 sm:pl-8 space-y-1.5 text-sm font-sans mb-3">
                                {Object.entries(ex.options || {}).map(([optKey, optVal]) => (
                                  <div key={optKey} className="flex items-center gap-2">
                                    <span className="font-bold text-stone-900">{optKey}. {optVal}</span>
                                  </div>
                                ))}
                              </div>

                              <p className="text-xs sm:text-sm text-stone-800 leading-normal border-t border-stone-200 pt-2 font-serif">
                                {ex.explanation}
                              </p>
                            </div>
                          ))}
                        </div>

                        {sec.additionalNotes && sec.additionalNotes.length > 0 && (
                          <div className="mt-5 text-xs text-stone-600 bg-stone-100 p-3.5 rounded border border-stone-200 space-y-1 font-sans">
                            <strong className="block text-stone-800 mb-1">Catatan Tambahan:</strong>
                            <ul className="list-disc pl-4 space-y-0.5">
                              {sec.additionalNotes.map((note, nIdx) => (
                                <li key={nIdx}>{note}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Official Footer Note */}
                      <div className="mt-8 pt-4 border-t-2 border-stone-300 text-center text-xs text-stone-500 font-sans">
                        Petunjuk ini muncul otomatis sebelum peserta mulai mengerjakan {sec.subtitle}.
                      </div>
                    </div>
                  );
                }

                // Modern CBT Dark Theme View
                return (
                  <div className="max-w-2xl mx-auto bg-stone-900 text-stone-100 border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
                    <div className="text-center space-y-2 border-b border-stone-800 pb-5">
                      <span className="text-[11px] uppercase tracking-wider font-extrabold text-[#F7B425] bg-[#F7B425]/10 px-3 py-1 rounded-full border border-[#F7B425]/20">
                        {sec.badge} • Section Directions
                      </span>
                      <h2 className="text-2xl font-black text-white">{sec.title}</h2>
                      <div className="text-sm font-semibold text-amber-300 whitespace-pre-line bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 max-w-md mx-auto">
                        {sec.timeHeading}
                      </div>
                    </div>

                    <p className="text-sm text-stone-300 leading-relaxed text-justify">
                      {sec.introText}
                    </p>

                    <div className="p-5 rounded-xl bg-stone-950/70 border border-stone-800/80 space-y-4">
                      <h3 className="text-base font-bold text-white border-b border-stone-800 pb-2">
                        {sec.subpartTitle}
                      </h3>
                      <div className="text-xs sm:text-sm text-stone-300 leading-relaxed whitespace-pre-line">
                        {sec.directionsText}
                      </div>

                      <div className="space-y-3 pt-2">
                        {(sec.examples || []).map((ex, exIdx) => (
                          <div key={exIdx} className="p-4 rounded-xl bg-stone-900 border border-stone-800">
                            <div className="text-xs font-bold text-amber-300 mb-1">{ex.title}</div>
                            <div className="text-sm text-white font-medium mb-3 whitespace-pre-line">{ex.prompt}</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                              {Object.entries(ex.options || {}).map(([optKey, optVal]) => (
                                <div key={optKey} className="text-xs px-3 py-2 rounded-lg bg-stone-950 border border-stone-800 text-stone-300">
                                  <strong className="text-amber-400 mr-1.5">{optKey}.</strong> {optVal}
                                </div>
                              ))}
                            </div>
                            <div className="text-xs text-stone-400 italic bg-stone-950/50 p-2.5 rounded-lg border border-stone-800">
                              {ex.explanation}
                            </div>
                          </div>
                        ))}
                      </div>

                      {sec.additionalNotes && sec.additionalNotes.length > 0 && (
                        <div className="mt-4 p-3 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-300 space-y-1">
                          <strong className="text-amber-400 block mb-1">Catatan Tambahan:</strong>
                          <ul className="list-disc pl-4 space-y-0.5">
                            {sec.additionalNotes.map((note, nIdx) => (
                              <li key={nIdx}>{note}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Bottom Footer Actions */}
            <div className="px-6 py-4 border-t border-stone-800/80 bg-stone-950/90 flex items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-stone-400">
                Mode Tampilan: <span className="text-white font-bold">{directionsThemeMode === 'paper' ? 'Buku Soal Kertas (Sesuai Screenshot ETS)' : 'CBT Digital Modern'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewSectionDirections(null)}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs transition-all shadow-md shadow-amber-400/20 cursor-pointer active:scale-95"
                >
                  Tutup Preview
                </button>
              </div>
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
