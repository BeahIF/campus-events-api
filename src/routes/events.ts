import { Router } from "express";
import { makeEventController } from "../controllers/events";
import { AppContext } from "../app";

export const makeEventRoutes = (ctx: AppContext): Router => {
  const router = Router();
  const controller = makeEventController(ctx);

  // Endpoint para listar todos os eventos
  router.get("/", (req, res, next) => {
    controller.getAllEvents(req, res).catch(next);
  });

  // Endpoint para cadastrar novo evento
  router.post("/", (req, res, next) => {
    controller.addEvent(req, res).catch(next);
  });

  // Endpoint para realizar inscrição no evento
  router.post("/register", (req, res, next) => {
    controller.registerParticipant(req, res).catch(next);
  });

  return router;
};