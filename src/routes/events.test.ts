import { describe, expect, it } from 'vitest';
import { Express } from 'express';
import request from 'supertest';
import { makeApp } from '../app';
import { makeMiddleware } from '../middleware';
import { makeQueries } from '../database/queries';
import { getConfig } from '../config';
import pino from 'pino';

const logger = pino({ level: 'silent' });

describe('events router', () => {
  const config = getConfig('TEST_');
  const middleware = makeMiddleware(logger);
  const queries = makeQueries(config.databaseUrl);
  const app: Express = makeApp({ queries, middleware });

  describe('POST /events', () => {
    it('responds with 201 for valid event', async () => {
      const response = await request(app)
        .post('/events')
        .send({ name: 'Semana Acadêmica', date: '2026-09-16', capacity: 30 });
      expect(response.statusCode).toBe(201);
    });

    it.each([
      [{ date: '2026-09-16', capacity: 10 }, 'name is required'],
      [{ name: 'JS Day', capacity: 10 }, 'date is required'],
      [{ name: 'JS Day', date: '2026-09-16', capacity: 0 }, 'capacity must be greater than zero'],
    ])('responds with 400 for invalid event %#', async (body, expectedError) => {
      const response = await request(app).post('/events').send(body);
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toContain(expectedError);
    });
  });
});
