import { Router } from "express";

import { AppContext } from "../app";
import { makeEventsController } from "../controllers/events";

export const makeEventsRoutes = (ctx: AppContext): Router => {
  const router = Router();

  const controller = makeEventsController(ctx);

  router.post("/", controller.addEvent);
  router.get("/", controller.getAllEvents);
  router.post("/:eventId/registrations", controller.addRegistration);
  return router;
};
