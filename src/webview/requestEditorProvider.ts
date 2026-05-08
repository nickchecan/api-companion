import * as vscode from 'vscode';

import { parseRequestFile } from '../request/requestFile';
import { initializeRequestWebview, loadRequestInWebview, RequestChangedMessage } from './requestWebview';

export class RequestEditorProvider implements vscode.CustomTextEditorProvider {
	public static readonly viewType = 'api-companion.requestEditor';

	public constructor(private readonly extensionUri: vscode.Uri) {}

	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		return vscode.window.registerCustomEditorProvider(
			RequestEditorProvider.viewType,
			new RequestEditorProvider(context.extensionUri),
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
				onReady: () => {
					void this.loadDocument(webviewPanel.webview, document);
				},
				onRequestChanged: (message) => {
					let nextText: string;
					try {
						nextText = this.createUpdatedDocumentText(document, message);
					} catch {
						return;
					}

					if (nextText !== document.getText()) {
						pendingDocumentText = nextText;
						void this.updateDocument(document, nextText);
					}
				},
			});
			const documentSubscription = vscode.workspace.onDidChangeTextDocument((event) => {
				if (event.document.uri.toString() === document.uri.toString()) {
					if (event.document.getText() === pendingDocumentText) {
						pendingDocumentText = undefined;
						return;
					}

					void this.loadDocument(webviewPanel.webview, event.document);
				}
			});

		webviewPanel.onDidDispose(() => {
			messageSubscription.dispose();
			documentSubscription.dispose();
		});

		void this.loadDocument(webviewPanel.webview, document);
	}

	private async loadDocument(webview: vscode.Webview, document: vscode.TextDocument): Promise<void> {
		try {
			const request = parseRequestFile(document.getText());
			await loadRequestInWebview(webview, request);
		} catch (error) {
			await webview.postMessage({
				type: 'requestError',
				message: error instanceof Error ? error.message : 'Unable to load request file.',
			});
		}
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
		const parsed = JSON.parse(document.getText()) as Record<string, unknown>;

		parsed.method = message.method;
		parsed.url = message.url;
		parsed.headers = message.headers;
		parsed.body = message.body.trim() ? readBodyValue(message.body) : null;

		return `${JSON.stringify(parsed, null, 2)}\n`;
	}
}

function readBodyValue(body: string): unknown {
	try {
		return JSON.parse(body);
	} catch {
		return body;
	}
}
