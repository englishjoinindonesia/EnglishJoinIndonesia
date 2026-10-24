import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, Plus, Trash2, Edit2, Calendar, FileText, 
  Sparkles, CheckCircle2, AlertCircle, Loader2 
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const ProjectsTab: React.FC = () => {
  const { isDark } = useTheme();
  const { tr } = useLanguage();
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. LOAD USER'S DATA (SELECT from Supabase)
  const fetchProjects = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching projects from Supabase:', error.message);
        setErrorMessage(error.message);
      } else {
        setProjects(data || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Fetch error:', msg);
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  // Open modal for creating new project
  const handleOpenCreate = () => {
    setEditingProject(null);
    setNewTitle('');
    setNewDescription('');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  // Open modal for editing existing project
  const handleOpenEdit = (proj: Project) => {
    setEditingProject(proj);
    setNewTitle(proj.title);
    setNewDescription(proj.description || '');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    setNewTitle('');
    setNewDescription('');
    setErrorMessage(null);
  };

  // 2. CREATE & UPDATE ITEM (INSERT & UPDATE in Supabase)
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !user) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (editingProject) {
        // UPDATE ITEM
        const { data, error } = await supabase
          .from('projects')
          .update({
            title: newTitle.trim(),
            description: newDescription.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingProject.id)
          .select();

        if (error) {
          setErrorMessage(error.message);
        } else if (data && data.length > 0) {
          setProjects(projects.map((p) => (p.id === editingProject.id ? data[0] : p)));
          handleCloseModal();
          showToast(tr('Proyek berhasil diperbarui!', 'Project successfully updated!'));
        }
      } else {
        // CREATE ITEM
        const { data, error } = await supabase
          .from('projects')
          .insert([
            {
              title: newTitle.trim(),
              description: newDescription.trim() || null,
              user_id: user.id,
            },
          ])
          .select();

        if (error) {
          setErrorMessage(error.message);
        } else if (data && data.length > 0) {
          setProjects([data[0], ...projects]);
          handleCloseModal();
          showToast(tr('Proyek baru berhasil disimpan!', 'New project successfully saved!'));
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. DELETE ITEM (DELETE in Supabase)
  const handleDeleteProject = async (id: string, title: string) => {
    if (!confirm(tr(`Hapus proyek "${title}"?`, `Delete project "${title}"?`))) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) {
        alert(error.message);
      } else {
        setProjects(projects.filter((p) => p.id !== id));
        showToast(tr('Proyek berhasil dihapus.', 'Project deleted.'));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(msg);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#F7B425]" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F7B425]" />
            <h1 className={`text-2xl font-bold tracking-tight font-heading ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {tr('Proyek & Target Belajar Saya', 'My Projects & Learning Goals')}
            </h1>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {tr(
              'Ruang kerja pribadi yang tersimpan terisolasi per akun di Supabase Database.',
              'Personal workspace securely isolated per user account in Supabase Database.'
            )}
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-3.5 py-2 bg-[#F7B425] hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition-all shadow-md shadow-[#F7B425]/20 flex items-center gap-1.5 cursor-pointer active:scale-98 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{tr('Tambah Proyek Baru', 'New Project')}</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#F7B425]" />
          <span className="text-xs">{tr('Memuat proyek pribadi Anda...', 'Loading your private projects...')}</span>
        </div>
      ) : projects.length === 0 ? (
        <div className={`p-8 rounded-2xl border text-center ${
          isDark ? 'bg-[#141414] border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
        }`}>
          <FolderKanban className="w-10 h-10 mx-auto text-[#F7B425]/40 mb-3" />
          <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {tr('Belum ada proyek pribadi', 'No projects yet')}
          </h3>
          <p className="text-xs mt-1 max-w-md mx-auto">
            {tr(
              'Buat proyek belajar TOEFL atau target sertifikasi pribadi Anda. Hanya Anda yang dapat mengakses proyek ini.',
              'Create a TOEFL study project or personal certification goal. Only you can access your projects.'
            )}
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 bg-[#F7B425] hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{tr('Mulai Proyek Pertama', 'Start First Project')}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all group ${
                isDark 
                  ? 'bg-[#141414] border-white/10 hover:border-[#F7B425]/50' 
                  : 'bg-white border-slate-200/90 hover:border-[#F7B425]/60 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className={`font-bold text-sm line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {proj.title}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(proj)}
                      className="text-slate-400 hover:text-[#F7B425] p-1 rounded-lg transition-colors cursor-pointer"
                      title={tr('Edit Proyek', 'Edit Project')}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProject(proj.id, proj.title)}
                      className="text-slate-400 hover:text-rose-400 p-1 rounded-lg transition-colors cursor-pointer"
                      title={tr('Hapus Proyek', 'Delete Project')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className={`text-xs mt-1.5 line-clamp-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {proj.description || tr('Tidak ada deskripsi tambahan.', 'No description provided.')}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-inherit flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#F7B425]" />
                  <span>{new Date(proj.created_at).toLocaleDateString()}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F7B425]/15 text-[#F7B425] border border-[#F7B425]/30">
                  {tr('Pribadi', 'Private')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md rounded-2xl border p-5 sm:p-6 shadow-2xl ${
            isDark ? 'bg-[#141414] border-white/15 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h2 className="text-lg font-bold">
              {editingProject 
                ? tr('Edit Proyek', 'Edit Project') 
                : tr('Buat Proyek Baru', 'Create New Project')}
            </h2>
            <p className={`text-xs mt-1 mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {tr(
                'Proyek ini disimpan secara aman dan hanya dapat diakses oleh akun Anda.',
                'This project is stored securely and accessible only by your account.'
              )}
            </p>

            <form onSubmit={handleSaveProject} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold mb-1">
                  {tr('Nama / Judul Proyek', 'Project Title')} *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={tr('cth. Target TOEFL 600+ Beasiswa LPDP', 'e.g. Target TOEFL 600+ LPDP Scholarship')}
                  className="w-full bg-white/5 border border-white/15 focus:border-[#F7B425] rounded-xl py-2 px-3 text-xs sm:text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">
                  {tr('Deskripsi & Rencana', 'Description & Plan')}
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder={tr('Jadwal latihan harian, fokus section Structure dan Reading...', 'Daily study schedule, focus on Structure and Reading sections...')}
                  className="w-full bg-white/5 border border-white/15 focus:border-[#F7B425] rounded-xl py-2 px-3 text-xs sm:text-sm outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    isDark ? 'border-white/10 hover:bg-white/5 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {tr('Batal', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim()}
                  className="px-4 py-2 bg-[#F7B425] hover:bg-amber-400 disabled:opacity-50 text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {isSubmitting 
                    ? tr('Menyimpan...', 'Saving...') 
                    : editingProject 
                    ? tr('Perbarui Proyek', 'Update Project') 
                    : tr('Simpan Proyek', 'Save Project')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
