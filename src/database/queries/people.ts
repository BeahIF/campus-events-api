import { HttpError } from '../../errors';
import type { Pool } from 'pg';
import type { Person } from '../types';

export const makePeopleQueries = (pool: Pool) => ({
  getAllPeople: async (): Promise<Person[]> => {
    const { rows } = await pool.query<Person>(
      `
      SELECT name, age
      FROM people
      `,
    );

    return rows;
  },

  addPerson: async ({ name, age }: Person): Promise<Person> => {
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
});

export type PeopleQueries = ReturnType<typeof makePeopleQueries>;
