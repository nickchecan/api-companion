import * as vscode from 'vscode';

import { executeRequest } from '../request/requestRunner';
import { RequestFileDefinition } from '../request/types';
import { getWebviewHtml } from './getWebviewHtml';

interface SendRequestMessage {
	type: 'sendRequest';
	method: string;
	url: string;
	headers?: Record<string, string>;
	body?: string;
}

interface WebviewReadyMessage {
	type: 'webviewReady';
}

export interface RequestChangedMessage {
	type: 'requestChanged';
	method: string;
	url: string;
	headers: Record<string, string>;
	body: string;
}

export interface RequestWebviewHandlers {
	onReady?: () => void;
	onRequestChanged?: (message: RequestChangedMessage) => void;
}

export function initializeRequestWebview(
	webview: vscode.Webview,
	handlersOrOnReady?: RequestWebviewHandlers | (() => void),
): vscode.Disposable {
	const handlers = typeof handlersOrOnReady === 'function'
		? { onReady: handlersOrOnReady }
		: handlersOrOnReady ?? {};

	webview.html = getWebviewHtml(webview);

	return webview.onDidReceiveMessage((message: unknown) => {
		if (isWebviewReadyMessage(message)) {
			handlers.onReady?.();
			return;
		}

		if (isRequestChangedMessage(message)) {
			handlers.onRequestChanged?.(message);
			return;
		}

		void handleMessage(webview, message);
	});
}

export async function loadRequestInWebview(webview: vscode.Webview, request: RequestFileDefinition): Promise<void> {
	await webview.postMessage({
		type: 'loadRequest',
		request,
	});
}

async function handleMessage(webview: vscode.Webview, message: unknown): Promise<void> {
	if (!isSendRequestMessage(message)) {
		return;
	}

	try {
		const response = await executeRequest({
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

function isSendRequestMessage(message: unknown): message is SendRequestMessage {
	if (!message || typeof message !== 'object') {
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
	if (!message || typeof message !== 'object') {
		return false;
	}

	const candidate = message as Partial<WebviewReadyMessage>;

	return candidate.type === 'webviewReady';
}

function isRequestChangedMessage(message: unknown): message is RequestChangedMessage {
	if (!message || typeof message !== 'object') {
		return false;
	}

	const candidate = message as Partial<RequestChangedMessage>;

	return candidate.type === 'requestChanged'
		&& typeof candidate.method === 'string'
		&& typeof candidate.url === 'string'
		&& typeof candidate.body === 'string'
		&& isStringRecord(candidate.headers);
}

function isStringRecord(value: unknown): value is Record<string, string> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}

	return Object.values(value).every((item) => typeof item === 'string');
}
