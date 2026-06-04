import { formatDistanceToNow } from "date-fns";
import { de, enUS } from "date-fns/locale";
import type { Locale } from "date-fns";

type RelativeTimeOptions = {
  addSuffix?: boolean;
  includeSeconds?: boolean;
  locale?: Locale;
};

/**
 * Determines whether a `Date` instance represents a valid date.
 *
 * A date is considered valid when its timestamp can be converted to a finite
 * numeric value. Invalid dates (e.g. `new Date("invalid")`) return `false`.
 *
 * @param value The `Date` instance to validate.
 *
 * @returns `true` if the date is valid; otherwise, `false`.
 */
function isValidDate(value: Date) {
  return !Number.isNaN(value.getTime());
}

/**
 * Converts a date string or `Date` instance into a validated `Date` object.
 *
 * If the provided value cannot be parsed into a valid date, `null` is returned.
 *
 * @param value The date value to convert.
 *
 * @returns A valid `Date` instance, or `null` if the input is invalid.
 */
function toDate(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return isValidDate(date) ? date : null;
}

/**
 * Formats a date value as a readable relative time string (for example,
 * "5 minutes ago" or "in 2 days").
 *
 * Accepts a `Date` instance or a date string and returns `null` when the
 * value is missing or cannot be parsed into a valid date.
 *
 * @param value The date value to format.
 * @param options Configuration options for relative time formatting.
 * @param options.locale The locale used when formatting the output.
 * @param options.addSuffix Whether to include a relative suffix or prefix
 * (for example, "ago" or "in").
 * @param options.includeSeconds Whether to include second-level precision for
 * recent dates.
 *
 * @returns A formatted relative time string, or `null` if the input is empty
 * or invalid.
 */
export function formatRelativeTime(
  value: string | Date | null | undefined,
  options: RelativeTimeOptions = {},
): string | null {
  const date = value ? toDate(value) : null;
  if (!date) return null;

  const { locale = enUS, addSuffix = true, includeSeconds = true } = options;

  return formatDistanceToNow(date, {
    locale,
    addSuffix,
    includeSeconds,
  });
}

/**
 * Formats a date value as a localized date and time string.
 *
 * Accepts a `Date` instance or a date string and returns `null` when the
 * value is missing or cannot be parsed into a valid date. Default formatting
 * includes the date, time, and seconds, but can be customized through the
 * provided `Intl.DateTimeFormat` options.
 *
 * @param value The date value to format.
 * @param locale The locale used for formatting. Defaults to `"de-DE"`.
 * @param options Additional `Intl.DateTimeFormat` options that override the
 * default formatting configuration.
 *
 * @returns A localized date and time string, or `null` if the input is empty
 * or invalid.
 */
export function formatDateTime(
  value: string | Date | null | undefined,
  locale: string = "de-DE",
  options: Intl.DateTimeFormatOptions = {},
): string | null {
  const date = value ? toDate(value) : null;
  if (!date) return null;

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    ...options,
  }).format(date);
}

/**
 * Formats a date value as a localized time string.
 *
 * Accepts a `Date` instance or a date string and returns `null` if the input
 * is missing or cannot be parsed into a valid date. By default, the output
 * includes hours and minutes in 12-hour format, but this can be customized
 * using `Intl.DateTimeFormat` options.
 *
 * @param value The date value to format.
 * @param locale The locale used for formatting. Defaults to `"de-DE"`.
 * @param options Additional `Intl.DateTimeFormat` options that override the
 * default time formatting configuration.
 *
 * @returns A localized time string, or `null` if the input is empty or invalid.
 */
export function formatTime(
  value: string | Date | null | undefined,
  locale: string = "de-DE",
  options: Intl.DateTimeFormatOptions = {},
): string | null {
  const date = value ? toDate(value) : null;
  if (!date) return null;

  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...options,
  }).format(date);
}
