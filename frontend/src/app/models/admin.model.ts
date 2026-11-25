export interface AdminStatistics {
    users: {
        total: number;
        owners: number;
        vets: number;
        approvedVets: number;
        pendingVets: number;
        admins: number;
    };
    animals: {
        total: number;
    };
    medicalRecords: {
        total: number;
    };
    reminders: {
        total: number;
    };
}

export interface PendingVet {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    clinicName: string | null;
    clinicAddress: string | null;
    city: string | null;
    createdAt: string;
}

export interface AdminUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    role: 'OWNER' | 'VET' | 'ADMIN';
    vetApproved: boolean;
    city: string | null;
    createdAt: string;
}

export interface AdminAnimalOwner {
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}

export interface AdminAnimal {
    id: string;
    petId: string;
    name: string;
    species: string;
    breed: string | null;
    sex: string | null;
    dateOfBirth: string | null;
    microchipId: string | null;
    createdAt: string;
    owners: AdminAnimalOwner[];
}
