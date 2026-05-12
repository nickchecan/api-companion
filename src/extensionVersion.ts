export interface ExtensionPackageJson {
	version?: unknown;
}

export function readPackageVersion(packageJson: ExtensionPackageJson): string {
	return typeof packageJson.version === 'string' && packageJson.version.trim()
		? packageJson.version
		: '0.0.0';
}
