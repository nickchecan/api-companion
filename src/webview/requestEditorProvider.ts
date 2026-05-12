import * as vscode from 'vscode';

import { parseRequestFile } from '../request/requestFile';
import { HttpMethod, isHttpMethod, RequestFileDefinition } from '../request/types';
import {
	executeRequestWithEnvironment,
	initializeRequestWebview,
	loadRequestInWebview,
	RequestChangedMessage,
} from './requestWebview';

export class RequestEditorProvider implements vscode.CustomTextEditorProvider {
	public static readonly viewType = 'api-companion.requestEditor';

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

		let pendingDocumentText: string | undefined;
		const messageSubscription = initializeRequestWebview(webviewPanel.webview, {
			extensionVersion: this.extensionVersion,
			onReady: () => {
				void this.loadDocument(webviewPanel, document);
			},
			onRequestChanged: (message) => {
				let nextText: string;
				try {
					nextText = this.createUpdatedDocumentText(document, message);
				} catch {
					return;
				}

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

					void this.loadDocument(webviewPanel, event.document);
				}
			});

		webviewPanel.onDidDispose(() => {
			messageSubscription.dispose();
			documentSubscription.dispose();
		});

		void this.loadDocument(webviewPanel, document);
	}

	private async loadDocument(webviewPanel: vscode.WebviewPanel, document: vscode.TextDocument): Promise<void> {
		const request = readRequestDocument(document.getText());

		webviewPanel.title = readRequestTitle(request.name);
		await loadRequestInWebview(webviewPanel.webview, request);
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
		parsed.headers = message.headers;
		parsed.body = message.body.trim() ? readBodyValue(message.body) : null;

		return `${JSON.stringify(parsed, null, 2)}\n`;
	}
}

function readRequestDocument(content: string): RequestFileDefinition {
	try {
		return parseRequestFile(content);
	} catch {
		return readDraftRequestDocument(content);
	}
}

function readDraftRequestDocument(content: string): RequestFileDefinition {
	const parsed = readDocumentObject(content);
	const method = typeof parsed.method === 'string' && isHttpMethod(parsed.method.toUpperCase())
		? parsed.method.toUpperCase() as HttpMethod
		: 'GET';

	return {
		name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim() : 'Untitled Request',
		method,
		url: typeof parsed.url === 'string' ? parsed.url : '',
		headers: readDraftHeaders(parsed.headers),
		body: parsed.body ?? null,
	};
}

function readDraftHeaders(headers: unknown): Record<string, string> {
	if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
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

function readDocumentObject(content: string): Record<string, unknown> {
	try {
		const parsed = JSON.parse(content);

		if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
			return parsed as Record<string, unknown>;
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
