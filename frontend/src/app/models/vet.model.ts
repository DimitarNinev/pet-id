export interface Vet {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  clinicName: string | null;
  clinicAddress: string | null;
  city: string | null;
}

export interface VetsResponse {
  data: Vet[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}