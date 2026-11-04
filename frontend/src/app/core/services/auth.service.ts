import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  AuthUser,
} from '../../models/auth.model';
import { API_BASE_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly apiUrl = `${API_BASE_URL}/auth`;
  private readonly tokenKey = 'pet-id-access-token';
  private readonly userKey = 'pet-id-user';
  private readonly legacyRoleKey = 'user-role';

  readonly currentUser = signal<AuthUser | null>(this.readStoredUser());
  readonly currentRole = computed(() => this.currentUser()?.role ?? null);

  /**
   * Вход в съществуващ профил.
   */
  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, data)
      .pipe(tap((response) => this.saveSession(response)));
  }

  /**
   * Регистрация на нов потребител.
   */
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, data)
      .pipe(tap((response) => this.saveSession(response)));
  }

  /**
   * Връща запазения access token.
   */
  getToken(): string | null {
    return this.readStorage(this.tokenKey);
  }

  /**
   * Проверява дали има запазен token.
   * Това само по себе си не доказва, че сесията е валидна.
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(role: AuthUser['role']): boolean {
    return this.currentRole() === role;
  }

  isVetApproved(): boolean {
    const user = this.currentUser();
    return user?.role === 'VET' && user.vetApproved;
  }

  /**
   * Изчиства локалната сесия и пренасочва към Login.
   */
  logout(): void {
    this.removeStorage(this.tokenKey);
    this.removeStorage(this.userKey);
    this.removeStorage(this.legacyRoleKey);
    this.currentUser.set(null);
    void this.router.navigate(['/login']);
  }

  /**
   * Запазва access token след успешен вход или регистрация.
   */
  private saveSession(response: AuthResponse): void {
    this.writeStorage(this.tokenKey, response.accessToken);
    this.saveUser(response.user);
  }

  private saveUser(user: AuthUser): void {
    this.writeStorage(this.userKey, JSON.stringify({ role: user.role, vetApproved: user.vetApproved }));
    this.writeStorage(this.legacyRoleKey, user.role);
    this.currentUser.set(user);
  }

  private readStoredUser(): AuthUser | null {
    const storedUser = this.readStorage(this.userKey);
    if (storedUser) {
      try {
        const user: unknown = JSON.parse(storedUser);
        if (
          typeof user === 'object' && user !== null &&
          'role' in user && (user.role === 'OWNER' || user.role === 'VET') &&
          'vetApproved' in user && typeof user.vetApproved === 'boolean'
        ) {
          return {
            id: '', email: '', firstName: '', lastName: '',
            role: user.role,
            vetApproved: user.vetApproved,
          };
        }
        this.removeStorage(this.userKey);
      } catch {
        this.removeStorage(this.userKey);
      }
    }

    // Keep sessions created by earlier versions usable until the next login.
    const role = this.readStorage(this.legacyRoleKey);
    return role === 'OWNER' || role === 'VET'
      ? { id: '', email: '', firstName: '', lastName: '', role, vetApproved: role === 'OWNER' }
      : null;
  }

  private readStorage(key: string): string | null {
    try {
      return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private writeStorage(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // The session remains usable in memory when browser storage is unavailable.
    }
  }

  private removeStorage(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore unavailable browser storage.
    }
  }

  getCurrentUser(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.apiUrl}/me`).pipe(tap((user) => this.saveUser(user)));
  }
}
