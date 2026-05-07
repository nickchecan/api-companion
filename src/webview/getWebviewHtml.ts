import * as vscode from 'vscode';

export function getWebviewHtml(webview: vscode.Webview): string {
	const nonce = getNonce();
	const cspSource = webview.cspSource;

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
	<title>API Workbench</title>
	<style>
		:root {
			color-scheme: light dark;
		}

		body {
			margin: 0;
			padding: 20px;
			color: var(--vscode-foreground);
			background: var(--vscode-editor-background);
			font-family: var(--vscode-font-family);
			font-size: var(--vscode-font-size);
		}

		.request-bar {
			display: grid;
			grid-template-columns: minmax(110px, 140px) minmax(180px, 1fr) auto;
			gap: 8px;
			align-items: center;
		}

		select,
		input,
		button {
			height: 32px;
			box-sizing: border-box;
			font: inherit;
		}

		select,
		input {
			width: 100%;
			color: var(--vscode-input-foreground);
			background: var(--vscode-input-background);
			border: 1px solid var(--vscode-input-border);
			padding: 0 8px;
		}

		button {
			color: var(--vscode-button-foreground);
			background: var(--vscode-button-background);
			border: 0;
			padding: 0 14px;
			cursor: pointer;
		}

		button:hover {
			background: var(--vscode-button-hoverBackground);
		}

		button:disabled {
			opacity: 0.7;
			cursor: wait;
		}

		.response {
			min-height: 260px;
			margin-top: 16px;
			padding: 12px;
			white-space: pre-wrap;
			color: var(--vscode-editor-foreground);
			background: var(--vscode-editor-inactiveSelectionBackground);
			border: 1px solid var(--vscode-panel-border);
		}

		.sr-only {
			position: absolute;
			width: 1px;
			height: 1px;
			padding: 0;
			margin: -1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
			white-space: nowrap;
			border: 0;
		}

		@media (max-width: 640px) {
			.request-bar {
				grid-template-columns: 1fr;
			}
		}
	</style>
</head>
<body>
	<form class="request-bar" id="request-form">
		<label>
			<span class="sr-only">HTTP method</span>
			<select id="method" name="method" aria-label="HTTP method">
				<option value="GET">GET</option>
				<option value="POST">POST</option>
				<option value="PUT">PUT</option>
				<option value="PATCH">PATCH</option>
				<option value="DELETE">DELETE</option>
				<option value="HEAD">HEAD</option>
				<option value="OPTIONS">OPTIONS</option>
			</select>
		</label>
		<label>
			<span class="sr-only">Request URL</span>
			<input id="url" name="url" type="url" placeholder="https://api.example.com/resource" aria-label="Request URL">
		</label>
		<button id="send" type="submit">Send</button>
	</form>
	<section class="response" id="response" aria-label="Response area"></section>

	<script nonce="${nonce}">
		const vscode = acquireVsCodeApi();
		const form = document.getElementById('request-form');
		const method = document.getElementById('method');
		const url = document.getElementById('url');
		const send = document.getElementById('send');
		const response = document.getElementById('response');
		let loadedHeaders = {};

		form.addEventListener('submit', (event) => {
			event.preventDefault();
			send.disabled = true;
			response.textContent = 'Sending...';

			vscode.postMessage({
				type: 'sendRequest',
				method: method.value,
				url: url.value,
				headers: loadedHeaders,
			});
		});

		window.addEventListener('message', (event) => {
			const message = event.data;
			send.disabled = false;

			if (message.type === 'requestComplete') {
				response.textContent = formatResponse(message.response);
				return;
			}

			if (message.type === 'requestError') {
				response.textContent = 'Request failed\\n\\n' + message.message;
				return;
			}

			if (message.type === 'loadRequest') {
				method.value = message.request.method;
				url.value = message.request.url;
				loadedHeaders = message.request.headers || {};
				response.textContent = 'Loaded request: ' + message.request.name;
			}
		});

		function formatResponse(result) {
			const headers = Object.entries(result.headers)
				.map(([name, value]) => name + ': ' + value)
				.join('\\n');

			return [
				'Status: ' + result.status + ' ' + result.statusText,
				'',
				'Headers:',
				headers || '(none)',
				'',
				'Body:',
				result.body || '(empty)',
			].join('\\n');
		}
	</script>
</body>
</html>`;
}

function getNonce(): string {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}

	return text;
}
