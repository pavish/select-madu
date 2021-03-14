import svelte from 'rollup-plugin-svelte';
import typescript from '@rollup/plugin-typescript';
import preprocess from 'svelte-preprocess';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const isDev = process.env.NODE_ENV === 'development';
const name = pkg.consName;

export default {
  input: 'src/index.ts',
  output: [
    { file: pkg.module, format: 'es', name },
    { file: pkg.main, format: 'umd', name },
    {
      file: 'dist/selectmadu.js', format: 'iife', name, sourcemap: isDev,
    },
    {
      file: 'dist/selectmadu.min.js', format: 'iife', name, sourcemap: isDev, plugins: [terser()],
    },
  ],
  plugins: [
    svelte({
      dev: isDev,
      emitCss: false,
      legacy: true,
      preprocess: preprocess(),
    }),
    typescript({ sourceMap: isDev }),
    resolve(),
  ],
};
