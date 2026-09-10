import { Router } from 'express';
import { makeSubscriptionController } from '../controllers/subscriptions';
import { AppContext } from '../app';

export const makeSubscriptionRoutes = (ctx: AppContext): Router => {
  const router = Router();
  const controller = makeSubscriptionController(ctx);

  router.post('/', controller.addSubscription);

  return router;
};