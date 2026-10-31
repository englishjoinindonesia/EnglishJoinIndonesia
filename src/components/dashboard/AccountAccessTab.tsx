import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, UserCheck, UserX, Clock, AlertCircle, Search, 
  Filter, CheckCircle2, XCircle, RotateCcw, Plus, Trash2,
  Mail, Phone, Shield, GraduationCap, Info, UserPlus, Check, X,
  ExternalLink, Sparkles
} from 'lucide-react';
import { AccountAccessRequest, AccountRequestStatus, UserRole } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { 
  PRIMARY_ADMIN_EMAIL, 
  getAccountAccessRequests, 
  approveAccountAccessRequest, 
  rejectAccountAccessRequest, 
  resetAccountAccessRequest, 
  deleteAccountAccessRequest, 
  addAccountAccessRequest,
  resetToDefaultAccountRequests,
  isPrimaryAdmin
} from '../../lib/accountAccessService';

export const AccountAccessTab: React.FC = () => {
  const { isDark } = useTheme();
  const { tr, language } = useLanguage();
  const { user } = useAuth();

  const [requests, setRequests] = useState<AccountAccessRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'admin' | 'student'>('all');
  
  // Modal states
  const [actionModal, setActionModal] = useState<{
    type: 'approve' | 'reject' | 'delete' | 'add' | null;
    request?: AccountAccessRequest;
  }>({ type: null });

  const [notesInput, setNotesInput] = useState('');
  
  // Add new modal form state
  const [newFormData, setNewFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    role: 'student' as UserRole,
    notes: '',
    instantApprove: false
  });

  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Load and subscribe to requests
  const refreshRequests = () => {
    setRequests(getAccountAccessRequests());
  };

  useEffect(() => {
    refreshRequests();

    const handleUpdate = () => refreshRequests();
    window.addEventListener('ej_account_requests_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('ej_account_requests_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Determine if current user or reviewer identity is Primary Admin
  const currentEmail = user?.email || PRIMARY_ADMIN_EMAIL;
  const isCurrentSuperAdmin = isPrimaryAdmin(currentEmail);

  // Filter requests
  const filteredRequests = requests.filter(req => {
    // Search filter
    const matchesSearch = 
      req.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.whatsapp && req.whatsapp.includes(searchTerm)) ||
      (req.notes && req.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // Tab filter
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return req.status === 'pending';
    if (statusFilter === 'approved') return req.status === 'approved';
    if (statusFilter === 'rejected') return req.status === 'rejected';
    if (statusFilter === 'admin') return req.role === 'admin';
    if (statusFilter === 'student') return req.role === 'student';
    return true;
  });

  // Summary counts
  const totalCount = requests.length;
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;
  const adminRequestsCount = requests.filter(r => r.role === 'admin').length;
  const studentRequestsCount = requests.filter(r => r.role === 'student').length;

  // Handle Approvals
  const handleConfirmApprove = () => {
    if (!actionModal.request) return;
    const reviewer = PRIMARY_ADMIN_EMAIL;
    approveAccountAccessRequest(
      actionModal.request.id, 
      reviewer, 
      notesInput.trim() || tr('Disetujui oleh Admin EJI Utama', 'Approved by Primary EJI Admin')
    );
    showNotification(tr(
      `Akun ${actionModal.request.name} (${actionModal.request.role}) berhasil DISETUJUI oleh Admin EJI!`,
      `Account ${actionModal.request.name} (${actionModal.request.role}) successfully APPROVED by Admin EJI!`
    ));
    setActionModal({ type: null });
    setNotesInput('');
    refreshRequests();
  };

  // Handle Rejection
  const handleConfirmReject = () => {
    if (!actionModal.request) return;
    const reviewer = PRIMARY_ADMIN_EMAIL;
    rejectAccountAccessRequest(
      actionModal.request.id, 
      reviewer, 
      notesInput.trim() || tr('Pendaftaran akun ditolak oleh Admin EJI', 'Registration rejected by Admin EJI')
    );
    showNotification(tr(
      `Permohonan akun ${actionModal.request.name} telah DITOLAK.`,
      `Account request for ${actionModal.request.name} has been REJECTED.`
    ));
    setActionModal({ type: null });
    setNotesInput('');
    refreshRequests();
  };

  // Handle Delete
  const handleConfirmDelete = () => {
    if (!actionModal.request) return;
    deleteAccountAccessRequest(actionModal.request.id);
    showNotification(tr('Data permohonan akses berhasil dihapus.', 'Access request record removed.'));
    setActionModal({ type: null });
    refreshRequests();
  };

  // Handle Quick Reset to Pending
  const handleResetStatus = (req: AccountAccessRequest) => {
    resetAccountAccessRequest(req.id);
    showNotification(tr(`Status akun ${req.name} dikembalikan ke MENUNGGU PERSETUJUAN.`, `Status for ${req.name} reset to PENDING.`));
    refreshRequests();
  };

  // Handle Add New Manual Request
  const handleAddNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormData.name || !newFormData.email) {
      alert(tr('Nama dan Email wajib diisi.', 'Name and Email are required.'));
      return;
    }

    const created = addAccountAccessRequest({
      name: newFormData.name,
      email: newFormData.email,
      whatsapp: newFormData.whatsapp,
      role: newFormData.role,
      notes: newFormData.notes
    });

    if (newFormData.instantApprove) {
      approveAccountAccessRequest(created.id, PRIMARY_ADMIN_EMAIL, 'Disetujui langsung oleh Admin EJI');
    }

    showNotification(tr('Permohonan akun baru berhasil ditambahkan!', 'New account access request added!'));
    setNewFormData({
      name: '',
      email: '',
      whatsapp: '',
      role: 'student',
      notes: '',
      instantApprove: false
    });
    setActionModal({ type: null });
    refreshRequests();
  };

  return (
    <div className="space-y-2.5 sm:space-y-3">
      {/* SUCCESS TOAST NOTIFICATION */}
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl border border-amber-500/40 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* COMPACT PRIMARY ADMIN AUTHORITY BAR */}
      <div 
        style={{ borderRadius: '12px' }}
        className={`p-2.5 sm:px-3.5 sm:py-2 rounded-xl border transition-colors ${
        isDark 
          ? 'bg-[#141414] border-white/10 shadow-sm' 
          : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#F7B425]/15 text-[#F7B425] flex items-center justify-center flex-shrink-0 font-bold shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#F7B425]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 
                  style={{ fontSize: '16px' }}
                  className={`text-base font-bold font-heading tracking-tight truncate ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {tr('Persetujuan Akses Akun: Admin & Student', 'Account Access Approval: Admin & Student')}
                </h2>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MINIMAL STATS METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
        {/* TOTAL */}
        <div 
          onClick={() => setStatusFilter('all')}
          className={`p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-all duration-150 hover:bg-slate-50/50 dark:hover:bg-white/5 ${
            isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-slate-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {tr('Total Permohonan', 'Total Requests')}
              </span>
            </div>
            <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black mt-1 font-heading">
            {totalCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
            <span className="font-bold">Admin: <strong>{adminRequestsCount}</strong></span>
            <span>•</span>
            <span className="font-bold">Student: <strong>{studentRequestsCount}</strong></span>
          </div>
        </div>

        {/* PENDING APPROVALS */}
        <div 
          onClick={() => setStatusFilter('pending')}
          className={`p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-all duration-150 hover:bg-amber-50/30 dark:hover:bg-amber-950/10 ${
            isDark 
              ? 'bg-amber-950/20 border-amber-500/30 text-amber-300' 
              : 'bg-amber-50/60 border-amber-200 text-amber-900 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block" />
              {tr('Menunggu', 'Pending')}
            </span>
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black mt-1 font-heading text-amber-600 dark:text-amber-400">
            {pendingCount}
          </div>
          <div className="text-[10px] font-normal text-[#90a1b9] mt-0.5 truncate">
            {tr('Perlu persetujuan Admin EJI', 'Needs Admin EJI approval')}
          </div>
        </div>

        {/* APPROVED */}
        <div 
          onClick={() => setStatusFilter('approved')}
          className={`p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-all duration-150 hover:bg-slate-50/50 dark:hover:bg-white/5 ${
            isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-slate-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              {tr('Disetujui', 'Approved')}
            </span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black mt-1 font-heading text-emerald-600 dark:text-emerald-400">
            {approvedCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {tr('Akun aktif & dapat login', 'Active accounts')}
          </div>
        </div>

        {/* REJECTED */}
        <div 
          onClick={() => setStatusFilter('rejected')}
          className={`p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-all duration-150 hover:bg-slate-50/50 dark:hover:bg-white/5 ${
            isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-slate-200 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              {tr('Ditolak', 'Rejected')}
            </span>
            <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <XCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black mt-1 font-heading text-rose-600 dark:text-rose-400">
            {rejectedCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {tr('Akses diblokir / ditolak', 'Access blocked')}
          </div>
        </div>
      </div>

      {/* COMPACT CONTROLS: SEARCH, SIMULATORS & FILTERS */}
      <div className={`p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 ${
        isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-slate-200 shadow-2xs'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          
          {/* SEARCH BAR */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={tr('Cari nama, email, whatsapp...', 'Search name, email, whatsapp...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs font-medium transition-colors outline-hidden border ${
                isDark 
                  ? 'bg-black/50 border-white/10 text-white placeholder-slate-500 focus:border-[#F7B425]' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#F7B425]'
              }`}
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActionModal({ type: 'add' })}
              style={{ borderRadius: '8px' }}
              className="px-3 py-1.5 rounded-lg text-xs font-black bg-[#F7B425] text-black hover:bg-[#ffc247] shadow-xs transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span className="font-bold">{tr('Tambah Manual', 'Add Manual')}</span>
            </button>

            {requests.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm(tr('Hapus semua permohonan yang ada di tabel ini?', 'Clear all requests in this table?'))) {
                    resetToDefaultAccountRequests();
                    showNotification(tr('Semua data permohonan telah dibersihkan.', 'All request records cleared.'));
                    refreshRequests();
                  }
                }}
                className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                  isDark 
                    ? 'border-white/10 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10' 
                    : 'border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                }`}
                title={tr('Bersihkan Semua Data Permohonan', 'Clear All Request Records')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* COMPACT FILTER PILLS */}
        <div className="flex flex-wrap items-center gap-1 mt-2 pt-2 border-t border-slate-100 dark:border-white/5">
          <span className="text-[10px] font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-2.5 h-2.5" />
            {tr('Filter:', 'Filter:')}
          </span>

          {[
            { id: 'all', label: tr('Semua', 'All'), count: totalCount },
            { id: 'pending', label: tr('Menunggu', 'Pending'), count: pendingCount, highlight: true },
            { id: 'admin', label: tr('Admin', 'Admin'), count: adminRequestsCount },
            { id: 'student', label: tr('Student', 'Student'), count: studentRequestsCount },
            { id: 'approved', label: tr('Disetujui', 'Approved'), count: approvedCount },
            { id: 'rejected', label: tr('Ditolak', 'Rejected'), count: rejectedCount },
          ].map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-[#F7B425] text-black shadow-2xs font-black'
                    : isDark
                      ? 'bg-white/5 hover:bg-white/10 text-slate-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                } ${tab.highlight && !isSelected && tab.count > 0 ? 'border border-amber-500/40 text-amber-500' : ''}`}
              >
                <span>{tab.label}</span>
                <span className={`px-1 py-0 rounded text-[9px] font-extrabold ${
                  isSelected 
                    ? 'bg-black/20 text-black' 
                    : isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-800'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MINIMAL REQUESTS TABLE */}
      <div className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
        isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-slate-200 shadow-2xs'
      }`}>
        <div className="px-3 py-2 sm:px-3.5 sm:py-2.5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-bold text-xs sm:text-sm">
              {tr('Daftar Permohonan Registrasi Akun', 'Account Registration Requests')}
            </h3>
            <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-bold">
              {filteredRequests.length}
            </span>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="py-12 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-[#F7B425] flex items-center justify-center mx-auto mb-3 border border-amber-500/20">
              <UserCheck className="w-6 h-6" />
            </div>
            <h4 
              style={{ color: '#ffffff' }}
              className="text-sm font-bold text-white"
            >
              {searchTerm || statusFilter !== 'all'
                ? tr('Tidak ada data permohonan yang sesuai kriteria.', 'No requests match the selected criteria.')
                : tr('Belum Ada Permohonan Akses Akun', 'No Account Access Requests Yet')}
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? tr('Coba ubah kata kunci pencarian atau ganti filter status.', 'Try changing your search term or filter.')
                : tr('Data seeding dummy telah dibersihkan. Setiap calon pendaftar atau akun baru yang membutuhkan persetujuan akan masuk ke daftar ini secara langsung.', 'Dummy seed data has been removed. Any new account applicants requiring approval will appear here in real-time.')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b text-[10px] uppercase tracking-wider font-extrabold ${
                  isDark ? 'border-white/10 bg-white/2 text-slate-400' : 'border-slate-100 bg-slate-50/80 text-slate-500'
                }`}>
                  <th className="py-2 px-3">{tr('Pengaju & Kontak', 'Applicant & Contact')}</th>
                  <th className="py-2 px-2.5">{tr('Peran', 'Role')}</th>
                  <th className="py-2 px-2.5">{tr('Waktu', 'Time')}</th>
                  <th className="py-2 px-2.5">{tr('Status', 'Status')}</th>
                  <th className="py-2 px-2.5">{tr('Persetujuan / Catatan', 'Review / Notes')}</th>
                  <th className="py-2 px-3 text-right">{tr('Aksi', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredRequests.map((req, idx) => {
                  const isPrimary = isPrimaryAdmin(req.email);
                  const isPending = req.status === 'pending';
                  const isApproved = req.status === 'approved';
                  const isRejected = req.status === 'rejected';

                  return (
                    <tr 
                      key={`${req.id}-${req.email}-${idx}`}
                      className={`transition-colors ${
                        isPending 
                          ? isDark ? 'bg-amber-950/10 hover:bg-amber-950/20' : 'bg-amber-50/40 hover:bg-amber-50/70' 
                          : isDark ? 'hover:bg-white/3' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* APPLICANT INFO */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] flex-shrink-0 ${
                            req.role === 'admin'
                              ? 'bg-[#F7B425] text-black shadow-2xs'
                              : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                          }`}>
                            {req.role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-[#F7B425]">
                                {req.name}
                              </span>
                              {isPrimary && (
                                <span className="text-[8px] font-bold uppercase px-1.5 py-0.2 rounded-sm bg-[#F7B425] text-black">
                                  ADMIN UTAMA EJI
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.2">
                              <span className="flex items-center gap-1 font-mono">
                                <Mail className="w-2.5 h-2.5 text-slate-400" />
                                <span>{req.email}</span>
                              </span>
                              {req.whatsapp && req.whatsapp !== '-' && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 text-emerald-500 font-sans">
                                    <Phone className="w-2.5 h-2.5" />
                                    <span>{req.whatsapp}</span>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ROLE */}
                      <td className="py-2 px-2.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          req.role === 'admin'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                        }`}>
                          {req.role === 'admin' ? (
                            <>
                              <Shield className="w-2.5 h-2.5" />
                              <span>Admin</span>
                            </>
                          ) : (
                            <>
                              <GraduationCap className="w-2.5 h-2.5" />
                              <span>Student</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* REQUESTED DATE */}
                      <td className="py-2 px-2.5 whitespace-nowrap text-[11px] text-slate-500 dark:text-slate-400">
                        {req.requestedAt}
                      </td>

                      {/* STATUS */}
                      <td className="py-2 px-2.5 whitespace-nowrap">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{tr('Menunggu', 'Pending')}</span>
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>{tr('Disetujui', 'Approved')}</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                            <XCircle className="w-2.5 h-2.5" />
                            <span>{tr('Ditolak', 'Rejected')}</span>
                          </span>
                        )}
                      </td>

                      {/* REVIEW INFO / NOTES */}
                      <td className="py-2 px-2.5 max-w-[200px]">
                        {req.reviewedBy ? (
                          <div className="text-[10px]">
                            <div className="font-semibold text-slate-700 dark:text-slate-300 truncate" title={req.reviewedBy}>
                              Oleh: <strong className="text-[#F7B425] font-bold">{req.reviewedBy}</strong>
                            </div>
                            {req.notes && (
                              <div className="text-[10px] text-slate-400 italic truncate" title={req.notes}>
                                "{req.notes}"
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 truncate">
                            {req.notes || tr('Belum ditinjau', 'Not reviewed')}
                          </div>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* APPROVE BUTTON */}
                          {req.status !== 'approved' && (
                            <button
                              onClick={() => {
                                setActionModal({ type: 'approve', request: req });
                                setNotesInput(`Disetujui oleh Admin EJI (${PRIMARY_ADMIN_EMAIL})`);
                              }}
                              className="px-2 py-1 rounded-lg text-[11px] font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                              title={tr('Setujui akun ini sebagai Admin EJI', 'Approve this account as Admin EJI')}
                            >
                              <Check className="w-3 h-3" />
                              <span>{tr('Setujui', 'Approve')}</span>
                            </button>
                          )}

                          {/* REJECT BUTTON */}
                          {req.status !== 'rejected' && !isPrimary && (
                            <button
                              onClick={() => {
                                setActionModal({ type: 'reject', request: req });
                                setNotesInput('Tidak memenuhi kriteria / permohonan ditolak');
                              }}
                              className="px-2 py-1 rounded-lg text-[11px] font-bold bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-500/20 transition-all flex items-center gap-1 cursor-pointer"
                              title={tr('Tolak permohonan akun ini', 'Reject this account request')}
                            >
                              <X className="w-3 h-3" />
                              <span>{tr('Tolak', 'Reject')}</span>
                            </button>
                          )}

                          {/* RESET BUTTON */}
                          {(req.status === 'approved' || req.status === 'rejected') && !isPrimary && (
                            <button
                              onClick={() => handleResetStatus(req)}
                              className={`p-1 rounded-lg border transition-all cursor-pointer ${
                                isDark ? 'border-white/10 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-black'
                              }`}
                              title={tr('Kembalikan ke status Menunggu', 'Reset back to Pending')}
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          )}

                          {/* DELETE BUTTON */}
                          {!isPrimary && (
                            <button
                              onClick={() => setActionModal({ type: 'delete', request: req })}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                              title={tr('Hapus catatan', 'Delete record')}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: APPROVE CONFIRMATION */}
      {/* ========================================================================= */}
      {actionModal.type === 'approve' && actionModal.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-2xs">
          <div className={`w-full max-w-sm p-4 sm:p-5 rounded-2xl border shadow-xl animate-in zoom-in-95 duration-150 ${
            isDark ? 'bg-[#181818] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>

            <h3 className="text-base font-black font-heading">
              {tr('Setujui Akses Akun', 'Approve Account Access')}
            </h3>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {tr('Berikan persetujuan akses aplikasi kepada:', 'Grant application access to:')}
            </p>

            <div className={`my-3 p-2.5 rounded-xl border ${
              isDark ? 'bg-black/40 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-xs font-extrabold">{actionModal.request.name}</div>
              <div className="text-[11px] font-mono text-slate-400">{actionModal.request.email}</div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-[#F7B425] text-black">
                  {actionModal.request.role.toUpperCase()}
                </span>
                <span className="text-[10px] text-slate-500">
                  {tr('Penyetuju:', 'Approver:')} <strong className="text-emerald-500">{PRIMARY_ADMIN_EMAIL}</strong>
                </span>
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-[11px] font-bold mb-1 text-slate-400">
                {tr('Catatan Tambahan (Opsional):', 'Optional Notes:')}
              </label>
              <input
                type="text"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder={tr('Contoh: Verifikasi berkas lulus', 'e.g. Verification passed')}
                className={`w-full px-3 py-1.5 rounded-lg text-xs outline-hidden border ${
                  isDark ? 'bg-black/50 border-white/10 text-white focus:border-emerald-500' : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                }`}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActionModal({ type: null })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {tr('Batal', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                className="px-3.5 py-1.5 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{tr('Setujui Akun', 'Approve Account')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REJECT CONFIRMATION */}
      {/* ========================================================================= */}
      {actionModal.type === 'reject' && actionModal.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-2xs">
          <div className={`w-full max-w-sm p-4 sm:p-5 rounded-2xl border shadow-xl animate-in zoom-in-95 duration-150 ${
            isDark ? 'bg-[#181818] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center mb-3">
              <XCircle className="w-5 h-5" />
            </div>

            <h3 className="text-base font-black font-heading">
              {tr('Tolak Permohonan Akses', 'Reject Account Access')}
            </h3>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {tr('Tolak permohonan akses untuk:', 'Reject request for:')}
            </p>

            <div className={`my-3 p-2.5 rounded-xl border ${
              isDark ? 'bg-black/40 border-white/10' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-xs font-extrabold">{actionModal.request.name}</div>
              <div className="text-[11px] font-mono text-slate-400">{actionModal.request.email}</div>
              <div className="mt-1 text-[10px] text-rose-500 font-semibold">
                {tr('Peran diminta:', 'Requested role:')} {actionModal.request.role.toUpperCase()}
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-[11px] font-bold mb-1 text-slate-400">
                {tr('Alasan Penolakan:', 'Reason for Rejection:')}
              </label>
              <textarea
                rows={2}
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder={tr('Tuliskan alasan penolakan...', 'Enter reason...')}
                className={`w-full px-3 py-1.5 rounded-lg text-xs outline-hidden border resize-none ${
                  isDark ? 'bg-black/50 border-white/10 text-white focus:border-rose-500' : 'bg-white border-slate-200 text-slate-900 focus:border-rose-500'
                }`}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActionModal({ type: null })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {tr('Batal', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-3.5 py-1.5 rounded-lg text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-xs cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>{tr('Tolak Akun', 'Reject Account')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DELETE CONFIRMATION */}
      {/* ========================================================================= */}
      {actionModal.type === 'delete' && actionModal.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-2xs">
          <div className={`w-full max-w-xs p-4 sm:p-5 rounded-2xl border shadow-xl animate-in zoom-in-95 duration-150 ${
            isDark ? 'bg-[#181818] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center mb-2.5">
              <Trash2 className="w-4 h-4" />
            </div>

            <h3 className="text-sm font-black font-heading">
              {tr('Hapus Catatan Permohonan?', 'Delete Request Record?')}
            </h3>

            <p className="text-xs text-slate-400 mt-1.5">
              {tr('Hapus arsip pendaftaran untuk', 'Remove registration record for')}{' '}
              <strong className="text-white dark:text-white">{actionModal.request.name}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setActionModal({ type: null })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {tr('Batal', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded-lg text-xs font-black bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
              >
                {tr('Hapus', 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADD NEW MANUAL REQUEST */}
      {/* ========================================================================= */}
      {actionModal.type === 'add' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-2xs">
          <div className={`w-full max-w-md p-4 sm:p-5 rounded-2xl border shadow-xl animate-in zoom-in-95 duration-150 ${
            isDark ? 'bg-[#181818] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#F7B425] text-black flex items-center justify-center font-black">
                  <UserPlus className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-sm">
                    {tr('Tambah Permohonan Akun Manual', 'Add Manual Account Request')}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {tr('Daftarkan akun Admin atau Student untuk diproses persetujuan', 'Register an Admin or Student account for approval')}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActionModal({ type: null })}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewSubmit} className="space-y-2.5 mt-3">
              <div>
                <label className="block text-[11px] font-bold mb-1 text-slate-600 dark:text-slate-300">
                  {tr('Nama Lengkap', 'Full Name')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Farhan"
                  value={newFormData.name}
                  onChange={(e) => setNewFormData({ ...newFormData, name: e.target.value })}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-hidden ${
                    isDark ? 'bg-black/50 border-white/10 text-white focus:border-[#F7B425]' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#F7B425]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold mb-1 text-slate-600 dark:text-slate-300">
                    {tr('Alamat Email', 'Email Address')} *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={newFormData.email}
                    onChange={(e) => setNewFormData({ ...newFormData, email: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-hidden ${
                      isDark ? 'bg-black/50 border-white/10 text-white focus:border-[#F7B425]' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#F7B425]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1 text-slate-600 dark:text-slate-300">
                    {tr('No. WhatsApp', 'WhatsApp Number')}
                  </label>
                  <input
                    type="tel"
                    placeholder="0812xxxxxxxx"
                    value={newFormData.whatsapp}
                    onChange={(e) => setNewFormData({ ...newFormData, whatsapp: e.target.value })}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-hidden ${
                      isDark ? 'bg-black/50 border-white/10 text-white focus:border-[#F7B425]' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#F7B425]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1 text-slate-600 dark:text-slate-300">
                  {tr('Peran Akun Diminta', 'Requested Role')} *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewFormData({ ...newFormData, role: 'admin' })}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                      newFormData.role === 'admin'
                        ? 'border-[#F7B425] bg-amber-500/10 text-[#F7B425] font-black'
                        : isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-[#F7B425]" />
                    <div>
                      <div className="text-xs font-bold">Admin</div>
                      <div className="text-[9px] text-slate-400">Pengajar & Staf EJI</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewFormData({ ...newFormData, role: 'student' })}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                      newFormData.role === 'student'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-500 font-black'
                        : isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                    <div>
                      <div className="text-xs font-bold">Student</div>
                      <div className="text-[9px] text-slate-400">Peserta Test TOEFL</div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1 text-slate-600 dark:text-slate-300">
                  {tr('Catatan (Opsional)', 'Notes (Optional)')}
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Peserta batch 2026"
                  value={newFormData.notes}
                  onChange={(e) => setNewFormData({ ...newFormData, notes: e.target.value })}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-hidden ${
                    isDark ? 'bg-black/50 border-white/10 text-white focus:border-[#F7B425]' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#F7B425]'
                  }`}
                />
              </div>

              <div className={`p-2 rounded-xl border flex items-center gap-2 ${
                isDark ? 'bg-white/2 border-white/10' : 'bg-slate-50 border-slate-200'
              }`}>
                <input
                  type="checkbox"
                  id="instantApproveCheck"
                  checked={newFormData.instantApprove}
                  onChange={(e) => setNewFormData({ ...newFormData, instantApprove: e.target.checked })}
                  className="w-3.5 h-3.5 rounded accent-[#F7B425] cursor-pointer"
                />
                <label htmlFor="instantApproveCheck" className="text-[11px] font-semibold cursor-pointer select-none">
                  {tr('Langsung setujui akun sekarang sebagai Admin EJI', 'Immediately approve this account as Admin EJI')}
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1.5">
                <button
                  type="button"
                  onClick={() => setActionModal({ type: null })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {tr('Batal', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-black bg-[#F7B425] text-black hover:bg-[#ffc247] shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{tr('Simpan', 'Save')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
