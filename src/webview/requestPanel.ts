import * as vscode from 'vscode';

import { RequestFileDefinition } from '../request/types';
import { executeRequestWithEnvironment, initializeRequestWebview, loadRequestInWebview } from './requestWebview';

/**
 * Singleton API Workbench panel used by the `restcraft.openApiWorkbench` command.
 *
 * The panel can be opened empty or loaded from a `.api.json` file. When a file
 * is loaded, its URI is retained so request execution can resolve sibling `.env`
 * variables.
 */
export class ApiWorkbenchPanel {
	private static currentPanel: ApiWorkbenchPanel | undefined;

	private readonly panel: vscode.WebviewPanel;
	private requestUri: vscode.Uri | undefined;

	private constructor(panel: vscode.WebviewPanel, extensionVersion: string) {
		this.panel = panel;
		initializeRequestWebview(this.panel.webview, {
			extensionVersion,
			onSendRequest: (message) => executeRequestWithEnvironment(message, this.requestUri),
		});

		this.panel.onDidDispose(() => {
			ApiWorkbenchPanel.currentPanel = undefined;
		});
	}

	public static createOrShow(extensionUri: vscode.Uri, extensionVersion: string): ApiWorkbenchPanel {
		if (ApiWorkbenchPanel.currentPanel) {
			ApiWorkbenchPanel.currentPanel.panel.reveal(vscode.ViewColumn.One);
			return ApiWorkbenchPanel.currentPanel;
		}

		const panel = vscode.window.createWebviewPanel(
			'apiWorkbench',
			'API Workbench',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [extensionUri],
			},
		);

		ApiWorkbenchPanel.currentPanel = new ApiWorkbenchPanel(panel, extensionVersion);
		return ApiWorkbenchPanel.currentPanel;
	}

	public async loadRequest(request: RequestFileDefinition, requestUri?: vscode.Uri): Promise<void> {
		this.requestUri = requestUri;
		await loadRequestInWebview(this.panel.webview, request);
	}
}
