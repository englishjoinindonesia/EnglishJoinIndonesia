import { AccountAccessRequest, AccountRequestStatus, UserRole } from '../types';
import { supabase } from './supabase';

export const PRIMARY_ADMIN_EMAIL = 'englishjoinindonesia@gmail.com';

const STORAGE_KEY = 'ej_account_access_requests';

// Default initial data for rich demonstration and initial state
const DEFAULT_ACCOUNT_REQUESTS: AccountAccessRequest[] = [
  {
    id: 'REQ-2026-001',
    name: 'Rahmat Hidayat, M.Pd.',
    email: 'rahmat.admin@gmail.com',
    whatsapp: '081234567890',
    role: 'admin',
    requestedAt: '2026-03-29 08:30:15',
    status: 'pending',
    notes: 'Permohonan akun Staff Pengajar & Administrator TOEFL'
  },
  {
    id: 'REQ-2026-002',
    name: 'Siti Nurhaliza',
    email: 'sitinurhaliza@gmail.com',
    whatsapp: '085712345678',
    role: 'student',
    requestedAt: '2026-03-29 10:15:40',
    status: 'pending',
    notes: 'Pendaftar program TOEFL ITP Intensive Test'
  },
  {
    id: 'REQ-2026-003',
    name: 'Admin EJI Utama',
    email: 'englishjoinindonesia@gmail.com',
    whatsapp: '081234567000',
    role: 'admin',
    requestedAt: '2026-01-01 00:00:00',
    status: 'approved',
    reviewedBy: 'Super Admin EJI (System)',
    reviewedAt: '2026-01-01 00:00:00',
    notes: 'Pemilik Sistem & Admin Utama English Join Indonesia'
  },
  {
    id: 'REQ-2026-004',
    name: 'Budi Santoso',
    email: 'budisantoso@gmail.com',
    whatsapp: '082198765432',
    role: 'student',
    requestedAt: '2026-03-28 14:20:00',
    status: 'approved',
    reviewedBy: 'englishjoinindonesia@gmail.com',
    reviewedAt: '2026-03-28 15:00:10',
    notes: 'Verifikasi pendaftaran TOEFL lulus'
  },
  {
    id: 'REQ-2026-005',
    name: 'Dedi Kurniawan',
    email: 'dedi.k@spammail.com',
    whatsapp: '089900112233',
    role: 'student',
    requestedAt: '2026-03-27 11:05:22',
    status: 'rejected',
    reviewedBy: 'englishjoinindonesia@gmail.com',
    reviewedAt: '2026-03-27 13:45:00',
    notes: 'Nomor WhatsApp dan email tidak valid / terindikasi spam'
  }
];

export function isPrimaryAdmin(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
}

/**
 * Fetch all account access requests from localStorage or fallback
 */
export function getAccountAccessRequests(): AccountAccessRequest[] {
  if (typeof window === 'undefined') return DEFAULT_ACCOUNT_REQUESTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNT_REQUESTS));
      return DEFAULT_ACCOUNT_REQUESTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNT_REQUESTS));
      return DEFAULT_ACCOUNT_REQUESTS;
    }
    return parsed;
  } catch (err) {
    console.warn('Failed to parse account requests from localStorage:', err);
    return DEFAULT_ACCOUNT_REQUESTS;
  }
}

/**
 * Count total pending requests
 */
export function getPendingAccountRequestsCount(): number {
  const requests = getAccountAccessRequests();
  return requests.filter(r => r.status === 'pending').length;
}

/**
 * Save requests to localStorage & broadcast event
 */
function saveRequests(list: AccountAccessRequest[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('ej_account_requests_updated', { detail: list }));
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.error('Error saving account access requests:', err);
  }
}

/**
 * Add a new account registration request (status defaults to 'pending')
 */
