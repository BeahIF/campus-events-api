export interface EventInput {
  title: string;
  description: string;
  date: Date;
  capacity: number;
}

export interface RegistrationInput {
  eventId: string;
  userId: string;
  existingRegistrations: Array<{ eventId: string; userId: string }>;
  currentParticipantsCount: number;
  eventCapacity: number;
}

export class EventDomain {
  // Regra 1: Validação de Cadastro de Eventos
  static validateAndCreateEvent(input: EventInput) {
    if (!input.title || input.title.trim().length < 3) {
      throw new Error("O título do evento deve ter no mínimo 3 caracteres.");
    }

    if (!input.description || input.description.trim().length === 0) {
      throw new Error("A descrição do evento é obrigatória.");
    }

    if (!input.date || new Date(input.date) <= new Date()) {
      throw new Error("A data do evento deve ser no futuro.");
    }

    if (!input.capacity || input.capacity <= 0 || !Number.isInteger(input.capacity)) {
      throw new Error("A capacidade máxima deve ser um número inteiro maior que zero.");
    }

    return {
      title: input.title.trim(),
      description: input.description.trim(),
      date: new Date(input.date),
      capacity: input.capacity,
    };
  }

  // Regra 2: Validação de Inscrição em Eventos
  static registerUserInEvent(input: RegistrationInput) {
    const isAlreadyRegistered = input.existingRegistrations.some(
      (reg) => reg.eventId === input.eventId && reg.userId === input.userId
    );

    if (isAlreadyRegistered) {
      throw new Error("Usuário já está inscrito neste evento.");
    }

    if (input.currentParticipantsCount >= input.eventCapacity) {
      throw new Error("Limite de vagas para este evento foi atingido.");
    }

    return {
      eventId: input.eventId,
      userId: input.userId,
      status: "CONFIRMED",
    };
  }
}