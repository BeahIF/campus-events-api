import {
  NextFunction,
  Request,
  Response,
} from 'express';

import { canRegister } from '../domain/events';
import { HttpError } from '../errors';
import { Queries } from '../database/queries';

export const makeRegisterForEvent = (queries: Queries) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { eventId } = req.params;
      const { userId } = req.body as { userId: string };

      const event = await queries.getEventById(eventId);

      const registrations =
        await queries.getRegistrationsByEventId(eventId);

      const result = canRegister({
        capacity: event.capacity,
        registrations,
        userId,
      });

      if (!result.allowed) {
        throw new HttpError(400, result.reason);
      }

      await queries.createRegistration({
        eventId,
        userId,
      });

      res.status(201).json({
        eventId,
        userId,
      });
    } catch (error) {
      next(error);
    }
  };
};