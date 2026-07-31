/**
 * Cleans a UUID string. If the value is null, undefined, empty, or whitespace-only,
 * returns null. Otherwise returns the cleaned string.
 */
export function cleanUuid(uuid: string | null | undefined): string | null {
  if (uuid === null || uuid === undefined) {
    return null;
  }
  const trimmed = uuid.trim();
  return trimmed === '' ? null : trimmed;
}
