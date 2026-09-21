export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates if a string is a standard 36-character RFC4122 UUID.
 */
export function isValidUuid(val?: string | null): boolean {
  if (!val || typeof val !== 'string') return false;
  return UUID_REGEX.test(val.trim());
}

/**
 * Ensures a valid UUID format for PostgreSQL UUID columns.
 * If the input is already a valid UUID, returns it.
 * Otherwise, deterministically hashes/converts the string into a valid UUID
 * so foreign key relationships remain stable and repeatable.
 */
export function toValidUuid(val?: string | null): string {
  if (!val || typeof val !== 'string') {
    return crypto.randomUUID();
  }
  const trimmed = val.trim();
  if (UUID_REGEX.test(trimmed)) {
    return trimmed;
  }

  // Deterministic 32-character hex generation
  let hash1 = 5381;
  let hash2 = 52711;
  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) ^ char;
    hash2 = ((hash2 << 5) + hash2) ^ char;
  }
  let hex = '';
  for (let i = 0; i < trimmed.length; i++) {
    hex += trimmed.charCodeAt(i).toString(16);
  }
  const h1 = Math.abs(hash1).toString(16).padStart(8, '0');
  const h2 = Math.abs(hash2).toString(16).padStart(8, '0');
  hex = (h1 + h2 + hex + '1234567890abcdef1234567890abcdef').substring(0, 32);

  const p1 = hex.substring(0, 8);
  const p2 = hex.substring(8, 12);
  const p3 = `4${hex.substring(13, 16)}`;
  const p4 = `8${hex.substring(17, 20)}`;
  const p5 = hex.substring(20, 32);
  return `${p1}-${p2}-${p3}-${p4}-${p5}`.toLowerCase();
}
