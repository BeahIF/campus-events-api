import { NextFunction, Request, Response } from 'express';
import { validateEventInput } from '../domain/events';
import { HttpError } from '../errors';

export const makeEventsController = () => {
  return {
    addEvent: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const result = validateEventInput(req.body);
        if (!result.valid) {
          throw new HttpError(400, result.errors.join(', '));
        }
        res.status(201).json(req.body);
      } catch (err) {
        next(err);
      }
    },
  };
};
