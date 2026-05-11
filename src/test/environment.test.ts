import * as assert from 'assert';

import { parseEnvFile, resolveRequestVariables } from '../request/environment';

suite('Environment variables', () => {
	test('parses env files', () => {
		assert.deepStrictEqual(parseEnvFile([
			'# API environment',
			'DOMAIN=https://google.com',
			'TOKEN="abc123"',
			'PASSWORD=\'secret\'',
			'',
		].join('\n')), {
			DOMAIN: 'https://google.com',
			TOKEN: 'abc123',
			PASSWORD: 'secret',
		});
	});

	test('resolves variables in request fields', () => {
		const request = resolveRequestVariables({
			method: 'POST',
			url: '{{DOMAIN}}/endpoint',
			headers: {
				Authorization: 'Bearer {{TOKEN}}',
				'X-{{HEADER_NAME}}': '{{HEADER_VALUE}}',
			},
			body: '{"domain":"{{DOMAIN}}"}',
		}, {
			DOMAIN: 'https://google.com',
			TOKEN: 'abc123',
			HEADER_NAME: 'Request-Id',
			HEADER_VALUE: 'request-1',
		});

		assert.deepStrictEqual(request, {
			method: 'POST',
			url: 'https://google.com/endpoint',
			headers: {
				Authorization: 'Bearer abc123',
				'X-Request-Id': 'request-1',
			},
			body: '{"domain":"https://google.com"}',
		});
	});

	test('resolves variables inside basic auth credentials before sending', () => {
		const request = resolveRequestVariables({
			method: 'GET',
			url: 'https://example.com',
			headers: {
				Authorization: `Basic ${Buffer.from('postman:{{PASSWORD}}', 'utf8').toString('base64')}`,
			},
		}, {
			PASSWORD: 'secret',
		});

		assert.strictEqual(
			request.headers?.Authorization,
			`Basic ${Buffer.from('postman:secret', 'utf8').toString('base64')}`,
		);
	});

	test('resolves variables in form url encoded body fields', () => {
		const request = resolveRequestVariables({
			method: 'POST',
			url: 'https://example.com',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				username: 'postman',
				password: '{{PASSWORD}}',
			}).toString(),
		}, {
			PASSWORD: 'secret',
		});

		assert.deepStrictEqual(
			Array.from(new URLSearchParams(request.body).entries()),
			[
				['username', 'postman'],
				['password', 'secret'],
			],
		);
	});

	test('reports missing variables', () => {
		assert.throws(
			() => resolveRequestVariables({
				method: 'GET',
				url: '{{DOMAIN}}/endpoint/{{ID}}',
			}, {}),
			/Missing environment variables: DOMAIN, ID/,
		);
	});
});
