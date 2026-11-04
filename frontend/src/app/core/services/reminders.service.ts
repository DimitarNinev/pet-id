import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Reminder } from '../../models/reminder.model';
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
}
