import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const name = pkg.consName;

export default {
	input: 'src/index.js',
	output: [
		{ file: pkg.module, format: 'es', name },
    { file: pkg.main, format: 'umd', name },
		{ file: 'dist/selectmadu.js', format: 'iife', name, sourcemap: true },
		{ file: 'dist/selectmadu.min.js', format: 'iife', name, sourcemap: true }
	],
	plugins: [
		svelte({
			emitCss: false,
			legacy: true
		}),
		resolve(),
		terser({
			include: [/^.+\.min\.js$/]
		})
	]
};