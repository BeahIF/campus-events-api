import { z } from "zod/v4";

export const Person = z.object({
  name: z.string().trim().min(1),
  age: z.number().positive().max(150),
});
export type Person = z.infer<typeof Person>;

export const Event = z.object({
  id: z.number().optional(),
  name: z.string().trim().min(1),
  date: z.string().min(1),
  capacity: z.number().int().positive(),
});

export type Event = z.infer<typeof Event>;
export const RegistrationBody = z.object({
  userId: z.number().int().positive(),
});

export type RegistrationBody = z.infer<typeof RegistrationBody>;

export const EventId = z.coerce.number().int().positive();

export type Registration = {
  id: number;
  eventId: number;
  userId: number;
};
