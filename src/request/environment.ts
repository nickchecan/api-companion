import { ApiRequest } from './types';

const variablePattern = /\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g;

export function parseEnvFile(content: string): Record<string, string> {
	const values: Record<string, string> = {};

	for (const line of content.split(/\r?\n/)) {
		const trimmed = line.trim();

		if (!trimmed || trimmed.startsWith('#')) {
			continue;
		}

		const separatorIndex = trimmed.indexOf('=');

		if (separatorIndex === -1) {
			continue;
		}

		const name = trimmed.slice(0, separatorIndex).trim();
		const value = trimmed.slice(separatorIndex + 1).trim();

		if (!name) {
			continue;
		}

		values[name] = unquoteEnvValue(value);
	}

	return values;
}

export function resolveRequestVariables(request: ApiRequest, variables: Record<string, string>): ApiRequest {
	const missing = new Set<string>();
	const resolvedHeaders: Record<string, string> = {};

	for (const [name, value] of Object.entries(request.headers ?? {})) {
		resolvedHeaders[resolveVariables(name, variables, missing)] = resolveHeaderValue(name, value, variables, missing);
	}

	const resolved: ApiRequest = {
		method: request.method,
		url: resolveVariables(request.url, variables, missing),
		headers: resolvedHeaders,
	};

	if (request.body !== undefined) {
		resolved.body = resolveBody(request.body, resolvedHeaders, variables, missing);
	}

	if (missing.size > 0) {
		throw new Error(`Missing environment variable${missing.size === 1 ? '' : 's'}: ${Array.from(missing).join(', ')}`);
	}

	return resolved;
}

function resolveBody(
	body: string,
	headers: Record<string, string>,
	variables: Record<string, string>,
	missing: Set<string>,
): string {
	if (!isFormUrlEncoded(headers)) {
		return resolveVariables(body, variables, missing);
	}

	const params = new URLSearchParams();

	for (const [name, value] of new URLSearchParams(body).entries()) {
		params.append(
			resolveVariables(name, variables, missing),
			resolveVariables(value, variables, missing),
		);
	}

	return params.toString();
}

function resolveHeaderValue(
	name: string,
	value: string,
	variables: Record<string, string>,
	missing: Set<string>,
): string {
	if (name.toLowerCase() !== 'authorization' || !value.startsWith('Basic ')) {
		return resolveVariables(value, variables, missing);
	}

	const encodedCredentials = value.slice('Basic '.length);
	const credentials = decodeBase64(encodedCredentials);
	const resolvedCredentials = resolveVariables(credentials, variables, missing);

	return `Basic ${encodeBase64(resolvedCredentials)}`;
}

function resolveVariables(value: string, variables: Record<string, string>, missing: Set<string>): string {
	return value.replace(variablePattern, (_match, name: string) => {
		if (Object.prototype.hasOwnProperty.call(variables, name)) {
			return variables[name];
		}

		missing.add(name);
		return '';
	});
}

function isFormUrlEncoded(headers: Record<string, string>): boolean {
	for (const [name, value] of Object.entries(headers)) {
		if (name.toLowerCase() === 'content-type') {
			return value.toLowerCase().includes('application/x-www-form-urlencoded');
		}
	}

	return false;
}

function unquoteEnvValue(value: string): string {
	if (value.length < 2) {
		return value;
	}

	const quote = value[0];
	const last = value[value.length - 1];

	if ((quote === '"' || quote === "'") && last === quote) {
		return value.slice(1, -1);
	}

	return value;
}

function encodeBase64(value: string): string {
	return Buffer.from(value, 'utf8').toString('base64');
}

function decodeBase64(value: string): string {
	return Buffer.from(value, 'base64').toString('utf8');
}
