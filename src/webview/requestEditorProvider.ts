import * as vscode from 'vscode';

import { parseRequestFile } from '../request/requestFile';
import { initializeRequestWebview, loadRequestInWebview } from './requestWebview';

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

		const messageSubscription = initializeRequestWebview(webviewPanel.webview, () => {
			void this.loadDocument(webviewPanel.webview, document);
		});
		const documentSubscription = vscode.workspace.onDidChangeTextDocument((event) => {
			if (event.document.uri.toString() === document.uri.toString()) {
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
}
