import * as vscode from 'vscode';

import { RequestFileDefinition } from '../request/types';
import { executeRequestWithEnvironment, initializeRequestWebview, loadRequestInWebview } from './requestWebview';

export class ApiWorkbenchPanel {
	private static currentPanel: ApiWorkbenchPanel | undefined;

	private readonly panel: vscode.WebviewPanel;
	private requestUri: vscode.Uri | undefined;

	private constructor(panel: vscode.WebviewPanel) {
		this.panel = panel;
		initializeRequestWebview(this.panel.webview, {
			onSendRequest: (message) => executeRequestWithEnvironment(message, this.requestUri),
		});

		this.panel.onDidDispose(() => {
			ApiWorkbenchPanel.currentPanel = undefined;
		});
	}

	public static createOrShow(extensionUri: vscode.Uri): ApiWorkbenchPanel {
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

		ApiWorkbenchPanel.currentPanel = new ApiWorkbenchPanel(panel);
		return ApiWorkbenchPanel.currentPanel;
	}

	public async loadRequest(request: RequestFileDefinition, requestUri?: vscode.Uri): Promise<void> {
		this.requestUri = requestUri;
		await loadRequestInWebview(this.panel.webview, request);
	}
}
