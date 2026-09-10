import { Router } from 'express';
import { makeEventController } from '../controllers/events';
import { AppContext } from '../app';

export const makeEventRoutes = (ctx: AppContext): Router => {
  const router = Router();
  const controller = makeEventController(ctx);

  router.get('/', controller.getAllEvents);
  router.post('/', controller.addEvent);

  return router;
};