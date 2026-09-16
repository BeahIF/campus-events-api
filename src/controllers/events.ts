import { NextFunction, Request, Response } from "express";

import { Event, EventId, RegistrationBody } from "../database/types";
import { AppContext } from "../app";
import { canRegister } from "../domain/registrations";

export interface EventsController {
  addEvent(
    req: Request,
    res: Response<Event>,
    next: NextFunction,
  ): Promise<void>;

  getAllEvents(
    req: Request,
    res: Response<Event[]>,
    next: NextFunction,
  ): Promise<void>;

  addRegistration(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
}

export const makeEventsController = ({
  queries,
}: AppContext): EventsController => {
  return {
    getAllEvents: async (_req, res) => {
      const events = await queries.getAllEvents();

      res.status(200).send(events);
    },
    addEvent: async (req, res) => {
      const event = Event.parse(req.body);

      const newEvent = await queries.addEvent(event);

      res.status(201).send(newEvent);
    },
    addRegistration: async (req, res) => {
      const eventId = EventId.parse(req.params.eventId);

      const { userId } = RegistrationBody.parse(req.body);

      const event = await queries.getEventById(eventId);

      if (!event) {
        res.status(404).json({
          message: "Event not found",
        });

        return;
      }

      const alreadyRegistered = await queries.registrationExists(
        eventId,
        userId,
      );

      if (alreadyRegistered) {
        res.status(409).json({
          message: "User already registered",
        });

        return;
      }

      const registrations = await queries.countRegistrations(eventId);

      if (!canRegister(event.capacity, registrations)) {
        res.status(400).json({
          message: "Event is full",
        });

        return;
      }

      const registration = await queries.addRegistration(eventId, userId);

      res.status(201).json(registration);
    },
  };
};
