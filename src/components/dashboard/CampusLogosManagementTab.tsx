import React, { useState, useRef } from 'react';
import { 
  Building2, Plus, Edit3, Trash2, CheckCircle2, 
  Sparkles, AlertTriangle, X, 
  Eye, EyeOff, Upload, Image as ImageIcon, Globe,
  ArrowUpDown, ExternalLink,
  GripVertical, ArrowLeft, ArrowRight,
  LayoutGrid, Table, ArrowUp, ArrowDown
} from 'lucide-react';
import { useCampusLogos } from '../../context/CampusLogosContext';
import { CampusLogo } from '../../types/campus';
import { CampusLogoItem } from '../common/CampusLogoItem';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export const CampusLogosManagementTab: React.FC = () => {
  const { 
    campusLogos, 
    addCampusLogo, 
    updateCampusLogo, 
    deleteCampusLogo, 
    toggleCampusLogoActive,
    reorderCampusLogos
  } = useCampusLogos();
  const { isDark } = useTheme();
  const { tr } = useLanguage();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLogo, setEditingLogo] = useState<CampusLogo | null>(null);
  const [deletingLogo, setDeletingLogo] = useState<CampusLogo | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Drag & Drop state
  const [draggedLogoId, setDraggedLogoId] = useState<string | null>(null);
  const [dragOverLogoId, setDragOverLogoId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLogoId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverLogoId !== id) {
      setDragOverLogoId(id);
    }
  };

  const handleDragEnd = () => {
    setDraggedLogoId(null);
    setDragOverLogoId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedLogoId || draggedLogoId === targetId) {
      setDraggedLogoId(null);
      setDragOverLogoId(null);
      return;
    }

    const currentList = [...sortedLogos];
    const sourceIdx = currentList.findIndex(l => l.id === draggedLogoId);
    const targetIdx = currentList.findIndex(l => l.id === targetId);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      const [moved] = currentList.splice(sourceIdx, 1);
      currentList.splice(targetIdx, 0, moved);
      reorderCampusLogos(currentList);
      showToast(tr(`Urutan logo "${moved.name}" dipindahkan ke posisi #${targetIdx + 1}.`, `Order of logo "${moved.name}" moved to position #${targetIdx + 1}.`));
    }

    setDraggedLogoId(null);
    setDragOverLogoId(null);
  };

  const moveLogoByIndex = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || fromIndex >= sortedLogos.length || toIndex < 0 || toIndex >= sortedLogos.length) return;
    const currentList = [...sortedLogos];
    const [moved] = currentList.splice(fromIndex, 1);
    currentList.splice(toIndex, 0, moved);
    reorderCampusLogos(currentList);
    showToast(tr(`Urutan logo "${moved.name}" dipindahkan ke posisi #${toIndex + 1}.`, `Order of logo "${moved.name}" moved to position #${toIndex + 1}.`));
  };

  const openCreateModal = () => {
    const newLogo: CampusLogo = {
      id: '',
      name: '',
      shortName: '',
      tagline: '',
      logoUrl: '',
      category: 'PTN / Dalam Negeri',
      country: 'Indonesia',
      isActive: true,
      order: campusLogos.length + 1
    };
    setEditingLogo(newLogo);
    setIsModalOpen(true);
  };

  const openEditModal = (logo: CampusLogo) => {
    setEditingLogo({ ...logo });
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingLogo) return;

    if (!file.type.startsWith('image/')) {
      alert(tr('Silakan pilih file gambar (PNG, JPG, SVG, WebP).', 'Please select an image file (PNG, JPG, SVG, WebP).'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setEditingLogo({
        ...editingLogo,
        logoUrl: result,
        svgPresetKey: undefined
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLogo) return;

    if (!editingLogo.name.trim()) {
      alert(tr('Nama universitas/kampus wajib diisi!', 'University name is required!'));
      return;
    }

    const toSave: CampusLogo = {
      ...editingLogo,
      shortName: editingLogo.shortName?.trim() || editingLogo.name.trim(),
      name: editingLogo.name.trim(),
      tagline: editingLogo.tagline?.trim() || ''
    };

    if (editingLogo.id) {
      updateCampusLogo(toSave);
      showToast(tr(`Logo kampus "${toSave.name}" berhasil diperbarui.`, `Campus logo "${toSave.name}" updated successfully.`));
    } else {
      addCampusLogo(toSave);
      showToast(tr(`Logo kampus "${toSave.name}" berhasil ditambahkan ke carousel.`, `Campus logo "${toSave.name}" added to carousel.`));
    }

    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!deletingLogo) return;
    deleteCampusLogo(deletingLogo.id);
    showToast(tr(`Logo kampus "${deletingLogo.name}" berhasil dihapus.`, `Campus logo "${deletingLogo.name}" has been deleted.`));
    setDeletingLogo(null);
  };

  const handleToggle = (id: string, name: string, currentActive: boolean) => {
    toggleCampusLogoActive(id);
    showToast(
      !currentActive
        ? tr(`"${name}" diaktifkan dan tampil di Carousel Beranda.`, `"${name}" is active and visible in Landing Page Carousel.`)
        : tr(`"${name}" dinonaktifkan (disembunyikan dari Carousel).`, `"${name}" is deactivated (hidden from Carousel).`)
    );
  };

  const sortedLogos = [...campusLogos].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-2.5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-emerald-600 text-white px-3.5 py-2 rounded-xl shadow-xl border border-emerald-400 font-bold text-xs animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Action Bar - Compact & Minimal Padding */}
      <div className={`p-2.5 sm:px-3.5 sm:py-2 rounded-2xl border transition-colors ${
        isDark 
          ? 'bg-[#141414] border-white/10 shadow-sm' 
          : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#F7B425]/15 text-[#F7B425] flex items-center justify-center font-black flex-shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h1 className={`text-base font-bold font-['Poppins',sans-serif] ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {tr('Kelola Logo Kampus Alumni', 'Manage Alumni Campus Logos')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={openCreateModal}
              className="px-2.5 py-1.5 rounded-lg bg-[#F7B425] hover:bg-[#ffbe33] text-black font-bold text-xs flex items-center gap-1.5 shadow-xs hover:shadow transition-all cursor-pointer active:scale-95 font-['Poppins',sans-serif]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="text-[12px] leading-[18px] font-bold font-['Poppins',sans-serif]">{tr('Tambah Logo Kampus', 'Add Campus Logo')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-toolbar: View Mode Toggle - Compact */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-semibold font-['Poppins',sans-serif] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {tr('Daftar Logo Kampus Alumni', 'Alumni Campus Logos List')}
          </span>
          <span className="text-[11px] font-black font-mono text-[#F7B425] bg-[#F7B425]/10 px-1.5 py-0.2 rounded border border-[#F7B425]/20">
            {sortedLogos.length}
          </span>
        </div>

        {/* Toggle Tampilan Grid dan Tabel */}
        <div className={`flex items-center p-0.5 rounded-lg border text-xs ${
          isDark ? 'bg-[#141414] border-white/10 shadow-inner' : 'bg-white border-slate-200/90 shadow-xs'
        }`}>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 text-[10.5px] ${
              viewMode === 'grid' 
                ? 'bg-[#F7B425] text-black font-extrabold shadow-xs' 
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
            title={tr('Tampilan Grid (Kartu)', 'Grid (Card) View')}
          >
            <LayoutGrid className="w-3 h-3" />
            <span className="font-['Poppins',sans-serif] text-[11px] leading-[18px] font-bold">{tr('Grid', 'Grid')}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 text-[10.5px] ${
              viewMode === 'table' 
                ? 'bg-[#F7B425] text-black font-extrabold shadow-xs' 
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
            title={tr('Tampilan Tabel (Daftar Terorganisir)', 'Table View')}
          >
            <Table className="w-3 h-3" />
            <span className="font-['Poppins',sans-serif] text-[11px] leading-[18px] font-bold">{tr('Tabel', 'Table')}</span>
          </button>
        </div>
      </div>

      {/* Logos List: Grid or Table View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-2.5">
        {sortedLogos.map((logo, index) => {
          const isBeingDragged = draggedLogoId === logo.id;
          const isDragOver = dragOverLogoId === logo.id && !isBeingDragged;

          return (
            <div
              key={logo.id}
              draggable
              onDragStart={(e) => handleDragStart(e, logo.id)}
              onDragOver={(e) => handleDragOver(e, logo.id)}
              onDrop={(e) => handleDrop(e, logo.id)}
              onDragEnd={handleDragEnd}
              className={`p-2 rounded-xl border transition-all flex flex-col justify-between group select-none relative ${
                isBeingDragged
                  ? 'opacity-30 scale-95 border-dashed border-[#F7B425] shadow-none ring-2 ring-[#F7B425]/50'
                  : isDragOver
                  ? 'border-[#F7B425] scale-[1.01] shadow-lg ring-2 ring-[#F7B425] bg-[#F7B425]/10'
                  : !logo.isActive
                  ? 'opacity-60 grayscale-[30%]'
                  : isDark 
                  ? 'bg-[#141414] border-white/10 hover:border-[#F7B425]/50 hover:shadow-md' 
                  : 'bg-white border-slate-200/90 hover:border-[#F7B425]/70 shadow-xs hover:shadow-sm'
              }`}
            >
              <div>
                {/* Header: Mini Order Badge & Quick Actions */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div 
                    className="flex items-center gap-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-[#F7B425] transition-colors"
                    title={tr('Tahan & geser untuk mengubah urutan', 'Drag to reorder')}
                  >
                    <GripVertical className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                    <span className="text-[10px] leading-4 font-black text-[#F7B425] font-mono bg-[#F7B425]/10 px-1 py-0.2 rounded border border-[#F7B425]/25">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                    {/* Active/Hidden Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggle(logo.id, logo.name, logo.isActive)}
                      className={`p-0.5 rounded transition-colors cursor-pointer ${
                        logo.isActive
                          ? 'text-emerald-500 hover:bg-emerald-500/15'
                          : 'text-slate-400 hover:text-rose-500 hover:bg-rose-500/15'
                      }`}
                      title={logo.isActive ? tr('Aktif (Tampil) - Klik untuk sembunyikan', 'Active - Click to hide') : tr('Disembunyikan - Klik untuk tampilkan', 'Hidden - Click to show')}
                      aria-label="Toggle active status"
                    >
                      {logo.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => openEditModal(logo)}
                      className={`p-0.5 rounded transition-colors cursor-pointer ${
                        isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      title={tr('Edit Logo Kampus', 'Edit Campus Logo')}
                      aria-label="Edit"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => setDeletingLogo(logo)}
                      className="p-0.5 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title={tr('Hapus Logo Kampus', 'Delete Campus Logo')}
                      aria-label="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Logo Preview - Compact */}
                <div className="w-full h-12 sm:h-14 rounded-lg bg-white border border-slate-200/80 p-1 flex items-center justify-center mb-1 shadow-xs overflow-hidden group-hover:border-[#F7B425]/40 transition-colors">
                  <CampusLogoItem logo={logo} />
                </div>

                {/* Campus Information (Compact) */}
                <div className="text-center">
                  <h3 
                    className={`font-bold text-xs leading-4 truncate font-['Poppins',sans-serif] ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                    title={logo.name}
                  >
                    {logo.shortName || logo.name}
                  </h3>
                  <div className="flex items-center justify-center gap-1 mt-0.5 text-[10px] leading-4 text-slate-400 truncate">
                    <span className={`px-1 py-0.2 rounded font-semibold ${
                      logo.category === 'PTN / Dalam Negeri'
                        ? 'bg-amber-500/10 text-amber-500'
                        : logo.category === 'PTS / Swasta'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      {logo.category === 'PTN / Dalam Negeri' ? 'PTN' : logo.category === 'PTS / Swasta' ? 'PTS' : 'LN'}
                    </span>
                    <span>•</span>
                    <span className="truncate">{logo.country}</span>
                  </div>
                </div>
              </div>

              {/* Mini Quick Reorder Controls on bottom - Compact */}
              <div 
                className={`mt-1 pt-1 border-t flex items-center justify-between text-[8.5px] text-slate-400 ${
                  isDark ? 'border-white/5' : 'border-slate-100'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="truncate text-[8.5px] text-slate-400 font-mono">
                  {logo.svgPresetKey ? 'Vector' : 'Image'}
                </span>

                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveLogoByIndex(index, index - 1)}
                    className={`p-0.5 rounded transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-20 active:scale-95 ${
                      isDark 
                        ? 'hover:bg-white/10 hover:text-white text-slate-400' 
                        : 'hover:bg-slate-200 hover:text-black text-slate-600'
                    }`}
                    title={tr('Geser ke kiri', 'Move left')}
                  >
                    <ArrowLeft className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === sortedLogos.length - 1}
                    onClick={() => moveLogoByIndex(index, index + 1)}
                    className={`p-0.5 rounded transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-20 active:scale-95 ${
                      isDark 
                        ? 'hover:bg-white/10 hover:text-white text-slate-400' 
                        : 'hover:bg-slate-200 hover:text-black text-slate-600'
                    }`}
                    title={tr('Geser ke kanan', 'Move right')}
                  >
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      ) : (
        /* Logos List Table View - Compact & Minimal Padding */
        <div className={`rounded-xl border overflow-hidden ${
          isDark ? 'bg-[#141414] border-white/10 shadow-sm' : 'bg-white border-slate-200/90 shadow-xs'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className={`border-b text-[9.5px] uppercase tracking-wider font-['Poppins',sans-serif] ${
                isDark ? 'border-white/10 text-slate-400 bg-white/5' : 'border-slate-200 text-slate-500 bg-slate-50/80'
              }`}>
                <tr>
                  <th className="py-2 px-2.5 font-bold text-center w-20">{tr('Urutan', 'Order')}</th>
                  <th className="py-2 px-2.5 font-bold text-center w-20">{tr('Logo', 'Logo')}</th>
                  <th className="py-2 px-2.5 font-bold">{tr('Nama Kampus & Info', 'Campus Name & Info')}</th>
                  <th className="py-2 px-2.5 font-bold w-32">{tr('Kategori', 'Category')}</th>
                  <th className="py-2 px-2.5 font-bold w-28 text-center">{tr('Status', 'Status')}</th>
                  <th className="py-2 px-2.5 font-bold text-right w-20">{tr('Aksi', 'Action')}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
                {sortedLogos.map((logo, index) => {
                  const isBeingDragged = draggedLogoId === logo.id;
                  const isDragOver = dragOverLogoId === logo.id && !isBeingDragged;

                  return (
                    <tr
                      key={logo.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, logo.id)}
                      onDragOver={(e) => handleDragOver(e, logo.id)}
                      onDrop={(e) => handleDrop(e, logo.id)}
                      onDragEnd={handleDragEnd}
                      className={`transition-all select-none ${
                        isBeingDragged
                          ? 'opacity-30 bg-[#F7B425]/10'
                          : isDragOver
                          ? 'bg-[#F7B425]/15 ring-2 ring-[#F7B425]'
                          : !logo.isActive
                          ? 'opacity-60 grayscale-[30%]'
                          : isDark ? 'hover:bg-white/5' : 'hover:bg-amber-50/40'
                      }`}
                    >
                      {/* Urutan & Reorder Controls */}
                      <td className="py-1.5 px-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <div 
                            className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-[#F7B425] p-0.5 rounded transition-colors"
                            title={tr('Tahan & geser untuk memindahkan urutan', 'Drag to reorder')}
                          >
                            <GripVertical className="w-3 h-3" />
                          </div>
                          <span className="text-[9.5px] font-black text-[#F7B425] font-mono bg-[#F7B425]/10 px-1 py-0.2 rounded border border-[#F7B425]/20">
                            #{index + 1}
                          </span>
                          <div className="flex flex-col gap-0.2 ml-0.5">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => moveLogoByIndex(index, index - 1)}
                              className={`p-0.5 rounded transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed ${
                                isDark ? 'hover:bg-white/10 text-slate-300 hover:text-[#F7B425]' : 'hover:bg-slate-200 text-slate-600 hover:text-black'
                              }`}
                              title={tr('Geser ke atas', 'Move up')}
                            >
                              <ArrowUp className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              disabled={index === sortedLogos.length - 1}
                              onClick={() => moveLogoByIndex(index, index + 1)}
                              className={`p-0.5 rounded transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed ${
                                isDark ? 'hover:bg-white/10 text-slate-300 hover:text-[#F7B425]' : 'hover:bg-slate-200 text-slate-600 hover:text-black'
                              }`}
                              title={tr('Geser ke bawah', 'Move down')}
                            >
                              <ArrowDown className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Logo Thumbnail */}
                      <td className="py-1.5 px-2.5 text-center">
                        <div className="w-12 h-7.5 rounded-md bg-white border border-slate-200/90 p-0.5 flex items-center justify-center mx-auto shadow-xs overflow-hidden">
                          <CampusLogoItem logo={logo} />
                        </div>
                      </td>

                      {/* Campus Name & Info */}
                      <td className="py-1.5 px-2.5">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`font-bold font-['Poppins',sans-serif] text-[11px] sm:text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {logo.name}
                            </span>
                            {logo.shortName && (
                              <span className="text-[8.5px] px-1 py-0.2 rounded bg-slate-500/10 text-slate-400 font-mono font-bold">
                                {logo.shortName}
                              </span>
                            )}
                          </div>
                          {logo.tagline && (
                            <span className="text-[9.5px] text-slate-400 italic mt-0.5 max-w-md truncate">
                              "{logo.tagline}"
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-1.5 px-2.5">
                        <span className={`inline-block px-1.5 py-0.2 rounded-full text-[8.5px] font-bold ${
                          logo.category === 'PTN / Dalam Negeri'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : logo.category === 'PTS / Swasta'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                        }`}>
                          {logo.category === 'PTN / Dalam Negeri' ? 'PTN' : logo.category === 'PTS / Swasta' ? 'PTS' : 'LN'}
                        </span>
                        <span className={`block text-[9px] mt-0.5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {logo.country}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-1.5 px-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggle(logo.id, logo.name, logo.isActive)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold transition-all cursor-pointer ${
                            logo.isActive
                              ? 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 border border-rose-500/30'
                          }`}
                          title={logo.isActive ? tr('Klik untuk sembunyikan', 'Click to hide') : tr('Klik untuk tampilkan', 'Click to show')}
                        >
                          {logo.isActive ? (
                            <>
                              <Eye className="w-2.5 h-2.5" />
                              <span>{tr('Aktif', 'Active')}</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-2.5 h-2.5" />
                              <span>{tr('Off', 'Off')}</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-1.5 px-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(logo)}
                            className={`p-1 rounded-md transition-colors cursor-pointer ${
                              isDark 
                                ? 'bg-white/5 hover:bg-white/15 text-slate-300 hover:text-[#F7B425]' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-black'
                            }`}
                            title={tr('Edit Logo Kampus', 'Edit Campus Logo')}
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingLogo(logo)}
                            className="p-1 rounded-md text-rose-500 hover:bg-rose-500/15 transition-colors cursor-pointer"
                            title={tr('Hapus Logo Kampus', 'Delete Campus Logo')}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sortedLogos.length === 0 && (
        <div className={`p-8 text-center rounded-2xl border ${
          isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-slate-200'
        }`}>
          <Building2 className="w-9 h-9 text-slate-500 mx-auto mb-2 opacity-40" />
          <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {tr('Belum ada logo kampus', 'No campus logos added yet')}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {tr('Klik tombol "+ Tambah Logo Kampus" di atas untuk menambahkan logo baru.', 'Click "+ Add Campus Logo" above to add a new logo.')}
          </p>
        </div>
      )}

      {/* MODAL: Tambah / Edit Logo Kampus */}
      {isModalOpen && editingLogo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className={`w-full max-w-md rounded-2xl border p-4 sm:p-5 my-4 shadow-2xl relative transition-all ${
            isDark ? 'bg-[#161616] border-white/15 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3.5">
              <div className="w-7 h-7 rounded-lg bg-[#F7B425]/15 text-[#F7B425] flex items-center justify-center font-black">
                {editingLogo.id ? <Edit3 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </div>
              <h2 className="text-base sm:text-lg font-bold font-heading">
                {editingLogo.id 
                  ? tr('Edit Logo Kampus', 'Edit Campus Logo') 
                  : tr('Tambah Logo Kampus Baru', 'Add New Campus Logo')
                }
              </h2>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              {/* Nama Kampus */}
              <div>
                <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {tr('Nama Lengkap Universitas / Kampus *', 'Full University / Campus Name *')}
                </label>
                <input
                  type="text"
                  required
                  value={editingLogo.name}
                  onChange={(e) => setEditingLogo({ ...editingLogo, name: e.target.value })}
                  placeholder="Contoh: Universitas Airlangga / Harvard University"
                  className={`w-full px-3 py-1.5 sm:py-2 rounded-lg text-xs outline-none ${
                    isDark 
                      ? 'bg-[#222] text-white border border-white/10 focus:border-[#F7B425]' 
                      : 'bg-slate-50 text-slate-900 border border-slate-200 focus:border-[#F7B425]'
                  }`}
                />
              </div>

              {/* Short Name & Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {tr('Singkatan / Short Name', 'Short Name')}
                  </label>
                  <input
                    type="text"
                    value={editingLogo.shortName || ''}
                    onChange={(e) => setEditingLogo({ ...editingLogo, shortName: e.target.value })}
                    placeholder="Contoh: UNAIR, ITB, UI"
                    className={`w-full px-3 py-1.5 sm:py-2 rounded-lg text-xs outline-none ${
                      isDark 
                        ? 'bg-[#222] text-white border border-white/10 focus:border-[#F7B425]' 
                        : 'bg-slate-50 text-slate-900 border border-slate-200 focus:border-[#F7B425]'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {tr('Tagline / Slogan', 'Tagline / Slogan')}
                  </label>
                  <input
                    type="text"
                    value={editingLogo.tagline || ''}
                    onChange={(e) => setEditingLogo({ ...editingLogo, tagline: e.target.value })}
                    placeholder="Contoh: Excellence with Morality"
                    className={`w-full px-3 py-1.5 sm:py-2 rounded-lg text-xs outline-none ${
                      isDark 
                        ? 'bg-[#222] text-white border border-white/10 focus:border-[#F7B425]' 
                        : 'bg-slate-50 text-slate-900 border border-slate-200 focus:border-[#F7B425]'
                    }`}
                  />
                </div>
              </div>

              {/* Kategori & Negara */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {tr('Kategori', 'Category')}
                  </label>
                  <select
                    value={editingLogo.category}
                    onChange={(e) => setEditingLogo({ 
                      ...editingLogo, 
                      category: e.target.value as 'PTN / Dalam Negeri' | 'PTS / Swasta' | 'Luar Negeri / Internasional' 
                    })}
                    className={`w-full px-3 py-1.5 sm:py-2 rounded-lg text-xs outline-none cursor-pointer ${
                      isDark 
                        ? 'bg-[#222] text-white border border-white/10 focus:border-[#F7B425]' 
                        : 'bg-slate-50 text-slate-900 border border-slate-200 focus:border-[#F7B425]'
                    }`}
                  >
                    <option value="PTN / Dalam Negeri">PTN / Dalam Negeri</option>
                    <option value="PTS / Swasta">PTS / Swasta</option>
                    <option value="Luar Negeri / Internasional">Luar Negeri / Internasional</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {tr('Negara', 'Country')}
                  </label>
                  <input
                    type="text"
                    value={editingLogo.country}
                    onChange={(e) => setEditingLogo({ ...editingLogo, country: e.target.value })}
                    placeholder="Contoh: Indonesia, UK, Germany"
                    className={`w-full px-3 py-1.5 sm:py-2 rounded-lg text-xs outline-none ${
                      isDark 
                        ? 'bg-[#222] text-white border border-white/10 focus:border-[#F7B425]' 
                        : 'bg-slate-50 text-slate-900 border border-slate-200 focus:border-[#F7B425]'
                    }`}
                  />
                </div>
              </div>

              {/* Upload File Logo Kampus */}
              <div className="pt-1">
                <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  {tr('Upload File Logo Kampus', 'Upload Campus Logo File')}
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${
                    isDark 
                      ? 'border-white/20 hover:border-[#F7B425] bg-[#1a1a1a] hover:bg-[#202020]' 
                      : 'border-slate-300 hover:border-[#F7B425] bg-slate-50 hover:bg-amber-50/40'
                  }`}
                >
                  <Upload className="w-5 h-5 text-[#F7B425] mx-auto mb-1" />
                  <p className={`text-xs font-bold mb-0.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {tr('Klik untuk pilih logo dari perangkat', 'Click to select logo from device')}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    PNG, JPG, SVG, WebP (Maksimal 5MB)
                  </p>
                </div>
              </div>

              {/* LIVE PREVIEW BOX */}
              <div className="pt-1">
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {tr('Preview Tampilan Logo di Carousel', 'Live Preview in Carousel')}
                </span>
                <div className="w-full h-14 rounded-xl bg-white border border-slate-200 p-1.5 flex items-center justify-center shadow-xs">
                  <CampusLogoItem logo={editingLogo} />
                </div>
              </div>

              {/* Urutan & Status Aktif */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {tr('Nomor Urut', 'Order Number')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingLogo.order}
                    onChange={(e) => setEditingLogo({ ...editingLogo, order: parseInt(e.target.value) || 1 })}
                    className={`w-full px-3 py-1.5 sm:py-2 rounded-lg text-xs outline-none ${
                      isDark 
                        ? 'bg-[#222] text-white border border-white/10 focus:border-[#F7B425]' 
                        : 'bg-slate-50 text-slate-900 border border-slate-200 focus:border-[#F7B425]'
                    }`}
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-1.5 cursor-pointer pb-1.5">
                    <input
                      type="checkbox"
                      checked={editingLogo.isActive}
                      onChange={(e) => setEditingLogo({ ...editingLogo, isActive: e.target.checked })}
                      className="w-3.5 h-3.5 rounded text-[#F7B425] focus:ring-[#F7B425] accent-[#F7B425]"
                    />
                    <span className="text-xs font-bold">
                      {tr('Tampilkan di Beranda', 'Display on Landing')}
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    isDark ? 'bg-[#222] text-slate-300 hover:bg-[#2a2a2a]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tr('Batal', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#F7B425] hover:bg-[#ffbe33] text-black font-black text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="font-bold">{tr('Simpan Logo Kampus', 'Save Campus Logo')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus */}
      {deletingLogo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs">
          <div className={`w-full max-w-xs rounded-2xl border p-4 sm:p-5 shadow-2xl text-center ${
            isDark ? 'bg-[#161616] border-white/15 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <h3 className="font-extrabold text-base font-heading mb-1.5">
              {tr('Hapus Logo Kampus Ini?', 'Delete this Campus Logo?')}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {tr(
                `Apakah Anda yakin ingin menghapus logo kampus "${deletingLogo.name}"? Logo ini tidak akan muncul lagi di Carousel Beranda.`,
                `Are you sure you want to delete "${deletingLogo.name}"? It will no longer appear in the Landing Carousel.`
              )}
            </p>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeletingLogo(null)}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                  isDark ? 'bg-[#222] text-slate-300 hover:bg-[#2a2a2a]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tr('Batal', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{tr('Ya, Hapus', 'Yes, Delete')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
