import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Download, Plus, MessageCircle, 
  Award, CheckCircle2, Clock, Trash2, Edit2, Filter, X
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { CustomDropdown } from '../common/CustomDropdown';

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

const defaultStudents: StudentRecord[] = [
  {
    id: 'STD-2026-001',
    name: 'Muhammad Farhan',
    whatsapp: '081298765432',
    email: 'farhan.m@gmail.com',
    programName: 'TOEFL ITP Prediction Test (Online)',
    registrationDate: '01 Mar 2026',
    testScore: 573,
    listeningScore: 56,
    structureScore: 58,
    readingScore: 58,
    paymentStatus: 'Paid',
    status: 'Lulus (500+)',
    certificateNumber: 'CERT/EJ/2026/03/089'
  },
  {
    id: 'STD-2026-002',
    name: 'Anisa Rahmawati',
    whatsapp: '085712348899',
    email: 'anisa.rahma@student.ac.id',
    programName: 'TOEFL Preparation & Test (Garansi 500+)',
    registrationDate: '28 Feb 2026',
    testScore: 540,
    listeningScore: 52,
    structureScore: 55,
    readingScore: 55,
    paymentStatus: 'Paid',
    status: 'Lulus (500+)',
    certificateNumber: 'CERT/EJ/2026/02/084'
  },
  {
    id: 'STD-2026-003',
    name: 'Bagus Tri Prasetyo',
    whatsapp: '082199887766',
    email: 'bagus.tri@corp.id',
    programName: 'TOEFL Fast-Track Weekend Bootcamp',
    registrationDate: '27 Feb 2026',
    testScore: 490,
    listeningScore: 48,
    structureScore: 50,
    readingScore: 49,
    paymentStatus: 'Paid',
    status: 'Selesai (<500)',
    certificateNumber: 'CERT/EJ/2026/02/079'
  },
  {
    id: 'STD-2026-004',
    name: 'Clarissa Putri',
    whatsapp: '081344556677',
    email: 'clarissa.p@yahoo.com',
    programName: 'TOEFL ITP Prediction Test (Online)',
    registrationDate: '01 Mar 2026',
    testScore: null,
    listeningScore: null,
    structureScore: null,
    readingScore: null,
    paymentStatus: 'Paid',
    status: 'Sedang Ujian'
  },
  {
    id: 'STD-2026-005',
    name: 'Dedi Kurniawan',
    whatsapp: '087811223344',
    email: 'dedi.kurnia@gmail.com',
    programName: 'Speaking Intensive & Conversation Camp',
    registrationDate: '26 Feb 2026',
    testScore: null,
    listeningScore: null,
    structureScore: null,
    readingScore: null,
    paymentStatus: 'Pending',
    status: 'Belum Mulai'
  },
  {
    id: 'STD-2026-006',
    name: 'Eka Novitasari',
    whatsapp: '089677889900',
    email: 'eka.novita@gmail.com',
    programName: 'TOEFL Preparation & Test (Garansi 500+)',
    registrationDate: '25 Feb 2026',
    testScore: 610,
    listeningScore: 62,
    structureScore: 60,
    readingScore: 61,
    paymentStatus: 'Paid',
    status: 'Lulus (500+)',
    certificateNumber: 'CERT/EJ/2026/02/062'
  }
];

