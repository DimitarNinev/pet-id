export type ReminderType = 'VACCINATION' | 'DEWORMING';

export type ReminderStatus = 'UPCOMING' | 'OVERDUE';

export type DewormingType = 'INTERNAL' | 'EXTERNAL';

export interface Reminder {
  id: string;
  animalId: string;
  animalName: string;
  petId: string;
  type: ReminderType;
  title: string;
  dueAt: string;
  status: ReminderStatus;
  dewormingType?: DewormingType;
}