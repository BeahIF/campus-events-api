import { HttpError } from '../errors';
import { getPool } from './pool';
import { EventRecord, NewEvent, Person, PersonRecord, RegistrationRecord } from './types';

export interface Queries {
  checkConnection(): Promise<boolean>;
  getAllPeople(): Promise<PersonRecord[]>;
  addPerson(person: Person): Promise<PersonRecord>;
  getAllEvents(): Promise<EventRecord[]>;
  getEventById(id: number): Promise<EventRecord | null>;
  addEvent(event: NewEvent): Promise<EventRecord>;
  getRegistrationsByEvent(eventId: number): Promise<RegistrationRecord[]>;
  addRegistration(eventId: number, personId: number): Promise<RegistrationRecord>;
}

const EVENT_COLUMNS = 'id, title, description, date, capacity';
const REGISTRATION_COLUMNS =
  'id, event_id AS "eventId", person_id AS "personId", created_at AS "createdAt"';

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
      const { rows } = await pool.query<PersonRecord>(
        `
        SELECT id, name, age
        FROM people
        ORDER BY id
        `,
      );
      return rows;
    },
    addPerson: async ({ name, age }) => {
      const { rows, rowCount } = await pool.query<PersonRecord, [string, number]>(
        `
        INSERT INTO people (name, age)
        VALUES ($1, $2)
        RETURNING id, name, age
        `,
        [name, age],
      );
      if (rowCount !== 1) {
        throw new HttpError(500, 'Something went wrong');
      }
      return rows[0];
    },
    getAllEvents: async () => {
      const { rows } = await pool.query<EventRecord>(
        `
        SELECT ${EVENT_COLUMNS}
        FROM events
        ORDER BY date, id
        `,
      );
      return rows;
    },
    getEventById: async (id) => {
      const { rows } = await pool.query<EventRecord, [number]>(
        `
        SELECT ${EVENT_COLUMNS}
        FROM events
        WHERE id = $1
        `,
        [id],
      );
      return rows[0] ?? null;
    },
    addEvent: async ({ title, description, date, capacity }) => {
      const { rows, rowCount } = await pool.query<EventRecord, [string, string, Date, number]>(
        `
        INSERT INTO events (title, description, date, capacity)
        VALUES ($1, $2, $3, $4)
        RETURNING ${EVENT_COLUMNS}
        `,
        [title, description, date, capacity],
      );
      if (rowCount !== 1) {
        throw new HttpError(500, 'Something went wrong');
      }
      return rows[0];
    },
    getRegistrationsByEvent: async (eventId) => {
      const { rows } = await pool.query<RegistrationRecord, [number]>(
        `
        SELECT ${REGISTRATION_COLUMNS}
        FROM registrations
        WHERE event_id = $1
        ORDER BY id
        `,
        [eventId],
      );
      return rows;
    },
    addRegistration: async (eventId, personId) => {
      try {
        const { rows, rowCount } = await pool.query<RegistrationRecord, [number, number]>(
          `
          INSERT INTO registrations (event_id, person_id)
          VALUES ($1, $2)
          RETURNING ${REGISTRATION_COLUMNS}
          `,
          [eventId, personId],
        );
        if (rowCount !== 1) {
          throw new HttpError(500, 'Something went wrong');
        }
        return rows[0];
      } catch (error) {
        const code = (error as { code?: string }).code;
        // 23503 = foreign_key_violation (pessoa ou evento inexistente)
        if (code === '23503') {
          throw new HttpError(404, 'Pessoa ou evento não encontrado.');
        }
        // 23505 = unique_violation (proteção extra contra inscrições simultâneas duplicadas)
        if (code === '23505') {
          throw new HttpError(409, 'Usuário já está inscrito neste evento.');
        }
        throw error;
      }
    },
  };
};
