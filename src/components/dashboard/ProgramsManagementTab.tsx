import React, { useState } from 'react';
import { 
  BookOpen, Plus, Edit3, Trash2, CheckCircle2, 
  Clock, Calendar, Award, Sparkles, Tag, AlertTriangle, X, Star, RotateCcw,
  GripVertical, ArrowLeft, ArrowRight
} from 'lucide-react';
import { usePrograms, ManagedProgram } from '../../context/ProgramsContext';
import { useTheme } from '../../context/ThemeContext';
import { CustomDropdown } from '../common/CustomDropdown';

export const ProgramsManagementTab: React.FC = () => {
  const { 
    programs, 
    addProgram, 
    updateProgram, 
    deleteProgram, 
    toggleProgramActive,
    reorderPrograms,
    resetToDefaults
  } = usePrograms();
  const { isDark } = useTheme();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<ManagedProgram | null>(null);
  const [benefitsText, setBenefitsText] = useState<string>('');
  
  // Drag and Drop state
  const [draggedProgramId, setDraggedProgramId] = useState<string | null>(null);
  const [dragOverProgramId, setDragOverProgramId] = useState<string | null>(null);

  // Delete confirmation state
  const [deletingProgram, setDeletingProgram] = useState<ManagedProgram | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleToggle = (id: string, title: string, currentActive: boolean) => {
    toggleProgramActive(id);
    showToast(!currentActive ? `Program "${title}" diaktifkan (tampil di website).` : `Program "${title}" dinonaktifkan (disembunyikan).`);
  };

  const openEditModal = (prog: ManagedProgram) => {
    setEditingProgram({ ...prog });
    setBenefitsText(prog.benefits.join('\n'));
    setIsEditModalOpen(true);
  };

  const openCreateModal = () => {
    const defaultNew: ManagedProgram = {
      id: '',
      title: '',
      category: 'Landing Page',
      tag: 'Program Baru',
      level: 'Semua Level',
      duration: '1 Bulan',
      sessionCount: '16 Sesi',
      priceFormatted: 'Rp 299.000',
      originalPrice: 'Rp 450.000',
      scoreTarget: '',
      description: '',
      benefits: ['Sertifikat Resmi', 'Modul Lengkap PDF', 'Bimbingan Tutor Berpengalaman'],
      isFeatured: false,
      isActive: true,
      iconName: 'Sparkles'
    };
    setEditingProgram(defaultNew);
    setBenefitsText(defaultNew.benefits.join('\n'));
    setIsEditModalOpen(true);
  };

  const handleSaveProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProgram) return;

    const parsedBenefits = benefitsText
      .split('\n')
      .map(b => b.trim())
      .filter(b => b.length > 0);

    const programToSave: ManagedProgram = {
      ...editingProgram,
      benefits: parsedBenefits.length > 0 ? parsedBenefits : ['Sertifikat Resmi']
    };

    if (editingProgram.id) {
      updateProgram(programToSave);
      showToast(`Program "${programToSave.title}" berhasil diperbarui & disinkronkan ke website.`);
    } else {
      addProgram(programToSave);
      showToast(`Program "${programToSave.title}" berhasil ditambahkan ke website.`);
    }

    setIsEditModalOpen(false);
    setEditingProgram(null);
  };

  const confirmDelete = () => {
    if (!deletingProgram) return;
    deleteProgram(deletingProgram.id);
    showToast(`Program "${deletingProgram.title}" berhasil dihapus.`);
    setDeletingProgram(null);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Kembalikan semua daftar program ke pengaturan awal?')) {
      resetToDefaults();
      showToast('Program berhasil direset ke standar awal English Join Indonesia.');
    }
  };

  const filtered = activeCategory === 'all' 
    ? programs 
    : programs.filter(p => p.category === activeCategory);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedProgramId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverProgramId !== id) {
      setDragOverProgramId(id);
    }
  };

  const handleDragEnd = () => {
    setDraggedProgramId(null);
    setDragOverProgramId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedProgramId || draggedProgramId === targetId) {
      setDraggedProgramId(null);
      setDragOverProgramId(null);
      return;
    }

    const currentFiltered = [...filtered];
    const sourceIdx = currentFiltered.findIndex(p => p.id === draggedProgramId);
    const targetIdx = currentFiltered.findIndex(p => p.id === targetId);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      const [moved] = currentFiltered.splice(sourceIdx, 1);
      currentFiltered.splice(targetIdx, 0, moved);

      if (activeCategory === 'all') {
        reorderPrograms(currentFiltered);
      } else {
        let catIdx = 0;
        const newMaster = programs.map(p => {
          if (p.category === activeCategory) {
            const item = currentFiltered[catIdx];
            catIdx++;
            return item;
          }
          return p;
        });
        reorderPrograms(newMaster);
      }
      showToast(`Urutan program "${moved.title}" dipindahkan ke posisi #${targetIdx + 1}.`);
    }

    setDraggedProgramId(null);
    setDragOverProgramId(null);
  };

  const moveProgramByIndex = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || fromIndex >= filtered.length || toIndex < 0 || toIndex >= filtered.length) return;
    
    const currentFiltered = [...filtered];
    const [moved] = currentFiltered.splice(fromIndex, 1);
    currentFiltered.splice(toIndex, 0, moved);

    if (activeCategory === 'all') {
      reorderPrograms(currentFiltered);
    } else {
      let catIdx = 0;
      const newMaster = programs.map(p => {
        if (p.category === activeCategory) {
          const item = currentFiltered[catIdx];
          catIdx++;
          return item;
        }
        return p;
      });
      reorderPrograms(newMaster);
    }
    showToast(`Urutan "${moved.title}" dipindahkan ke posisi #${toIndex + 1}.`);
  };

  return (
    <div className="space-y-3 relative" id="programs-management-container">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#F7B425]" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card - Compact & Minimal Padding */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#141414] p-3 sm:px-4 sm:py-2.5 rounded-2xl border border-white/10 shadow-lg text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#F7B425]/15 text-[#F7B425] flex items-center justify-center font-bold shrink-0">
            <BookOpen className="w-4 h-4 text-[#F7B425]" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-white font-heading">
              Pilihan Program English Join Indonesia
            </h2>
            <p className="text-[11px] text-slate-400">
              Perubahan langsung tersinkronisasi ke <strong className="text-[#F7B425]">Landing Page ("Chosen Program")</strong> &amp; <strong className="text-[#F7B425]">Portal Ujian</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCreateModal}
            className="px-3 py-1.5 bg-[#F7B425] hover:bg-amber-400 text-black font-bold text-xs rounded-lg transition-all shadow-md shadow-[#F7B425]/20 flex items-center gap-1.5 cursor-pointer active:scale-98"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="font-bold leading-4">Tambah Program</span>
          </button>
        </div>
      </div>

      {/* Category Tabs & Filter - Compact */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex flex-wrap items-center gap-1 bg-[#141414] p-0.5 rounded-xl border border-white/10 text-xs shadow-2xs">
            {[
              { id: 'all', label: 'Semua Program' },
              { id: 'Landing Page', label: 'Program Kursus Aktif' },
            ].map((cat) => {
              const count = cat.id === 'all' 
                ? programs.length 
                : programs.filter(p => p.category === cat.id).length;
              
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer text-[11px] ${
                    activeCategory === cat.id
                      ? 'bg-[#F7B425] text-black font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="font-bold">{cat.label}</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded-full font-bold ${
                    activeCategory === cat.id ? 'bg-black text-[#F7B425]' : 'bg-white/10 text-slate-300'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <span className="text-[11px] text-slate-400 font-medium">
          Menampilkan <strong className="text-white">{filtered.length}</strong> program
        </span>
      </div>

      {/* Program Cards Grid - Minimal padding & compact spacing */}
      {filtered.length === 0 ? (
        <div className="bg-[#141414] rounded-2xl p-8 text-center border border-dashed border-white/20 text-white">
          <BookOpen className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
          <h3 className="text-xs font-bold text-white mb-1">Belum Ada Program di Kategori Ini</h3>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto mb-3">
            Anda dapat menambahkan program baru atau memilih tab kategori lain.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-3 py-1.5 bg-[#F7B425] text-black text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Program</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((program, index) => {
              const isFeatured = program.isFeatured;
              const isBeingDragged = draggedProgramId === program.id;
              const isDragOver = dragOverProgramId === program.id && !isBeingDragged;

              return (
                <div 
                  key={program.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, program.id)}
                  onDragOver={(e) => handleDragOver(e, program.id)}
                  onDrop={(e) => handleDrop(e, program.id)}
                  onDragEnd={handleDragEnd}
                  className={`bg-[#141414] rounded-2xl p-3 sm:p-3.5 border transition-all duration-200 flex flex-col justify-between shadow-lg relative group ${
                    isBeingDragged
                      ? 'opacity-30 scale-95 border-dashed border-[#F7B425] shadow-none ring-2 ring-[#F7B425]/50'
                      : isDragOver
                      ? 'border-[#F7B425] scale-[1.01] shadow-xl ring-2 ring-[#F7B425] bg-[#F7B425]/10'
                      : isFeatured 
                      ? 'border-2 border-[#F7B425] shadow-md shadow-[#F7B425]/15 hover:border-[#ffbe33]' 
                      : program.isActive ? 'border-white/10 hover:border-[#F7B425]/40 hover:shadow-xl' : 'border-white/5 opacity-60 bg-[#101010]'
                  }`}
                >
                  {/* Featured Ribbon */}
                  {isFeatured && (
                    <div className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full bg-[#F7B425] text-black text-[9px] font-bold uppercase tracking-wider shadow-md flex items-center gap-1 z-10">
                      <Star className="w-2.5 h-2.5 fill-black" />
                      <span className="font-bold">POPULER</span>
                    </div>
                  )}

                  <div>
                    {/* Drag Handle & Order Toolbar - Compact */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                      <div 
                        className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing text-slate-300 hover:text-[#F7B425] transition-colors select-none"
                        title="Tahan & geser untuk memindahkan urutan program"
                      >
                        <div className="w-5 h-5 rounded bg-white/5 group-hover:bg-[#F7B425]/20 flex items-center justify-center text-slate-400 group-hover:text-[#F7B425] transition-colors">
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-[9px] uppercase font-bold text-slate-400">Urutan</span>
                          <span className="text-[11px] font-black text-[#F7B425] font-mono bg-[#F7B425]/10 px-1.5 py-0.5 rounded border border-[#F7B425]/20">
                            #{index + 1}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveProgramByIndex(index, index - 1)}
                          className="w-5 h-5 rounded bg-white/5 hover:bg-[#F7B425] hover:text-black disabled:opacity-20 text-slate-300 transition-all flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                          title="Geser posisi ke kiri"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={index === filtered.length - 1}
                          onClick={() => moveProgramByIndex(index, index + 1)}
                          className="w-5 h-5 rounded bg-white/5 hover:bg-[#F7B425] hover:text-black disabled:opacity-20 text-slate-300 transition-all flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                          title="Geser posisi ke kanan"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Header Badges & Status */}
                    <div className="flex items-center justify-between mb-2 pt-0.5">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide ${
                          program.category === 'Landing Page'
                            ? 'bg-[#F7B425]/15 text-[#F7B425] border border-[#F7B425]/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {program.category === 'Landing Page' ? 'Landing Page' : 'TOEFL Portal'}
                        </span>
                        {program.level && (
                          <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-slate-300 text-[9px] font-bold">
                            {program.level}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(program.id, program.title, program.isActive);
                        }}
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold cursor-pointer transition-colors ${
                          program.isActive 
                            ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30' 
                            : 'bg-white/10 text-slate-400 hover:bg-white/20'
                        }`}
                        title={program.isActive ? 'Klik untuk non-aktifkan' : 'Klik untuk aktifkan'}
                      >
                        {program.isActive ? '● Aktif' : '○ Non-Aktif'}
                      </button>
                    </div>

                    {/* Title & Tag */}
                    <div className="mb-1.5">
                      <span className="text-[10px] font-extrabold text-[#F7B425] uppercase tracking-wider block">
                        {program.tag}
                      </span>
                      <h3 className="text-sm sm:text-base font-extrabold text-white font-heading leading-snug">
                        {program.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-slate-400 leading-snug mb-2.5 line-clamp-2">
                      {program.description || 'Tidak ada deskripsi rinci.'}
                    </p>

                    {/* Specs & Pricing Box - Compact */}
                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 space-y-1.5 text-[11px] mb-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#F7B425]" />
                          <span>Durasi:</span>
                        </span>
                        <span className="font-bold text-slate-200">{program.duration}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#F7B425]" />
                          <span>Sesi / Soal:</span>
                        </span>
                        <span className="font-semibold text-slate-200 text-right">{program.sessionCount}</span>
                      </div>

                      {program.scoreTarget && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Award className="w-3 h-3 text-[#F7B425]" />
                            <span>Target Skor:</span>
                          </span>
                          <span className="font-black text-[#F7B425] font-mono bg-[#F7B425]/10 px-1.5 py-0.5 rounded border border-[#F7B425]/30">
                            {program.scoreTarget}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-baseline pt-1.5 border-t border-white/10">
                        <span className="text-slate-400 text-[10px] font-medium">Investasi:</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-black text-sm text-[#F7B425] font-mono">
                            {program.priceFormatted}
                          </span>
                          {program.originalPrice && (
                            <span className="text-[9px] text-slate-500 line-through">
                              {program.originalPrice}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Benefits - Compact */}
                    <div className="space-y-1 mb-3">
                      <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                        Fasilitas &amp; Keunggulan:
                      </div>
                      {program.benefits.slice(0, 4).map((b, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[10.5px] text-slate-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="leading-tight line-clamp-1">{b}</span>
                        </div>
                      ))}
                      {program.benefits.length > 4 && (
                        <span className="text-[9px] text-slate-500 font-semibold pl-4 block">
                          +{program.benefits.length - 4} fasilitas lainnya
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer - Edit & Delete */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingProgram(program);
                      }}
                      className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                      title="Hapus Program"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(program);
                      }}
                      className="px-3 py-1.5 bg-white/10 hover:bg-[#F7B425] text-white hover:text-black font-bold rounded-lg transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-98 text-xs"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Program</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#141414] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-white/10 text-white">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white font-heading mb-1.5">
              Hapus Program Ini?
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus program <strong className="text-[#F7B425]">"{deletingProgram.title}"</strong>? Tindakan ini akan menghapus data program dari website dan portal secara permanen.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingProgram(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 font-bold text-xs text-slate-300 hover:bg-white/5 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Program</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Modal */}
      {isEditModalOpen && editingProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#141414] rounded-3xl w-full max-w-4xl p-6 sm:p-8 shadow-2xl border border-white/10 text-white max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xl font-black text-white font-heading">
                  {editingProgram.id ? 'Edit Program Kursus / TOEFL' : 'Tambah Program Baru'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Perbarui detail program, harga investasi, target skor, dan fasilitas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProgram} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Nama Program</label>
                <input
                  type="text"
                  required
                  value={editingProgram.title}
                  onChange={(e) => setEditingProgram({ ...editingProgram, title: e.target.value })}
                  placeholder="Contoh: TOEFL Preparation / English Conversation"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e1e1e] border border-white/10 text-white focus:outline-none focus:border-[#F7B425]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <CustomDropdown
                    label="Kategori Tampilan"
                    value={editingProgram.category}
                    onChange={(val) => setEditingProgram({ ...editingProgram, category: val as any })}
                    options={[
                      { value: 'Landing Page', label: 'Chosen Program (Landing Page)', badge: 'Web' },
                      { value: 'TOEFL Test', label: 'Paket Ujian Toefl (Portal Login)', badge: 'Portal' },
                    ]}
                  />
                </div>

                <div>
                  <label className={`block font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Badge Tag / Subtitle</label>
                  <input
                    type="text"
                    value={editingProgram.tag}
                    onChange={(e) => setEditingProgram({ ...editingProgram, tag: e.target.value })}
                    placeholder="Contoh: Belajar dari Nol Besar / Paling Populer"
                    className={`w-full px-3.5 py-3 rounded-2xl border text-xs sm:text-sm focus:outline-none focus:border-[#F7B425] ${
                      isDark ? 'bg-[#1e1e1e] border-[#323232] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Level Kelas</label>
                  <input
                    type="text"
                    value={editingProgram.level || ''}
                    onChange={(e) => setEditingProgram({ ...editingProgram, level: e.target.value })}
                    placeholder="Contoh: Beginner (A1 - A2) / Intermediate"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e1e1e] border border-white/10 text-white focus:outline-none focus:border-[#F7B425]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Target Skor</label>
                  <input
                    type="text"
                    value={editingProgram.scoreTarget || ''}
                    onChange={(e) => setEditingProgram({ ...editingProgram, scoreTarget: e.target.value })}
                    placeholder="Contoh: Target Skor 500+ / Skala 310-677"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e1e1e] border border-white/10 text-white focus:outline-none focus:border-[#F7B425]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Durasi Program</label>
                  <input
                    type="text"
                    value={editingProgram.duration}
                    onChange={(e) => setEditingProgram({ ...editingProgram, duration: e.target.value })}
                    placeholder="Contoh: 1 Bulan Intensif / 115 Menit"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e1e1e] border border-white/10 text-white focus:outline-none focus:border-[#F7B425]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Jumlah Sesi / Soal</label>
                  <input
                    type="text"
                    value={editingProgram.sessionCount}
                    onChange={(e) => setEditingProgram({ ...editingProgram, sessionCount: e.target.value })}
                    placeholder="Contoh: 16 Sesi / 140 Soal (L, S, R)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e1e1e] border border-white/10 text-white focus:outline-none focus:border-[#F7B425]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Biaya Investasi</label>
                  <input
                    type="text"
                    value={editingProgram.priceFormatted}
                    onChange={(e) => setEditingProgram({ ...editingProgram, priceFormatted: e.target.value })}
                    placeholder="Contoh: Rp 299.000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e1e1e] border border-white/10 text-white focus:outline-none focus:border-[#F7B425]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Harga Asli (Coret)</label>
                  <input
                    type="text"
                    value={editingProgram.originalPrice || ''}
                    onChange={(e) => setEditingProgram({ ...editingProgram, originalPrice: e.target.value })}
                    placeholder="Contoh: Rp 450.000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1e1e1e] border border-white/10 text-white focus:outline-none focus:border-[#F7B425]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={editingProgram.description}
                  onChange={(e) => setEditingProgram({ ...editingProgram, description: e.target.value })}
                  placeholder="Deskripsi singkat mengenai program..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1e1e1e] border border-white/10 text-white focus:outline-none focus:border-[#F7B425]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Fasilitas &amp; Keunggulan <span className="text-slate-400 font-normal">(1 baris per fasilitas)</span>
                </label>
                <textarea
                  rows={4}
                  value={benefitsText}
                  onChange={(e) => setBenefitsText(e.target.value)}
                  placeholder="Belajar dari Nol (Nol Besar Sangat Welcome)&#10;Basic Daily Vocabulary 500+&#10;Sertifikat Resmi"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1e1e1e] border border-white/10 text-white focus:outline-none focus:border-[#F7B425] font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <label className="flex items-center gap-2 text-slate-300 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProgram.isFeatured || false}
                    onChange={(e) => setEditingProgram({ ...editingProgram, isFeatured: e.target.checked })}
                    className="w-4 h-4 text-[#F7B425] rounded accent-[#F7B425]"
                  />
                  <span>Tandai sebagai Featured / Program Populer ⭐</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-between gap-3 border-t border-white/10">
                {editingProgram.id && (
                  <button
                    type="button"
                    onClick={() => {
                      const prog = editingProgram;
                      setIsEditModalOpen(false);
                      setDeletingProgram(prog);
                    }}
                    className="px-3 py-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                )}
                
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-white/10 font-bold text-slate-300 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#F7B425] hover:bg-amber-400 font-extrabold text-black transition-colors shadow-lg shadow-[#F7B425]/20 cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

