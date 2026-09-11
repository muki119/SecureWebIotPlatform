// Shared semantic-release config factory for every independently-released
// package (services/authentication, services/domain, services/devicecontrol,
// services/ledger, app). `services/common` and `services/eventbus` are not
// released — they're internal source-only libraries, bundled into whichever
// service imports them, not shipped as images.
//
// `semantic-release-monorepo` filters commits to the ones touching the
// package's own directory and derives `tagFormat` from the (unscoped)
// package name, e.g. `authentication-v1.2.3`.
//
// `dockerfile`/`context` are resolved relative to the package directory
// (semantic-release's cwd), matching how each Dockerfile expects to be built:
// services build from the `services/` workspace root (`context: ".."`), app
// builds from itself (`context: "."`).
export function dockerRelease({ image, dockerfile = "./Dockerfile", context }) {
	return {
		extends: "semantic-release-monorepo",
		// Explicit rather than inferred: semantic-release falls back to the
		// git remote named "origin", but this repo's remote is "personalMain",
		// and app/package.json (unlike the services) has no `repository` field.
		repositoryUrl: "https://github.com/muki119/SecureWebIotPlatform.git",
		branches: ["main"],
		plugins: [
			"@semantic-release/commit-analyzer",
			"@semantic-release/release-notes-generator",
			[
				"@semantic-release/exec",
				{
					// Only `${nextRelease.version}` is a semantic-release template
					// placeholder (left unescaped from JS via `\$`); everything else is
					// a plain JS interpolation of a fixed string, resolved by a real
					// script rather than shell parameter expansion, which would clash
					// with semantic-release's own `${...}` templating syntax.
					publishCmd: `"$GITHUB_WORKSPACE/scripts/docker-release.sh" "${image}" "${dockerfile}" "${context}" "\${nextRelease.version}"`,
				},
			],
			["@semantic-release/github", { successComment: false, failComment: false }],
		],
	};
}
