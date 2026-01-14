/**
 * Utility for generating test emails with aliases
 * Uses the Gmail + alias trick: test_purpose+email@gmail.com routes to email@gmail.com
 */

const BASE_EMAIL = "adetunmbikenny@gmail.com";

/**
 * Generates a test email alias with a specific prefix
 * @param prefix - The prefix to add before the + symbol (e.g., "test_duration")
 * @returns The aliased email address
 * @example
 * getTestEmail("test_duration") // "test_duration+adetunmbikenny@gmail.com"
 * getTestEmail("reservation") // "reservation+adetunmbikenny@gmail.com"
 */
export const getTestEmail = (prefix: string): string => {
  const [localPart, domain] = BASE_EMAIL.split("@");
  return `${prefix}+${localPart}@${domain}`;
};

/**
 * Returns the base test email address
 */
export const getBaseTestEmail = (): string => {
  return BASE_EMAIL;
};
