export type UserRole = 'OWNER' | 'VET';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  vetApproved: boolean;
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
  role: UserRole;
  phone?: string;
  clinicName?: string;
  clinicAddress?: string;
  city?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}