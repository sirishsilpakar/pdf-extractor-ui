/**
 * Formats a numeric value as a localized percentage string.
 *
 * Accepts a number in either fractional form (e.g. 0.25) or whole-number
 * percentage form (e.g. 25). Values greater than 1 are automatically
 * normalized by dividing by 100.
 *
 * Returns `null` for missing, non-finite, or invalid numeric input.
 *
 * @param value The numeric value to format as a percentage.
 * @param locale The locale used for formatting. Defaults to `"de-DE"`.
 * @param options Additional `Intl.NumberFormat` options that override the
 * default percentage formatting configuration.
 *
 * @returns A localized percentage string, or `null` if the input is invalid.
 */
export function formatPercent(
  value: number | null | undefined,
  locale: string = "de-DE",
  options: Intl.NumberFormatOptions = {},
): string | null {
  if (value == null || !Number.isFinite(value)) return null;

  const normalized = value > 1 ? value / 100 : value;

  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    ...options,
  }).format(normalized);
}

/**
 * Formats a numeric value using locale-aware number formatting.
 *
 * Accepts a finite number and returns a localized string representation
 * based on the provided locale and formatting options. Returns `null`
 * for missing or non-finite values.
 *
 * @param value The number to format.
 * @param locale The locale used for formatting. Defaults to `"de-DE"`.
 * @param options Additional `Intl.NumberFormat` options for customizing
 * formatting (e.g., style, currency, grouping, decimals).
 *
 * @returns A localized number string, or `null` if the input is invalid.
 */
export function formatNumber(
  value: number | null | undefined,
  locale: string = "de-DE",
  options: Intl.NumberFormatOptions = {},
): string | null {
  if (value == null || !Number.isFinite(value)) return null;

  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Formats a numeric value using compact notation (e.g. "1K", "2.5M").
 *
 * This is a convenience wrapper around `formatNumber` that applies
 * `Intl.NumberFormat` compact notation by default. It returns `null`
 * for missing or invalid numeric input.
 *
 * @param value The number to format in compact form.
 * @param locale The locale used for formatting. Defaults to `"de-DE"`.
 * @param options Additional `Intl.NumberFormat` options that override
 * the default compact formatting configuration.
 *
 * @returns A compact localized number string, or `null` if the input is invalid.
 */
export function formatNumCompact(
  value: number | null | undefined,
  locale: string = "de-DE",
  options: Intl.NumberFormatOptions = {},
): string | null {
  return formatNumber(value, locale, {
    notation: "compact",
    maximumFractionDigits: 1,
    ...options,
  });
}

/**
 * Formats a numeric character count into a localized, readable string.
 *
 * Optionally uses compact number formatting (e.g. "1.2K chars") or full
 * numeric formatting depending on the `compact` flag. Returns `null` for
 * missing or invalid values.
 *
 * @param value The number of characters to format.
 * @param locale The locale used for formatting. Defaults to `"de-DE"`.
 * @param compact Whether to use compact number formatting. Defaults to `true`.
 *
 * @returns A localized character count string (e.g. "1.2K chars"), or `null`
 * if the input is invalid.
 */
export function formatChars(
  value: number | null | undefined,
  locale: string = "de-DE",
  compact = true,
): string | null {
  if (value == null || !Number.isFinite(value)) return null;

  const formatted = compact ? formatNumCompact(value, locale) : formatNumber(value, locale);

  return formatted ? `${formatted} char${formatted.length > 1 ? "s" : ""}` : null;
}

/**
 * Formats a file size in bytes into a readable string using
 * B, KB, or MB units with one decimal place for KB and MB values.
 *
 * @param bytes - The file size in bytes.
 * @param locale The locale used for formatting. Defaults to `"de-DE"`.
 *
 * @returns A formatted file size string (e.g., "512 B", "1.5 KB", "3.2 MB").
 */
export function formatFileSize(bytes: number, locale: string = "de-DE") {
  if (bytes < 1024) return formatNumCompact(bytes, locale) + " B";
  if (bytes < 1048576) return formatNumCompact(bytes / 1024, locale) + " KB";
  return formatNumCompact(bytes / 1048576, locale) + " MB";
}
