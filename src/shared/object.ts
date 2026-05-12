/**
 * Narrows unknown JSON-like data to a plain object record.
 *
 * Arrays are excluded because request files and webview messages use arrays as
 * distinct shapes that should be validated separately.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Narrows unknown data to an object whose values are all strings.
 *
 * This is mainly used for untrusted header maps crossing the webview boundary.
 */
export function isStringRecord(value: unknown): value is Record<string, string> {
	return isRecord(value) && Object.values(value).every((item) => typeof item === 'string');
}
