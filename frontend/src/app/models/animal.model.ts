
export interface Animal {
  id: string;
  petId: string;
  name: string;
  species: string;
  breed: string | null;
  sex: string | null;
  dateOfBirth: string | null;
  microchipId: string | null;
  notes: string | null;
  photoPath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnimalDto {
  name: string;
  species: string;
  breed?: string;
  sex?: string;
  dateOfBirth?: string;
  microchipId?: string;
  notes?: string;
}