export const StudentRegistrationsTab: React.FC = () => {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentRecord | null>(null);
  const [deleteToast, setDeleteToast] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Initial student dataset merged with registered students & localStorage persistence
  const [students, setStudents] = useState<StudentRecord[]>(() => {
    try {
      const savedMaster = localStorage.getItem('ej_all_students_records');
      if (savedMaster) {
        const parsedMaster = JSON.parse(savedMaster);
        if (Array.isArray(parsedMaster) && parsedMaster.length > 0) {
          return parsedMaster;
        }
      }

      const saved = localStorage.getItem('ej_registered_students');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const combined = [...parsed, ...defaultStudents];
          localStorage.setItem('ej_all_students_records', JSON.stringify(combined));
          return combined;
        }
      }
      localStorage.setItem('ej_all_students_records', JSON.stringify(defaultStudents));
    } catch (e) {
      console.warn('Error reading ej_all_students_records', e);
    }
    return defaultStudents;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const savedMaster = localStorage.getItem('ej_all_students_records');
        if (savedMaster) {
          const parsed = JSON.parse(savedMaster);
          if (Array.isArray(parsed)) {
            setStudents(parsed);
            return;
          }
        }
        const saved = localStorage.getItem('ej_registered_students');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setStudents([...parsed, ...defaultStudents]);
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

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const created: StudentRecord = {
      id: `STD-2026-00${students.length + 1}`,
      name: newStudent.name,
      whatsapp: newStudent.whatsapp,
      email: newStudent.email || `${newStudent.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
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
      localStorage.setItem('ej_all_students_records', JSON.stringify(updated));
    } catch (err) {
      console.warn('Error saving new student to localStorage', err);
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

  const confirmDeleteStudent = () => {
    if (!studentToDelete) return;
    const targetId = studentToDelete.id;
    const targetName = studentToDelete.name;

    const updated = students.filter((s) => s.id !== targetId);
    setStudents(updated);

    try {
      localStorage.setItem('ej_all_students_records', JSON.stringify(updated));

      const rawRegistered = localStorage.getItem('ej_registered_students');
      if (rawRegistered) {
        const regList = JSON.parse(rawRegistered);
        if (Array.isArray(regList)) {
          const filteredReg = regList.filter((s: any) => s.id !== targetId);
          localStorage.setItem('ej_registered_students', JSON.stringify(filteredReg));
        }
      }
    } catch (err) {
      console.warn('Error updating storage upon deletion', err);
    }

    if (selectedStudent?.id === targetId) {
      setSelectedStudent(null);
    }

    setStudentToDelete(null);
    setDeleteToast(`Data siswa "${targetName}" (${targetId}) berhasil dihapus.`);
    setTimeout(() => setDeleteToast(null), 4000);
  };

  // Filtered list
  const filteredStudents = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.whatsapp.includes(searchTerm) ||
      s.programName.toLowerCase().includes(searchTerm.toLowerCase());
    
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
            <p className={`text-[11px] ${subText}`}>
              Kelola peserta ujian TOEFL, status pembayaran, skor tes, dan verifikasi sertifikat.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 bg-[#F7B425] hover:bg-amber-400 text-black font-extrabold text-xs rounded-lg transition-all shadow-md shadow-[#F7B425]/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Pendaftar</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar - Compact */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <div className={`flex items-center gap-1 p-0.5 rounded-xl border text-xs ${isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-slate-200 shadow-xs'}`}>
            {[
              { id: 'all', label: 'Semua' },
              { id: 'passed', label: 'Lolos 500+' },
              { id: 'active', label: 'Sedang Ujian' },
              { id: 'pending', label: 'Belum Mulai' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  filterStatus === tab.id
                    ? 'bg-[#F7B425] text-black font-extrabold shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
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
            placeholder="Cari nama, WhatsApp, program..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full md:w-72 pl-8 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:border-[#F7B425] ${
              isDark 
                ? 'bg-[#141414] border-white/10 text-white placeholder:text-slate-500' 
                : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 shadow-xs'
            }`}
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
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
                <th className="py-2.5 px-3.5 sm:px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400 text-xs">
                    Tidak ditemukan data pendaftar sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className={`transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                    
                    {/* ID & Name */}
                    <td className="py-2 px-3.5 sm:px-4">
                      <span className={`font-mono text-[9px] block ${subText}`}>{student.id}</span>
                      <span className={`font-extrabold text-xs block leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{student.name}</span>
                      <span className={`text-[9.5px] block truncate max-w-[160px] ${subText}`}>{student.email}</span>
                    </td>

                    {/* Contact */}
                    <td className="py-2 px-3">
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
                    <td className="py-2 px-3 max-w-[200px]">
                      <span className={`font-semibold line-clamp-1 text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{student.programName}</span>
                      <span className={`text-[9.5px] ${subText}`}>{student.registrationDate}</span>
                    </td>

                    {/* Score */}
                    <td className="py-2 px-2.5 text-center">
                      {student.testScore ? (
                        <div>
                          <span className={`px-2 py-0.5 rounded font-mono font-black text-[11px] ${
                            student.testScore >= 500 ? 'bg-[#F7B425] text-black' : isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {student.testScore}
                          </span>
                          <span className={`block text-[8.5px] mt-0.5 font-mono ${subText}`}>
                            L:{student.listeningScore} S:{student.structureScore} R:{student.readingScore}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">-</span>
                      )}
                    </td>

                    {/* Payment */}
                    <td className="py-2 px-2.5 text-center">
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase ${
                        student.paymentStatus === 'Paid' 
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30' 
                          : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                      }`}>
                        {student.paymentStatus}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-2 px-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                        student.status.includes('Lulus') ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30' :
                        student.status.includes('Sedang') ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30' :
                        student.status.includes('Belum') ? isDark ? 'bg-white/10 text-slate-400' : 'bg-slate-100 text-slate-500' :
                        'bg-[#F7B425]/20 text-[#F7B425] border border-[#F7B425]/30'
                      }`}>
                        {student.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-3.5 sm:px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className={`px-2.5 py-1 rounded-md font-bold text-[10.5px] transition-colors cursor-pointer ${
                          isDark ? 'bg-white/10 hover:bg-[#F7B425] text-white hover:text-black' : 'bg-slate-100 hover:bg-[#F7B425] text-slate-800 hover:text-black'
                        }`}
                        title="Lihat Detail & Sertifikat"
                      >
                        Detail
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="p-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer inline-flex items-center justify-center align-middle"
                        title="Hapus Data"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>

                  </tr>
                ))
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
                  alert(`Mengunduh E-Certificate Resmi untuk ${selectedStudent.name}...`);
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
                  options={[
                    { value: 'TOEFL ITP Prediction Test (Online)', label: 'TOEFL ITP Prediction Test (Online)', badge: 'Populer' },
                    { value: 'TOEFL Preparation & Test (Garansi 500+)', label: 'TOEFL Preparation & Test (Garansi 500+)' },
                    { value: 'TOEFL Fast-Track Weekend Bootcamp', label: 'TOEFL Fast-Track Weekend Bootcamp' },
                    { value: 'English for Beginners (From Zero to Hero)', label: 'English for Beginners (From Zero to Hero)' },
                    { value: 'Speaking Intensive & Conversation Camp', label: 'Speaking Intensive & Conversation Camp' },
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
