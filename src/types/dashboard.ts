export interface StudentApplicant {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  programId: string;
  programName: string;
  registrationDate: string;
  paymentStatus: 'Paid' | 'Pending' | 'Verified';
  testStatus: 'Completed' | 'In Progress' | 'Scheduled' | 'Not Started';
  toeflScore?: {
    listening: number;
    structure: number;
    reading: number;
    total: number;
  };
  targetScore: number;
  notes?: string;
}

export interface ToeflQuestion {
  id: string;
  programId?: string;
  section: 'Listening' | 'Structure' | 'Reading';
  part?: string;
  questionText: string;
  audioUrl?: string;
  audioFileName?: string;
  passageText?: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

export interface ToeflScoreSetting {
  minPassingScore: number;
  listeningScale: { minRaw: number; maxRaw: number; scaledScore: number }[];
  structureScale: { minRaw: number; maxRaw: number; scaledScore: number }[];
  readingScale: { minRaw: number; maxRaw: number; scaledScore: number }[];
}

export interface ToeflTestProgram {
  id: string;
  title: string;
  tag: string;
  category: string;
  duration: string;
  questionCount: string;
  scoreTarget: string;
  certificate?: string;
  benefits: string[];
  isActive?: boolean;
  isFullscreen?: boolean;
}
