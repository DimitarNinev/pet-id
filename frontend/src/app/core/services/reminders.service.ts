import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Reminder,
  CreateReminderPayload,
  PersonalReminder,
} from '../../models/reminder.model';

import { API_BASE_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root',
})
export class RemindersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/reminders`;

  getAll(): Observable<Reminder[]> {
    return this.http.get<Reminder[]>(this.apiUrl);
  }

  create(payload: CreateReminderPayload): Observable<PersonalReminder> {
    return this.http.post<PersonalReminder>(
      this.apiUrl,
      payload,
    );
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}