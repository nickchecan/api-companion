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

			.response-panel {
				margin-top: 16px;
				border: 1px solid var(--vscode-panel-border);
				background: var(--vscode-editor-inactiveSelectionBackground);
			}

			.response-tabs {
				display: flex;
				align-items: center;
				background: var(--vscode-sideBarSectionHeader-background);
				border-bottom: 1px solid var(--vscode-panel-border);
			}

			.response-tab-list {
				display: flex;
			}

			.response-tab {
				height: 34px;
				color: var(--vscode-editor-foreground);
				background: transparent;
				border: 0;
				border-right: 1px solid var(--vscode-panel-border);
				padding: 0 14px;
				cursor: pointer;
			}

			.response-tab:hover {
				background: var(--vscode-list-hoverBackground);
			}

			.response-tab.active {
				background: var(--vscode-editor-inactiveSelectionBackground);
				box-shadow: inset 0 -2px 0 var(--vscode-focusBorder);
			}

			.response-status {
				margin-left: auto;
				padding: 0 12px;
				color: var(--vscode-descriptionForeground);
				white-space: nowrap;
			}

			.response-panel-content {
				min-height: 320px;
			}

			.response-content,
			.response-line-numbers {
				margin: 0;
				box-sizing: border-box;
				white-space: pre-wrap;
				font-family: var(--vscode-editor-font-family);
				font-size: var(--vscode-editor-font-size);
				line-height: 1.45;
			}

			.response-content {
				padding: 12px;
				color: var(--vscode-editor-foreground);
			}

			.response-body-content {
				display: grid;
				grid-template-columns: auto minmax(0, 1fr);
				max-height: 48vh;
				overflow: auto;
			}

			.response-line-numbers {
				min-width: 44px;
				padding: 12px 8px;
				text-align: right;
				user-select: none;
				color: var(--vscode-editorLineNumber-foreground);
				background: var(--vscode-editorGutter-background);
				border-right: 1px solid var(--vscode-panel-border);
			}

			.response-body-content .response-content {
				min-width: 0;
				overflow: visible;
			}

			.hidden {
				display: none;
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
		<section class="response-panel" aria-label="Response area">
			<div class="response-tabs">
				<div class="response-tab-list" role="tablist" aria-label="Response sections">
					<button class="response-tab active" id="headers-tab" type="button" role="tab" aria-selected="true" aria-controls="headers-panel">Headers</button>
					<button class="response-tab" id="body-tab" type="button" role="tab" aria-selected="false" aria-controls="body-panel">Body</button>
				</div>
				<div class="response-status" id="response-status" aria-live="polite">No response yet.</div>
			</div>
			<div class="response-panel-content" id="headers-panel" role="tabpanel" aria-labelledby="headers-tab">
				<pre class="response-content" id="response-headers">(none)</pre>
			</div>
			<div class="response-panel-content hidden" id="body-panel" role="tabpanel" aria-labelledby="body-tab">
				<div class="response-body-content">
					<pre class="response-line-numbers" id="response-body-lines" aria-hidden="true">1</pre>
					<pre class="response-content" id="response-body">(empty)</pre>
				</div>
			</div>
		</section>

	<script nonce="${nonce}">
		const vscode = acquireVsCodeApi();
		const form = document.getElementById('request-form');
			const method = document.getElementById('method');
			const url = document.getElementById('url');
			const send = document.getElementById('send');
			const headersTab = document.getElementById('headers-tab');
			const bodyTab = document.getElementById('body-tab');
			const headersPanel = document.getElementById('headers-panel');
			const bodyPanel = document.getElementById('body-panel');
			const responseStatus = document.getElementById('response-status');
			const responseHeaders = document.getElementById('response-headers');
			const responseBodyLines = document.getElementById('response-body-lines');
			const responseBody = document.getElementById('response-body');
			let loadedHeaders = {};

			headersTab.addEventListener('click', () => {
				showResponseTab('headers');
			});

			bodyTab.addEventListener('click', () => {
				showResponseTab('body');
			});

		form.addEventListener('submit', (event) => {
			event.preventDefault();
				send.disabled = true;
				responseStatus.textContent = 'Sending...';
				responseHeaders.textContent = '(none)';
				setBodyContent('(empty)');

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
				renderResponse(message.response);
				return;
			}

				if (message.type === 'requestError') {
					responseStatus.textContent = 'Request failed';
					responseHeaders.textContent = '(none)';
					setBodyContent(message.message);
					return;
				}

			if (message.type === 'loadRequest') {
				method.value = message.request.method;
				url.value = message.request.url;
					loadedHeaders = message.request.headers || {};
					responseStatus.textContent = 'Loaded request: ' + message.request.name;
					responseHeaders.textContent = formatHeaders(loadedHeaders);
					setBodyContent(message.request.body === null || message.request.body === undefined
						? '(empty)'
						: formatBody(message.request.body));
				}
		});

		vscode.postMessage({
			type: 'webviewReady',
		});

			function renderResponse(result) {
				responseStatus.textContent = 'Status: ' + result.status + ' ' + result.statusText;
				responseHeaders.textContent = formatHeaders(result.headers);
				setBodyContent(result.body || '(empty)');
			}

			function showResponseTab(tabName) {
				const showHeaders = tabName === 'headers';

				headersTab.classList.toggle('active', showHeaders);
				bodyTab.classList.toggle('active', !showHeaders);
				headersTab.setAttribute('aria-selected', String(showHeaders));
				bodyTab.setAttribute('aria-selected', String(!showHeaders));
				headersPanel.classList.toggle('hidden', !showHeaders);
				bodyPanel.classList.toggle('hidden', showHeaders);
			}

			function setBodyContent(content) {
				responseBody.textContent = content;
				responseBodyLines.textContent = formatLineNumbers(content);
			}

			function formatLineNumbers(content) {
				const lineCount = content.split('\\n').length;

				return Array.from({ length: lineCount }, (_item, index) => String(index + 1)).join('\\n');
			}

		function formatHeaders(headers) {
			const lines = Object.entries(headers)
				.map(([name, value]) => name + ': ' + value)
				.join('\\n');

			return lines || '(none)';
		}

		function formatBody(body) {
			if (typeof body === 'string') {
				return body || '(empty)';
			}

			return JSON.stringify(body, null, 2);
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
