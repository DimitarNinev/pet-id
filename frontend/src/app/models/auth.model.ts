export type UserRole = 'OWNER' | 'VET' | 'ADMIN';
export type RegistrationRole = 'OWNER' | 'VET';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  vetApproved: boolean;
  clinicName: string | null;
  clinicAddress: string | null;
  city: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: RegistrationRole;
  phone?: string;
  clinicName?: string;
  clinicAddress?: string;
  city?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  clinicName?: string | null;
  clinicAddress?: string | null;
  city?: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}