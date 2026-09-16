import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { Express } from "express";
import request from "supertest";
import pino from "pino";

import { getConfig } from "../config";
import { applyMigrations } from "../database/migrate";
import { getPool } from "../database/pool";
import { Queries, makeQueries } from "../database/queries";
import { makeApp } from "../app";
import { makeMiddleware } from "../middleware";

const logger = pino({ level: "silent" });
describe("events router", () => {
  const config = getConfig("TEST_");

  let app: Express;
  let queries: Queries;

  beforeAll(async () => {
    await applyMigrations(config.databaseUrl, "up");

    const pool = getPool(config.databaseUrl);

    const migrations = await pool.query(`
      SELECT id, name, run_on
      FROM migrations
      ORDER BY id
    `);

    console.log("MIGRATIONS:", migrations.rows);

    const table = await pool.query(`
      SELECT to_regclass('public.events')
        AS events_table
    `);

    console.log("EVENTS TABLE:", table.rows[0]);

    const middleware = makeMiddleware(logger);

    queries = makeQueries(config.databaseUrl);

    app = makeApp({
      queries,
      middleware,
    });
  });
  beforeEach(async () => {
    const pool = getPool(config.databaseUrl);

    // await pool.query("DELETE FROM registrations");
    await pool.query("DELETE FROM events");
  });

  afterAll(async () => {
    await getPool(config.databaseUrl).end();
  });
  type EventOverrides = Partial<{
    name: string;
    date: string;
    capacity: number;
  }>;

  async function createEvent(overrides: EventOverrides = {}) {
    const data = {
      name: "Evento teste",
      date: "2026-10-01",
      capacity: 10,
      ...overrides,
    };

    const result = await getPool(config.databaseUrl).query(
      `INSERT INTO events (name, date, capacity)
     VALUES ($1, $2, $3)
     RETURNING *`,
      [data.name, data.date, data.capacity],
    );

    return result.rows[0];
  }

  describe("POST /events", () => {
    it("creates a valid event", async () => {
      const response = await request(app).post("/events").send({
        name: "Semana Acadêmica",
        date: "2026-10-01",
        capacity: 30,
      });

      expect(response.statusCode).toBe(201);

      expect(response.headers["content-type"]).toContain("application/json");

      expect(response.body).toMatchObject({
        name: "Semana Acadêmica",
        capacity: 30,
      });
    });
    it("persists the created event in the database", async () => {
      await request(app).post("/events").send({
        name: "Semana Acadêmica",
        date: "2026-10-01",
        capacity: 30,
      });

      const pool = getPool(config.databaseUrl);

      const result = await pool.query(
        `SELECT name, capacity
     FROM events
     WHERE name = $1`,
        ["Semana Acadêmica"],
      );

      expect(result.rows).toHaveLength(1);

      expect(result.rows[0]).toMatchObject({
        name: "Semana Acadêmica",
        capacity: 30,
      });
    });
    it.each([
      ["missing name", { date: "2026-10-01", capacity: 30 }],
      ["capacity zero", { name: "Evento A", date: "2026-10-01", capacity: 0 }],
      [
        "negative capacity",
        { name: "Evento A", date: "2026-10-01", capacity: -1 },
      ],
      [
        "capacity as string",
        { name: "Evento A", date: "2026-10-01", capacity: "30" },
      ],
    ])("returns 400: %s", async (_case, body) => {
      const response = await request(app).post("/events").send(body);

      expect(response.statusCode).toBe(400);
      expect(response.headers["content-type"]).toContain("application/json");
      const result = await getPool(config.databaseUrl).query(
        "SELECT COUNT(*)::int AS count FROM events",
      );

      expect(result.rows[0].count).toBe(0);
    });
    it("rejects capacity zero", async () => {
      const response = await request(app).post("/events").send({
        name: "Evento teste",
        date: "2026-10-01",
        capacity: 0,
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("GET /events", () => {
    it("returns all events", async () => {
      // Arrange
      await createEvent({
        name: "Workshop Git",
        capacity: 50,
      });

      await createEvent({
        name: "Semana Acadêmica",
        capacity: 100,
      });

      // Act
      const response = await request(app).get("/events");

      // Assert
      expect(response.statusCode).toBe(200);

      expect(response.body).toHaveLength(2);
    });
    it("returns 500 when database fails", async () => {
      vi.spyOn(queries, "addEvent").mockRejectedValueOnce(
        new Error("Database unavailable"),
      );

      const response = await request(app).post("/events").send({
        name: "Semana Acadêmica",
        date: "2026-10-01",
        capacity: 30,
      });

      expect(response.statusCode).toBe(500);
    });
  });
  describe("POST /registrations", () => {
    it("registers a user when the event has seats", async () => {
      const event = await createEvent({
        capacity: 2,
      });

      const response = await request(app)
        .post(`/events/${event.id}/registrations`)
        .send({ userId: 10 });

      expect(response.statusCode).toBe(201);

      const result = await getPool(config.databaseUrl).query(
        `SELECT event_id, user_id
     FROM registrations
     WHERE event_id = $1`,
        [event.id],
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].user_id).toBe(10);
    });
    it("rejects registration when event is full", async () => {
      const event = await createEvent({
        capacity: 1,
      });

      const pool = getPool(config.databaseUrl);

      await pool.query(
        `INSERT INTO registrations (event_id, user_id)
     VALUES ($1, $2)`,
        [event.id, 10],
      );

      const response = await request(app)
        .post(`/events/${event.id}/registrations`)
        .send({ userId: 11 });

      expect(response.statusCode).toBe(400);
      const result = await getPool(config.databaseUrl).query(
        `SELECT event_id, user_id
     FROM registrations
     WHERE event_id = $1`,
        [event.id],
      );

      expect(result.rows).toHaveLength(1);
    });
    it("rejects duplicate registration", async () => {
      const event = await createEvent({
        capacity: 10,
      });

      const pool = getPool(config.databaseUrl);

      await pool.query(
        `INSERT INTO registrations (event_id, user_id)
     VALUES ($1, $2)`,
        [event.id, 20],
      );

      const response = await request(app)
        .post(`/events/${event.id}/registrations`)
        .send({ userId: 20 });

      expect(response.statusCode).toBe(409);
    });
  });
});
