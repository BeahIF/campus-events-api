import { HttpError } from "../errors";
import { getPool } from "./pool";
import { Person, Event, Registration } from "./types";

export interface Queries {
  checkConnection(): Promise<boolean>;
  getAllPeople(): Promise<Person[]>;
  addPerson(person: Person): Promise<Person>;
  addEvent(event: Event): Promise<Event>;
  getAllEvents(): Promise<Event[]>;
  getEventById(eventId: number): Promise<Event | null>;

  countRegistrations(eventId: number): Promise<number>;

  registrationExists(eventId: number, userId: number): Promise<boolean>;

  addRegistration(eventId: number, userId: number): Promise<Registration>;
}

export const makeQueries = (databaseUrl: string): Queries => {
  const pool = getPool(databaseUrl);

  return {
    checkConnection: async () => {
      try {
        const { rows } = await pool.query<{ conn_test: number }>(
          "SELECT 1 as conn_test",
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
      const { rows, rowCount } = await pool.query<Person, [string, number]>(
        `
        INSERT INTO people (name, age)
        VALUES ($1, $2)
        RETURNING name, age
        `,
        [name, age],
      );
      if (rowCount !== 1) {
        throw new HttpError(500, "Something went wrong");
      }
      return rows[0];
    },
    addEvent: async ({ name, date, capacity }) => {
      const { rows, rowCount } = await pool.query<
        Event,
        [string, string, number]
      >(
        `
    INSERT INTO events (name, date, capacity)
    VALUES ($1, $2, $3)
    RETURNING name, date, capacity
    `,
        [name, date, capacity],
      );

      if (rowCount !== 1) {
        throw new HttpError(500, "Something went wrong");
      }

      return rows[0];
    },
    getAllEvents: async () => {
      const { rows } = await pool.query<Event>(
        `
    SELECT id, name, date, capacity
    FROM events
    ORDER BY date, id
    `,
      );

      return rows;
    },

    getEventById: async (eventId) => {
      const { rows } = await pool.query(
        `
    SELECT id, name, date, capacity
    FROM events
    WHERE id = $1
    `,
        [eventId],
      );

      return rows[0] ?? null;
    },
    countRegistrations: async (eventId) => {
      const { rows } = await pool.query(
        `
    SELECT COUNT(*)::int AS count
    FROM registrations
    WHERE event_id = $1
    `,
        [eventId],
      );

      return rows[0].count;
    },
    registrationExists: async (eventId, userId) => {
      const { rows } = await pool.query(
        `
    SELECT EXISTS (
      SELECT 1
      FROM registrations
      WHERE event_id = $1
        AND user_id = $2
    ) AS exists
    `,
        [eventId, userId],
      );

      return rows[0].exists;
    },
    addRegistration: async (eventId, userId) => {
      const { rows } = await pool.query(
        `
    INSERT INTO registrations (
      event_id,
      user_id
    )
    VALUES ($1, $2)
    RETURNING
      id,
      event_id AS "eventId",
      user_id AS "userId"
    `,
        [eventId, userId],
      );

      return rows[0];
    },
  };
};
