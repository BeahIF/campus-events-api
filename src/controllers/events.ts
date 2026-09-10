import { Request, Response } from 'express';
import { AppContext } from '../app';

export function makeEventController(ctx: AppContext) {
  return {
    async getAllEvents(req: Request, res: Response): Promise<void> {
      try {
        const events = await ctx.queries.getAllEvents();
        res.status(200).json(events);
      } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar eventos' });
      }
    },

    async addEvent(req: Request, res: Response): Promise<void> {
      try {
        const eventData = req.body;
        const newEvent = await ctx.queries.createEvent(eventData);
        res.status(201).json(newEvent);
      } catch (error) {
        res.status(500).json({ error: 'Erro ao cadastrar evento' });
      }
    }
  };
}