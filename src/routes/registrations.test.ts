import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import pino from 'pino';
import { getConfig } from '../config';
import { applyMigrations } from '../database/migrate';
import { getPool } from '../database/pool';
import { makeQueries } from '../database/queries';
import { makeApp } from '../app';
import { makeMiddleware } from '../middleware';

describe('registrations router', () => {
  const config = getConfig('TEST_');
  const pool = getPool(config.databaseUrl);
  const app = makeApp({
    queries: makeQueries(config.databaseUrl),
    middleware: makeMiddleware(pino({ level: 'silent' })),
  });
  const person = { name: 'Ana', email: 'ana@example.com' };
  async function createEvent(capacity = 2) {
    const response = await request(app)
      .post('/events')
      .send({
        title: 'Workshop',
        startsAt: new Date(Date.now() + 86400000).toISOString(),
        capacity,
      })
      .expect(201);
    return response.body.id as number;
  }
  const register = (id: number | string, body = person) =>
    request(app).post(`/events/${id}/registrations`).send(body);
  beforeAll(() => applyMigrations(config.databaseUrl, 'up'));
  beforeEach(async () => {
    await pool.query('DELETE FROM registrations');
    await pool.query('DELETE FROM events');
  });
  afterAll(async () => {
    await applyMigrations(config.databaseUrl, 'down');
    await pool.end();
  });

  it('persists a participant with normalized name and email', async () => {
    const id = await createEvent();
    const result = await register(id, { name: ' Ana ', email: ' ANA@EXAMPLE.COM ' });
    expect(result.status).toBe(201);
    expect(result.body).toEqual({
      id: expect.any(Number),
      eventId: id,
      ...person,
      createdAt: expect.any(String),
    });
    expect(
      (await pool.query('SELECT email FROM registrations WHERE event_id = $1', [id])).rows,
    ).toEqual([{ email: person.email }]);
  });
  it('rejects duplicate email regardless of case and permits the same email in another event', async () => {
    const id = await createEvent();
    await register(id).expect(201);
    await register(id, { ...person, email: ' ANA@EXAMPLE.COM ' }).expect(409);
    await register(await createEvent()).expect(201);
  });
  it('allows the last seat and rejects the next participant', async () => {
    const id = await createEvent(1);
    await register(id).expect(201);
    await register(id, { name: 'Bia', email: 'bia@example.com' }).expect(409);
  });
  it('serializes concurrent requests for the last seat', async () => {
    const id = await createEvent(1);
    const responses = await Promise.all([
      register(id),
      register(id, { name: 'Bia', email: 'bia@example.com' }),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(
      (
        await pool.query('SELECT count(*)::int AS total FROM registrations WHERE event_id = $1', [
          id,
        ])
      ).rows[0].total,
    ).toBe(1);
  });
  it('rejects simultaneous duplicate registrations without a server error', async () => {
    const id = await createEvent();
    const responses = await Promise.all([register(id), register(id)]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
  });
  it('rejects an event that has already started without inserting a registration', async () => {
    const id = await createEvent();
    await pool.query("UPDATE events SET starts_at = now() - interval '1 second' WHERE id = $1", [
      id,
    ]);
    await register(id).expect(409);
    expect((await pool.query('SELECT * FROM registrations')).rows).toEqual([]);
  });
  it('returns 404 for a missing event', async () => {
    await register(2147483647).expect(404);
  });
  it.each(['0', '-1', '1.5', 'abc', '2147483648', '1e2'])(
    'rejects invalid event id %s',
    async (id) => {
      await register(id).expect(400);
    },
  );
  it.each([
    { name: '', email: 'ana@example.com' },
    { name: 'Ana', email: 'invalid' },
    { name: 'a'.repeat(256), email: 'ana@example.com' },
  ])('rejects invalid participant %j', async (body) => {
    await register(await createEvent(), body).expect(400);
    expect((await pool.query('SELECT * FROM registrations')).rows).toEqual([]);
  });
});
