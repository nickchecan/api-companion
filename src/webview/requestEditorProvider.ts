import * as vscode from 'vscode';

import { parseRequestFile } from '../request/requestFile';
import { HttpMethod, isHttpMethod, RequestFileDefinition } from '../request/types';
import { isRecord } from '../shared/object';
import {
	executeRequestWithEnvironment,
	initializeRequestWebview,
	loadRequestInWebview,
	RequestChangedMessage,
} from './requestWebview';

/**
 * Custom text editor for `.api.json` request files.
 *
 * The editor keeps the JSON document as the source of truth while presenting a
 * form-based request builder. User edits in the webview are serialized back into
 * the text document, and external text edits are reloaded into the webview.
 */
export class RequestEditorProvider implements vscode.CustomTextEditorProvider {
	public static readonly viewType = 'restcraft.requestEditor';

	public constructor(
		private readonly extensionUri: vscode.Uri,
		private readonly extensionVersion: string,
	) {}

	public static register(context: vscode.ExtensionContext, extensionVersion: string): vscode.Disposable {
		return vscode.window.registerCustomEditorProvider(
			RequestEditorProvider.viewType,
			new RequestEditorProvider(context.extensionUri, extensionVersion),
			{
				webviewOptions: {
					retainContextWhenHidden: true,
				},
			},
		);
	}

	public resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken,
	): void {
		webviewPanel.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.extensionUri],
		};

		// Tracks writes initiated by this provider so the following document
		// change event is not treated as an external edit from another editor.
		let pendingDocumentText: string | undefined;
		// Keeps unsaved row enablement while the JSON document is being updated.
		let draftParams: RequestChangedMessage['params'] | undefined;
		let draftHeaderState: RequestChangedMessage['headerState'] | undefined;
		const messageSubscription = initializeRequestWebview(webviewPanel.webview, {
			extensionVersion: this.extensionVersion,
			onReady: () => {
				void this.loadDocument(webviewPanel, document, draftParams, draftHeaderState);
			},
			onRequestChanged: (message) => {
				let nextText: string;
				try {
					nextText = this.createUpdatedDocumentText(document, message);
				} catch {
					return;
				}

				draftParams = message.params;
				draftHeaderState = message.headerState;
				webviewPanel.title = readRequestTitle(message.name);

				if (nextText !== document.getText()) {
					pendingDocumentText = nextText;
					void this.updateDocument(document, nextText);
				}
			},
			onSendRequest: (message) => executeRequestWithEnvironment(message, document.uri),
		});
		const documentSubscription = vscode.workspace.onDidChangeTextDocument((event) => {
			if (event.document.uri.toString() === document.uri.toString()) {
				if (event.document.getText() === pendingDocumentText) {
					pendingDocumentText = undefined;
					return;
				}

					draftParams = undefined;
					draftHeaderState = undefined;
					void this.loadDocument(webviewPanel, event.document);
				}
			});

		webviewPanel.onDidDispose(() => {
			messageSubscription.dispose();
			documentSubscription.dispose();
		});

		void this.loadDocument(webviewPanel, document, draftParams, draftHeaderState);
	}

	private async loadDocument(
		webviewPanel: vscode.WebviewPanel,
		document: vscode.TextDocument,
		params?: RequestChangedMessage['params'],
		headerState?: RequestChangedMessage['headerState'],
	): Promise<void> {
		const request = readRequestDocument(document.getText());

		webviewPanel.title = readRequestTitle(request.name);
		await loadRequestInWebview(webviewPanel.webview, request, params, headerState);
	}

	private async updateDocument(
		document: vscode.TextDocument,
		nextText: string,
	): Promise<void> {
		const edit = new vscode.WorkspaceEdit();
		const fullRange = new vscode.Range(
			document.positionAt(0),
			document.positionAt(document.getText().length),
		);

		edit.replace(document.uri, fullRange, nextText);
		await vscode.workspace.applyEdit(edit);
	}

	private createUpdatedDocumentText(document: vscode.TextDocument, message: RequestChangedMessage): string {
		const parsed = readDocumentObject(document.getText());

		parsed.name = message.name.trim() || 'Untitled Request';
		parsed.method = message.method;
		parsed.url = message.url;
		parsed.params = message.params;
		parsed.headerState = message.headerState;
		parsed.headers = message.headers;
		parsed.body = message.body.trim() ? readBodyValue(message.body) : null;

		return `${JSON.stringify(parsed, null, 2)}\n`;
	}
}

