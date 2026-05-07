import * as vscode from 'vscode';

import { executeRequest } from '../request/requestRunner';
import { RequestFileDefinition } from '../request/types';
import { getWebviewHtml } from './getWebviewHtml';

interface SendRequestMessage {
	type: 'sendRequest';
	method: string;
	url: string;
	headers?: Record<string, string>;
}

export class ApiWorkbenchPanel {
	private static currentPanel: ApiWorkbenchPanel | undefined;

	private readonly panel: vscode.WebviewPanel;

	private constructor(panel: vscode.WebviewPanel) {
		this.panel = panel;
		this.panel.webview.html = getWebviewHtml(this.panel.webview);

		this.panel.webview.onDidReceiveMessage((message: unknown) => {
			void this.handleMessage(message);
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

	public async loadRequest(request: RequestFileDefinition): Promise<void> {
		await this.panel.webview.postMessage({
			type: 'loadRequest',
			request,
		});
	}

	private async handleMessage(message: unknown): Promise<void> {
		if (!isSendRequestMessage(message)) {
			return;
		}

		try {
			const response = await executeRequest({
				method: message.method,
				url: message.url,
				headers: message.headers,
			});

			await this.panel.webview.postMessage({
				type: 'requestComplete',
				response,
			});
		} catch (error) {
			await this.panel.webview.postMessage({
				type: 'requestError',
				message: error instanceof Error ? error.message : 'Request failed.',
			});
		}
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
		&& (candidate.headers === undefined || isStringRecord(candidate.headers));
}

function isStringRecord(value: unknown): value is Record<string, string> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}

	return Object.values(value).every((item) => typeof item === 'string');
}
