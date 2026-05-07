import { ApiRequest, ApiResponse, isHttpMethod } from './types';

export async function executeRequest(request: ApiRequest): Promise<ApiResponse> {
	const method = normalizeMethod(request.method);
	const url = normalizeUrl(request.url);

	const response = await fetch(url, {
		method,
		headers: request.headers,
	});

	return {
		status: response.status,
		statusText: response.statusText,
		headers: Object.fromEntries(response.headers.entries()),
		body: method === 'HEAD' ? '' : await response.text(),
	};
}

function normalizeMethod(method: string): string {
	const normalized = method.trim().toUpperCase();

	if (!isHttpMethod(normalized)) {
		throw new Error(`Unsupported HTTP method: ${method}`);
	}

	return normalized;
}

function normalizeUrl(url: string): string {
	const trimmed = url.trim();

	if (!trimmed) {
		throw new Error('Enter a request URL.');
	}

	let parsed: URL;
	try {
		parsed = new URL(trimmed);
	} catch {
		throw new Error('Enter a valid request URL.');
	}

	if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
		throw new Error('Only http and https URLs are supported.');
	}

	return parsed.toString();
}
