import { NextFunction, Request, Response } from 'express';
import { Event } from '../database/types';
import { AppContext } from '../app';

export interface EventController {
  getAllEvents(req: Request, res: Response<Event[]>, next: NextFunction): Promise<void>;
  addEvent(req: Request, res: Response<Event>, next: NextFunction): Promise<void>;
}

export const makeEventController = ({ queries }: AppContext): EventController => {
  return {
    getAllEvents: async (req, res) => {
      const events = await queries.getAllEvents();
      res.send(events);
    },
    addEvent: async (req, res) => {
      const event = Event.parse(req.body);
      const newEvent = await queries.addEvent(event);
      res.send(newEvent);
    },
  };
};