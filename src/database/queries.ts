import { HttpError } from '../errors';
import { getPool } from './pool';
import { Event, EventSubscription, Person } from './types';

export interface Queries {
  checkConnection(): Promise<boolean>;
  getAllPeople(): Promise<Person[]>;
  addPerson(person: Person): Promise<Person>;
  getAllEvents(): Promise<Event[]>;
  addEvent(event: Event): Promise<Event>;
  addSubscription(subscription: EventSubscription): Promise<EventSubscription>;
}

export const makeQueries = (databaseUrl: string): Queries => {
  const pool = getPool(databaseUrl);

  return {
    checkConnection: async () => {
      try {
        const { rows } = await pool.query<{ conn_test: number }>('SELECT 1 as conn_test');
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
      const { rows, rowCount } = await pool.query<Person, [string, number]>(
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
    getAllEvents: async () => {
      const { rows } = await pool.query<Event>(
        `
        SELECT title, description, date
        FROM events
        `,
      );
      return rows;
    },
    addEvent: async ({ title, description, date }) => {
      const { rows, rowCount } = await pool.query<Event, [string, string, string]>(
        `
        INSERT INTO events (title, description, date)
        VALUES ($1, $2, $3)
        RETURNING title, description, date
        `,
        [title, description, date],
      );
      if (rowCount !== 1) {
        throw new HttpError(500, 'Something went wrong');
      }
      return rows[0];
    },
    addSubscription: async ({ personId, eventId }) => {
      const { rows, rowCount } = await pool.query<{ person_id: number; event_id: number }, [number, number]>(
        `
        INSERT INTO event_subscriptions (person_id, event_id)
        VALUES ($1, $2)
        RETURNING person_id, event_id
        `,
        [personId, eventId],
      );
      if (rowCount !== 1) {
        throw new HttpError(500, 'Something went wrong');
      }
      return {
        personId: rows[0].person_id,
        eventId: rows[0].event_id,
      };
    },
  };
};