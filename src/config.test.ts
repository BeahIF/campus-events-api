import { describe, it, expect, vi, afterEach } from 'vitest';
import { validateEnv } from './config';

vi.mock('./logger', () => ({
  makeLogger: () => ({ error: vi.fn() }),
}));

describe('validateEnv', () => {
  const originalEnv = process.env.DATABASE_URL;

  afterEach(() => {
    process.env.DATABASE_URL = originalEnv;
    vi.restoreAllMocks();
  });

  it('Encerra o processo quando DATABASE_URL está ausente', () => {
    delete process.env.DATABASE_URL;
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    expect(() => validateEnv()).toThrow('process.exit called');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('não encerra o processo quando DATABASE_URL está definida', () => {
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    expect(() => validateEnv()).not.toThrow();
    expect(exitSpy).not.toHaveBeenCalled();
  });
});
