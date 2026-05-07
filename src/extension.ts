import * as vscode from 'vscode';

import { ApiWorkbenchPanel } from './webview/requestPanel';

export function activate(context: vscode.ExtensionContext) {
	const openApiWorkbench = vscode.commands.registerCommand('api-companion.openApiWorkbench', () => {
		ApiWorkbenchPanel.createOrShow(context.extensionUri);
	});

	context.subscriptions.push(openApiWorkbench);
}

export function deactivate() {}
