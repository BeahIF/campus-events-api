export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export function validateEventInput(input: unknown): ValidationResult {
  const errors: string[] = [];
  const event = input as Record<string, unknown>;

  if (typeof event.name !== "string" || !event.name.trim()) {
    errors.push("name is required");
  }

  if (typeof event.date !== "string" || !event.date.trim()) {
    errors.push("date is required");
  }

  if (!Number.isInteger(event.capacity) || Number(event.capacity) <= 0) {
    errors.push("capacity must be greater than zero");
  }

  return { valid: errors.length === 0, errors };
}

export type Registration = { userId: number };

export function canRegister(args: {
  capacity: number;
  registrations: Registration[];
  userId: number;
}) {
  const { capacity, registrations, userId } = args;

  if (registrations.some((r) => r.userId === userId)) {
    return { allowed: false, reason: "duplicate" as const };
  }

  if (registrations.length >= capacity) {
    return { allowed: false, reason: "full" as const };
  }

  return { allowed: true as const };
}
