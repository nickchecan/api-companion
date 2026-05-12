import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import { readPackageVersion } from '../src/extensionVersion';

suite('Extension version', () => {
	test('reads the version from package.json metadata', () => {
		const packageJsonPath = path.join(__dirname, '..', '..', 'package.json');
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as { version?: unknown };

		assert.strictEqual(readPackageVersion(packageJson), packageJson.version);
	});

	test('falls back when package metadata has no version', () => {
		assert.strictEqual(readPackageVersion({}), '0.0.0');
	});
});