export function addAccountAccessRequest(data: {
  name: string;
  email: string;
  role: UserRole;
  whatsapp?: string;
  notes?: string;
}): AccountAccessRequest {
  const list = getAccountAccessRequests();
  const lowerEmail = data.email.trim().toLowerCase();

  // If primary admin, auto-approve
  const autoApprove = isPrimaryAdmin(lowerEmail);

  // Check if already exists
  const existingIndex = list.findIndex(r => r.email.trim().toLowerCase() === lowerEmail);

  const newRequest: AccountAccessRequest = {
    id: `REQ-${new Date().getFullYear()}-${String(list.length + 1).padStart(3, '0')}`,
    name: data.name.trim() || 'Pengguna Baru',
    email: lowerEmail,
    whatsapp: data.whatsapp?.trim() || '-',
    role: data.role,
    requestedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    status: autoApprove ? 'approved' : 'pending',
    reviewedBy: autoApprove ? 'System (Primary Admin)' : undefined,
    reviewedAt: autoApprove ? new Date().toISOString().replace('T', ' ').substring(0, 19) : undefined,
    notes: data.notes || (autoApprove ? 'Akun Utama Otomatis Disetujui' : `Permohonan registrasi akun ${data.role}`)
  };

  if (existingIndex >= 0) {
    // If it exists, update it if it was rejected or pending
    list[existingIndex] = {
      ...list[existingIndex],
      ...newRequest,
      id: list[existingIndex].id
    };
    saveRequests(list);
    return list[existingIndex];
  } else {
    const updated = [newRequest, ...list];
    saveRequests(updated);
    return newRequest;
  }
}

/**
 * Approve an account access request
 */
export function approveAccountAccessRequest(
  id: string, 
  reviewedBy: string = PRIMARY_ADMIN_EMAIL, 
  notes?: string
): boolean {
  const list = getAccountAccessRequests();
  const idx = list.findIndex(r => r.id === id);
  if (idx === -1) return false;

  list[idx] = {
    ...list[idx],
    status: 'approved',
    reviewedBy,
    reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    notes: notes || list[idx].notes || 'Disetujui oleh Admin EJI'
  };

  saveRequests(list);
  return true;
}

/**
 * Reject an account access request
 */
export function rejectAccountAccessRequest(
  id: string, 
  reviewedBy: string = PRIMARY_ADMIN_EMAIL, 
  notes?: string
): boolean {
  const list = getAccountAccessRequests();
  const idx = list.findIndex(r => r.id === id);
  if (idx === -1) return false;

  list[idx] = {
    ...list[idx],
    status: 'rejected',
    reviewedBy,
    reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    notes: notes || 'Permohonan ditolak oleh Admin EJI'
  };

  saveRequests(list);
  return true;
}

/**
 * Reset status back to pending
 */
export function resetAccountAccessRequest(id: string): boolean {
  const list = getAccountAccessRequests();
  const idx = list.findIndex(r => r.id === id);
  if (idx === -1) return false;

  list[idx] = {
    ...list[idx],
    status: 'pending',
    reviewedBy: undefined,
    reviewedAt: undefined,
    notes: 'Status dikembalikan ke menunggu persetujuan'
  };

  saveRequests(list);
  return true;
}

/**
 * Delete a request item
 */
export function deleteAccountAccessRequest(id: string): boolean {
  const list = getAccountAccessRequests();
  const filtered = list.filter(r => r.id !== id);
  if (filtered.length === list.length) return false;

  saveRequests(filtered);
  return true;
}

/**
 * Reset to default sample data
 */
export function resetToDefaultAccountRequests(): void {
  saveRequests(DEFAULT_ACCOUNT_REQUESTS);
}

/**
 * Check approval status of an email:
 * Returns: 'approved' | 'pending' | 'rejected' | 'unknown'
 */
export function checkAccountApprovalStatus(email?: string | null): AccountRequestStatus | 'unknown' {
  if (!email) return 'unknown';
  const cleanEmail = email.trim().toLowerCase();

  // Primary admin is always approved
  if (cleanEmail === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
    return 'approved';
  }

  const list = getAccountAccessRequests();
  const found = list.find(r => r.email.trim().toLowerCase() === cleanEmail);
  if (found) {
    return found.status;
  }

  return 'unknown';
}
