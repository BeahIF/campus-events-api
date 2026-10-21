import { Router } from 'express';
import { makeEventsController } from '../controllers/events';

export const makeEventsRoutes = (): Router => {
  const router = Router();
  const controller = makeEventsController();

  router.post('/', controller.addEvent);

  return router;
};
