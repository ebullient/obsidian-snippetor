import esbuild from "esbuild";
import process from "process";
import builtins from 'builtin-modules';
import copy from 'esbuild-copy-plugin';
import {sassPlugin} from 'esbuild-sass-plugin'

const banner = `/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/
`;

const prod = (process.argv[2] === 'production');

esbuild.build({
    banner: {
        js: banner,
    },
    entryPoints: ['src/main.ts', 'src/styles.scss'],
    bundle: true,
    external: ['obsidian', 'electron', ...builtins],
    format: 'cjs',
    watch: !prod,
    target: 'es2016',
    logLevel: "info",
    sourcemap: prod ? false : 'inline',
    treeShaking: true,
    outdir: './build',
    plugins: [
        sassPlugin()
    //     copy({
    //         from: './manifest.json',
    //         to: './manifest.json'
    //     }),
    //     copy({
    //         from: './README.md',
    //         to: './README.md'
    //     }),
    ]
}).catch(() => process.exit(1));
