import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const name = 'SelectMadu';

export default {
	input: 'src/index.js',
	output: [
		{ file: pkg.module, format: 'es' },
    { file: pkg.main, format: 'umd', name },
		{ file: 'bundle/selectmadu.js', format: 'iife', name },
		{ file: 'bundle/selectmadu.min.js', format: 'iife', name }
	],
	plugins: [
		svelte(),
		resolve(),
		terser({
			include: [/^.+\.min\.js$/]
		})
	]
};