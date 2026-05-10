import { HttpMethod, isHttpMethod, RequestFileDefinition, supportedMethods } from './types';

export function parseRequestFile(content: string): RequestFileDefinition {
	let parsed: unknown;

	try {
		parsed = JSON.parse(content);
	} catch (error) {
		const detail = error instanceof Error ? error.message : 'Unknown JSON parse error.';
		throw new Error(`Invalid JSON: ${detail}`);
	}

	if (!isRecord(parsed)) {
		throw new Error('Request file must contain a JSON object.');
	}

	return {
		name: readRequiredString(parsed, 'name'),
		method: readMethod(parsed),
		url: readUrl(parsed),
		headers: readHeaders(parsed),
		body: parsed.body ?? null,
	};
}

export function isRequestFileName(fileName: string): boolean {
	return fileName.endsWith('.api.json');
}

function readRequiredString(value: Record<string, unknown>, property: string): string {
	const candidate = value[property];

	if (typeof candidate !== 'string' || !candidate.trim()) {
		throw new Error(`Request file property "${property}" must be a non-empty string.`);
	}

	return candidate.trim();
}

function readMethod(value: Record<string, unknown>): HttpMethod {
	const method = readRequiredString(value, 'method').toUpperCase();

	if (!isHttpMethod(method)) {
		throw new Error(`Request file property "method" must be one of: ${supportedMethods.join(', ')}.`);
	}

	return method as HttpMethod;
}

function readUrl(value: Record<string, unknown>): string {
	const url = readRequiredString(value, 'url');

	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		throw new Error('Request file property "url" must be a valid URL.');
	}

	if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
		throw new Error('Request file property "url" must use http or https.');
	}

	return parsed.toString();
}

function readHeaders(value: Record<string, unknown>): Record<string, string> {
	const headers = value.headers;

	if (headers === undefined || headers === null) {
		return {};
	}

	if (!isRecord(headers)) {
		throw new Error('Request file property "headers" must be an object when provided.');
	}

	const normalized: Record<string, string> = {};

	for (const [name, headerValue] of Object.entries(headers)) {
		if (!name.trim()) {
			throw new Error('Request file header names must be non-empty strings.');
		}

		if (typeof headerValue !== 'string') {
			throw new Error(`Request file header "${name}" must have a string value.`);
		}

		normalized[name] = headerValue;
	}

	return normalized;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
