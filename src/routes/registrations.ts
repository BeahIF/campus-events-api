import { Router } from 'express';
import { z } from 'zod/v4';
import { AppContext } from '../app';

const RegistrationInput = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
});
export type RegistrationInput = z.infer<typeof RegistrationInput>;
export interface Registration extends RegistrationInput {
  id: number;
  eventId: number;
  createdAt: Date;
}
const EventId = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .pipe(z.number().int().max(2147483647));

export function makeRegistrationRoutes({ queries }: AppContext): Router {
  const router = Router();
  router.post('/:eventId/registrations', async (req, res) => {
    const eventId = EventId.parse(req.params.eventId);
    const input = RegistrationInput.parse(req.body);
    res.status(201).send(await queries.addRegistration(eventId, input));
  });
  return router;
}
