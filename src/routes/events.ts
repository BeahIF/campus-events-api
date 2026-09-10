import { Router } from 'express';
import { makeEventController } from '../controllers/events';
import { AppContext } from '../app';

export const makeEventRoutes = (ctx: AppContext): Router => {
  const router = Router();
  const controller = makeEventController(ctx);
router.get('/', (req, res) => controller.getAllEvents(req, res));
router.post('/', (req, res) => controller.addEvent(req, res));
  return router;
};