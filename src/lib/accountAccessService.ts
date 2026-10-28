import { AccountAccessRequest, AccountRequestStatus, UserRole } from '../types';
import { supabase } from './supabase';

export const PRIMARY_ADMIN_EMAIL = 'englishjoinindonesia@gmail.com';

const STORAGE_KEY = 'ej_account_access_requests';

// Default initial data: empty array (no unnecessary dummy seed data)
const DEFAULT_ACCOUNT_REQUESTS: AccountAccessRequest[] = [];

// Known dummy seed identifiers to automatically purge from localStorage
const DUMMY_SEED_IDS = new Set([
  'REQ-2026-001',
  'REQ-2026-002',
  'REQ-2026-003',
  'REQ-2026-004',
  'REQ-2026-005'
]);

const DUMMY_SEED_EMAILS = new Set([
  'rahmat.admin@gmail.com',
  'sitinurhaliza@gmail.com',
  'budisantoso@gmail.com',
  'dedi.k@spammail.com'
]);

export function isPrimaryAdmin(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
}

/**
 * Helper to generate a strictly unique ID that never collides with existing entries
 */
function generateUniqueRequestId(list: AccountAccessRequest[]): string {
  const currentYear = new Date().getFullYear();
  const existingIds = new Set(list.map(r => r.id));
  
  let maxNum = 0;
  for (const item of list) {
    const match = item.id?.match(/REQ-\d+-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  let nextNum = Math.max(maxNum + 1, list.length + 1);
  let candidate = `REQ-${currentYear}-${String(nextNum).padStart(3, '0')}`;
  
  while (existingIds.has(candidate)) {
    nextNum++;
    candidate = `REQ-${currentYear}-${String(nextNum).padStart(3, '0')}`;
  }
  
  return candidate;
}

/**
 * Fetch all account access requests from localStorage or fallback
 */
export function getAccountAccessRequests(): AccountAccessRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }

    // Filter out unwanted dummy seeding data if present in localStorage
    const filteredParsed = parsed.filter(item => {
      if (!item || typeof item !== 'object') return false;
      const id = String(item.id || '');
      const email = String(item.email || '').toLowerCase().trim();
      if (DUMMY_SEED_IDS.has(id)) return false;
      if (email && DUMMY_SEED_EMAILS.has(email)) return false;
      return true;
    });

    const hadDummySeed = filteredParsed.length !== parsed.length;

    // Ensure all requests have strictly unique IDs and repair any duplicate keys
    const seenIds = new Set<string>();
    let hasDuplicates = false;
    const sanitizedList: AccountAccessRequest[] = [];

    for (let i = 0; i < filteredParsed.length; i++) {
      const item = filteredParsed[i];
      if (!item || typeof item !== 'object') continue;

      let id = item.id;
      if (!id || seenIds.has(id)) {
        hasDuplicates = true;
        const year = new Date().getFullYear();
        let counter = filteredParsed.length + i + 1;
        while (seenIds.has(`REQ-${year}-${String(counter).padStart(3, '0')}`)) {
          counter++;
        }
        id = `REQ-${year}-${String(counter).padStart(3, '0')}`;
      }

      seenIds.add(id);
      sanitizedList.push({
        ...item,
        id
      });
    }

    if (hasDuplicates || hadDummySeed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedList));
    }

    return sanitizedList;
  } catch (err) {
    console.warn('Failed to parse account requests from localStorage:', err);
    return [];
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

  // Check if already exists by email
  const existingIndex = list.findIndex(r => r.email.trim().toLowerCase() === lowerEmail);

  if (existingIndex >= 0) {
    // If it exists, update it cleanly without duplicating ID
    const existing = list[existingIndex];
    const updatedRecord: AccountAccessRequest = {
      ...existing,
      name: data.name.trim() || existing.name,
      whatsapp: data.whatsapp?.trim() || existing.whatsapp,
      role: data.role,
      status: autoApprove ? 'approved' : existing.status,
      notes: data.notes || existing.notes
    };
    list[existingIndex] = updatedRecord;
    saveRequests(list);
    return updatedRecord;
  }

  const uniqueId = generateUniqueRequestId(list);
  const newRequest: AccountAccessRequest = {
    id: uniqueId,
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

  const updated = [newRequest, ...list];
  saveRequests(updated);
  return newRequest;
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
 * Reset / clear all requests (defaults to empty)
 */
export function resetToDefaultAccountRequests(): void {
  saveRequests(DEFAULT_ACCOUNT_REQUESTS);
}

/**
 * Clear all account access requests
 */
export function clearAllAccountRequests(): void {
  saveRequests([]);
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
