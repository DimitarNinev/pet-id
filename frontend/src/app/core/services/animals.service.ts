import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Animal, CreateAnimalDto } from '../../models/animal.model';

@Injectable({
  providedIn: 'root',
})
export class AnimalsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/v1/animals';

  getAll(): Observable<Animal[]> {
    return this.http.get<Animal[]>(this.apiUrl);
  }

  create(data: CreateAnimalDto): Observable<Animal> {
    return this.http.post<Animal>(this.apiUrl, data);
  }

  getById(id: string): Observable<Animal> {
    return this.http.get<Animal>(`${this.apiUrl}/${id}`);
  }

  update(id: string, data: Partial<CreateAnimalDto>): Observable<Animal> {
    return this.http.patch<Animal>(
      `${this.apiUrl}/${id}`,
      data,
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  uploadPhoto(animalId: string, photo: File): Observable<{ id: string; photoPath: string }> {
    const formData = new FormData();
    formData.append('photo', photo);

    return this.http.post<{ id: string; photoPath: string }>(
      `${this.apiUrl}/${animalId}/photo`,
      formData
    );
  }

  getPhotoUrl(animalId: string): Observable<{ photoUrl: string }> {
    return this.http.get<{ photoUrl: string }>(
      `${this.apiUrl}/${animalId}/photo-url`
    );
  }

  getVetPhotoUrl(animalId: string): Observable<{ photoUrl: string }> {
    return this.http.get<{ photoUrl: string }>(
      `${this.apiUrl}/${animalId}/vet-photo-url`
    );
  }
}
