import * as assert from 'assert';

import { isRequestFileName, parseRequestFile } from '../src/request/requestFile';

suite('Request file parser', () => {
	test('parses a valid request file', () => {
		const request = parseRequestFile(JSON.stringify({
			name: 'Get Users',
			method: 'GET',
			url: 'https://jsonplaceholder.typicode.com/users',
			params: [],
			headerState: [
				{
					name: 'Accept',
					value: 'application/json',
					enabled: true,
				},
			],
			headers: {
				Accept: 'application/json',
			},
			body: null,
		}));

		assert.deepStrictEqual(request, {
			name: 'Get Users',
			method: 'GET',
			url: 'https://jsonplaceholder.typicode.com/users',
			params: [],
			headerState: [
				{
					name: 'Accept',
					value: 'application/json',
					enabled: true,
				},
			],
			headers: {
				Accept: 'application/json',
			},
			body: null,
		});
	});

	test('parses persisted request headers with enabled flags', () => {
		const request = parseRequestFile(JSON.stringify({
			name: 'Create User',
			method: 'POST',
			url: 'https://api.example.com/users',
			params: [],
			headerState: [
				{
					name: 'Accept',
					value: 'application/json',
					enabled: true,
				},
				{
					name: 'X-Debug',
					value: '1',
					enabled: false,
				},
			],
			headers: {
				Accept: 'application/json',
				'X-Debug': '1',
			},
			body: null,
		}));

		assert.deepStrictEqual(request.headerState, [
			{
				name: 'Accept',
				value: 'application/json',
				enabled: true,
			},
			{
				name: 'X-Debug',
				value: '1',
				enabled: false,
			},
		]);
	});

	test('backfills enabled header state from legacy headers', () => {
		const request = parseRequestFile(JSON.stringify({
			name: 'Create User',
			method: 'POST',
			url: 'https://api.example.com/users',
			params: [],
			headers: {
				Accept: 'application/json',
				'X-Trace': 'abc',
			},
			body: null,
		}));

		assert.deepStrictEqual(request.headerState, [
			{
				name: 'Accept',
				value: 'application/json',
				enabled: true,
			},
			{
				name: 'X-Trace',
				value: 'abc',
				enabled: true,
			},
		]);
	});

	test('parses persisted query params with enabled flags', () => {
		const request = parseRequestFile(JSON.stringify({
			name: 'Search Users',
			method: 'GET',
			url: 'https://api.example.com/users?active=true',
			params: [
				{
					name: 'active',
					value: 'true',
					enabled: true,
				},
				{
					name: 'debug',
					value: '1',
					enabled: false,
				},
			],
			headers: {},
			body: null,
		}));

		assert.deepStrictEqual(request.params, [
			{
				name: 'active',
				value: 'true',
				enabled: true,
			},
			{
				name: 'debug',
				value: '1',
				enabled: false,
			},
		]);
	});

	test('backfills enabled params from legacy URLs', () => {
		const request = parseRequestFile(JSON.stringify({
			name: 'Search Users',
			method: 'GET',
			url: 'https://api.example.com/users?page=1&sort=name',
			headers: {},
			body: null,
		}));

		assert.deepStrictEqual(request.params, [
			{
				name: 'page',
				value: '1',
				enabled: true,
			},
			{
				name: 'sort',
				value: 'name',
				enabled: true,
			},
		]);
	});

	test('requires query param enabled flags to be booleans', () => {
		assert.throws(
			() => parseRequestFile(JSON.stringify({
				name: 'Search Users',
				method: 'GET',
				url: 'https://api.example.com/users',
				params: [
					{
						name: 'debug',
						value: '1',
						enabled: 'false',
					},
				],
				headers: {},
				body: null,
			})),
			/must have a boolean enabled flag/,
		);
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
