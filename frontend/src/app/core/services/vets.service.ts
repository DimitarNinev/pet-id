import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { VetsResponse } from '../../models/vet.model';

@Injectable({
  providedIn: 'root',
})
export class VetsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/vets`;

  getAll(
    query = '',
    page = 1,
    limit = 10,
    city = '',
  ): Observable<VetsResponse> {
    return this.http.get<VetsResponse>(this.apiUrl, {
      params: {
        q: query,
        city,
        page,
        limit,
      },
    });
  }
}