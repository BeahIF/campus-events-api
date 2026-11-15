import { HttpError } from '../errors';
import { getPool } from './pool';
import { Person } from './types';
import type { CampusEvent, EventInput } from '../routes/events';
import type { Registration, RegistrationInput } from '../routes/registrations';

export interface Queries {
  addRegistration(eventId: number, input: RegistrationInput): Promise<Registration>;
  getEvents(): Promise<CampusEvent[]>;
  addEvent(input: EventInput): Promise<CampusEvent>;
  checkConnection(): Promise<boolean>;
  getAllPeople(): Promise<Person[]>;
  addPerson(person: Person): Promise<Person>;
}

export const makeQueries = (databaseUrl: string): Queries => {
  const pool = getPool(databaseUrl);

  return {
    addRegistration: async (eventId, { name, email }) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        // All registrations for this event must acquire the same lock before counting seats.
        const { rows: events } = await client.query<{ startsAt: Date; capacity: number }>(
          'SELECT starts_at AS "startsAt", capacity FROM events WHERE id = $1 FOR UPDATE',
          [eventId],
        );
        const event = events[0];
        if (!event) throw new HttpError(404, 'Event not found');
        if (event.startsAt.getTime() <= Date.now())
          throw new HttpError(409, 'Event has already started');
        const duplicate = await client.query(
          'SELECT id FROM registrations WHERE event_id = $1 AND email = $2',
          [eventId, email],
        );
        if (duplicate.rowCount)
          throw new HttpError(409, 'Email is already registered for this event');
        const count = await client.query<{ total: number }>(
          'SELECT count(*)::int AS total FROM registrations WHERE event_id = $1',
          [eventId],
        );
        if (count.rows[0].total >= event.capacity) throw new HttpError(409, 'Event is full');
        const { rows } = await client.query<Registration>(
          `INSERT INTO registrations (event_id, name, email) VALUES ($1, $2, $3)
           RETURNING id, event_id AS "eventId", name, email, created_at AS "createdAt"`,
          [eventId, name, email],
        );
        await client.query('COMMIT');
        return rows[0];
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
    getEvents: async () => {
      const { rows } = await pool.query<CampusEvent>(
        'SELECT id, title, description, starts_at AS "startsAt", capacity FROM events ORDER BY starts_at, id',
      );
      return rows;
    },
    addEvent: async ({ title, description, startsAt, capacity }) => {
      const { rows } = await pool.query<CampusEvent>(
        `INSERT INTO events (title, description, starts_at, capacity) VALUES ($1, $2, $3, $4)
         RETURNING id, title, description, starts_at AS "startsAt", capacity`,
        [title, description ?? null, startsAt, capacity],
      );
      return rows[0];
    },
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
  };
};
