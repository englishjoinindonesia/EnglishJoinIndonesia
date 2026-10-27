export type UserRole = 'admin' | 'student';

export type AccountRequestStatus = 'pending' | 'approved' | 'rejected';

export interface AccountAccessRequest {
  id: string;
  name: string;
  email: string;
  whatsapp?: string;
  role: UserRole;
  requestedAt: string;
  status: AccountRequestStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

export interface UserSession {
  email: string;
  role: UserRole;
  name: string;
  avatar?: string;
  loginAt: string;
}

