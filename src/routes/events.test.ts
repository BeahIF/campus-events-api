import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import pino from 'pino';
import { getConfig } from '../config';
import { applyMigrations } from '../database/migrate';
import { getPool } from '../database/pool';
import { makeQueries } from '../database/queries';
import { makeApp } from '../app';
import { makeMiddleware } from '../middleware';

describe('events router', () => {
  const config = getConfig('TEST_');
  const app = makeApp({
    queries: makeQueries(config.databaseUrl),
    middleware: makeMiddleware(pino({ level: 'silent' })),
  });
  const future = () => new Date(Date.now() + 86400000).toISOString();
  beforeAll(() => applyMigrations(config.databaseUrl, 'up'));
  beforeEach(async () => {
    await getPool(config.databaseUrl).query('DELETE FROM events');
  });
  afterAll(async () => {
    await applyMigrations(config.databaseUrl, 'down');
    await getPool(config.databaseUrl).end();
  });

  it('returns an empty list before any event is created', async () => {
    const response = await request(app).get('/events');
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
  it('persists a valid event and trims its title', async () => {
    const input = { title: ' Workshop ', startsAt: future(), capacity: 1 };
    const created = await request(app).post('/events').send(input);
    expect(created.status).toBe(201);
    expect(created.body).toEqual({
      ...input,
      title: 'Workshop',
      id: expect.any(Number),
      description: null,
    });
    expect((await request(app).get('/events')).body).toEqual([created.body]);
  });
  it('lists events by date rather than insertion order', async () => {
    const later = {
      title: 'Later',
      startsAt: new Date(Date.now() + 172800000).toISOString(),
      capacity: 5,
    };
    await request(app).post('/events').send(later).expect(201);
    await request(app)
      .post('/events')
      .send({ ...later, title: 'Earlier', startsAt: future() })
      .expect(201);
    expect(
      (await request(app).get('/events')).body.map((event: { title: string }) => event.title),
    ).toEqual(['Earlier', 'Later']);
  });
  it.each([
    { title: '   ' },
    { capacity: 0 },
    { capacity: 1.5 },
    { capacity: 2147483648 },
    { startsAt: '2020-01-01T12:00:00Z' },
    { startsAt: '2030-01-01T12:00:00' },
    { startsAt: 'invalid' },
    { title: 'a'.repeat(256) },
  ])('rejects invalid input without persisting it: %j', async (invalid) => {
    await request(app)
      .post('/events')
      .send({ title: 'Event', startsAt: future(), capacity: 10, ...invalid })
      .expect(400);
    expect((await request(app).get('/events')).body).toEqual([]);
  });
});
