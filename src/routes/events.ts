import { Router } from 'express';
import { makeEventController } from '../controllers/events';
import { AppContext } from '../app';

export const makeEventRoutes = (ctx: AppContext): Router => {
  const router = Router();
  const controller = makeEventController(ctx);

  router.get('/', controller.getAllEvents);
  router.post('/', controller.addEvent);
  router.get('/:id', controller.getEventById);
  router.get('/:id/registrations', controller.getRegistrations);
  router.post('/:id/registrations', controller.addRegistration);

  return router;
};
