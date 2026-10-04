import { describe, it, expect } from "vitest";
import { EventDomain } from "./events";

describe("EventDomain - Regras de Negócio", () => {
  describe("Cadastro de Eventos", () => {
    it("deve criar um evento com sucesso quando os dados forem válidos (Caso de Sucesso)", () => {
      const validEvent = {
        title: "Workshop de TypeScript",
        description: "Aprenda desenvolvimento ágil com Node.js e TS",
        date: new Date(Date.now() + 86400000), // Amanhã
        capacity: 50,
      };

      const result = EventDomain.validateAndCreateEvent(validEvent);

      expect(result.title).toBe("Workshop de TypeScript");
      expect(result.capacity).toBe(50);
    });

    it("deve lançar erro se o título for menor que 3 caracteres (Caso de Erro)", () => {
      const invalidEvent = {
        title: "AB",
        description: "Descrição do evento",
        date: new Date(Date.now() + 86400000),
        capacity: 20,
      };

      expect(() => EventDomain.validateAndCreateEvent(invalidEvent)).toThrow(
        "O título do evento deve ter no mínimo 3 caracteres."
      );
    });

    it("deve lançar erro se a capacidade for zero ou negativa (Caso de Limite / Entrada Inválida)", () => {
      const invalidCapacity = {
        title: "Palestra de IA",
        description: "Visão geral de IA",
        date: new Date(Date.now() + 86400000),
        capacity: 0,
      };

      expect(() => EventDomain.validateAndCreateEvent(invalidCapacity)).toThrow(
        "A capacidade máxima deve ser um número inteiro maior que zero."
      );
    });
  });

  describe("Inscrição em Eventos", () => {
    it("deve inscrever usuário com sucesso em evento com vagas (Caso de Sucesso)", () => {
      const registration = {
        eventId: "event-1",
        userId: "user-1",
        existingRegistrations: [],
        currentParticipantsCount: 10,
        eventCapacity: 20,
      };

      const result = EventDomain.registerUserInEvent(registration);

      expect(result.status).toBe("CONFIRMED");
    });

    it("deve recusar inscrição de usuário duplicado no mesmo evento (Caso de Erro)", () => {
      const duplicateRegistration = {
        eventId: "event-1",
        userId: "user-1",
        existingRegistrations: [{ eventId: "event-1", userId: "user-1" }],
        currentParticipantsCount: 1,
        eventCapacity: 10,
      };

      expect(() => EventDomain.registerUserInEvent(duplicateRegistration)).toThrow(
        "Usuário já está inscrito neste evento."
      );
    });

    it("deve recusar inscrição quando o evento atingir a capacidade máxima (Caso de Limite)", () => {
      const limitRegistration = {
        eventId: "event-1",
        userId: "user-2",
        existingRegistrations: [{ eventId: "event-1", userId: "user-1" }],
        currentParticipantsCount: 10,
        eventCapacity: 10, // Evento lotado (10/10)
      };

      expect(() => EventDomain.registerUserInEvent(limitRegistration)).toThrow(
        "Limite de vagas para este evento foi atingido."
      );
    });
  });
});