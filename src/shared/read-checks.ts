/**
 * Format checks for values read from the database. They verify shape only, never business rules:
 * valid old data must always open, even if today's rules would reject it.
 */
import { isValidDayKey } from '@/shared/days';
import { isValidMonthKey } from '@/shared/months';

export class DataFormatError extends Error {
  constructor(field: string) {
    // Names the field only: financial values must not end up in error messages.
    super(`Stored data has the wrong format: ${field}`);
    this.name = 'DataFormatError';
  }
}

export function readInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) throw new DataFormatError(field);
  return value;
}

export function readPositiveInteger(value: unknown, field: string): number {
  const integer = readInteger(value, field);
  if (integer <= 0) throw new DataFormatError(field);
  return integer;
}

export function readText(value: unknown, field: string): string {
  if (typeof value !== 'string') throw new DataFormatError(field);
  return value;
}

export function readOneOf<T extends string>(value: unknown, options: readonly T[], field: string): T {
  if (!options.includes(value as T)) throw new DataFormatError(field);
  return value as T;
}

export function readMonth(value: unknown, field: string): string {
  if (!isValidMonthKey(value)) throw new DataFormatError(field);
  return value;
}

export function readDay(value: unknown, field: string): string {
  if (!isValidDayKey(value)) throw new DataFormatError(field);
  return value;
}
