export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface ApiRequest {
	method: string;
	url: string;
	headers?: Record<string, string>;
	body?: string;
}

export interface ApiResponse {
	status: number;
	statusText: string;
	headers: Record<string, string>;
	body: string;
}

export interface RequestParamDefinition {
	name: string;
	value: string;
	enabled: boolean;
}

export interface RequestHeaderDefinition {
	name: string;
	value: string;
	enabled: boolean;
}

export interface RequestFileDefinition {
	name: string;
	method: HttpMethod;
	url: string;
	params: RequestParamDefinition[];
	headerState: RequestHeaderDefinition[];
	headers: Record<string, string>;
	body: unknown;
}

export const supportedMethods: readonly HttpMethod[] = [
	'GET',
	'POST',
	'PUT',
	'PATCH',
	'DELETE',
	'HEAD',
	'OPTIONS',
];

export function isHttpMethod(method: string): method is HttpMethod {
	return supportedMethods.includes(method as HttpMethod);
}