/**
 * Reads a request for editor display.
 *
 * Invalid or incomplete JSON is tolerated here so the custom editor can remain
 * open while a user is midway through editing the underlying file.
 */
function readRequestDocument(content: string): RequestFileDefinition {
	try {
		return parseRequestFile(content);
	} catch {
		return readDraftRequestDocument(content);
	}
}

/**
 * Builds a best-effort request model from incomplete document content.
 */
function readDraftRequestDocument(content: string): RequestFileDefinition {
	const parsed = readDocumentObject(content);
	const method = typeof parsed.method === 'string' && isHttpMethod(parsed.method.toUpperCase())
		? parsed.method.toUpperCase() as HttpMethod
		: 'GET';

	return {
		name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim() : 'Untitled Request',
		method,
		url: typeof parsed.url === 'string' ? parsed.url : '',
		params: readDraftParams(parsed.params, typeof parsed.url === 'string' ? parsed.url : ''),
		headerState: readDraftHeaderState(parsed.headerState, parsed.headers),
		headers: readDraftHeaders(parsed.headers),
		body: parsed.body ?? null,
	};
}

function readDraftParams(params: unknown, url: string): RequestChangedMessage['params'] {
	if (!Array.isArray(params)) {
		return readDraftParamsFromUrl(url);
	}

	const normalized: RequestChangedMessage['params'] = [];

	for (const param of params) {
		if (!isRecord(param)) {
			continue;
		}

		if (typeof param.name === 'string' && param.name.trim() && typeof param.value === 'string') {
			normalized.push({
				name: param.name.trim(),
				value: param.value,
				enabled: typeof param.enabled === 'boolean' ? param.enabled : true,
			});
		}
	}

	return normalized;
}

function readDraftParamsFromUrl(url: string): RequestChangedMessage['params'] {
	try {
		return Array.from(new URL(url).searchParams.entries()).map(([name, value]) => ({
			name,
			value,
			enabled: true,
		}));
	} catch {
		return [];
	}
}

function readDraftHeaders(headers: unknown): Record<string, string> {
	if (!isRecord(headers)) {
		return {};
	}

	const normalized: Record<string, string> = {};

	for (const [name, value] of Object.entries(headers)) {
		if (name.trim() && typeof value === 'string') {
			normalized[name] = value;
		}
	}

	return normalized;
}

function readDraftHeaderState(headerState: unknown, headers: unknown): RequestChangedMessage['headerState'] {
	if (!Array.isArray(headerState)) {
		return Object.entries(readDraftHeaders(headers)).map(([name, value]) => ({
			name,
			value,
			enabled: true,
		}));
	}

	const normalized: RequestChangedMessage['headerState'] = [];

	for (const header of headerState) {
		if (!isRecord(header)) {
			continue;
		}

		if (typeof header.name === 'string' && header.name.trim() && typeof header.value === 'string') {
			normalized.push({
				name: header.name.trim(),
				value: header.value,
				enabled: typeof header.enabled === 'boolean' ? header.enabled : true,
			});
		}
	}

	return normalized;
}

function readDocumentObject(content: string): Record<string, unknown> {
	try {
		const parsed = JSON.parse(content);

		if (isRecord(parsed)) {
			return parsed;
		}
	} catch {
		return {};
	}

	return {};
}

function readBodyValue(body: string): unknown {
	try {
		return JSON.parse(body);
	} catch {
		return body;
	}
}

function readRequestTitle(name: string): string {
	return name.trim() || 'Untitled Request';
}
