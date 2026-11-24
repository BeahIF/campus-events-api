import { z } from 'zod/v4';

export const Person = z.object({
  name: z.string().trim().min(1),
  age: z.number().positive().max(150),
});
export type Person = z.infer<typeof Person>;

export interface PersonRecord extends Person {
  id: number;
}

// Formato do corpo de POST /events (as regras de negócio ficam em src/domain/events.ts)
export const EventBody = z.object({
  title: z.string(),
  description: z.string(),
  date: z.string(),
  capacity: z.number(),
});
export type EventBody = z.infer<typeof EventBody>;

export interface NewEvent {
  title: string;
  description: string;
  date: Date;
  capacity: number;
}

export interface EventRecord extends NewEvent {
  id: number;
}

// Formato do corpo de POST /events/:id/registrations
export const RegistrationBody = z.object({
  personId: z.number().int().positive(),
});
export type RegistrationBody = z.infer<typeof RegistrationBody>;

export interface RegistrationRecord {
  id: number;
  eventId: number;
  personId: number;
  createdAt: Date;
}
