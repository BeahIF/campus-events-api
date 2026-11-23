import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Express } from 'express';
import request from 'supertest';
import pino from 'pino';
import { getConfig } from '../config';
import { applyMigrations } from '../database/migrate';
import { getPool } from '../database/pool';
import { Queries, makeQueries } from '../database/queries';
import { makeApp } from '../app';
import { makeMiddleware } from '../middleware';

const logger = pino({ level: 'silent' });

const futureDate = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

const validEvent = () => ({
  title: 'Semana Acadêmica de TI',
  description: 'Palestras e oficinas sobre desenvolvimento de sistemas',
  date: futureDate(),
  capacity: 2,
});

const errorBody = (status: number) => ({
  status,
  message: expect.any(String),
  name: expect.any(String),
});

describe('events router', () => {
  const config = getConfig('TEST_');
  let app: Express;
  let queries: Queries;

  beforeAll(async () => {
    await applyMigrations(config.databaseUrl, 'up');
    const middleware = makeMiddleware(logger);
    queries = makeQueries(config.databaseUrl);
    app = makeApp({ queries, middleware });
  });

  beforeEach(async () => {
    const pool = getPool(config.databaseUrl);
    await pool.query('DELETE FROM registrations');
    await pool.query('DELETE FROM events');
    await pool.query('DELETE FROM people');
  });

  afterAll(async () => {
    await applyMigrations(config.databaseUrl, 'down');
    await getPool(config.databaseUrl).end();
  });

  describe('POST /events', () => {
    it('cria um evento válido e responde 201', async () => {
      const body = validEvent();
      const response = await request(app).post('/events').send(body);

      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual({
        id: expect.any(Number),
        title: body.title,
        description: body.description,
        date: body.date,
        capacity: 2,
      });
      expect(await queries.getAllEvents()).toHaveLength(1);
    });

    it('responde 400 quando a data está no passado (regra de negócio)', async () => {
      const response = await request(app)
        .post('/events')
        .send({ ...validEvent(), date: '2020-01-01T00:00:00.000Z' });

      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual(errorBody(400));
      expect(await queries.getAllEvents()).toHaveLength(0);
    });

    it('responde 400 quando faltam campos obrigatórios', async () => {
      const response = await request(app).post('/events').send({ title: 'Sem dados' });

      expect(response.statusCode).toBe(400);
      expect(response.body).toEqual(errorBody(400));
    });
  });

  describe('GET /events e GET /events/:id', () => {
    it('lista os eventos cadastrados', async () => {
      await request(app).post('/events').send(validEvent());

      const response = await request(app).get('/events');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it('responde 404 para evento inexistente', async () => {
      const response = await request(app).get('/events/999999');

      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual(errorBody(404));
    });

    it('responde 400 para id inválido', async () => {
      const response = await request(app).get('/events/abc');

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /events/:id/registrations', () => {
    it('inscreve uma pessoa e responde 201', async () => {
      const event = await queries.addEvent({ ...validEvent(), date: new Date(futureDate()) });
      const person = await queries.addPerson({ name: 'Ana', age: 22 });

      const response = await request(app)
        .post(`/events/${event.id}/registrations`)
        .send({ personId: person.id });

      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual({
        id: expect.any(Number),
        eventId: event.id,
        personId: person.id,
        createdAt: expect.any(String),
      });
    });

    it('responde 409 ao tentar inscrever a mesma pessoa duas vezes', async () => {
      const event = await queries.addEvent({ ...validEvent(), date: new Date(futureDate()) });
      const person = await queries.addPerson({ name: 'Ana', age: 22 });
      const url = `/events/${event.id}/registrations`;

      await request(app).post(url).send({ personId: person.id });
      const response = await request(app).post(url).send({ personId: person.id });

      expect(response.statusCode).toBe(409);
      expect(response.body).toEqual(errorBody(409));
      expect(await queries.getRegistrationsByEvent(event.id)).toHaveLength(1);
    });

    it('responde 409 quando o evento já atingiu a capacidade', async () => {
      const event = await queries.addEvent({
        ...validEvent(),
        date: new Date(futureDate()),
        capacity: 1,
      });
      const ana = await queries.addPerson({ name: 'Ana', age: 22 });
      const bruno = await queries.addPerson({ name: 'Bruno', age: 23 });
      const url = `/events/${event.id}/registrations`;

      const first = await request(app).post(url).send({ personId: ana.id });
      const second = await request(app).post(url).send({ personId: bruno.id });

      expect(first.statusCode).toBe(201);
      expect(second.statusCode).toBe(409);
      expect(second.body.message).toBe('Limite de vagas para este evento foi atingido.');
    });

    it('responde 404 quando o evento não existe', async () => {
      const person = await queries.addPerson({ name: 'Ana', age: 22 });

      const response = await request(app)
        .post('/events/999999/registrations')
        .send({ personId: person.id });

      expect(response.statusCode).toBe(404);
    });

    it('responde 404 quando a pessoa não existe', async () => {
      const event = await queries.addEvent({ ...validEvent(), date: new Date(futureDate()) });

      const response = await request(app)
        .post(`/events/${event.id}/registrations`)
        .send({ personId: 999999 });

      expect(response.statusCode).toBe(404);
    });

    it('lista as inscrições de um evento', async () => {
      const event = await queries.addEvent({ ...validEvent(), date: new Date(futureDate()) });
      const person = await queries.addPerson({ name: 'Ana', age: 22 });
      await queries.addRegistration(event.id, person.id);

      const response = await request(app).get(`/events/${event.id}/registrations`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].personId).toBe(person.id);
    });
  });
});
