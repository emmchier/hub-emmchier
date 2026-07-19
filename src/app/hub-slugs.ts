/** URL segments allowed under `/resume/[section]`. */
export const VALID_RESUME_SECTION_SLUGS = new Set([
  'work-experience',
  'courses',
  'studies',
  'languages',
]);

/**
 * Validates optional catch-all slug for `/contact/[[...slug]]`.
 * Hub Contact is only `/contact` (Say hello) — any nested segment is invalid.
 */
export function isValidContactSlug(slug?: string[]): boolean {
  return !slug || slug.length === 0;
}

/**
 * Validates optional catch-all slug for `/resume/[[...slug]]`.
 * Allows `/resume` and `/resume/{work-experience|courses|studies|languages}`.
 */
export function isValidResumeSlug(slug?: string[]): boolean {
  if (!slug || slug.length === 0) return true;
  if (slug.length === 1 && VALID_RESUME_SECTION_SLUGS.has(slug[0])) return true;
  return false;
}
