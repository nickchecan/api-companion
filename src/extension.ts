import * as vscode from 'vscode';

import { isRequestFileName, parseRequestFile } from './request/requestFile';
import { RequestEditorProvider } from './webview/requestEditorProvider';
import { ApiWorkbenchPanel } from './webview/requestPanel';

export function activate(context: vscode.ExtensionContext) {
	const extensionVersion = readExtensionVersion(context);

	const openApiWorkbench = vscode.commands.registerCommand('restcraft.openApiWorkbench', () => {
		ApiWorkbenchPanel.createOrShow(context.extensionUri, extensionVersion);
	});

	const loadRequestFile = vscode.commands.registerCommand('restcraft.loadRequestFile', async () => {
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			await vscode.window.showErrorMessage('Open a .api.json file before loading a request.');
			return;
		}

		if (!isRequestFileName(editor.document.fileName)) {
			await vscode.window.showErrorMessage('The active file must end with .api.json.');
			return;
		}

		try {
			const request = parseRequestFile(editor.document.getText());
			const panel = ApiWorkbenchPanel.createOrShow(context.extensionUri, extensionVersion);

			await panel.loadRequest(request, editor.document.uri);
		} catch (error) {
			await vscode.window.showErrorMessage(error instanceof Error ? error.message : 'Unable to load request file.');
		}
	});

	context.subscriptions.push(openApiWorkbench, loadRequestFile, RequestEditorProvider.register(context, extensionVersion));
}

export function deactivate() {}

function readExtensionVersion(context: vscode.ExtensionContext): string {
	const packageJson = context.extension.packageJSON as { version?: unknown };

	return typeof packageJson.version === 'string' ? packageJson.version : '0.0.0';
}
