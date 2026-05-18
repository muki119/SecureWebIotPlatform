import esbuild from 'esbuild';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

console.log("Starting build process...");
console.log(dirname(fileURLToPath(import.meta.url)))
await esbuild.build({
    entryPoints: ['./index.ts', "./src/bus/ledger_service_worker.ts"],
    bundle: true,
    platform: 'node',
    target: 'esNext',
    format: "esm",
    outdir: 'dist',
    resolveExtensions: ['.ts', '.js'],
    alias: {
        '@services/common': '../common',
        "@services/eventbus": '../eventbus/src',
    },
    treeShaking: true,
    packages: 'external',
    preserveSymlinks: true,
    absWorkingDir: dirname(fileURLToPath(import.meta.url)),
    metafile: true,
});
console.log("Build completed successfully.");