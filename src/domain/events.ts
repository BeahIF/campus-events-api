type CanRegisterArgs = {
  capacity: number;
  registrations: string[];
  userId: string;
};

type CanRegisterResult =
  | { allowed: true }
  | { allowed: false; reason: 'duplicate' | 'full' };

export const canRegister = ({
  capacity,
  registrations,
  userId,
}: CanRegisterArgs): CanRegisterResult => {
  if (!Number.isInteger(capacity) || capacity < 0) {
    throw new Error('capacity must be a non-negative integer');
  }

  if (!userId.trim()) {
    throw new Error('userId must not be empty');
  }

  if (registrations.includes(userId)) {
    return {
      allowed: false,
      reason: 'duplicate',
    };
  }

  if (registrations.length >= capacity) {
    return {
      allowed: false,
      reason: 'full',
    };
  }

  return {
    allowed: true,
  };
};

type EventInput = {
  name?: unknown;
  date?: unknown;
  capacity?: unknown;
};

type ValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

export const validateEventInput = (
  input: EventInput,
): ValidationResult => {
  const errors: string[] = [];

  if (
    typeof input.name !== 'string' ||
    !input.name.trim()
  ) {
    errors.push('name is required');
  }

  if (
    typeof input.date !== 'string' ||
    !input.date.trim()
  ) {
    errors.push('date is required');
  }

  if (
    typeof input.capacity !== 'number' ||
    !Number.isInteger(input.capacity) ||
    input.capacity <= 0
  ) {
    errors.push('capacity must be greater than zero');
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
    };
  }

  return {
    valid: true,
  };
};