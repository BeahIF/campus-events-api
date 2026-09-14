import { HttpError } from '../errors';
import { getPool } from './pool';
import { Person } from './types';

export type Event = {
  id: string;
  capacity: number;
};

export type Registration = {
  eventId: string;
  userId: string;
};

export interface Queries {
  checkConnection(): Promise<boolean>;

  getAllPeople(): Promise<Person[]>;
  addPerson(person: Person): Promise<Person>;

  getEventById(eventId: string): Promise<Event>;
  getRegistrationsByEventId(eventId: string): Promise<string[]>;
  createRegistration(registration: Registration): Promise<void>;
}

export const makeQueries = (databaseUrl: string): Queries => {
  const pool = getPool(databaseUrl);

  return {
    checkConnection: async () => {
      try {
        const { rows } = await pool.query<{ conn_test: number }>(
          'SELECT 1 as conn_test',
        );

        return rows[0].conn_test === 1;
      } catch {
        return false;
      }
    },

    getAllPeople: async () => {
      const { rows } = await pool.query<Person>(
        `
        SELECT name, age
        FROM people
        `,
      );

      return rows;
    },

    addPerson: async ({ name, age }) => {
      const { rows, rowCount } = await pool.query<
        Person,
        [string, number]
      >(
        `
        INSERT INTO people (name, age)
        VALUES ($1, $2)
        RETURNING name, age
        `,
        [name, age],
      );

      if (rowCount !== 1) {
        throw new HttpError(500, 'Something went wrong');
      }

      return rows[0];
    },

    getEventById: async (eventId: string) => {
      const { rows } = await pool.query<Event, [string]>(
        `
        SELECT id, capacity
        FROM events
        WHERE id = $1
        `,
        [eventId],
      );

      if (rows.length !== 1) {
        throw new HttpError(404, 'event not found');
      }

      return rows[0];
    },

    getRegistrationsByEventId: async (eventId: string) => {
      const { rows } = await pool.query<{ user_id: string }, [string]>(
        `
        SELECT user_id
        FROM registrations
        WHERE event_id = $1
        `,
        [eventId],
      );

      return rows.map((registration) => registration.user_id);
    },

    createRegistration: async ({
      eventId,
      userId,
    }: Registration): Promise<void> => {
      const { rowCount } = await pool.query<
        Registration,
        [string, string]
      >(
        `
        INSERT INTO registrations (event_id, user_id)
        VALUES ($1, $2)
        `,
        [eventId, userId],
      );

      if (rowCount !== 1) {
        throw new HttpError(500, 'Something went wrong');
      }
    },
  };
};