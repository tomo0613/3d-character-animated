import rollup_ts from 'rollup-plugin-typescript2';
import typescript from 'typescript';
import node_resolve from 'rollup-plugin-node-resolve';
import {terser} from 'rollup-plugin-terser';

export default {
    input: 'src/main.ts',
    output: {
        file: './build/rollup-bundle.js',
        format: 'esm',
    },
    plugins: [
        rollup_ts({typescript}),
        node_resolve({only: 'three'}),
        terser(),
    ],
};
