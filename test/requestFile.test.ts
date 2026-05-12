import * as assert from 'assert';

import { isRequestFileName, parseRequestFile } from '../src/request/requestFile';

suite('Request file parser', () => {
	test('parses a valid request file', () => {
		const request = parseRequestFile(JSON.stringify({
			name: 'Get Users',
			method: 'GET',
			url: 'https://jsonplaceholder.typicode.com/users',
			headers: {
				Accept: 'application/json',
			},
			body: null,
		}));

		assert.deepStrictEqual(request, {
			name: 'Get Users',
			method: 'GET',
			url: 'https://jsonplaceholder.typicode.com/users',
			headers: {
				Accept: 'application/json',
			},
			body: null,
		});
	});

	test('reports invalid JSON clearly', () => {
		assert.throws(
			() => parseRequestFile('{ "name": '),
			/Invalid JSON:/,
		);
	});

	test('requires http or https URLs', () => {
		assert.throws(
			() => parseRequestFile(JSON.stringify({
				name: 'Local file',
				method: 'GET',
				url: 'file:///tmp/example',
				headers: {},
				body: null,
			})),
			/must use http or https/,
		);
	});

	test('matches request file names', () => {
		assert.strictEqual(isRequestFileName('/workspace/get-users.api.json'), true);
		assert.strictEqual(isRequestFileName('/workspace/get-users.json'), false);
	});
});
