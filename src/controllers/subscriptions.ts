import { Request, Response } from 'express';
import { AppContext } from '../app';
import { EventSubscription } from '../database/types';

export const makeSubscriptionController = (ctx: AppContext) => {
  return {
    addSubscription: async (req: Request, res: Response): Promise<void> => {
      const subscriptionData = EventSubscription.parse(req.body);
      const createdSubscription = await ctx.queries.addSubscription(subscriptionData);
      res.status(201).json(createdSubscription);
    },
  };
};