module.exports = {
	branches: ['main'],
	tagFormat: 'v${version}',
	plugins: [
		[
			'@semantic-release/commit-analyzer',
			{
				preset: 'angular',
			},
		],
		[
			'@semantic-release/release-notes-generator',
			{
				preset: 'angular',
			},
		],
		[
			'@semantic-release/npm',
			{
				npmPublish: false,
			},
		],
		[
			'@semantic-release/exec',
			{
				prepareCmd: 'npm run package && vsce package --out dist/api-companion-${nextRelease.version}.vsix',
				publishCmd: 'vsce publish --packagePath dist/api-companion-${nextRelease.version}.vsix --pat "$VSCE_PAT"',
			},
		],
		[
			'@semantic-release/github',
			{
				assets: [
					{
						path: 'dist/api-companion-*.vsix',
						label: 'API Companion VS Code extension',
					},
				],
			},
		],
	],
};
