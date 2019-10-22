import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'src/functions/skill.js',
  output: {
    file: 'functions/skill.js',
    format: 'cjs',
    exports: 'named'
  },
  plugins: [
    resolve({
      preferBuiltins: true,
    }),
    commonjs()
  ]
}
