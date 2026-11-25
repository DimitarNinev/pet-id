import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  AdminStatistics,
  PendingVet,
  AdminUser,
  AdminAnimal,
} from '../../../models/admin.model';

import { API_BASE_URL } from '../../../core/config/api.config';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/admin`;

  readonly pendingVetCount = signal(0);

  refreshPendingVetCount(): void {
    this.getStatistics().subscribe({
      next: (statistics) => {
        this.pendingVetCount.set(statistics.users.pendingVets);
      },
      error: (error) => {
        console.error('Error refreshing pending vet count:', error);
      },
    });
  }

  getStatistics(): Observable<AdminStatistics> {
    return this.http.get<AdminStatistics>(
      `${this.apiUrl}/statistics`,
    );
  }

  getPendingVets(): Observable<PendingVet[]> {
    return this.http.get<PendingVet[]>(
      `${this.apiUrl}/vets/pending`,
    );
  }

  approveVet(id: string): Observable<PendingVet> {
    return this.http.patch<PendingVet>(
      `${this.apiUrl}/vets/${id}/approve`,
      {},
    );
  }

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(
      `${this.apiUrl}/users`,
    );
  }

  getAnimals(): Observable<AdminAnimal[]> {
    return this.http.get<AdminAnimal[]>(
      `${this.apiUrl}/animals`,
    );
  }
}
