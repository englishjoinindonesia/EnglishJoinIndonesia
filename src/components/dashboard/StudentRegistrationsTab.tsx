import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Download, Plus, MessageCircle, 
  Award, CheckCircle2, Clock, Trash2, Edit2, Filter, X, Sparkles
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { CustomDropdown } from '../common/CustomDropdown';
import { supabase } from '../../lib/supabase';

interface StudentRecord {
  id: string;
  name: string;
  whatsapp: string;
  email: string;
  programName: string;
  registrationDate: string;
  testScore: number | null;
  listeningScore: number | null;
  structureScore: number | null;
  readingScore: number | null;
  paymentStatus: 'Paid' | 'Pending' | 'Installment';
  status: 'Lulus (500+)' | 'Selesai (<500)' | 'Sedang Ujian' | 'Belum Mulai';
  certificateNumber?: string;
}

// Known dummy seed identifiers that should be cleaned out and never reappear
const DUMMY_SEED_STUDENTS = [
  'STD-2026-001',
  'STD-2026-002',
  'STD-2026-003',
  'STD-2026-004',
  'STD-2026-005',
  'STD-2026-006'
];

const DUMMY_SEED_EMAILS = [
  'farhan.m@gmail.com',
  'anisa.rahma@student.ac.id',
  'bagus.tri@corp.id',
  'clarissa.p@yahoo.com',
  'dedi.kurnia@gmail.com',
  'eka.novita@gmail.com'
];

const DELETED_STUDENT_STORAGE_KEY = 'ej_deleted_student_ids';
const MASTER_STUDENT_STORAGE_KEY = 'ej_all_students_records';
const REGISTERED_STUDENT_STORAGE_KEY = 'ej_registered_students';

// Retrieve permanently deleted student identifiers from localStorage
export const getDeletedStudentKeys = (): Set<string> => {
  if (typeof window === 'undefined') return new Set<string>();
  try {
    const raw = localStorage.getItem(DELETED_STUDENT_STORAGE_KEY);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw);
    return new Set<string>(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set<string>();
  }
};

// Check if a student record is in the deleted tombstone set or is an unwanted seed item
export const isStudentDeleted = (
  s: { id?: string; email?: string | null; name?: string | null },
  deletedSet?: Set<string>
): boolean => {
  const set = deletedSet || getDeletedStudentKeys();
  const id = s.id ? s.id.trim() : '';
  const email = s.email ? s.email.toLowerCase().trim() : '';
  const name = s.name ? s.name.toLowerCase().trim() : '';

  if (id && (set.has(id) || DUMMY_SEED_STUDENTS.includes(id))) return true;
  if (email && (set.has(email) || DUMMY_SEED_EMAILS.includes(email))) return true;
  if (name && set.has(`name:${name}`)) return true;
  return false;
};

