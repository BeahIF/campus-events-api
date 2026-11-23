/**
 * Regras de negócio do domínio de eventos.
 *
 * Este módulo não depende de Express, HTTP ou banco de dados, para que as regras
 * possam ser testadas isoladamente (testes unitários em events.spec.ts).
 */

export type BusinessRuleCode = 'INVALID_EVENT' | 'DUPLICATE_REGISTRATION' | 'EVENT_FULL';

export class BusinessRuleError extends Error {
  readonly code: BusinessRuleCode;

  constructor(code: BusinessRuleCode, message: string) {
    super(message);
    this.name = 'BusinessRuleError';
    this.code = code;
  }
}

export interface EventInput {
  title: string;
  description: string;
  date: Date | string;
  capacity: number;
}

export interface ValidEvent {
  title: string;
  description: string;
  date: Date;
  capacity: number;
}

export interface RegistrationInput {
  eventId: string | number;
  userId: string | number;
  existingRegistrations: Array<{ eventId: string | number; userId: string | number }>;
  currentParticipantsCount: number;
  eventCapacity: number;
}

export class EventDomain {
  // Regra 1: validação do cadastro de eventos
  static validateAndCreateEvent(input: EventInput, now: Date = new Date()): ValidEvent {
    if (!input.title || input.title.trim().length < 3) {
      throw new BusinessRuleError(
        'INVALID_EVENT',
        'O título do evento deve ter no mínimo 3 caracteres.',
      );
    }

    if (!input.description || input.description.trim().length === 0) {
      throw new BusinessRuleError('INVALID_EVENT', 'A descrição do evento é obrigatória.');
    }

    const date = new Date(input.date);
    if (Number.isNaN(date.getTime())) {
      throw new BusinessRuleError('INVALID_EVENT', 'A data do evento é inválida.');
    }

    if (date <= now) {
      throw new BusinessRuleError('INVALID_EVENT', 'A data do evento deve ser no futuro.');
    }

    if (!Number.isInteger(input.capacity) || input.capacity <= 0) {
      throw new BusinessRuleError(
        'INVALID_EVENT',
        'A capacidade máxima deve ser um número inteiro maior que zero.',
      );
    }

    return {
      title: input.title.trim(),
      description: input.description.trim(),
      date,
      capacity: input.capacity,
    };
  }

  // Regra 2: validação da inscrição em eventos (duplicidade e vagas)
  static registerUserInEvent(input: RegistrationInput) {
    const isAlreadyRegistered = input.existingRegistrations.some(
      (reg) =>
        String(reg.eventId) === String(input.eventId) &&
        String(reg.userId) === String(input.userId),
    );

    if (isAlreadyRegistered) {
      throw new BusinessRuleError(
        'DUPLICATE_REGISTRATION',
        'Usuário já está inscrito neste evento.',
      );
    }

    if (input.currentParticipantsCount >= input.eventCapacity) {
      throw new BusinessRuleError('EVENT_FULL', 'Limite de vagas para este evento foi atingido.');
    }

    return {
      eventId: input.eventId,
      userId: input.userId,
      status: 'CONFIRMED' as const,
    };
  }
}
