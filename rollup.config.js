import WindiCSS from 'rollup-plugin-windicss'
import babel from "@rollup/plugin-babel";
import {defineConfig} from "rollup";
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import {terser} from 'rollup-plugin-terser';
import css from "rollup-plugin-import-css";

const extensions = [
    '.js', '.jsx', '.ts', '.tsx',
];
const is_prod = process.env.NODE_ENV === "production";

export default defineConfig({
    input: {
        out: "src/index.tsx"
    },
    output: {
        dir: "dist/",
        format: "iife",
        sourcemap: is_prod ? true : "inline", // inline sourcemaps are required for dev builds
    },
    plugins: [
        resolve({
            extensions,
        }),
        commonjs(),
        ...WindiCSS(),
        babel({
            extensions,
            exclude: './node_modules/**',
            babelHelpers: "bundled",
        }),
        copy({
            targets: [
                { src: "public/*", dest: 'dist/' }
            ]
        }),
        is_prod && terser(),
        css(),
    ],
});