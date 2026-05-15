import * as vscode from 'vscode';
import * as path from 'path';

import { readPackageVersion } from './extensionVersion';
import { createDefaultRequestFileContent, createRequestFileName } from './request/createRequestFile';
import { isRequestFileName, parseRequestFile } from './request/requestFile';
import { RequestEditorProvider } from './webview/requestEditorProvider';
import { ApiWorkbenchPanel } from './webview/requestPanel';

/**
 * Registers RestCraft commands and the custom request editor.
 *
 * Activation intentionally does only lightweight setup. Work that reads files,
 * opens panels, or parses requests is deferred until the user invokes a command
 * or opens a `.api.json` document.
 */
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

	const createRequestFile = vscode.commands.registerCommand('restcraft.createRequestFile', async (resource?: vscode.Uri) => {
		const directory = await resolveRequestFileDirectory(resource);

		if (!directory) {
			await vscode.window.showErrorMessage('Open a workspace folder or file before creating a request.');
			return;
		}

		const input = await vscode.window.showInputBox({
			prompt: 'Request file name',
			placeHolder: 'get-users',
			validateInput: validateRequestFileName,
		});

		if (input === undefined) {
			return;
		}

		let fileName: string;
		try {
			fileName = createRequestFileName(input);
		} catch (error) {
			await vscode.window.showErrorMessage(error instanceof Error ? error.message : 'Invalid request file name.');
			return;
		}

		const fileUri = vscode.Uri.joinPath(directory, fileName);

		if (await fileExists(fileUri)) {
			await vscode.window.showErrorMessage(`A request file named "${fileName}" already exists.`);
			return;
		}

		try {
			const requestFileContent = createDefaultRequestFileContent(fileName);
			const request = parseRequestFile(requestFileContent);
			const content = new TextEncoder().encode(requestFileContent);

			await vscode.workspace.fs.writeFile(fileUri, content);
			const panel = ApiWorkbenchPanel.createOrShow(context.extensionUri, extensionVersion);

			await panel.loadRequest(request, fileUri);
		} catch (error) {
			await vscode.window.showErrorMessage(error instanceof Error ? error.message : 'Unable to create request file.');
		}
	});

	context.subscriptions.push(openApiWorkbench, loadRequestFile, createRequestFile, RequestEditorProvider.register(context, extensionVersion));
}

/**
 * VS Code calls this when the extension is deactivated.
 *
 * RestCraft currently registers disposable commands/providers only, so VS Code
 * can clean them up through `context.subscriptions` without explicit teardown.
 */
export function deactivate() {}

/**
 * Reads the extension version from VS Code's package metadata.
 *
 * The helper keeps package JSON shape handling outside activation so the entry
 * point stays focused on command and provider registration.
 */
function readExtensionVersion(context: vscode.ExtensionContext): string {
	return readPackageVersion(context.extension.packageJSON);
}

/**
 * Chooses where a new request file should be created.
 *
 * Explorer context wins when VS Code provides it. Otherwise the command uses
 * the active file's folder, then falls back to the first workspace folder.
 */
async function resolveRequestFileDirectory(resource?: vscode.Uri): Promise<vscode.Uri | undefined> {
	if (resource?.scheme === 'file') {
		const stat = await vscode.workspace.fs.stat(resource);

		return stat.type === vscode.FileType.Directory ? resource : getParentUri(resource);
	}

	const activeDocument = vscode.window.activeTextEditor?.document;

	if (activeDocument?.uri.scheme === 'file') {
		return getParentUri(activeDocument.uri);
	}

	return vscode.workspace.workspaceFolders?.[0]?.uri;
}

/**
 * Reports filename validation errors directly in the input box.
 */
function validateRequestFileName(input: string): string | undefined {
	try {
		createRequestFileName(input);
		return undefined;
	} catch (error) {
		return error instanceof Error ? error.message : 'Invalid request file name.';
	}
}

/**
 * Checks whether a target file already exists before writing.
 */
async function fileExists(uri: vscode.Uri): Promise<boolean> {
	try {
		await vscode.workspace.fs.stat(uri);
		return true;
	} catch {
		return false;
	}
}

/**
 * Creates a file URI for the parent directory of another file URI.
 */
function getParentUri(uri: vscode.Uri): vscode.Uri {
	return vscode.Uri.file(path.dirname(uri.fsPath));
}
