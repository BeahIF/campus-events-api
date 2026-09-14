import { describe, expect, it } from 'vitest';
import { canRegister } from './events';

describe('canRegister', () => {
  it('allows registration when there is an available spot', () => {
    // Arrange
    const capacity = 3;
    const registrations = ['user-1'];
    const userId = 'user-2';

    // Act
    const result = canRegister({
      capacity,
      registrations,
      userId,
    });

    // Assert
    expect(result).toEqual({
      allowed: true,
    });
  });

  it('denies registration when the user is already registered', () => {
    // Arrange
    const capacity = 3;
    const registrations = ['user-1', 'user-2'];
    const userId = 'user-2';

    // Act
    const result = canRegister({
      capacity,
      registrations,
      userId,
    });

    // Assert
    expect(result).toEqual({
      allowed: false,
      reason: 'duplicate',
    });
  });

  it('denies registration when the event is full', () => {
    // Arrange
    const capacity = 2;
    const registrations = ['user-1', 'user-2'];
    const userId = 'user-3';

    // Act
    const result = canRegister({
      capacity,
      registrations,
      userId,
    });

    // Assert
    expect(result).toEqual({
      allowed: false,
      reason: 'full',
    });
  });

  it('allows registration in the last available spot', () => {
    // Arrange
    const capacity = 2;
    const registrations = ['user-1'];
    const userId = 'user-2';

    // Act
    const result = canRegister({
      capacity,
      registrations,
      userId,
    });

    // Assert
    expect(result).toEqual({
      allowed: true,
    });
  });

  it('denies registration when capacity is zero', () => {
    // Arrange
    const capacity = 0;
    const registrations: string[] = [];
    const userId = 'user-1';

    // Act
    const result = canRegister({
      capacity,
      registrations,
      userId,
    });

    // Assert
    expect(result).toEqual({
      allowed: false,
      reason: 'full',
    });
  });

  it('throws an error when capacity is negative', () => {
    // Arrange
    const capacity = -1;
    const registrations: string[] = [];
    const userId = 'user-1';

    // Act and Assert
    expect(() =>
      canRegister({
        capacity,
        registrations,
        userId,
      }),
    ).toThrow('capacity must be a non-negative integer');
  });

  it('throws an error when capacity is not an integer', () => {
    // Arrange
    const capacity = 2.5;
    const registrations: string[] = [];
    const userId = 'user-1';

    // Act and Assert
    expect(() =>
      canRegister({
        capacity,
        registrations,
        userId,
      }),
    ).toThrow('capacity must be a non-negative integer');
  });

  it('throws an error when userId is empty', () => {
    // Arrange
    const capacity = 2;
    const registrations: string[] = [];
    const userId = '';

    // Act and Assert
    expect(() =>
      canRegister({
        capacity,
        registrations,
        userId,
      }),
    ).toThrow('userId must not be empty');
  });
});