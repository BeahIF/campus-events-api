import { getPool } from './pool';
import { makePeopleQueries } from './queries/people';
import { makeEventQueries } from './queries/events';
import { makeRegistrationQueries } from './queries/registrations';
import type { Person } from './types';
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
    ...makePeopleQueries(pool),
    ...makeEventQueries(pool),
    ...makeRegistrationQueries(pool),

    checkConnection: async (): Promise<boolean> => {
      try {
        const { rows } = await pool.query<{ conn_test: number }>('SELECT 1 as conn_test');

        return rows[0].conn_test === 1;
      } catch {
        return false;
      }
    },
  };
};
