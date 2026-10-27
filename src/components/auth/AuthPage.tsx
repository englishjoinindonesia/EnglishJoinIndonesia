import React, { useState, useEffect } from 'react';
import { 
  Lock, Mail, User, ShieldCheck, ArrowRight, ArrowLeft, 
  Sparkles, CheckCircle2, Eye, EyeOff, Award, BookOpen, AlertCircle, KeyRound, Phone
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { LanguageToggle } from '../common/LanguageToggle';
import { UserRole } from '../../types';
import { usePrograms } from '../../context/ProgramsContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { 
  PRIMARY_ADMIN_EMAIL, 
  addAccountAccessRequest, 
  checkAccountApprovalStatus 
} from '../../lib/accountAccessService';

export type AuthMode = 'sign-in' | 'sign-up' | 'forgot-password' | 'update-password';

interface AuthPageProps {
  initialMode?: AuthMode;
  onNavigate: (path: string) => void;
  onSuccessRedirect?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ 
  initialMode = 'sign-in', 
  onNavigate,
  onSuccessRedirect
}) => {
  const { landingPrograms } = usePrograms();
  const { language, tr } = useLanguage();
  const { signIn, signUp, resetPasswordForEmail, updateUserPassword } = useAuth();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [initialMode]);

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    onNavigate(`/${newMode}`);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage(tr('Email dan kata sandi wajib diisi.', 'Email and password are required.'));
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const isPrimary = cleanEmail === PRIMARY_ADMIN_EMAIL.toLowerCase();
    const approvalStatus = checkAccountApprovalStatus(cleanEmail);

    // Enforce approval requirement by primary admin
    if (!isPrimary && approvalStatus === 'pending') {
      setErrorMessage(tr(
        `Akun Anda sedang MENUNGGU PERSETUJUAN dari Admin Utama EJI (${PRIMARY_ADMIN_EMAIL}). Silakan hubungi admin atau tunggu hingga akun Anda disetujui untuk dapat masuk.`,
        `Your account is PENDING APPROVAL by Primary Admin EJI (${PRIMARY_ADMIN_EMAIL}). Please contact admin or wait until access is approved.`
      ));
      return;
    }

    if (!isPrimary && approvalStatus === 'rejected') {
      setErrorMessage(tr(
        `Permohonan akses akun Anda DITOLAK oleh Admin EJI. Silakan hubungi ${PRIMARY_ADMIN_EMAIL} jika ada pertanyaan.`,
        `Your account request has been REJECTED by Admin EJI. Please contact ${PRIMARY_ADMIN_EMAIL} for inquiry.`
      ));
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage(tr('Email atau kata sandi tidak valid. Silakan coba lagi.', 'Invalid email or password. Please try again.'));
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMessage(tr('Email belum dikonfirmasi. Silakan periksa inbox email Anda.', 'Email not confirmed yet. Please verify via your inbox.'));
        } else {
          setErrorMessage(error.message);
        }
      } else {
        if (onSuccessRedirect) {
          onSuccessRedirect();
        } else {
          onNavigate('/dashboard');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage(tr('Email dan kata sandi wajib diisi.', 'Email and password are required.'));
      return;
    }

    if (selectedRole === 'student' && !whatsapp.trim()) {
      setErrorMessage(tr('Nomor WhatsApp wajib diisi untuk peran Siswa/Student.', 'WhatsApp number is required for Student role.'));
      return;
    }

    if (password.length < 6) {
      setErrorMessage(tr('Kata sandi minimal 6 karakter.', 'Password must be at least 6 characters.'));
      return;
    }

    setIsLoading(true);
    try {
      // 1. Submit signup to auth
      const { session, error } = await signUp(email, password, fullName, selectedRole, whatsapp.trim());
      if (error) {
        setErrorMessage(error.message);
      } else {
        const cleanEmail = email.trim().toLowerCase();
        const isPrimary = cleanEmail === PRIMARY_ADMIN_EMAIL.toLowerCase();

        // 2. Register account access request for Admin EJI approval
        addAccountAccessRequest({
          name: fullName.trim() || (selectedRole === 'admin' ? 'Pendaftar Admin Baru' : 'Pendaftar Student Baru'),
          email: cleanEmail,
          whatsapp: whatsapp.trim(),
          role: selectedRole,
          notes: `Pendaftaran ${selectedRole} baru via portal registrasi`
        });

        // 3. If student role, also queue into local directory
        if (selectedRole === 'student') {
          try {
            const existingRaw = localStorage.getItem('ej_registered_students');
            const existingList = existingRaw ? JSON.parse(existingRaw) : [];
            const newRecord = {
              id: `STD-2026-${String(existingList.length + 7).padStart(3, '0')}`,
              name: fullName || 'Siswa Baru',
              whatsapp: whatsapp.trim(),
              email: cleanEmail,
              programName: 'TOEFL ITP Prediction Test (Online)',
              registrationDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
              testScore: null,
              listeningScore: null,
              structureScore: null,
              readingScore: null,
              paymentStatus: 'Paid' as const,
              status: 'Sedang Ujian' as const
            };
            localStorage.setItem('ej_registered_students', JSON.stringify([newRecord, ...existingList]));
            window.dispatchEvent(new Event('storage'));
          } catch (e) {
            console.warn('Error saving student to directory', e);
          }
        }

        // 4. Handle response & feedback
        if (isPrimary) {
          setSuccessMessage(tr('Akun Admin Utama EJI berhasil didaftarkan! Mengalihkan ke dashboard...', 'Primary Admin EJI account registered! Redirecting...'));
          setTimeout(() => {
            if (onSuccessRedirect) onSuccessRedirect();
            else onNavigate('/dashboard');
          }, 800);
        } else {
          // Account registered and sent for Admin EJI approval
          setSuccessMessage(tr(
            `Pendaftaran berhasil! Akun ${selectedRole === 'admin' ? 'Admin' : 'Student'} Anda kini berstatus MENUNGGU PERSETUJUAN dari Admin Utama (Admin EJI: ${PRIMARY_ADMIN_EMAIL}). Anda akan dapat login setelah permohonan disetujui.`,
            `Sign up successful! Your ${selectedRole === 'admin' ? 'Admin' : 'Student'} account is now PENDING APPROVAL by Primary Admin (Admin EJI: ${PRIMARY_ADMIN_EMAIL}). You may log in once approved.`
          ));
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email) {
      setErrorMessage(tr('Silakan masukkan alamat email Anda.', 'Please enter your email address.'));
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await resetPasswordForEmail(email);
      if (error) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage(tr(
          'Tautan pemulihan kata sandi telah dikirim ke email Anda! Silakan periksa kotak masuk atau spam.',
          'Password reset link has been sent to your email! Please check your inbox or spam.'
        ));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!password) {
      setErrorMessage(tr('Silakan masukkan kata sandi baru.', 'Please enter a new password.'));
      return;
    }

    if (password.length < 6) {
      setErrorMessage(tr('Kata sandi minimal 6 karakter.', 'Password must be at least 6 characters.'));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(tr('Konfirmasi kata sandi tidak cocok.', 'Passwords do not match.'));
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await updateUserPassword(password);
      if (error) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage(tr('Kata sandi berhasil diperbarui! Mengalihkan...', 'Password updated successfully! Redirecting...'));
        setTimeout(() => {
          if (onSuccessRedirect) onSuccessRedirect();
          else onNavigate('/dashboard');
        }, 1000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-100 font-sans selection:bg-[#F7B425] selection:text-black flex flex-col justify-between relative overflow-hidden">
      
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-[#F7B425]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-[#F7B425]/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="border-b border-white/10 bg-[#0A0A0A]/90 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xl shadow-black/40">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2 cursor-pointer bg-transparent border-0 p-0 text-left"
          >
            <Logo size="sm" />
          </button>
          <div className="hidden sm:block border-l border-white/15 pl-3">
            <span className="text-[11px] font-bold text-[#F7B425] uppercase tracking-wider block">
              {mode === 'sign-up' 
                ? (language === 'id' ? 'Daftar Akun Baru' : 'Create New Account')
                : mode === 'forgot-password'
                  ? (language === 'id' ? 'Reset Kata Sandi' : 'Reset Password')
                  : mode === 'update-password'
                    ? (language === 'id' ? 'Perbarui Kata Sandi' : 'Update Password')
                    : (language === 'id' ? 'Portal Login & TOEFL Dashboard' : 'Login Portal & TOEFL Dashboard')
              }
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageToggle size="sm" />

          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-black hover:bg-[#F7B425] bg-white/5 px-3.5 sm:px-4 py-2 rounded-full border border-white/10 hover:border-[#F7B425] transition-all duration-300 shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden xs:inline">{language === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}</span>
          </button>
        </div>
      </header>

      {/* Main Login / Register Layout */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start relative z-10">
        
        {/* LEFT COLUMN: AUTH CARD (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-[#141414]/90 border border-white/15 hover:border-[#F7B425]/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden transition-all duration-300">
          
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#F7B425]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            
            {/* Header Title inside card */}
            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#F7B425]/15 text-[#F7B425] border border-[#F7B425]/30 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#F7B425]" />
                <span>
                  {mode === 'sign-up' 
                    ? tr('Registrasi Akun Baru', 'New Account Registration')
                    : mode === 'forgot-password'
                      ? tr('Pemulihan Kata Sandi', 'Password Recovery')
                      : mode === 'update-password'
                        ? tr('Setel Kata Sandi Baru', 'Set New Password')
                        : tr('Autentikasi Terenkripsi', 'Encrypted Authentication')
                  }
                </span>
              </span>

              <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-white">
                {mode === 'sign-up'
                  ? tr('Buat Akun Anda', 'Create Your Account')
                  : mode === 'forgot-password'
                    ? tr('Lupa Kata Sandi?', 'Forgot Password?')
                    : mode === 'update-password'
                      ? tr('Buat Kata Sandi Baru', 'Set New Password')
                      : tr('Selamat Datang Kembali', 'Welcome Back')
                }
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                {mode === 'sign-up'
                  ? tr('Daftarkan akun email Anda untuk mengakses simulasi tes dan sertifikat resmi.', 'Register your email to access test simulations and official certificates.')
                  : mode === 'forgot-password'
                    ? tr('Masukkan email Anda untuk menerima tautan instruksi reset kata sandi.', 'Enter your email to receive password reset instructions.')
                    : mode === 'update-password'
                      ? tr('Masukkan kata sandi baru untuk akun Supabase Anda.', 'Enter a new password for your account.')
                      : tr('Masuk dengan akun email dan kata sandi Anda untuk mengakses dashboard.', 'Sign in with your email and password to access your dashboard.')
                }
              </p>
            </div>

            {/* Error Message Banner */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Success Message Banner */}
            {successMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{successMessage}</span>
              </div>
            )}

            {/* 1. SIGN IN FORM */}
            {mode === 'sign-in' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {tr('Alamat Email', 'Email Address')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full bg-white/5 border border-white/15 focus:border-[#F7B425] focus:bg-white/10 text-white rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm transition-all outline-none font-medium placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      {tr('Kata Sandi', 'Password')}
                    </label>
                    <button
                      type="button"
                      onClick={() => handleModeChange('forgot-password')}
                      className="text-[11px] text-[#F7B425] hover:underline cursor-pointer bg-transparent border-0"
                    >
                      {tr('Lupa kata sandi?', 'Forgot password?')}
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/15 focus:border-[#F7B425] focus:bg-white/10 text-white rounded-xl py-2.5 pl-10 pr-10 text-xs sm:text-sm transition-all outline-none font-mono placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer bg-transparent border-0"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#F7B425] hover:bg-[#ffbe33] disabled:opacity-60 text-black font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-[#F7B425]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98 mt-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{tr('Masuk ke Akun', 'Sign In to Account')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-4 border-t border-white/10 text-center">
                  <p className="text-xs text-slate-400">
                    {tr('Belum memiliki akun?', "Don't have an account?")}{' '}
                    <button
                      type="button"
                      onClick={() => handleModeChange('sign-up')}
                      className="font-bold text-[#F7B425] hover:underline cursor-pointer bg-transparent border-0"
                    >
                      {tr('Daftar Sekarang', 'Sign Up Now')}
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* 2. SIGN UP FORM */}
            {mode === 'sign-up' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {tr('Nama Lengkap', 'Full Name')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nama Lengkap Anda"
                      className="w-full bg-white/5 border border-white/15 focus:border-[#F7B425] focus:bg-white/10 text-white rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm transition-all outline-none font-medium placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {tr('Alamat Email', 'Email Address')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full bg-white/5 border border-white/15 focus:border-[#F7B425] focus:bg-white/10 text-white rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm transition-all outline-none font-medium placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {tr('Kata Sandi (min. 6 karakter)', 'Password (min. 6 characters)')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/15 focus:border-[#F7B425] focus:bg-white/10 text-white rounded-xl py-2.5 pl-10 pr-10 text-xs sm:text-sm transition-all outline-none font-mono placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer bg-transparent border-0"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {tr('Peran Akun', 'Account Role')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('student')}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        selectedRole === 'student'
                          ? 'bg-[#F7B425] text-black border-[#F7B425]'
                          : 'bg-white/5 text-slate-300 border-white/15 hover:bg-white/10'
                      }`}
                    >
                      {tr('Siswa / Student', 'Student')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('admin')}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        selectedRole === 'admin'
                          ? 'bg-[#F7B425] text-black border-[#F7B425]'
                          : 'bg-white/5 text-slate-300 border-white/15 hover:bg-white/10'
                      }`}
                    >
                      {tr('Admin Akademik', 'Admin')}
                    </button>
                  </div>
                </div>

                {/* Form Nomor WhatsApp khusus peran Siswa/Student */}
                {selectedRole === 'student' && (
                  <div className="animate-fadeIn">
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      {tr('Nomor WhatsApp', 'WhatsApp Number')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        required
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="081234567890"
                        className="w-full bg-white/5 border border-white/15 focus:border-[#F7B425] focus:bg-white/10 text-white rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm transition-all outline-none font-medium placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#F7B425] hover:bg-[#ffbe33] disabled:opacity-60 text-black font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-[#F7B425]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98 mt-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{tr('Daftar Akun Baru', 'Create Account')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-4 border-t border-white/10 text-center">
                  <p className="text-xs text-slate-400">
                    {tr('Sudah memiliki akun?', 'Already have an account?')}{' '}
                    <button
                      type="button"
                      onClick={() => handleModeChange('sign-in')}
                      className="font-bold text-[#F7B425] hover:underline cursor-pointer bg-transparent border-0"
                    >
                      {tr('Masuk di Sini', 'Sign In here')}
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* 3. FORGOT PASSWORD FORM */}
            {mode === 'forgot-password' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {tr('Alamat Email Terdaftar', 'Registered Email Address')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full bg-white/5 border border-white/15 focus:border-[#F7B425] focus:bg-white/10 text-white rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm transition-all outline-none font-medium placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#F7B425] hover:bg-[#ffbe33] disabled:opacity-60 text-black font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-[#F7B425]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98 mt-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>{tr('Kirim Link Reset Password', 'Send Reset Password Link')}</span>
                    </>
                  )}
                </button>

                <div className="pt-4 border-t border-white/10 text-center">
                  <p className="text-xs text-slate-400">
                    <button
                      type="button"
                      onClick={() => handleModeChange('sign-in')}
                      className="font-bold text-[#F7B425] hover:underline cursor-pointer bg-transparent border-0"
                    >
                      ← {tr('Kembali ke Halaman Masuk', 'Back to Sign In')}
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* 4. UPDATE PASSWORD FORM */}
            {mode === 'update-password' && (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {tr('Kata Sandi Baru', 'New Password')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/15 focus:border-[#F7B425] focus:bg-white/10 text-white rounded-xl py-2.5 pl-10 pr-10 text-xs sm:text-sm transition-all outline-none font-mono placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer bg-transparent border-0"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {tr('Konfirmasi Kata Sandi Baru', 'Confirm New Password')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/15 focus:border-[#F7B425] focus:bg-white/10 text-white rounded-xl py-2.5 pl-10 pr-10 text-xs sm:text-sm transition-all outline-none font-mono placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#F7B425] hover:bg-[#ffbe33] disabled:opacity-60 text-black font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-[#F7B425]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98 mt-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{tr('Simpan Kata Sandi Baru', 'Save New Password')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-4 border-t border-white/10 text-center">
                  <p className="text-xs text-slate-400">
                    <button
                      type="button"
                      onClick={() => handleModeChange('sign-in')}
                      className="font-bold text-[#F7B425] hover:underline cursor-pointer bg-transparent border-0"
                    >
                      ← {tr('Kembali ke Halaman Masuk', 'Back to Sign In')}
                    </button>
                  </p>
                </div>
              </form>
            )}

          </div>
        </div>

        {/* RIGHT COLUMN: BENEFITS & STATISTICS (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-2xl font-black text-[#F7B425] font-mono">1,548+</span>
              <p className="text-xs text-slate-400 mt-1">{tr('Siswa Terdaftar', 'Registered Students')}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-2xl font-black text-emerald-400 font-mono">535.4</span>
              <p className="text-xs text-slate-400 mt-1">{tr('Rata-rata Skor TOEFL', 'Average TOEFL Score')}</p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-[#F7B425]" />
              <span>{tr('Akses Layanan TOEFL Resmi English Join', 'Official TOEFL Service Access')}</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#F7B425] shrink-0" />
                <span>{tr('Simulasi Ujian TOEFL ITP Online dengan timer real-time', 'Online TOEFL ITP Exam Simulation with real-time timer')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#F7B425] shrink-0" />
                <span>{tr('E-Certificate resmi terverifikasi dan unduhan PDF langsung', 'Official verified E-Certificate with direct PDF download')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#F7B425] shrink-0" />
                <span>{tr('Breakdown skor per section: Listening, Structure & Reading', 'Section score breakdown: Listening, Structure & Reading')}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#F7B425] shrink-0" />
                <span>{tr('Penyimpanan data riwayat nilai tersimpan aman di database', 'Test history and score records securely stored in database')}</span>
              </li>
            </ul>
          </div>
        </div>

      </main>

      <footer className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} English Join Indonesia. All rights reserved.
      </footer>
    </div>
  );
};
