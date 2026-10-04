import { Request, Response } from "express";
import { AppContext } from "../app";
import { EventDomain } from "../domain/events";

export const makeEventController = (ctx: AppContext) => {
  // Pega a instância do banco a partir do contexto (pool ou db)
  const dbClient = (ctx as any).pool || (ctx as any).db;

  return {
    // Listar eventos
    getAllEvents: async (req: Request, res: Response) => {
      try {
        const events = await dbClient.query("SELECT * FROM events;");
        return res.status(200).json(events.rows);
      } catch (error) {
        return res.status(500).json({ error: "Erro ao buscar eventos." });
      }
    },

    // Criar evento (Com validação de domínio e retorno HTTP Status 201)
    addEvent: async (req: Request, res: Response) => {
      try {
        const { title, name, description, date, capacity } = req.body;
        const eventTitle = title || name;

        // 1. Validação de domínio pura
        const validatedEvent = EventDomain.validateAndCreateEvent({
          title: eventTitle,
          description: description || "Sem descrição",
          date: new Date(date),
          capacity: Number(capacity || 50),
        });

        // 2. Persistência no banco utilizando a tabela do projeto
        const result = await dbClient.query(
          "INSERT INTO events (name, date) VALUES ($1, $2) RETURNING *;",
          [validatedEvent.title, validatedEvent.date]
        );

        // Retorna HTTP Status 201 Created
        return res.status(201).json(result.rows[0]);
      } catch (error: any) {
        return res.status(400).json({ error: error.message });
      }
    },

    // Inscrever usuário no evento
    registerParticipant: async (req: Request, res: Response) => {
      try {
        const { eventId, userId, personId } = req.body;
        const targetUserId = userId || personId;

        // 1. Buscar inscrições existentes
        const existingRegs = await dbClient.query(
          'SELECT event_id as "eventId", person_id as "userId" FROM registrations WHERE event_id = $1;',
          [eventId]
        );

        // 2. Buscar o evento no banco
        const eventQuery = await dbClient.query(
          "SELECT id FROM events WHERE id = $1;",
          [eventId]
        );

        if (eventQuery.rows.length === 0) {
          return res.status(404).json({ error: "Evento não encontrado." });
        }

        // 3. Validação de domínio (duplicidade e vagas)
        EventDomain.registerUserInEvent({
          eventId,
          userId: targetUserId,
          existingRegistrations: existingRegs.rows || [],
          currentParticipantsCount: existingRegs.rows.length,
          eventCapacity: 50,
        });

        // 4. Inserção na tabela de inscrições
        await dbClient.query(
          "INSERT INTO registrations (event_id, person_id) VALUES ($1, $2);",
          [eventId, targetUserId]
        );

        return res.status(201).json({ message: "Inscrição realizada com sucesso." });
      } catch (error: any) {
        return res.status(400).json({ error: error.message });
      }
    },
  };
};