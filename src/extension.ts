import * as vscode from 'vscode';

import { isRequestFileName, parseRequestFile } from './request/requestFile';
import { ApiWorkbenchPanel } from './webview/requestPanel';

export function activate(context: vscode.ExtensionContext) {
	const openApiWorkbench = vscode.commands.registerCommand('api-companion.openApiWorkbench', () => {
		ApiWorkbenchPanel.createOrShow(context.extensionUri);
	});

	const loadRequestFile = vscode.commands.registerCommand('api-companion.loadRequestFile', async () => {
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			await vscode.window.showErrorMessage('Open a .request.json file before loading a request.');
			return;
		}

		if (!isRequestFileName(editor.document.fileName)) {
			await vscode.window.showErrorMessage('The active file must end with .request.json.');
			return;
		}

		try {
			const request = parseRequestFile(editor.document.getText());
			const panel = ApiWorkbenchPanel.createOrShow(context.extensionUri);

			await panel.loadRequest(request);
		} catch (error) {
			await vscode.window.showErrorMessage(error instanceof Error ? error.message : 'Unable to load request file.');
		}
	});

	context.subscriptions.push(openApiWorkbench, loadRequestFile);
}

export function deactivate() {}
