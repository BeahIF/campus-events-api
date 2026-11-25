import type { Pool } from 'pg';
import type { CampusEvent, EventInput } from '../../routes/events';

export const makeEventQueries = (pool: Pool) => ({
  getEvents: async (): Promise<CampusEvent[]> => {
    const { rows } = await pool.query<CampusEvent>(
      'SELECT id, title, description, starts_at AS "startsAt", capacity FROM events ORDER BY starts_at, id',
    );

    return rows;
  },

  addEvent: async ({
    title,
    description,
    startsAt,
    capacity,
  }: EventInput): Promise<CampusEvent> => {
    const { rows } = await pool.query<CampusEvent>(
      `INSERT INTO events (title, description, starts_at, capacity) VALUES ($1, $2, $3, $4)
       RETURNING id, title, description, starts_at AS "startsAt", capacity`,
      [title, description ?? null, startsAt, capacity],
    );

    return rows[0];
  },
});

export type EventQueries = ReturnType<typeof makeEventQueries>;
