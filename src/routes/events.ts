import { Router } from 'express';
import { z } from 'zod/v4';
import { AppContext } from '../app';
import { HttpError } from '../errors';

const EventInput = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(10000).optional(),
  startsAt: z.iso.datetime({ offset: true }),
  capacity: z.number().int().positive().max(2147483647),
});
export type EventInput = z.infer<typeof EventInput>;
export interface CampusEvent extends Omit<EventInput, 'description'> {
  id: number;
  description: string | null;
}

export function makeEventRoutes({ queries }: AppContext): Router {
  const router = Router();
  router.get('/', async (_req, res) => {
    res.send(await queries.getEvents());
  });
  router.post('/', async (req, res) => {
    const input = EventInput.parse(req.body);
    if (Date.parse(input.startsAt) <= Date.now()) {
      throw new HttpError(400, 'Event must start in the future');
    }
    res.status(201).send(await queries.addEvent(input));
  });
  return router;
}
