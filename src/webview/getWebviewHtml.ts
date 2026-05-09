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

		.request-title {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			margin: 0 0 12px;
			font-size: 20px;
			font-weight: 600;
			line-height: 1.3;
			color: var(--vscode-editor-foreground);
		}

		.request-title-text {
			cursor: text;
		}

		.request-title-input {
			width: min(520px, 80vw);
			height: auto;
			padding: 0;
			color: var(--vscode-editor-foreground);
			background: transparent;
			border: 0;
			border-bottom: 1px solid var(--vscode-focusBorder);
			font: inherit;
		}

		.request-title-input:focus {
			outline: none;
		}

		.request-title-icon {
			width: 16px;
			height: 16px;
			color: var(--vscode-descriptionForeground);
			opacity: 0;
			transition: opacity 120ms ease;
		}

		.request-title:hover .request-title-icon,
		.request-title:focus-within .request-title-icon {
			opacity: 0.65;
		}

		.section-divider {
			display: flex;
			align-items: center;
			gap: 12px;
			margin: 18px 0 12px;
			color: var(--vscode-descriptionForeground);
			font-size: 11px;
			font-weight: 700;
			letter-spacing: 0;
			line-height: 1;
			text-transform: uppercase;
		}

		.section-divider::after {
			content: "";
			flex: 1;
			height: 1px;
			background: var(--vscode-panel-border);
		}

		.section-divider:first-of-type {
			margin-top: 0;
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

			.request-panel {
				margin-top: 16px;
				border: 1px solid var(--vscode-panel-border);
				background: var(--vscode-editor-inactiveSelectionBackground);
			}

			.request-tabs {
				display: flex;
				background: var(--vscode-sideBarSectionHeader-background);
				border-bottom: 1px solid var(--vscode-panel-border);
			}

			.request-tab {
				height: 34px;
				color: var(--vscode-editor-foreground);
				background: transparent;
				border: 0;
				border-right: 1px solid var(--vscode-panel-border);
				padding: 0 14px;
				cursor: pointer;
			}

			.request-tab:hover {
				background: var(--vscode-list-hoverBackground);
			}

			.request-tab.active {
				background: var(--vscode-editor-inactiveSelectionBackground);
				box-shadow: inset 0 -2px 0 var(--vscode-focusBorder);
			}

			.request-panel-content {
				padding: 12px;
			}

			.request-headers-table {
				width: 100%;
				border-collapse: collapse;
			}

			.request-headers-table th {
				padding: 0 8px 8px 0;
				text-align: left;
				font-weight: 600;
				color: var(--vscode-descriptionForeground);
			}

			.request-headers-table td {
				padding: 0 8px 8px 0;
			}

			.request-headers-table td:last-child,
			.request-headers-table th:last-child {
				width: 1%;
				padding-right: 0;
			}

			.request-header-input {
				width: 100%;
				min-width: 0;
			}

			.request-header-remove {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				width: 32px;
				padding: 0;
			}

			.request-header-remove svg {
				width: 16px;
				height: 16px;
				pointer-events: none;
			}

			.request-header-add {
				margin-top: 4px;
			}

			.request-body-editor {
				display: grid;
				grid-template-columns: auto minmax(0, 1fr);
				background: var(--vscode-editor-background);
			}

			.request-body-line-numbers {
				margin: 0;
				min-width: 44px;
				padding: 12px 8px;
				box-sizing: border-box;
				text-align: right;
				user-select: none;
				white-space: pre-wrap;
				overflow: hidden;
				color: var(--vscode-editorLineNumber-foreground);
				background: var(--vscode-editorGutter-background);
				border-right: 1px solid var(--vscode-panel-border);
				font-family: var(--vscode-editor-font-family);
				font-size: var(--vscode-editor-font-size);
				line-height: 1.45;
			}

			.request-body-input {
				display: block;
				width: 100%;
				min-height: 140px;
				padding: 12px;
				box-sizing: border-box;
				resize: vertical;
				color: var(--vscode-editor-foreground);
				background: var(--vscode-editor-background);
				border: 0;
				font-family: var(--vscode-editor-font-family);
				font-size: var(--vscode-editor-font-size);
				line-height: 1.45;
			}

			.request-body-input:focus {
				outline: 1px solid var(--vscode-focusBorder);
				outline-offset: -1px;
			}

			.response-divider {
				margin-top: 22px;
			}

			.response-panel {
				margin-top: 12px;
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

			.response-time {
				font-variant-numeric: tabular-nums;
			}

			.response-time:not(:empty)::after {
				content: " | ";
				color: var(--vscode-descriptionForeground);
			}

			.response-status-badge {
				display: inline-flex;
				align-items: center;
				min-height: 22px;
				padding: 2px 8px;
				border-radius: 999px;
				box-sizing: border-box;
				font-weight: 600;
				line-height: 1.2;
			}

			.response-status-badge.success {
				color: #ffffff;
				background: #16825d;
			}

			.response-status-badge.error {
				color: #ffffff;
				background: #c73636;
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
				background: var(--vscode-editor-background);
				cursor: text;
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
				background: var(--vscode-editor-background);
				cursor: text;
				user-select: text;
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
	<h1 class="request-title" id="request-title-container">
		<span class="request-title-text" id="request-title">API Companion Request</span>
		<input class="request-title-input hidden" id="request-title-input" aria-label="Request title">
		<svg class="request-title-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M12 20h9"></path>
			<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
		</svg>
	</h1>
	<div class="section-divider">Request</div>
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
		<section class="request-panel" aria-label="Request configuration area">
			<div class="request-tabs" role="tablist" aria-label="Request sections">
				<button class="request-tab active" id="request-params-tab" type="button" role="tab" aria-selected="true" aria-controls="request-params-panel">Params</button>
				<button class="request-tab" id="request-headers-tab" type="button" role="tab" aria-selected="false" aria-controls="request-headers-panel">Headers</button>
				<button class="request-tab" id="request-body-tab" type="button" role="tab" aria-selected="false" aria-controls="request-body-panel">Body</button>
			</div>
			<div class="request-panel-content" id="request-params-panel" role="tabpanel" aria-labelledby="request-params-tab">
				<table class="request-headers-table" aria-label="Request query parameters">
					<thead>
						<tr>
							<th scope="col">Key</th>
							<th scope="col">Value</th>
							<th scope="col"><span class="sr-only">Actions</span></th>
						</tr>
					</thead>
					<tbody id="request-params-table"></tbody>
				</table>
				<button class="request-header-add" id="add-request-param" type="button">Add Param</button>
			</div>
			<div class="request-panel-content hidden" id="request-headers-panel" role="tabpanel" aria-labelledby="request-headers-tab">
				<table class="request-headers-table" aria-label="Request headers">
					<thead>
						<tr>
							<th scope="col">Key</th>
							<th scope="col">Value</th>
							<th scope="col"><span class="sr-only">Actions</span></th>
						</tr>
					</thead>
					<tbody id="request-headers-table"></tbody>
				</table>
				<button class="request-header-add" id="add-request-header" type="button">Add Header</button>
			</div>
			<div class="request-panel-content hidden" id="request-body-panel" role="tabpanel" aria-labelledby="request-body-tab">
				<div class="request-body-editor">
					<pre class="request-body-line-numbers" id="request-body-lines" aria-hidden="true">1</pre>
					<textarea class="request-body-input" id="request-body" spellcheck="false" placeholder="{&#10;  &quot;example&quot;: true&#10;}"></textarea>
				</div>
			</div>
		</section>
		<div class="section-divider response-divider">Response</div>
		<section class="response-panel" aria-label="Response area">
			<div class="response-tabs">
				<div class="response-tab-list" role="tablist" aria-label="Response sections">
					<button class="response-tab active" id="body-tab" type="button" role="tab" aria-selected="true" aria-controls="body-panel">Body</button>
					<button class="response-tab" id="headers-tab" type="button" role="tab" aria-selected="false" aria-controls="headers-panel">Headers</button>
				</div>
				<div class="response-status" aria-live="polite">
					<span class="response-time" id="response-time"></span><span id="response-status" class="response-status-text">No response yet.</span>
				</div>
			</div>
			<div class="response-panel-content" id="body-panel" role="tabpanel" aria-labelledby="body-tab">
				<div class="response-body-content">
					<pre class="response-line-numbers" id="response-body-lines" aria-hidden="true">1</pre>
					<pre class="response-content" id="response-body">(empty)</pre>
				</div>
			</div>
			<div class="response-panel-content hidden" id="headers-panel" role="tabpanel" aria-labelledby="headers-tab">
				<pre class="response-content" id="response-headers">(none)</pre>
			</div>
		</section>

	<script nonce="${nonce}">
			const vscode = acquireVsCodeApi();
			const form = document.getElementById('request-form');
			const requestTitleContainer = document.getElementById('request-title-container');
			const requestTitle = document.getElementById('request-title');
			const requestTitleInput = document.getElementById('request-title-input');
				const method = document.getElementById('method');
				const url = document.getElementById('url');
				const send = document.getElementById('send');
				const requestParamsTab = document.getElementById('request-params-tab');
				const requestHeadersTab = document.getElementById('request-headers-tab');
				const requestBodyTab = document.getElementById('request-body-tab');
				const requestParamsPanel = document.getElementById('request-params-panel');
				const requestHeadersPanel = document.getElementById('request-headers-panel');
				const requestBodyPanel = document.getElementById('request-body-panel');
				const requestParamsTable = document.getElementById('request-params-table');
				const requestHeadersTable = document.getElementById('request-headers-table');
				const addRequestParam = document.getElementById('add-request-param');
				const addRequestHeader = document.getElementById('add-request-header');
				const requestBodyLines = document.getElementById('request-body-lines');
				const requestBody = document.getElementById('request-body');
				const bodyTab = document.getElementById('body-tab');
				const headersTab = document.getElementById('headers-tab');
			const bodyPanel = document.getElementById('body-panel');
			const headersPanel = document.getElementById('headers-panel');
			const responseStatus = document.getElementById('response-status');
			const responseTime = document.getElementById('response-time');
			const responseHeaders = document.getElementById('response-headers');
				const responseBodyLines = document.getElementById('response-body-lines');
				const responseBody = document.getElementById('response-body');
				let requestStartedAt = 0;
				let requestTimer = undefined;
				renderRequestParamsFromUrl();
				renderRequestHeaders({});

				requestTitleContainer.addEventListener('click', (event) => {
					if (event.target === requestTitleInput) {
						return;
					}

					startTitleEdit();
				});

				requestTitleInput.addEventListener('keydown', (event) => {
					if (event.key === 'Enter') {
						event.preventDefault();
						commitTitleEdit();
					}

					if (event.key === 'Escape') {
						event.preventDefault();
						cancelTitleEdit();
					}
				});

				requestTitleInput.addEventListener('blur', () => {
					commitTitleEdit();
				});

				requestParamsTab.addEventListener('click', () => {
					showRequestTab('params');
				});

				requestHeadersTab.addEventListener('click', () => {
					showRequestTab('headers');
				});

				requestBodyTab.addEventListener('click', () => {
					showRequestTab('body');
				});

				addRequestParam.addEventListener('click', () => {
					addRequestParamRow('', '');
				});

				addRequestHeader.addEventListener('click', () => {
					addRequestHeaderRow('', '');
				});

				method.addEventListener('change', () => {
					notifyRequestChanged();
				});

				url.addEventListener('input', () => {
					renderRequestParamsFromUrl();
					notifyRequestChanged();
				});

				requestBody.addEventListener('input', () => {
					updateRequestBodyLineNumbers();
					notifyRequestChanged();
				});

				requestBody.addEventListener('scroll', () => {
					requestBodyLines.scrollTop = requestBody.scrollTop;
				});

			bodyTab.addEventListener('click', () => {
				showResponseTab('body');
			});

			headersTab.addEventListener('click', () => {
				showResponseTab('headers');
			});

			form.addEventListener('submit', (event) => {
				event.preventDefault();
				send.disabled = true;
				startRequestTimer();
				setResponseStatus('Sending...');
				responseHeaders.textContent = '(none)';
				setBodyContent('(empty)');

			vscode.postMessage({
						type: 'sendRequest',
						method: method.value,
						url: url.value,
						headers: readRequestHeaders(),
						body: requestBody.value,
					});
		});

		window.addEventListener('message', (event) => {
			const message = event.data;

			if (message.type === 'requestComplete') {
				send.disabled = false;
				stopRequestTimer();
				renderResponse(message.response);
				return;
			}

				if (message.type === 'requestError') {
					send.disabled = false;
					stopRequestTimer();
					setResponseStatus('Request failed', 'error');
					responseHeaders.textContent = '(none)';
					setBodyContent(message.message);
					return;
				}

				if (message.type === 'loadRequest') {
						setRequestTitle(message.request.name);
						method.value = message.request.method;
						url.value = message.request.url;
						renderRequestParamsFromUrl();
						renderRequestHeaders(message.request.headers || {});
						setRequestBodyContent(message.request.body === null || message.request.body === undefined
							? ''
							: formatBody(message.request.body));
				}
			});

		vscode.postMessage({
			type: 'webviewReady',
		});

				function renderResponse(result) {
					setResponseStatus(
						'Status: ' + result.status + ' ' + result.statusText,
						isSuccessStatus(result.status) ? 'success' : 'error',
					);
					responseHeaders.textContent = formatHeaders(result.headers);
					setBodyContent(result.body || '(empty)');
				}

				function setResponseStatus(text, badgeType) {
					responseStatus.textContent = text;
					responseStatus.className = badgeType
						? 'response-status-badge ' + badgeType
						: 'response-status-text';
				}

				function isSuccessStatus(status) {
					return status >= 200 && status < 300;
				}

				function startRequestTimer() {
					requestStartedAt = performance.now();
					updateRequestTimer();

					if (requestTimer !== undefined) {
						clearInterval(requestTimer);
					}

					requestTimer = setInterval(updateRequestTimer, 100);
				}

				function stopRequestTimer() {
					if (requestTimer !== undefined) {
						clearInterval(requestTimer);
						requestTimer = undefined;
					}

					updateRequestTimer();
				}

				function updateRequestTimer() {
					responseTime.textContent = formatDuration(performance.now() - requestStartedAt);
				}

				function showRequestTab(tabName) {
					const showParams = tabName === 'params';
					const showHeaders = tabName === 'headers';
					const showBody = tabName === 'body';

					requestParamsTab.classList.toggle('active', showParams);
					requestHeadersTab.classList.toggle('active', showHeaders);
					requestBodyTab.classList.toggle('active', showBody);
					requestParamsTab.setAttribute('aria-selected', String(showParams));
					requestHeadersTab.setAttribute('aria-selected', String(showHeaders));
					requestBodyTab.setAttribute('aria-selected', String(showBody));
					requestParamsPanel.classList.toggle('hidden', !showParams);
					requestHeadersPanel.classList.toggle('hidden', !showHeaders);
					requestBodyPanel.classList.toggle('hidden', !showBody);
				}

				function showResponseTab(tabName) {
					const showBody = tabName === 'body';

				bodyTab.classList.toggle('active', showBody);
				headersTab.classList.toggle('active', !showBody);
				bodyTab.setAttribute('aria-selected', String(showBody));
				headersTab.setAttribute('aria-selected', String(!showBody));
					bodyPanel.classList.toggle('hidden', !showBody);
					headersPanel.classList.toggle('hidden', showBody);
				}

				function renderRequestParamsFromUrl() {
					requestParamsTable.textContent = '';

					const entries = readParamsFromUrl();

					if (entries.length === 0) {
						addRequestParamRow('', '');
						return;
					}

					for (const [name, value] of entries) {
						addRequestParamRow(name, value);
					}
				}

				function renderRequestHeaders(headers) {
					requestHeadersTable.textContent = '';
					const entries = Object.entries(headers);

					if (entries.length === 0) {
						addRequestHeaderRow('', '');
						return;
					}

					for (const [name, value] of entries) {
						addRequestHeaderRow(name, value);
					}
				}

				function addRequestParamRow(name, value) {
					addKeyValueRow(requestParamsTable, name, value, 'Param name', 'Param value', 'Remove param', () => {
						updateUrlFromParams();
						notifyRequestChanged();
					});
				}

				function addRequestHeaderRow(name, value) {
					addKeyValueRow(requestHeadersTable, name, value, 'Header name', 'Header value', 'Remove header', () => {
						notifyRequestChanged();
					});
				}

				function addKeyValueRow(table, name, value, namePlaceholder, valuePlaceholder, removeLabel, onChange) {
					const row = document.createElement('tr');
					const nameCell = document.createElement('td');
					const valueCell = document.createElement('td');
					const actionCell = document.createElement('td');
					const nameInput = document.createElement('input');
					const valueInput = document.createElement('input');
					const removeButton = document.createElement('button');

					nameInput.className = 'request-header-input';
					nameInput.placeholder = namePlaceholder;
					nameInput.value = name;
					valueInput.className = 'request-header-input';
					valueInput.placeholder = valuePlaceholder;
					valueInput.value = value;
					removeButton.className = 'request-header-remove';
					removeButton.type = 'button';
					removeButton.ariaLabel = removeLabel;
					removeButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>';
					nameInput.addEventListener('input', () => {
						onChange();
					});
					valueInput.addEventListener('input', () => {
						onChange();
					});
					removeButton.addEventListener('click', () => {
						row.remove();

						if (table.children.length === 0) {
							addKeyValueRow(table, '', '', namePlaceholder, valuePlaceholder, removeLabel, onChange);
						}

						onChange();
					});

					nameCell.append(nameInput);
					valueCell.append(valueInput);
					actionCell.append(removeButton);
					row.append(nameCell, valueCell, actionCell);
					table.append(row);
				}

				function readRequestHeaders() {
					return readKeyValueRows(requestHeadersTable);
				}

				function readRequestParams() {
					return Object.entries(readKeyValueRows(requestParamsTable));
				}

				function readKeyValueRows(table) {
					const values = {};

					for (const row of table.querySelectorAll('tr')) {
						const inputs = row.querySelectorAll('input');
						const name = inputs[0].value.trim();

						if (name) {
							values[name] = inputs[1].value;
						}
					}

					return values;
				}

				function readParamsFromUrl() {
					try {
						return Array.from(new URL(url.value).searchParams.entries());
					} catch {
						return [];
					}
				}

				function updateUrlFromParams() {
					let parsed;
					try {
						parsed = new URL(url.value);
					} catch {
						return;
					}

					parsed.search = '';

					for (const [name, value] of readRequestParams()) {
						parsed.searchParams.append(name, value);
					}

					url.value = parsed.toString();
				}

				function notifyRequestChanged() {
					vscode.postMessage({
						type: 'requestChanged',
						name: requestTitle.textContent || 'Untitled Request',
						method: method.value,
						url: url.value,
						headers: readRequestHeaders(),
						body: requestBody.value,
					});
				}

				function setRequestTitle(value) {
					const title = value.trim() || 'Untitled Request';

					requestTitle.textContent = title;
					requestTitleInput.value = title;
				}

				function startTitleEdit() {
					requestTitleInput.value = requestTitle.textContent || '';
					requestTitle.classList.add('hidden');
					requestTitleInput.classList.remove('hidden');
					requestTitleInput.focus();
					requestTitleInput.select();
				}

				function commitTitleEdit() {
					if (requestTitleInput.classList.contains('hidden')) {
						return;
					}

					setRequestTitle(requestTitleInput.value);
					requestTitleInput.classList.add('hidden');
					requestTitle.classList.remove('hidden');
					notifyRequestChanged();
				}

				function cancelTitleEdit() {
					requestTitleInput.value = requestTitle.textContent || '';
					requestTitleInput.classList.add('hidden');
					requestTitle.classList.remove('hidden');
				}

				function setRequestBodyContent(content) {
					requestBody.value = content;
					updateRequestBodyLineNumbers();
				}

				function updateRequestBodyLineNumbers() {
					requestBodyLines.textContent = formatLineNumbers(requestBody.value || ' ');
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

		function formatDuration(durationMs) {
			if (durationMs < 1000) {
				return Math.round(durationMs) + ' ms';
			}

			return (durationMs / 1000).toFixed(2) + ' s';
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
