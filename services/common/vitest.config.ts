import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
	},
	esbuild: {
		target: "esnext",
		format: "esm",
		platform: "node",
	},
	resolve: {
		extensions: [".ts", ".js"],
		preserveSymlinks: true,
	},
});
