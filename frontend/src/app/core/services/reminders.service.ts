import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Reminder } from '../../models/reminder.model';

@Injectable({
  providedIn: 'root',
})
export class RemindersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/v1/reminders';

  getAll(): Observable<Reminder[]> {
    return this.http.get<Reminder[]>(this.apiUrl);
  }
}