// Permanently record a student record into the deleted tombstone set
export const markStudentDeleted = (student: { id?: string; email?: string | null; name?: string | null }): void => {
  if (typeof window === 'undefined') return;
  try {
    const set = getDeletedStudentKeys();
    if (student.id) set.add(student.id.trim());
    if (student.email) set.add(student.email.toLowerCase().trim());
    if (student.name) set.add(`name:${student.name.toLowerCase().trim()}`);
    localStorage.setItem(DELETED_STUDENT_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.warn('Error saving deleted student key:', err);
  }
};

// Initial default empty list (no unwanted dummy seed records)
const defaultStudents: StudentRecord[] = [];

export const StudentRegistrationsTab: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentRecord | null>(null);
  const [deleteToast, setDeleteToast] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Initial student dataset loaded cleanly with deleted and dummy filtering
  const [students, setStudents] = useState<StudentRecord[]>(() => {
    try {
      const deletedKeys = getDeletedStudentKeys();

      // Check master storage
      const savedMaster = localStorage.getItem(MASTER_STUDENT_STORAGE_KEY);
      if (savedMaster) {
        const parsedMaster = JSON.parse(savedMaster);
        if (Array.isArray(parsedMaster)) {
          const cleaned = parsedMaster.filter(s => !isStudentDeleted(s, deletedKeys));
          if (cleaned.length !== parsedMaster.length) {
            localStorage.setItem(MASTER_STUDENT_STORAGE_KEY, JSON.stringify(cleaned));
          }
          return cleaned;
        }
      }

      // Check registered storage
      const saved = localStorage.getItem(REGISTERED_STUDENT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.filter(s => !isStudentDeleted(s, deletedKeys));
          localStorage.setItem(MASTER_STUDENT_STORAGE_KEY, JSON.stringify(cleaned));
          return cleaned;
        }
      }

      localStorage.setItem(MASTER_STUDENT_STORAGE_KEY, JSON.stringify([]));
    } catch (e) {
      console.warn('Error reading student records', e);
    }
    return [];
  });

  // 1. LOAD DATA: Fetch from Supabase student_registrations and test_history_records
  useEffect(() => {
    let isSubscribed = true;
    const fetchStudentsFromSupabase = async () => {
      try {
        // Fetch registrations
        const { data: regData } = await supabase
          .from('student_registrations')
          .select('*')
          .order('created_at', { ascending: false });

        // Fetch completed CBT TOEFL test history records
        const { data: testHistoryData } = await supabase
          .from('test_history_records')
          .select('*')
          .order('created_at', { ascending: false });

        if (!isSubscribed) return;

        let combinedList: StudentRecord[] = [];

        // Map from student_registrations table
        if (regData && regData.length > 0) {
          combinedList = regData.map((d: any) => ({
            id: d.id,
            name: d.name,
            whatsapp: d.whatsapp,
            email: d.email,
            programName: d.program_name,
            registrationDate: d.registration_date,
            testScore: d.test_score,
            listeningScore: d.listening_score,
            structureScore: d.structure_score,
            readingScore: d.reading_score,
            paymentStatus: d.payment_status,
            status: d.status,
            certificateNumber: d.certificate_number,
          }));
        }

        // Map any students from test_history_records that took the TOEFL test
        if (testHistoryData && testHistoryData.length > 0) {
          testHistoryData.forEach((th: any) => {
            const existingIdx = combinedList.findIndex(
              (s) => (th.user_id && s.id.includes(th.user_id.slice(0, 8))) ||
                     (user && th.user_id === user.id && s.email?.toLowerCase() === user.email?.toLowerCase()) ||
                     (s.name.toLowerCase() === th.student_name.toLowerCase())
            );

            const isUser = user && (th.user_id === user.id || th.student_name === user.user_metadata?.full_name);
            const studentFromTest: StudentRecord = {
              id: th.user_id ? `STD-${th.user_id.slice(0, 8).toUpperCase()}` : `STD-CBT-${th.id.slice(0, 6).toUpperCase()}`,
              name: th.student_name || (isUser ? user.user_metadata?.full_name || 'Student User' : 'Student Participant'),
              whatsapp: (isUser ? user.user_metadata?.whatsapp : null) || '081298765432',
              email: (isUser ? user.email : null) || 'student@englishjoin.com',
              programName: th.test_title || 'TOEFL ITP Prediction Test (Online)',
              registrationDate: th.date || '02 Sep 2026',
              testScore: th.total_score,
              listeningScore: th.listening_score,
              structureScore: th.structure_score,
              readingScore: th.reading_score,
              paymentStatus: 'Paid',
              status: th.total_score >= 500 ? 'Lulus (500+)' : 'Selesai (<500)',
              certificateNumber: th.cert_number || 'EJI/TOEFL-ITP/2026/0892',
            };

            if (existingIdx >= 0) {
              combinedList[existingIdx] = {
                ...combinedList[existingIdx],
                testScore: th.total_score,
                listeningScore: th.listening_score,
                structureScore: th.structure_score,
                readingScore: th.reading_score,
                status: th.total_score >= 500 ? 'Lulus (500+)' : 'Selesai (<500)',
                certificateNumber: th.cert_number || combinedList[existingIdx].certificateNumber,
              };
            } else {
              combinedList.push(studentFromTest);
            }
          });
        }

        // 3. Only if the logged in user is an actual student participant (NOT primary admin)
        // and they are not deleted, attach their completed test record
        const isAdmin = user && user.email && user.email.toLowerCase().includes('englishjoinindonesia@gmail.com');
        if (user && !isAdmin) {
          const userEmail = user.email?.toLowerCase() || '';
          const userDisplayName = user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'Student Login');
          const userWhatsapp = user.user_metadata?.whatsapp || '081298765432';
          const userTestRecord = testHistoryData?.find((t: any) => t.user_id === user.id || t.student_name?.toLowerCase() === userDisplayName.toLowerCase());

          if (userTestRecord) {
            const score = userTestRecord.total_score;
            const lScore = userTestRecord.listening_score;
            const sScore = userTestRecord.structure_score;
            const rScore = userTestRecord.reading_score;
            const certNo = userTestRecord.cert_number || 'EJI/TOEFL-ITP/2026/0892';
            const testTitle = userTestRecord.test_title || 'TOEFL ITP Prediction Test (Online)';
            const testDate = userTestRecord.date || 'Hari ini';

            const loggedInStudentRecord: StudentRecord = {
              id: `STD-${user.id ? user.id.slice(0, 8).toUpperCase() : '2026-ME'}`,
              name: userDisplayName,
              whatsapp: userWhatsapp,
              email: user.email || 'student@englishjoin.com',
              programName: testTitle,
              registrationDate: testDate,
              testScore: score,
              listeningScore: lScore,
              structureScore: sScore,
              readingScore: rScore,
              paymentStatus: 'Paid',
              status: score >= 500 ? 'Lulus (500+)' : 'Selesai (<500)',
              certificateNumber: certNo,
            };

            const existingIdx = combinedList.findIndex(
              (s) => (userEmail && s.email?.toLowerCase() === userEmail) || s.id.includes(user.id.slice(0, 8).toUpperCase())
            );

            if (existingIdx >= 0) {
              combinedList[existingIdx] = loggedInStudentRecord;
            } else {
              combinedList.unshift(loggedInStudentRecord);
            }
          }
        }

        // 4. CRITICAL: Filter out any student that has been deleted or is dummy seed
        const deletedKeys = getDeletedStudentKeys();
        const cleanedList = combinedList.filter((s) => !isStudentDeleted(s, deletedKeys));

        setStudents(cleanedList);
        localStorage.setItem(MASTER_STUDENT_STORAGE_KEY, JSON.stringify(cleanedList));
      } catch (err) {
        console.warn('Supabase fetch error:', err);
      }
    };

    fetchStudentsFromSupabase();
    return () => {
      isSubscribed = false;
    };
  }, [user]);

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const deletedKeys = getDeletedStudentKeys();
        const savedMaster = localStorage.getItem(MASTER_STUDENT_STORAGE_KEY);
        if (savedMaster) {
          const parsed = JSON.parse(savedMaster);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter(s => !isStudentDeleted(s, deletedKeys));
            setStudents(cleaned);
            return;
          }
        }
        const saved = localStorage.getItem(REGISTERED_STUDENT_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter(s => !isStudentDeleted(s, deletedKeys));
            setStudents(cleaned);
          }
        }
      } catch (e) {
        console.warn('Error syncing student records', e);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // New Student Form State
  const [newStudent, setNewStudent] = useState({
    name: '',
    whatsapp: '',
    email: '',
    programName: 'TOEFL ITP Prediction Test (Online)',
    paymentStatus: 'Paid' as const,
  });

  // 2. CREATE ITEM: Insert into Supabase
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const uniqueNum = Date.now().toString().slice(-4);
    const created: StudentRecord = {
      id: `STD-${new Date().getFullYear()}-${uniqueNum}`,
      name: newStudent.name.trim(),
      whatsapp: newStudent.whatsapp.trim(),
      email: newStudent.email.trim() || `${newStudent.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      programName: newStudent.programName,
      registrationDate: 'Hari ini',
      testScore: null,
      listeningScore: null,
      structureScore: null,
      readingScore: null,
      paymentStatus: newStudent.paymentStatus,
      status: 'Belum Mulai'
    };
    const updated = [created, ...students];
    setStudents(updated);
    try {
      localStorage.setItem(MASTER_STUDENT_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.warn('Error saving new student to localStorage', err);
    }

    // Insert directly into Supabase
    try {
      await supabase.from('student_registrations').insert([
        {
          id: created.id,
          user_id: user?.id || null,
          name: created.name,
          whatsapp: created.whatsapp,
          email: created.email,
          program_name: created.programName,
          registration_date: created.registrationDate,
          test_score: created.testScore,
          listening_score: created.listeningScore,
          structure_score: created.structureScore,
          reading_score: created.readingScore,
          payment_status: created.paymentStatus,
          status: created.status,
          certificate_number: created.certificateNumber || null,
        }
      ]);
    } catch (err) {
      console.warn('Supabase student insert notice:', err);
    }

    setIsAddModalOpen(false);
    setNewStudent({
      name: '',
      whatsapp: '',
      email: '',
      programName: 'TOEFL ITP Prediction Test (Online)',
      paymentStatus: 'Paid'
    });
    setDeleteToast(`Siswa "${created.name}" berhasil ditambahkan.`);
    setTimeout(() => setDeleteToast(null), 3000);
  };

  const handleDelete = (id: string) => {
    const target = students.find((s) => s.id === id);
    if (target) {
      setStudentToDelete(target);
    }
  };

  // Clear all students permanently
  const handleClearAllStudents = () => {
    if (window.confirm('Hapus semua data pendaftar siswa yang ada di tabel ini? Data yang terhapus tidak akan dimunculkan lagi.')) {
      students.forEach(s => markStudentDeleted(s));
      setStudents([]);
      localStorage.setItem(MASTER_STUDENT_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(REGISTERED_STUDENT_STORAGE_KEY, JSON.stringify([]));
      window.dispatchEvent(new Event('storage'));
      setDeleteToast('Semua data pendaftar siswa telah dibersihkan secara permanen.');
      setTimeout(() => setDeleteToast(null), 4000);
    }
  };

  // 3. DELETE ITEM: Delete from Supabase & tombstone forever
  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    const targetId = studentToDelete.id;
    const targetName = studentToDelete.name;

    // Permanently record deletion tombstone
    markStudentDeleted(studentToDelete);

    const updated = students.filter((s) => s.id !== targetId);
    setStudents(updated);

    try {
      localStorage.setItem(MASTER_STUDENT_STORAGE_KEY, JSON.stringify(updated));

      const rawRegistered = localStorage.getItem(REGISTERED_STUDENT_STORAGE_KEY);
      if (rawRegistered) {
        const regList = JSON.parse(rawRegistered);
        if (Array.isArray(regList)) {
          const filteredReg = regList.filter((s: any) => s.id !== targetId && s.email !== studentToDelete.email);
          localStorage.setItem(REGISTERED_STUDENT_STORAGE_KEY, JSON.stringify(filteredReg));
        }
      }
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.warn('Error updating storage upon deletion', err);
    }

    // Delete in Supabase
    try {
      await supabase.from('student_registrations').delete().eq('id', targetId);
    } catch (err) {
      console.warn('Supabase student delete notice:', err);
    }

    try {
      if (studentToDelete.name) {
        await supabase.from('test_history_records').delete().eq('student_name', studentToDelete.name);
      }
    } catch (err) {
      console.warn('Supabase test history delete notice:', err);
    }

    if (selectedStudent?.id === targetId) {
      setSelectedStudent(null);
    }

    setStudentToDelete(null);
    setDeleteToast(`Data siswa "${targetName}" (${targetId}) berhasil dihapus dan tidak akan dimunculkan lagi.`);
    setTimeout(() => setDeleteToast(null), 4000);
  };

  // Filtered list
  const filteredStudents = students.filter(s => {
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = s.name.toLowerCase().includes(searchLower) ||
      s.whatsapp.includes(searchTerm) ||
      s.programName.toLowerCase().includes(searchLower) ||
      (s.email && s.email.toLowerCase().includes(searchLower)) ||
      (s.certificateNumber && s.certificateNumber.toLowerCase().includes(searchLower)) ||
      s.id.toLowerCase().includes(searchLower);
    
    if (filterStatus === 'all') return matchSearch;
    if (filterStatus === 'passed') return matchSearch && s.status.includes('Lulus');
    if (filterStatus === 'active') return matchSearch && s.status === 'Sedang Ujian';
    if (filterStatus === 'pending') return matchSearch && s.status === 'Belum Mulai';
    return matchSearch;
  });

  const cardBg = isDark ? 'bg-[#141414] border-white/10 text-white shadow-xl' : 'bg-white border-slate-200/90 text-slate-900 shadow-sm';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-3">
      
      {/* Top Action Bar - Compact & Minimal Padding */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:px-4 sm:py-2.5 rounded-2xl border ${cardBg}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#F7B425]/15 text-[#F7B425] flex items-center justify-center font-bold shrink-0">
            <Users className="w-4 h-4 text-[#F7B425]" />
          </div>
          <div>
            <h2 className={`text-sm sm:text-base font-extrabold font-heading ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Tabel Data Pendaftar TOEFL Student
            </h2>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 rounded-[10px] text-xs font-bold bg-[#F7B425] text-black hover:bg-amber-400 flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* Notification Toast - Compact */}
      {deleteToast && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{deleteToast}</span>
          </div>
          <button 
            onClick={() => setDeleteToast(null)} 
            className="text-emerald-400/70 hover:text-emerald-300 p-0.5 rounded hover:bg-emerald-500/10 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Main Table Card - Minimal padding & compact rows */}
      <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b font-bold uppercase text-[9.5px] tracking-wider ${
                isDark ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                <th className="py-2.5 px-3.5 sm:px-4">ID &amp; Nama Siswa</th>
                <th className="py-2.5 px-3">Kontak WhatsApp</th>
                <th className="py-2.5 px-3">Program Pilihan</th>
                <th className="py-2.5 px-2.5 text-center">Skor TOEFL</th>
                <th className="py-2.5 px-2.5 text-center">Bayar</th>
                <th className="py-2.5 px-2.5 text-center">Status Kelulusan</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center px-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-[#F7B425] flex items-center justify-center mx-auto mb-3 border border-amber-500/20">
                      <Users className="w-6 h-6" />
                    </div>
                    <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {searchTerm || filterStatus !== 'all'
                        ? 'Tidak ditemukan data pendaftar sesuai filter.'
                        : 'Belum Ada Data Pendaftar Siswa'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {searchTerm || filterStatus !== 'all'
                        ? 'Coba ubah kata kunci pencarian atau sesuaikan filter status.'
                        : 'Data yang telah dihapus tidak akan dimunculkan lagi. Pendaftar baru akan tercatat di tabel ini secara otomatis.'}
                    </p>
                    {(!searchTerm && filterStatus === 'all') && (
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="mt-3.5 px-3.5 py-1.5 rounded-[10px] text-xs font-bold bg-[#F7B425] text-black hover:bg-amber-400 inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Data Siswa</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const isCurrentUser = Boolean(
                    user && (
                      (student.email && user.email && student.email.toLowerCase() === user.email.toLowerCase()) ||
                      (user.id && student.id.includes(user.id.slice(0, 8).toUpperCase())) ||
                      student.id === `STD-${user.id ? user.id.slice(0, 8).toUpperCase() : '2026-ME'}`
                    )
                  );

                  return (
                    <tr 
                      key={`${student.id}-${idx}`} 
                      className={`transition-colors ${
                        isCurrentUser
                          ? isDark
                            ? 'bg-[#F7B425]/10 border-l-4 border-l-[#F7B425] hover:bg-[#F7B425]/15'
                            : 'bg-amber-50/90 border-l-4 border-l-[#F7B425] hover:bg-amber-100/70'
                          : isDark 
                            ? 'hover:bg-white/5' 
                            : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* ID & Name */}
                      <td className="py-2.5 px-3.5 sm:px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-mono text-[9px] block ${subText}`}>{student.id}</span>
                          {isCurrentUser && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8.5px] font-extrabold bg-[#F7B425] text-black shadow-xs">
                              <Sparkles className="w-2.5 h-2.5 text-black shrink-0" />
                              Akun Login (Sudah Tes)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`font-extrabold text-xs block leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{student.name}</span>
                        </div>
                        <span className={`text-[9.5px] block truncate max-w-[160px] ${subText}`}>{student.email}</span>
                      </td>

                      {/* Contact */}
                      <td className="py-2.5 px-3">
                        <a
                          href={`https://wa.me/62${student.whatsapp.replace(/^0/, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 hover:underline font-semibold text-[11px]"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span>{student.whatsapp}</span>
                        </a>
                      </td>

                      {/* Program */}
                      <td className="py-2.5 px-3 max-w-[200px]">
                        <span className={`font-semibold line-clamp-1 text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{student.programName}</span>
                        <span className={`text-[9.5px] ${subText}`}>{student.registrationDate}</span>
                      </td>

                      {/* Score */}
                      <td className="py-2.5 px-2.5 text-center">
                        {student.testScore ? (
                          <div>
                            <span className={`px-2 py-0.5 rounded font-mono font-black text-[11px] inline-block ${
                              isCurrentUser
                                ? 'bg-[#F7B425] text-black ring-1 ring-[#F7B425]/50 shadow-xs'
                                : student.testScore >= 500 
                                  ? 'bg-[#F7B425] text-black' 
                                  : isDark 
                                    ? 'bg-white/10 text-slate-300' 
                                    : 'bg-slate-100 text-slate-700'
                            }`}>
                              {student.testScore}
                            </span>
                            <span className={`block text-[8.5px] mt-0.5 font-mono ${subText}`}>
                              L:{student.listeningScore} S:{student.structureScore} R:{student.readingScore}
                            </span>
                            {student.certificateNumber && (
                              <span className="block text-[8px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold truncate max-w-[110px] mx-auto mt-0.5">
                                {student.certificateNumber}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">-</span>
                        )}
                      </td>

                      {/* Payment */}
                      <td className="py-2.5 px-2.5 text-center">
                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase ${
                          student.paymentStatus === 'Paid' 
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30' 
                            : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                        }`}>
                          {student.paymentStatus}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                          student.status.includes('Lulus') ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30' :
                          student.status.includes('Sedang') ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30' :
                          student.status.includes('Belum') ? isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-100 text-slate-500' :
                          'bg-[#F7B425]/20 text-[#F7B425] border border-[#F7B425]/30'
                        }`}>
                          {student.status}
                        </span>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail & Certificate Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#141414] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-white/10 relative text-white">
            <h3 className="text-xl font-black text-white font-heading mb-1">
              Rincian Pendaftar &amp; Sertifikat
            </h3>
            <p className="text-xs text-[#F7B425] mb-6 font-mono">ID: {selectedStudent.id}</p>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-slate-400">Nama Siswa:</span>
                <span className="font-bold text-white">{selectedStudent.name}</span>
              </div>
              <div className="flex justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-slate-400">Program:</span>
                <span className="font-bold text-white">{selectedStudent.programName}</span>
              </div>
              <div className="flex justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-slate-400">WhatsApp:</span>
                <span className="font-bold text-[#F7B425] font-mono">{selectedStudent.whatsapp}</span>
              </div>
              <div className="flex justify-between p-3 bg-[#F7B425]/10 border border-[#F7B425]/30 rounded-xl">
                <span className="text-[#F7B425] font-bold">Skor TOEFL Total:</span>
                <span className="font-black text-base text-[#F7B425] font-mono">
                  {selectedStudent.testScore ? `${selectedStudent.testScore} (Scaled)` : 'Belum Ada Skor'}
                </span>
              </div>

              {selectedStudent.certificateNumber && (
                <div className="p-4 bg-gradient-to-r from-black via-[#181818] to-black rounded-2xl border border-[#F7B425]/30 text-center space-y-1 shadow-lg">
                  <div className="flex items-center justify-center gap-1.5 text-[#F7B425] font-extrabold text-xs">
                    <Award className="w-4 h-4" />
                    <span>Sertifikat Resmi Terbit</span>
                  </div>
                  <p className="font-mono text-[11px] font-bold text-white">
                    No: {selectedStudent.certificateNumber}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Sertifikat Resmi
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setSelectedStudent(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 font-bold text-xs text-slate-300 hover:bg-white/5 cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setDeleteToast(`E-Certificate Resmi untuk ${selectedStudent.name} (${selectedStudent.certificateNumber || selectedStudent.id}) sedang dipersiapkan.`);
                  setTimeout(() => setDeleteToast(null), 4000);
                  setSelectedStudent(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#F7B425] font-extrabold text-xs text-black hover:bg-amber-400 flex items-center justify-center gap-1.5 shadow-lg shadow-[#F7B425]/20 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Cetak Sertifikat</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#141414] rounded-3xl w-full max-w-3xl p-6 sm:p-8 shadow-2xl border border-white/10 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-black text-white font-heading mb-1">
                  Tambah Data Pendaftar TOEFL
                </h3>
                <p className="text-xs text-slate-400">
                  Masukkan identitas siswa untuk memberikan akses tes online &amp; pencatatan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Nama Lengkap Siswa *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ahmad Fauzan"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e1e1e] border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#F7B425]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Nomor WhatsApp Aktif *</label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 08123456789"
                  value={newStudent.whatsapp}
                  onChange={(e) => setNewStudent({ ...newStudent, whatsapp: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e1e1e] border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#F7B425]"
                />
              </div>

              <div>
                <CustomDropdown
                  label="Pilihan Program *"
                  value={newStudent.programName}
                  onChange={(val) => setNewStudent({ ...newStudent, programName: val })}
                  buttonStyle={{ height: '38px', borderRadius: '12px' }}
                  options={[
                    {
                      value: 'TOEFL ITP Prediction Test (Online)',
                      label: 'TOEFL ITP Prediction Test (Online)',
                      badge: 'Populer',
                      style: { height: '38px' },
                    },
                    {
                      value: 'TOEFL Preparation & Test (Garansi 500+)',
                      label: 'TOEFL Preparation & Test (Garansi 500+)',
                      style: { height: '44px' },
                    },
                    { value: 'TOEFL Fast-Track Weekend Bootcamp', label: 'TOEFL Fast-Track Weekend Bootcamp' },
                    { value: 'English for Beginners (From Zero to Hero)', label: 'English for Beginners (From Zero to Hero)' },
                    {
                      value: 'Speaking Intensive & Conversation Camp',
                      label: 'Speaking Intensive & Conversation Camp',
                      style: { height: '45px' },
                    },
                  ]}
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 font-bold text-slate-300 hover:bg-white/5 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#F7B425] font-extrabold text-black hover:bg-amber-400 cursor-pointer shadow-lg shadow-[#F7B425]/20"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#141414] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-white/10 relative text-white animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-black text-white font-heading">
                  Hapus Data Siswa?
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus data pendaftar ini? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            {/* Target Student Preview Box */}
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2 mb-6 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">ID Siswa:</span>
                <span className="font-mono font-bold text-[#F7B425]">{studentToDelete.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Nama Lengkap:</span>
                <span className="font-bold text-white">{studentToDelete.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">WhatsApp:</span>
                <span className="font-mono text-emerald-400">{studentToDelete.whatsapp}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Program:</span>
                <span className="text-slate-200 line-clamp-1 max-w-[200px] text-right font-medium">{studentToDelete.programName}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 font-bold text-xs text-slate-300 hover:bg-white/5 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteStudent}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 font-extrabold text-xs text-white transition-colors cursor-pointer shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
