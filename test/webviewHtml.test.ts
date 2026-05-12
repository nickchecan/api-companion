import * as assert from 'assert';
import * as vscode from 'vscode';

import { getWebviewHtml } from '../src/webview/getWebviewHtml';

suite('Webview HTML', () => {
	test('renders the supplied extension version in the footer', () => {
		const html = getWebviewHtml({} as vscode.Webview, '1.2.3');

		assert.match(html, /<span class="editor-footer-version" aria-label="RestCraft version">v1\.2\.3<\/span>/);
	});
});
