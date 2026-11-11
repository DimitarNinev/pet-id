export type ReminderType =
  | 'VACCINATION'
  | 'DEWORMING'
  | 'PERSONAL';

export type ReminderStatus =
  | 'UPCOMING'
  | 'OVERDUE'
  | 'COMPLETED'
  | 'CANCELLED';

export type ReminderSource = 'MEDICAL' | 'PERSONAL';

export type DewormingType = 'INTERNAL' | 'EXTERNAL';

export interface Reminder {
  id: string;
  animalId: string;
  animalName: string;
  petId: string;
  source: ReminderSource;
  type: ReminderType;
  title: string;
  description?: string | null;
  dueAt: string;
  status: ReminderStatus;
  dewormingType?: DewormingType;
}

export interface CreateReminderPayload {
  title: string;
  description?: string;
  animalId: string;
  dueAt: string;
}

export interface PersonalReminder {
  id: string;
  userId: string;
  animalId: string;
  title: string;
  description?: string | null;
  dueAt: string;
  status: ReminderStatus;
  createdAt: string;
  updatedAt: string;
  animal: {
    id: string;
    name: string;
    petId: string;
  };
}