import { z } from 'zod/v4';

export const Person = z.object({
  name: z.string().trim().min(1),
  age: z.number().positive().max(150),
});
export type Person = z.infer<typeof Person>;

export const Event = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  date: z.string().trim().min(1), 
});

export type Event = z.infer<typeof Event>;

export const EventSubscription = z.object({
  personId: z.number().int().positive(),
  eventId: z.number().int().positive(),
});

export type EventSubscription = z.infer<typeof EventSubscription>;