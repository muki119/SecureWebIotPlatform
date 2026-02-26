import * as esbuild from 'esbuild';
import { readFile } from 'fs/promises';
const moduleDependencies = JSON.parse(await readFile(new URL('./package.json', import.meta.url), 'utf-8'));


await esbuild.build({
    entryPoints: ['index.ts'],
    bundle: true,
    platform: 'node',
    target: 'esNext',
    format: "esm",
    outdir: 'build',
    sourcemap: true,
    tsconfig: 'tsconfig.json',
    resolveExtensions: ['.ts', '.js'],
    external: Object.keys(moduleDependencies.dependencies)
});