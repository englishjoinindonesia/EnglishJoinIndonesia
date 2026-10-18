import React, { useState } from 'react';
import { 
  GraduationCap, Plus, Edit3, Trash2, CheckCircle2, 
  Star, Award, Sparkles, AlertTriangle, X, RotateCcw, 
  Search, Eye, EyeOff, BookOpen, UserCheck,
  GripVertical, ArrowLeft, ArrowRight
} from 'lucide-react';
import { useMentors, ManagedMentor } from '../../context/MentorsContext';
import { useTheme } from '../../context/ThemeContext';
import { CustomDropdown } from '../common/CustomDropdown';

export const MentorsManagementTab: React.FC = () => {
  const { 
    mentors, 
    addMentor, 
    updateMentor, 
    deleteMentor, 
    toggleMentorActive, 
    reorderMentors,
    resetToDefaults 
  } = useMentors();
  const { isDark } = useTheme();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMentor, setEditingMentor] = useState<ManagedMentor | null>(null);
  const [specialtiesText, setSpecialtiesText] = useState<string>('');
  const [deletingMentor, setDeletingMentor] = useState<ManagedMentor | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Drag & Drop state
  const [draggedMentorId, setDraggedMentorId] = useState<string | null>(null);
  const [dragOverMentorId, setDragOverMentorId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedMentorId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverMentorId !== id) {
      setDragOverMentorId(id);
    }
  };

  const handleDragEnd = () => {
    setDraggedMentorId(null);
    setDragOverMentorId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedMentorId || draggedMentorId === targetId) {
      setDraggedMentorId(null);
      setDragOverMentorId(null);
      return;
    }

    const currentFiltered = [...filteredMentors];
    const sourceIdx = currentFiltered.findIndex(m => m.id === draggedMentorId);
    const targetIdx = currentFiltered.findIndex(m => m.id === targetId);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      const [moved] = currentFiltered.splice(sourceIdx, 1);
      currentFiltered.splice(targetIdx, 0, moved);

      if (filterRole === 'all' && !searchTerm) {
        reorderMentors(currentFiltered);
      } else {
        let fIdx = 0;
        const filteredIds = new Set(filteredMentors.map(m => m.id));
        const newMaster = mentors.map(m => {
          if (filteredIds.has(m.id)) {
            const item = currentFiltered[fIdx];
            fIdx++;
            return item;
          }
          return m;
        });
        reorderMentors(newMaster);
      }
      showToast(`Urutan "${moved.name}" dipindahkan ke posisi #${targetIdx + 1}.`);
    }

    setDraggedMentorId(null);
    setDragOverMentorId(null);
  };

  const moveMentorByIndex = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || fromIndex >= filteredMentors.length || toIndex < 0 || toIndex >= filteredMentors.length) return;
    
    const currentFiltered = [...filteredMentors];
    const [moved] = currentFiltered.splice(fromIndex, 1);
    currentFiltered.splice(toIndex, 0, moved);

    if (filterRole === 'all' && !searchTerm) {
      reorderMentors(currentFiltered);
    } else {
      let fIdx = 0;
      const filteredIds = new Set(filteredMentors.map(m => m.id));
      const newMaster = mentors.map(m => {
        if (filteredIds.has(m.id)) {
          const item = currentFiltered[fIdx];
          fIdx++;
          return item;
        }
        return m;
      });
      reorderMentors(newMaster);
    }
    showToast(`Urutan "${moved.name}" dipindahkan ke posisi #${toIndex + 1}.`);
  };

  const handleToggle = (id: string, name: string, currentActive: boolean) => {
    toggleMentorActive(id);
    showToast(!currentActive ? `Mentor "${name}" diaktifkan (tampil di Landing Page).` : `Mentor "${name}" dinonaktifkan.`);
  };

  const openEditModal = (mentor: ManagedMentor) => {
    setEditingMentor({ ...mentor });
    setSpecialtiesText(mentor.specialties.join('\n'));
    setIsEditModalOpen(true);
  };

  const openCreateModal = () => {
    const defaultNew: ManagedMentor = {
      id: '',
      name: '',
      title: 'Senior English Mentor',
      role: 'Speaking & Fluency Specialist',
      badge: 'Mentor Berpengalaman',
      bio: '',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      experience: '3+ Tahun Pengalaman',
      specialties: ['Interactive English Class', 'Practical Speaking Skills', 'Friendly & Supportive Learning'],
      educationOrCert: 'Bachelor of English Education • Certified Tutor',
      isActive: true,
      order: mentors.length + 1
    };
    setEditingMentor(defaultNew);
    setSpecialtiesText(defaultNew.specialties.join('\n'));
    setIsEditModalOpen(true);
  };

  const handleSaveMentor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMentor) return;

    const parsedSpecialties = specialtiesText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const mentorToSave: ManagedMentor = {
      ...editingMentor,
      specialties: parsedSpecialties.length > 0 ? parsedSpecialties : ['Interactive English Class']
    };

    if (editingMentor.id) {
      updateMentor(mentorToSave);
      showToast(`Data mentor "${mentorToSave.name}" berhasil diperbarui.`);
    } else {
      addMentor(mentorToSave);
      showToast(`Mentor "${mentorToSave.name}" berhasil ditambahkan ke Landing Page.`);
    }

    setIsEditModalOpen(false);
    setEditingMentor(null);
  };

  const confirmDelete = () => {
    if (!deletingMentor) return;
    deleteMentor(deletingMentor.id);
    showToast(`Data mentor "${deletingMentor.name}" berhasil dihapus.`);
    setDeletingMentor(null);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Kembalikan semua daftar mentor ke pengaturan awal Landing Page?')) {
      resetToDefaults();
      showToast('Data mentor berhasil direset ke standar awal English Join Indonesia.');
    }
  };

  const filteredMentors = mentors.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.bio.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterRole === 'all') return matchesSearch;
    if (filterRole === 'active') return matchesSearch && m.isActive;
    if (filterRole === 'inactive') return matchesSearch && !m.isActive;
    return matchesSearch;
  });

  const cardBg = isDark ? 'bg-[#141414] border-white/10 text-white shadow-xl' : 'bg-white border-slate-200/90 text-slate-900 shadow-sm';
  const subText = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-3 relative" id="mentors-management-container">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#F7B425]" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card - Compact & Minimal Padding */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:px-4 sm:py-2.5 rounded-2xl border ${cardBg}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#F7B425]/15 text-[#F7B425] flex items-center justify-center font-bold shrink-0">
            <GraduationCap className="w-4 h-4 text-[#F7B425]" />
          </div>
          <div>
            <h2 className={`text-sm sm:text-base font-extrabold font-heading ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Kelola Mentor &amp; Coach English Join Indonesia
            </h2>
            <p className={`text-[11px] ${subText}`}>
              Profil mentor aktif ditampilkan langsung di Landing Page English Join Indonesia.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCreateModal}
            className="px-3 py-1.5 bg-[#F7B425] hover:bg-amber-400 text-black font-extrabold text-xs rounded-lg transition-all shadow-md shadow-[#F7B425]/20 flex items-center gap-1.5 cursor-pointer active:scale-98"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Mentor</span>
          </button>
        </div>
      </div>

      {/* Search & Status Filter Filter Bar - Compact */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 p-0.5 rounded-xl border text-xs ${
            isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            {[
              { id: 'all', label: `Semua (${mentors.length})` },
              { id: 'active', label: `Aktif (${mentors.filter(m => m.isActive).length})` },
              { id: 'inactive', label: `Non-Aktif (${mentors.filter(m => !m.isActive).length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterRole(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  filterRole === tab.id
                    ? 'bg-[#F7B425] text-black font-extrabold shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Cari mentor, spesialisasi..."
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

      {/* Mentors Grid Display Container - Minimal padding & compact spacing */}
      <div>
        {filteredMentors.length === 0 ? (
          <div className={`py-8 text-center rounded-2xl border ${cardBg}`}>
            <GraduationCap className="w-8 h-8 text-slate-400 mx-auto mb-1.5 opacity-50" />
            <p className="text-xs font-bold text-slate-400">Tidak ada data mentor yang cocok.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredMentors.map((mentor, index) => {
              const isBeingDragged = draggedMentorId === mentor.id;
              const isDragOver = dragOverMentorId === mentor.id && !isBeingDragged;

              return (
                <div
                  key={mentor.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, mentor.id)}
                  onDragOver={(e) => handleDragOver(e, mentor.id)}
                  onDrop={(e) => handleDrop(e, mentor.id)}
                  onDragEnd={handleDragEnd}
                  className={`rounded-2xl border p-3 flex flex-col justify-between transition-all duration-200 relative overflow-hidden group select-none ${cardBg} ${
                    isBeingDragged
                      ? 'opacity-30 scale-95 border-dashed border-[#F7B425] shadow-none ring-2 ring-[#F7B425]/50'
                      : isDragOver
                      ? 'border-[#F7B425] scale-[1.01] shadow-xl ring-2 ring-[#F7B425] bg-[#F7B425]/10'
                      : !mentor.isActive 
                      ? 'opacity-60 grayscale-[40%]' 
                      : isDark ? 'hover:border-[#F7B425]/40 hover:shadow-xl' : 'hover:border-[#F7B425]/70 hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Top Header: Order Grip, Navigation, & Action Buttons all in ONE unified row */}
                    <div className={`flex items-center justify-between pb-2 mb-2 border-b gap-1.5 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                      {/* Left: Drag Handle & Order */}
                      <div className="flex items-center gap-1.5">
                        <div 
                          className="flex items-center gap-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-[#F7B425] transition-colors select-none"
                          title="Tahan & geser untuk mengatur urutan"
                        >
                          <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                            isDark ? 'bg-white/5 group-hover:bg-[#F7B425]/20 group-hover:text-[#F7B425]' : 'bg-slate-100 group-hover:bg-[#F7B425]/20 group-hover:text-amber-700'
                          }`}>
                            <GripVertical className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[11px] font-black text-[#F7B425] font-mono bg-[#F7B425]/10 px-1.5 py-0.5 rounded border border-[#F7B425]/20">
                            #{index + 1}
                          </span>
                        </div>

                        {/* Order Move Arrows */}
                        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveMentorByIndex(index, index - 1)}
                            className={`w-5 h-5 rounded transition-all flex items-center justify-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-20 ${
                              isDark 
                                ? 'bg-white/5 hover:bg-[#F7B425] hover:text-black text-slate-300' 
                                : 'bg-slate-100 hover:bg-[#F7B425] hover:text-black text-slate-700'
                            }`}
                            title="Geser posisi ke kiri"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={index === filteredMentors.length - 1}
                            onClick={() => moveMentorByIndex(index, index + 1)}
                            className={`w-5 h-5 rounded transition-all flex items-center justify-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-20 ${
                              isDark 
                                ? 'bg-white/5 hover:bg-[#F7B425] hover:text-black text-slate-300' 
                                : 'bg-slate-100 hover:bg-[#F7B425] hover:text-black text-slate-700'
                            }`}
                            title="Geser posisi ke kanan"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Right: Actions (Visibility, Edit, Delete) */}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleToggle(mentor.id, mentor.name, mentor.isActive)}
                          className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                            mentor.isActive
                              ? 'bg-[#F7B425]/10 hover:bg-[#F7B425]/20 text-[#F7B425]'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600'
                          }`}
                          title={mentor.isActive ? 'Sembunyikan dari Landing Page' : 'Tampilkan di Landing Page'}
                        >
                          {mentor.isActive ? <EyeOff className="w-3 h-3 text-[#F7B425]" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(mentor)}
                          className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                            isDark ? 'bg-white/10 hover:bg-[#F7B425] text-white hover:text-black' : 'bg-slate-100 hover:bg-[#F7B425] text-slate-800 hover:text-black'
                          }`}
                          title="Edit Profil Mentor"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingMentor(mentor)}
                          className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer"
                          title="Hapus Mentor"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Avatar & Basic Info - Compact */}
                    <div className="flex items-start gap-2.5 mb-2">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 border border-[#F7B425]">
                        <img
                          src={mentor.avatarUrl}
                          alt={mentor.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className={`font-extrabold text-xs sm:text-sm font-heading truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {mentor.name}
                          </h3>
                          <div className="flex items-center gap-0.5 text-[#F7B425] text-[10px] font-bold shrink-0">
                            <Star className="w-2.5 h-2.5 fill-[#F7B425]" />
                            <span>5.0</span>
                          </div>
                        </div>
                        <p className="text-[11px] font-semibold text-[#F7B425] truncate">
                          {mentor.title}
                        </p>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-medium mt-0.5 ${
                          isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {mentor.experience}
                        </span>
                      </div>
                    </div>

                    {/* Badge Pill */}
                    <div className="mb-2">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-[#F7B425]/15 text-[#F7B425] border border-[#F7B425]/30">
                        {mentor.badge}
                      </span>
                    </div>

                    {/* Bio Snippet */}
                    <p className={`text-[11px] line-clamp-2 mb-2 leading-snug ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {mentor.bio}
                    </p>

                    {/* Specialties Checklist */}
                    <div className={`space-y-1 pt-2 border-t text-[11px] ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                      <span className={`text-[9px] font-bold uppercase tracking-wider block ${subText}`}>
                        Spesialisasi:
                      </span>
                      {mentor.specialties.slice(0, 3).map((spec, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[10px] font-medium">
                          <CheckCircle2 className="w-3 h-3 text-[#F7B425] flex-shrink-0" />
                          <span className={`line-clamp-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{spec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer Education */}
                  <div className={`mt-2 pt-1.5 border-t text-[9px] flex items-center justify-between ${
                    isDark ? 'border-white/10 text-slate-400' : 'border-slate-100 text-slate-500'
                  }`}>
                    <span className="truncate">{mentor.educationOrCert}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`rounded-3xl max-w-md w-full p-6 shadow-2xl border ${cardBg}`}>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <h3 className={`text-lg font-black font-heading mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Hapus Data Mentor?
            </h3>
            <p className={`text-xs mb-4 leading-relaxed ${subText}`}>
              Apakah Anda yakin ingin menghapus mentor <strong className="text-[#F7B425]">"{deletingMentor.name}"</strong>? Data profil dan keahlian mentor akan dihapus dari Landing Page.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingMentor(null)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                  isDark ? 'border border-white/10 text-slate-300 hover:bg-white/5' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Mentor</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Modal */}
      {isEditModalOpen && editingMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`rounded-3xl w-full max-w-4xl p-6 sm:p-8 shadow-2xl border max-h-[90vh] overflow-y-auto ${cardBg}`}>
            
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className={`text-xl font-black font-heading ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {editingMentor.id ? 'Edit Profil Mentor' : 'Tambah Mentor Baru'}
                </h3>
                <p className={`text-xs mt-0.5 ${subText}`}>
                  Data ini akan langsung tersinkronisasi ke bagian Mentors &amp; Coaches di Landing Page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${
                  isDark ? 'bg-white/10 hover:bg-white/20 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMentor} className="space-y-4 text-xs">
              <div>
                <label className={`block font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  Nama Mentor / Instruktur
                </label>
                <input
                  type="text"
                  required
                  value={editingMentor.name}
                  onChange={(e) => setEditingMentor({ ...editingMentor, name: e.target.value })}
                  placeholder="Contoh: Sir Alwi / Miss Nadia / Kak Fajar"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-[#F7B425] ${
                    isDark ? 'bg-[#1e1e1e] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    Jabatan / Title
                  </label>
                  <input
                    type="text"
                    required
                    value={editingMentor.title}
                    onChange={(e) => setEditingMentor({ ...editingMentor, title: e.target.value })}
                    placeholder="Contoh: Founder & Lead Academic Mentor"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-[#F7B425] ${
                      isDark ? 'bg-[#1e1e1e] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    Badge Tagline
                  </label>
                  <input
                    type="text"
                    value={editingMentor.badge}
                    onChange={(e) => setEditingMentor({ ...editingMentor, badge: e.target.value })}
                    placeholder="Contoh: ⭐ Lead Mentor & Founder"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-[#F7B425] ${
                      isDark ? 'bg-[#1e1e1e] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Custom Styled Dropdown for Role Category using new CustomDropdown component */}
              <div>
                <CustomDropdown
                  label="Spesialisasi Utama / Program Bimbingan"
                  value={editingMentor.role}
                  onChange={(val) => setEditingMentor({ ...editingMentor, role: val })}
                  buttonClassName="!text-xs"
                  options={[
                    { value: 'TOEFL & Academic Specialist', label: 'TOEFL & Academic Specialist', badge: 'ITP & Prep' },
                    { value: 'Speaking & Fluency Specialist', label: 'Speaking & Fluency Specialist', badge: 'Conversation' },
                    { value: 'Fundamental & Grammar Coach', label: 'Fundamental & Grammar Coach', badge: 'Beginner' },
                    { value: 'Scholarship & Career Coach', label: 'Scholarship & Career Coach', badge: 'LPDP & BUMN' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    Pengalaman Mengajar
                  </label>
                  <input
                    type="text"
                    value={editingMentor.experience}
                    onChange={(e) => setEditingMentor({ ...editingMentor, experience: e.target.value })}
                    placeholder="Contoh: 7+ Tahun Pengalaman"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-[#F7B425] ${
                      isDark ? 'bg-[#1e1e1e] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    Pendidikan / Sertifikasi
                  </label>
                  <input
                    type="text"
                    value={editingMentor.educationOrCert}
                    onChange={(e) => setEditingMentor({ ...editingMentor, educationOrCert: e.target.value })}
                    placeholder="Contoh: Certified TOEFL & TESOL Trainer"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-[#F7B425] ${
                      isDark ? 'bg-[#1e1e1e] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  Bio &amp; Deskripsi Pendek
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingMentor.bio}
                  onChange={(e) => setEditingMentor({ ...editingMentor, bio: e.target.value })}
                  placeholder="Tuliskan ringkasan pengalaman dan pendekatan mengajar mentor..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-[#F7B425] ${
                    isDark ? 'bg-[#1e1e1e] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  Keahlian &amp; Fokus Bimbingan (1 baris = 1 poin checklist)
                </label>
                <textarea
                  rows={3}
                  value={specialtiesText}
                  onChange={(e) => setSpecialtiesText(e.target.value)}
                  placeholder="TOEFL ITP & Prediction Mastery&#10;Fast Structure Elimination Tactic&#10;Academic Grammar Strategy"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-[#F7B425] font-mono ${
                    isDark ? 'bg-[#1e1e1e] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className={`flex items-center gap-3 pt-3 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                    isDark ? 'border border-white/10 text-slate-300 hover:bg-white/5' : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#F7B425] hover:bg-amber-400 text-black font-extrabold text-xs transition-all shadow-lg shadow-[#F7B425]/20 cursor-pointer active:scale-98"
                >
                  {editingMentor.id ? 'Simpan Perubahan' : 'Tambah Mentor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
