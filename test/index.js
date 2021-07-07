import { rollup } from 'rollup';
import { globImport } from '../index.js';
const build = async () => {
  const bundle = await rollup({
    input: './test/source/index.js',
    plugins: [globImport()],
  });
  const { output } = await bundle.generate({ format: 'es' });
  console.log(output[0].code);
};
build().catch(e => {
  console.log(e);
});
