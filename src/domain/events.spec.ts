import { describe, it, expect } from 'vitest';
import { BusinessRuleError, EventDomain } from './events';

const now = new Date('2026-11-25T12:00:00.000Z');
const tomorrow = new Date('2026-11-26T12:00:00.000Z');

describe('EventDomain - Regras de Negócio', () => {
  describe('Cadastro de Eventos', () => {
    it('deve criar um evento com sucesso quando os dados forem válidos (Caso de Sucesso)', () => {
      const result = EventDomain.validateAndCreateEvent(
        {
          title: '  Workshop de TypeScript  ',
          description: 'Aprenda desenvolvimento ágil com Node.js e TS',
          date: tomorrow,
          capacity: 50,
        },
        now,
      );

      expect(result.title).toBe('Workshop de TypeScript');
      expect(result.capacity).toBe(50);
      expect(result.date).toEqual(tomorrow);
    });

    it('deve aceitar título com exatamente 3 caracteres (Caso de Limite)', () => {
      const result = EventDomain.validateAndCreateEvent(
        { title: 'TDS', description: 'Aula', date: tomorrow, capacity: 1 },
        now,
      );

      expect(result.title).toBe('TDS');
    });

    it('deve lançar erro se o título for menor que 3 caracteres (Caso de Erro)', () => {
      expect(() =>
        EventDomain.validateAndCreateEvent(
          { title: 'AB', description: 'Descrição do evento', date: tomorrow, capacity: 20 },
          now,
        ),
      ).toThrow('O título do evento deve ter no mínimo 3 caracteres.');
    });

    it('deve lançar erro se a descrição estiver vazia (Caso de Erro)', () => {
      expect(() =>
        EventDomain.validateAndCreateEvent(
          { title: 'Palestra', description: '   ', date: tomorrow, capacity: 20 },
          now,
        ),
      ).toThrow('A descrição do evento é obrigatória.');
    });

    it('deve lançar erro se a data for inválida (Entrada Inválida)', () => {
      expect(() =>
        EventDomain.validateAndCreateEvent(
          { title: 'Palestra', description: 'Desc', date: 'não-é-data', capacity: 20 },
          now,
        ),
      ).toThrow('A data do evento é inválida.');
    });

    it('deve lançar erro se a data for exatamente agora (Caso de Limite)', () => {
      expect(() =>
        EventDomain.validateAndCreateEvent(
          { title: 'Palestra', description: 'Desc', date: now, capacity: 20 },
          now,
        ),
      ).toThrow('A data do evento deve ser no futuro.');
    });

    it('deve lançar erro se a capacidade for zero (Caso de Limite)', () => {
      expect(() =>
        EventDomain.validateAndCreateEvent(
          {
            title: 'Palestra de IA',
            description: 'Visão geral de IA',
            date: tomorrow,
            capacity: 0,
          },
          now,
        ),
      ).toThrow('A capacidade máxima deve ser um número inteiro maior que zero.');
    });

    it('deve lançar erro se a capacidade não for inteira (Entrada Inválida)', () => {
      expect(() =>
        EventDomain.validateAndCreateEvent(
          { title: 'Palestra', description: 'Desc', date: tomorrow, capacity: 2.5 },
          now,
        ),
      ).toThrow(BusinessRuleError);
    });
  });

  describe('Inscrição em Eventos', () => {
    it('deve inscrever usuário com sucesso em evento com vagas (Caso de Sucesso)', () => {
      const result = EventDomain.registerUserInEvent({
        eventId: 1,
        userId: 1,
        existingRegistrations: [],
        currentParticipantsCount: 10,
        eventCapacity: 20,
      });

      expect(result.status).toBe('CONFIRMED');
    });

    it('deve aceitar a inscrição que ocupa a última vaga (Caso de Limite)', () => {
      const result = EventDomain.registerUserInEvent({
        eventId: 1,
        userId: 10,
        existingRegistrations: [],
        currentParticipantsCount: 9,
        eventCapacity: 10,
      });

      expect(result.status).toBe('CONFIRMED');
    });

    it('deve recusar inscrição de usuário duplicado no mesmo evento (Caso de Erro)', () => {
      expect(() =>
        EventDomain.registerUserInEvent({
          eventId: 1,
          userId: 1,
          existingRegistrations: [{ eventId: 1, userId: 1 }],
          currentParticipantsCount: 1,
          eventCapacity: 10,
        }),
      ).toThrow('Usuário já está inscrito neste evento.');
    });

    it('deve permitir o mesmo usuário em eventos diferentes', () => {
      const result = EventDomain.registerUserInEvent({
        eventId: 2,
        userId: 1,
        existingRegistrations: [{ eventId: 1, userId: 1 }],
        currentParticipantsCount: 0,
        eventCapacity: 10,
      });

      expect(result.status).toBe('CONFIRMED');
    });

    it('deve recusar inscrição quando o evento atingir a capacidade máxima (Caso de Limite)', () => {
      expect(() =>
        EventDomain.registerUserInEvent({
          eventId: 1,
          userId: 2,
          existingRegistrations: [{ eventId: 1, userId: 1 }],
          currentParticipantsCount: 10,
          eventCapacity: 10,
        }),
      ).toThrow('Limite de vagas para este evento foi atingido.');
    });
  });
});
