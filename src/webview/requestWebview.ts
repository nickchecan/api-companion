import * as vscode from 'vscode';

import { parseEnvFile, resolveRequestVariables } from '../request/environment';
import { executeRequest } from '../request/requestRunner';
import { ApiResponse, RequestFileDefinition } from '../request/types';
import { isRecord, isStringRecord } from '../shared/object';
import { getWebviewHtml } from './getWebviewHtml';

export interface SendRequestMessage {
	type: 'sendRequest';
	method: string;
	url: string;
	headers?: Record<string, string>;
	body?: string;
}

interface WebviewReadyMessage {
	type: 'webviewReady';
}

interface OpenRepositoryMessage {
	type: 'openRepository';
}

interface OpenIssuesMessage {
	type: 'openIssues';
}

export interface RequestChangedMessage {
	type: 'requestChanged';
	name: string;
	method: string;
	url: string;
	headers: Record<string, string>;
	body: string;
}

export interface RequestWebviewHandlers {
	extensionVersion?: string;
	onReady?: () => void;
	onRequestChanged?: (message: RequestChangedMessage) => void;
	onSendRequest?: (message: SendRequestMessage) => Promise<ApiResponse>;
}

export function initializeRequestWebview(
	webview: vscode.Webview,
	handlersOrOnReady?: RequestWebviewHandlers | (() => void),
): vscode.Disposable {
	const handlers = typeof handlersOrOnReady === 'function'
		? { onReady: handlersOrOnReady }
		: handlersOrOnReady ?? {};

	webview.html = getWebviewHtml(webview, handlers.extensionVersion ?? '0.0.0');

	return webview.onDidReceiveMessage((message: unknown) => {
		if (isWebviewReadyMessage(message)) {
			handlers.onReady?.();
			return;
		}

		if (isRequestChangedMessage(message)) {
			handlers.onRequestChanged?.(message);
			return;
		}

		if (isOpenRepositoryMessage(message)) {
			void vscode.env.openExternal(vscode.Uri.parse('https://github.com/nickchecan/restcraft'));
			return;
		}

		if (isOpenIssuesMessage(message)) {
			void vscode.env.openExternal(vscode.Uri.parse('https://github.com/nickchecan/restcraft/issues'));
			return;
		}

		void handleMessage(webview, message, handlers);
	});
}

export async function loadRequestInWebview(webview: vscode.Webview, request: RequestFileDefinition): Promise<void> {
	await webview.postMessage({
		type: 'loadRequest',
		request,
	});
}

async function handleMessage(
	webview: vscode.Webview,
	message: unknown,
	handlers: RequestWebviewHandlers,
): Promise<void> {
	if (!isSendRequestMessage(message)) {
		return;
	}

	try {
		const response = handlers.onSendRequest ? await handlers.onSendRequest(message) : await executeRequest({
			method: message.method,
			url: message.url,
			headers: message.headers,
			body: message.body,
		});

		await webview.postMessage({
			type: 'requestComplete',
			response,
		});
	} catch (error) {
		await webview.postMessage({
			type: 'requestError',
			message: error instanceof Error ? error.message : 'Request failed.',
		});
	}
}

export async function executeRequestWithEnvironment(
	message: SendRequestMessage,
	requestUri: vscode.Uri | undefined,
): Promise<ApiResponse> {
	const variables = requestUri ? await readEnvironmentVariables(requestUri) : {};
	const request = resolveRequestVariables({
		method: message.method,
		url: message.url,
		headers: message.headers,
		body: message.body,
	}, variables);

	return executeRequest(request);
}

async function readEnvironmentVariables(requestUri: vscode.Uri): Promise<Record<string, string>> {
	const envUri = vscode.Uri.joinPath(readRequestDirectory(requestUri), '.env');

	try {
		const content = await vscode.workspace.fs.readFile(envUri);
		return parseEnvFile(new TextDecoder().decode(content));
	} catch (error) {
		if (isFileNotFoundError(error)) {
			return {};
		}

		throw error;
	}
}

function readRequestDirectory(requestUri: vscode.Uri): vscode.Uri {
	const directoryPath = requestUri.path.replace(/\/[^/]*$/, '') || '/';

	return requestUri.with({ path: directoryPath });
}

function isFileNotFoundError(error: unknown): boolean {
	if (!(error instanceof vscode.FileSystemError)) {
		return false;
	}

	return error.code === 'FileNotFound';
}

function isSendRequestMessage(message: unknown): message is SendRequestMessage {
	if (!isRecord(message)) {
		return false;
	}

	const candidate = message as Partial<SendRequestMessage>;

	return candidate.type === 'sendRequest'
		&& typeof candidate.method === 'string'
		&& typeof candidate.url === 'string'
		&& (candidate.body === undefined || typeof candidate.body === 'string')
		&& (candidate.headers === undefined || isStringRecord(candidate.headers));
}

function isWebviewReadyMessage(message: unknown): message is WebviewReadyMessage {
	if (!isRecord(message)) {
		return false;
	}

	const candidate = message as Partial<WebviewReadyMessage>;

	return candidate.type === 'webviewReady';
}

function isOpenRepositoryMessage(message: unknown): message is OpenRepositoryMessage {
	if (!isRecord(message)) {
		return false;
	}

	const candidate = message as Partial<OpenRepositoryMessage>;

	return candidate.type === 'openRepository';
}

function isOpenIssuesMessage(message: unknown): message is OpenIssuesMessage {
	if (!isRecord(message)) {
		return false;
	}

	const candidate = message as Partial<OpenIssuesMessage>;

	return candidate.type === 'openIssues';
}

function isRequestChangedMessage(message: unknown): message is RequestChangedMessage {
	if (!isRecord(message)) {
		return false;
	}

	const candidate = message as Partial<RequestChangedMessage>;

	return candidate.type === 'requestChanged'
		&& typeof candidate.name === 'string'
		&& typeof candidate.method === 'string'
		&& typeof candidate.url === 'string'
		&& typeof candidate.body === 'string'
		&& isStringRecord(candidate.headers);
}
