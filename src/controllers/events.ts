import { NextFunction, Request, Response } from 'express';
import { AppContext } from '../app';
import { EventBody, EventRecord, RegistrationBody, RegistrationRecord } from '../database/types';
import { EventDomain } from '../domain/events';
import { HttpError } from '../errors';

type IdParams = { id: string };

export interface EventController {
  getAllEvents(req: Request, res: Response<EventRecord[]>, next: NextFunction): Promise<void>;
  getEventById(
    req: Request<IdParams>,
    res: Response<EventRecord>,
    next: NextFunction,
  ): Promise<void>;
  addEvent(req: Request, res: Response<EventRecord>, next: NextFunction): Promise<void>;
  getRegistrations(
    req: Request<IdParams>,
    res: Response<RegistrationRecord[]>,
    next: NextFunction,
  ): Promise<void>;
  addRegistration(
    req: Request<IdParams>,
    res: Response<RegistrationRecord>,
    next: NextFunction,
  ): Promise<void>;
}

function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'O id informado é inválido.');
  }
  return id;
}

export const makeEventController = ({ queries }: AppContext): EventController => {
  const findEventOr404 = async (id: number): Promise<EventRecord> => {
    const event = await queries.getEventById(id);
    if (!event) {
      throw new HttpError(404, 'Evento não encontrado.');
    }
    return event;
  };

  return {
    getAllEvents: async (req, res) => {
      const events = await queries.getAllEvents();
      res.send(events);
    },
    getEventById: async (req, res) => {
      const event = await findEventOr404(parseId(req.params.id));
      res.send(event);
    },
    addEvent: async (req, res) => {
      // 1. Formato do corpo (Zod) -> 2. Regras de negócio (domínio) -> 3. Persistência
      const body = EventBody.parse(req.body);
      const validEvent = EventDomain.validateAndCreateEvent(body);
      const created = await queries.addEvent(validEvent);
      res.status(201).send(created);
    },
    getRegistrations: async (req, res) => {
      const event = await findEventOr404(parseId(req.params.id));
      const registrations = await queries.getRegistrationsByEvent(event.id);
      res.send(registrations);
    },
    addRegistration: async (req, res) => {
      const eventId = parseId(req.params.id);
      const { personId } = RegistrationBody.parse(req.body);

      const event = await findEventOr404(eventId);
      const registrations = await queries.getRegistrationsByEvent(eventId);

      // Regras de negócio: impedir duplicidade e respeitar a capacidade do evento
      EventDomain.registerUserInEvent({
        eventId,
        userId: personId,
        existingRegistrations: registrations.map((r) => ({
          eventId: r.eventId,
          userId: r.personId,
        })),
        currentParticipantsCount: registrations.length,
        eventCapacity: event.capacity,
      });

      const registration = await queries.addRegistration(eventId, personId);
      res.status(201).send(registration);
    },
  };
};
