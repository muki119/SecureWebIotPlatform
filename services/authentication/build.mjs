import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

console.log("Starting build process...");

await esbuild.build({
	entryPoints: ["index.ts"],
	bundle: true,
	platform: "node",
	target: "esNext",
	format: "esm",
	outdir: "dist",
	resolveExtensions: [".ts", ".js"],
	alias: {
		"@services/common": "../common",
		"@services/eventbus": "../eventbus/src",
	},
	treeShaking: true,
	packages: "external",
	preserveSymlinks: true,
	absWorkingDir: dirname(fileURLToPath(import.meta.url)),
	metafile: true,
});
console.log("Build completed successfully.");
